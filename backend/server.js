require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const path = require("path");
const { google } = require('googleapis');

const syllabusData = require("./syllabusData");
const examData = require("./examData");

const { extractQuestions, extractDocument } = require("./extractor");

const stream = require("stream");

// Load the generated dictionary!
const subjectDictionary = require("./src/data/subjectDictionary.json");

// We use a unique name here so it doesn't conflict with your database!
const nodeFileSystem = require('fs');

let serviceAccount;

// Check if we are running on Render's secure server
if (nodeFileSystem.existsSync('/etc/secrets/serviceAccountKey.json')) {
    serviceAccount = require('/etc/secrets/serviceAccountKey.json');
}
// Otherwise, we must be testing locally on your MacBook
else {
    serviceAccount = require('./serviceAccountKey.json');
}

// Initialize Firebase with the correct account
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const app = express();

// ==========================================
// CORS CONFIGURATION
// ==========================================
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://www.forensync.me',
        'https://forensync.me',
        /vercel\.app$/
    ],
    credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// AI DOCUMENT INGESTION
// ==========================================
app.post('/api/admin/extract-document', upload.single('document'), async (req, res) => {
    try {
        const file = req.file;
        const { documentType, programId, semesterId } = req.body;

        if (!file) {
            return res.status(400).json({ error: "No document provided." });
        }
        if (!documentType || !['syllabus', 'exams', 'both'].includes(documentType)) {
            return res.status(400).json({ error: "Invalid document type." });
        }
        if (!programId || !semesterId) {
            return res.status(400).json({ error: "Program ID and Semester ID are required." });
        }

        console.log(`Extracting ${documentType} document for ${programId} -> ${semesterId}...`);

        // Parse using Gemini
        const extractedData = await extractDocument(file.buffer, file.mimetype, documentType);

        // Check for Collisions
        const extractedSemesters = new Set();
        if (extractedData.syllabus) {
            Object.values(extractedData.syllabus).forEach(s => {
                if (s.semester) extractedSemesters.add(s.semester);
            });
        }
        if (extractedData.exams) {
            Object.values(extractedData.exams).forEach(e => {
                if (e.semester) extractedSemesters.add(e.semester);
            });
        }

        // If the AI didn't find any specific semesters natively, it defaults to the dropdown one
        if (extractedSemesters.size === 0) {
            extractedSemesters.add(semesterId);
        }

        const existingSemesters = [];
        for (const sem of extractedSemesters) {
            const checkRef = await db.collection('programs').doc(programId)
                .collection('semesters').doc(sem)
                .collection('subjects').limit(1).get();
            if (!checkRef.empty) {
                existingSemesters.push(sem);
            }
        }

        // Return raw extracted data for preview/edit
        res.json({ message: "Document extracted successfully! Please review.", data: extractedData, existingSemesters });
    } catch (error) {
        console.error("Extraction failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// AI DATA APPROVE & SAVE
// ==========================================
app.post('/api/admin/save-document', async (req, res) => {
    try {
        const { programId, semesterId, extractedData } = req.body;

        if (!programId || !semesterId || !extractedData) {
            return res.status(400).json({ error: "Missing required fields for saving." });
        }

        const fs = require('fs');
        const path = require('path');
        const { exec } = require('child_process');

        // 1. If it's a Syllabus, update the local syllabusData.js file instead of writing directly to Firestore
        if (extractedData.syllabus) {
            const syllabusFilePath = path.join(__dirname, 'syllabusData.js');

            // Invalidate the cache to ensure we get the latest file if modified manually
            delete require.cache[require.resolve('./syllabusData.js')];
            const syllabusData = require('./syllabusData.js');

            // Ensure the program exists
            if (!syllabusData[programId]) {
                syllabusData[programId] = { programName: programId, semesters: {} };
            }
            if (!syllabusData[programId].semesters) {
                syllabusData[programId].semesters = {};
            }

            for (const [subjectCodeStr, subjectData] of Object.entries(extractedData.syllabus)) {
                const assignedSemester = subjectData.semester || semesterId;

                // Ensure the semester exists
                if (!syllabusData[programId].semesters[assignedSemester]) {
                    syllabusData[programId].semesters[assignedSemester] = {};
                }

                // Overwrite or add the subject inside the hard-coded object
                syllabusData[programId].semesters[assignedSemester][subjectCodeStr] = {
                    name: subjectData.name || subjectCodeStr,
                    credits: subjectData.credits || 0,
                    teacher: subjectData.teacherName || "TBA",
                    type: subjectData.type || "Core",
                    units: subjectData.units || []
                };
            }

            // Write it back to the file system as valid JS code
            const newContent = 'const syllabusData = ' + JSON.stringify(syllabusData, null, 2) + ';\n\nmodule.exports = syllabusData;\n';
            fs.writeFileSync(syllabusFilePath, newContent, 'utf8');

            // 2. Automatically run the user's migrate script to sync it perfectly
            console.log("Triggering migrateTeachersAndSyllabus.js automatically...");
            const util = require('util');
            const execPromise = util.promisify(exec);
            let scriptOutput = "";
            try {
                const { stdout, stderr } = await execPromise('node migrateTeachersAndSyllabus.js', { cwd: __dirname });
                scriptOutput = stdout;
                console.log(`migrate Output: ${stdout}`);
            } catch (err) {
                console.error(`Error executing migrate: ${err}`);
                return res.status(500).json({ error: "Syllabus updated locally, but upload failed: " + err.message });
            }
        }

        // 3. Keep the old batch logic ONLY for exams (since they go to examData / Firestore directly)
        if (extractedData.exams) {
            const batch = db.batch();
            for (const [subjectCode, examDataObj] of Object.entries(extractedData.exams)) {
                const sanitizedCode = sanitizeSubjectCode(subjectCode);
                const assignedSemester = examDataObj.semester || semesterId;

                const examRef = db.collection('exams').doc(sanitizedCode + "-" + assignedSemester);

                batch.set(examRef, {
                    subjectCode: sanitizedCode,
                    programId: programId,
                    semesterId: assignedSemester,
                    subjectName: examDataObj.subjectName || sanitizedCode,
                    date: examDataObj.date || "",
                    time: examDataObj.time || "",
                    type: examDataObj.type || "Unknown"
                }, { merge: true });
            }
            await batch.commit();
        }

        res.json({ message: "Data successfully saved to syllabusData.js!\n\n" + (typeof scriptOutput !== 'undefined' ? scriptOutput : '') });
    } catch (error) {
        console.error("Save failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get("/", (req, res) => {
    res.status(200).send("ForenSync Backend is awake and running!");
});

// ==========================================
// GOOGLE DRIVE SYNC
// ==========================================
async function getDriveChildren(parentId, drive, isFolder = true) {
    let q = `'${parentId}' in parents and trashed=false`;
    q += isFolder ? ` and mimeType='application/vnd.google-apps.folder'` : ` and mimeType!='application/vnd.google-apps.folder'`;

    try {
        const res = await drive.files.list({
            q: q,
            fields: 'files(id, name, webViewLink, webContentLink, mimeType)',
            spaces: 'drive'
        });
        return res.data.files || [];
    } catch (error) {
        console.error(`Error fetching children for ${parentId}:`, error.message);
        return [];
    }
}

function normalizeFolderName(folderName) {
    if (typeof folderName !== 'string') return null;
    const normalized = folderName.replace(/\s+/g, ' ').trim();
    return normalized || null;
}

function deriveCategoryFromStoredName(fileName) {
    if (typeof fileName !== 'string' || !fileName.includes('/')) return null;

    const pathSegments = fileName
        .split('/')
        .map(segment => segment.trim())
        .filter(Boolean);

    if (pathSegments.length < 2) return null;
    return normalizeFolderName(pathSegments[pathSegments.length - 2]);
}

function sanitizeSubjectCode(text) {
    if (typeof text !== 'string') return '';
    const homoglyphs = {
        'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H',
        'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T',
        'Х': 'X', 'У': 'Y', 'а': 'a', 'в': 'b', 'с': 'c',
        'е': 'e', 'н': 'h', 'к': 'k', 'м': 'm', 'о': 'o',
        'р': 'p', 'т': 't', 'х': 'x', 'у': 'y'
    };
    let clean = Array.from(text).map(char => homoglyphs[char] || char).join('');
    return clean.replace(/[^A-Za-z0-9\-]/g, '');
}

async function fetchAllFilesRecursively(folderId, drive, pathPrefix = "", parentFolderName = null) {
    let allFiles = [];
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, webViewLink, webContentLink, mimeType)',
            spaces: 'drive'
        });

        const items = res.data.files || [];

        for (const item of items) {
            if (item.mimeType === 'application/vnd.google-apps.folder') {
                const subFiles = await fetchAllFilesRecursively(
                    item.id,
                    drive,
                    `${pathPrefix}${item.name} / `,
                    item.name
                );
                allFiles = allFiles.concat(subFiles);
            } else {
                allFiles.push({
                    ...item,
                    displayName: `${pathPrefix}${item.name}`,
                    category: normalizeFolderName(parentFolderName)
                });
            }
        }
    } catch (error) {
        console.error(`Error crawling folder ${folderId}:`, error.message);
    }
    return allFiles;
}

async function fetchSubjectAndContributorNotes(subjectFolderId, drive) {
    const result = {
        officialNotes: [],
        contributorNotes: []
    };

    try {
        // 1. Scan the Root Subject Folder
        const rootRes = await drive.files.list({
            q: `'${subjectFolderId}' in parents and trashed=false`,
            fields: 'files(id, name, webViewLink, webContentLink, mimeType, appProperties)',
            spaces: 'drive'
        });

        const rootItems = rootRes.data.files || [];

        // 2. Loop and filter through items
        for (const item of rootItems) {
            const isFolder = item.mimeType === 'application/vnd.google-apps.folder';

            if (!isFolder) {
                // 3. FILE -> Push to officialNotes array
                result.officialNotes.push(item);
            } else {
                // 4. FOLDER -> Check folder name exactly
                if (item.name === "Contributors") {
                    // 6. IS "Contributors" -> Perform a second query for inside files
                    const contribRes = await drive.files.list({
                        q: `'${item.id}' in parents and trashed=false`,
                        fields: 'files(id, name, webViewLink, webContentLink, mimeType, appProperties)',
                        spaces: 'drive'
                    });

                    const contribItems = contribRes.data.files || [];

                    // Push these files into contributorNotes array
                    for (const cItem of contribItems) {
                        // Ensure we aren't pushing sub-folders inside contributors
                        if (cItem.mimeType !== 'application/vnd.google-apps.folder') {
                            result.contributorNotes.push(cItem);
                        }
                    }
                }
                // 5. If NOT "Contributors", it's ignored completely
            }
        }
    } catch (error) {
        console.error(`Error fetching subject notes for folder ${subjectFolderId}:`, error.message);
    }

    // 7. Return the object containing both arrays
    return result;
}

app.post("/api/sync-drive", async (req, res) => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: './serviceAccountKey.json',
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });

        const ROOT_NFSU_FOLDER_ID = '1bmI8_Bkn1airL4qznDJLWGc96wj76smp';

        const programs = await getDriveChildren(ROOT_NFSU_FOLDER_ID, drive, true);

        for (const prog of programs) {
            const semesters = await getDriveChildren(prog.id, drive, true);

            for (const sem of semesters) {
                const types = await getDriveChildren(sem.id, drive, true);

                for (const type of types) {
                    const subjects = await getDriveChildren(type.id, drive, true);
                    for (const subj of subjects) {
                        const sanitizedSubjectName = sanitizeSubjectCode(subj.name);

                        let mappedName = subjectDictionary[sanitizedSubjectName];
                        if (!mappedName) {
                            console.warn(`⚠️ Warning: Dictionary is missing a mapping for subject code: ${sanitizedSubjectName}. Falling back to default.`);
                            mappedName = sanitizedSubjectName;
                        }

                        // FIX: Ensure subject parent document is not a ghost document, so it can be listed!
                        const subjectRef = db.collection("subjects").doc(sanitizedSubjectName);
                        await subjectRef.set({
                            name: mappedName,
                            course: prog.name,
                            semester: sem.name,
                            lastSynced: admin.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });

                        // Use includes('note') to robustly catch folders named "Notes", "01. Notes", etc.
                        if (type.name.toLowerCase().includes('note')) {
                            const { officialNotes, contributorNotes } = await fetchSubjectAndContributorNotes(subj.id, drive);

                            const officialPromises = officialNotes.map(file => {
                                const docRef = db.collection("subjects").doc(sanitizedSubjectName)
                                    .collection(type.name).doc(file.id);
                                return docRef.set({
                                    name: file.displayName || file.name,
                                    category: admin.firestore.FieldValue.delete(),
                                    webViewLink: file.webViewLink || "#",
                                    webContentLink: file.webContentLink || "#",
                                    mimeType: file.mimeType,
                                    type: file.mimeType && file.mimeType.includes('pdf') ? 'pdf' : 'doc',
                                    source: "official",
                                    lastSynced: admin.firestore.FieldValue.serverTimestamp()
                                }, { merge: true });
                            });

                            const contribPromises = contributorNotes.map(file => {
                                const docRef = db.collection("subjects").doc(sanitizedSubjectName)
                                    .collection(type.name).doc(file.id);

                                const baseName = file.displayName || file.name;
                                const cleanedName = baseName.replace(/^Contributors\s*\/\s*/i, '');

                                return docRef.set({
                                    name: cleanedName,
                                    category: admin.firestore.FieldValue.delete(),
                                    webViewLink: file.webViewLink || "#",
                                    webContentLink: file.webContentLink || "#",
                                    mimeType: file.mimeType,
                                    type: file.mimeType && file.mimeType.includes('pdf') ? 'pdf' : 'doc',
                                    source: "contributor",
                                    contributorName: file.appProperties?.uploaderName || "Unknown",
                                    lastSynced: admin.firestore.FieldValue.serverTimestamp()
                                }, { merge: true });
                            });

                            await Promise.all([...officialPromises, ...contribPromises]);

                        } else {
                            // Standard fetching for PYQs, question banks, etc.
                            const files = await fetchAllFilesRecursively(subj.id, drive);

                            const promises = files.map(file => {
                                const docRef = db.collection("subjects").doc(sanitizedSubjectName)
                                    .collection(type.name).doc(file.id);

                                return docRef.set({
                                    name: file.displayName || file.name,
                                    category: file.category || null,
                                    webViewLink: file.webViewLink || "#",
                                    webContentLink: file.webContentLink || "#",
                                    mimeType: file.mimeType,
                                    type: file.mimeType && file.mimeType.includes('pdf') ? 'pdf' : 'doc',
                                    lastSynced: admin.firestore.FieldValue.serverTimestamp()
                                }, { merge: true });
                            });
                            await Promise.all(promises);
                        }
                    }
                }
            }
        }
        res.json({ message: "Drive Sync successful! Database updated." });
    } catch (error) {
        console.error("Sync failed.", error);
        res.status(500).json({ error: "Sync failed check server logs." });
    }
});


app.get("/api/notes/:programId/:semesterId/:subjects", async (req, res) => {
    try {
        const { programId, semesterId, subjects } = req.params;
        const sanitizedSubject = sanitizeSubjectCode(subjects);
        const type = req.query.type || 'Notes';

        const snapshot = await db.collection("subjects").doc(sanitizedSubject)
            .collection(type).get();

        if (snapshot.empty) return res.json({ files: [] });

        const filesList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                category: data.category || deriveCategoryFromStoredName(data.name)
            };
        });

        res.json({ files: filesList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch notes." });
    }
});

// ==========================================
// GLOBAL SEARCH ENDPOINT
// ==========================================
app.get('/api/search', async (req, res) => {
    try {
        const searchQuery = req.query.q;
        if (!searchQuery) return res.json([]);

        const q = searchQuery.toLowerCase();
        let searchResults = [];

        if (syllabusData) {
            for (const [progId, progData] of Object.entries(syllabusData)) {
                if (progData.name && progData.name.toLowerCase().includes(q)) {
                    searchResults.push({
                        title: progData.name,
                        description: "Full Program Syllabus",
                        type: "Program",
                        link: `/syllabus/${progId}`
                    });
                }

                if (progData.semesters) {
                    for (const [semId, subjectsObj] of Object.entries(progData.semesters)) {
                        for (const [subjId, subjData] of Object.entries(subjectsObj)) {
                            const subjectName = typeof subjData === 'string' ? subjData : (subjData.name || subjId);

                            if (subjectName.toLowerCase().includes(q)) {
                                const exists = searchResults.find(res => res.title === subjectName && res.type === "Subject");
                                if (!exists) {
                                    searchResults.push({
                                        title: subjectName,
                                        description: `Semester ${semId.replace('sem-', '')} Subject`,
                                        type: "Subject",
                                        link: `/syllabus/${progId}/${semId}/${subjId}`
                                    });
                                }
                            }

                            // Deep Search: Traverse Units and Topics
                            if (typeof subjData === 'object' && subjData.units && Array.isArray(subjData.units)) {
                                subjData.units.forEach((unit, index) => {

                                    // Check unit title
                                    if (unit.title && unit.title.toLowerCase().includes(q)) {
                                        const exists = searchResults.find(res => res.title === unit.title && res.type === "Topic");
                                        if (!exists) {
                                            searchResults.push({
                                                title: unit.title,
                                                description: unit.topics ? unit.topics.join(', ').substring(0, 80) + '...' : 'Sub-topic elements',
                                                type: "Topic",
                                                breadcrumbs: `Semester ${semId.replace('sem-', '')} • ${subjectName} • Unit ${unit.unitNumber || index + 1}`,
                                                link: `/syllabus/${progId}/${semId}/${subjId}?unit=${index}`
                                            });
                                        }
                                    }

                                    // Check individual topics within the unit
                                    if (unit.topics && Array.isArray(unit.topics)) {
                                        unit.topics.forEach(topic => {
                                            if (topic.toLowerCase().includes(q)) {
                                                const exists = searchResults.find(res => res.title === topic && res.type === "Topic");
                                                if (!exists) {
                                                    searchResults.push({
                                                        title: topic,
                                                        description: `Featured in: ${unit.title}`,
                                                        type: "Topic",
                                                        breadcrumbs: `Semester ${semId.replace('sem-', '')} • ${subjectName} • Unit ${unit.unitNumber || index + 1}`,
                                                        link: `/syllabus/${progId}/${semId}/${subjId}?unit=${index}`
                                                    });
                                                }
                                            }
                                        });
                                    }

                                });
                            }
                        }
                    }
                }
            }
        }

        const notesSnapshot = await db.collectionGroup('Notes').get();
        notesSnapshot.forEach(doc => {
            const data = doc.data();
            const fileName = data.name || "";

            if (fileName.toLowerCase().includes(q)) {
                searchResults.push({
                    title: fileName.replace('.pdf', ''),
                    description: `PDF Note Document`,
                    type: "Notes",
                    link: data.webViewLink || "#"
                });
            }
        });

        const pyqSnapshot = await db.collectionGroup('PYQ').get();
        pyqSnapshot.forEach(doc => {
            const data = doc.data();
            const fileName = data.name || "";

            if (fileName.toLowerCase().includes(q)) {
                searchResults.push({
                    title: fileName.replace('.pdf', ''),
                    description: `Past Year Question Paper`,
                    type: "PYQ",
                    link: data.webViewLink || "#"
                });
            }
        });

        const qBankSnapshot = await db.collection('question_bank').get();
        qBankSnapshot.forEach(doc => {
            const data = doc.data();
            const subject = data.subject || "";
            const text = data.question_text || "";

            if (subject.toLowerCase().includes(q) || text.toLowerCase().includes(q)) {
                const exists = searchResults.find(res => res.title === `${subject} Mock Test`);
                if (!exists) {
                    searchResults.push({
                        title: `${subject} Mock Test`,
                        description: `Generated from database of extracted questions.`,
                        type: "Practice",
                        link: `/practice`
                    });
                }
            }
        });

        const subjectsSnapshot = await db.collectionGroup('subjects').get();
        subjectsSnapshot.forEach(doc => {
            const data = doc.data();
            const subjectName = data.name || doc.id;

            if (subjectName.toLowerCase().includes(q)) {
                const pathParts = doc.ref.path.split('/');
                if (pathParts.length >= 6) {
                    const progId = pathParts[1];
                    const semId = pathParts[3];
                    const subjId = pathParts[5];

                    const exists = searchResults.find(res => res.title === subjectName);
                    if (!exists) {
                        searchResults.push({
                            title: subjectName,
                            description: "View complete syllabus, modules, and resources.",
                            type: "Subject",
                            link: `/syllabus/${progId}/${semId}/${subjId}`
                        });
                    }
                }
            }
        });

        const examsSnapshot = await db.collectionGroup('exams').get();
        examsSnapshot.forEach(doc => {
            const data = doc.data();
            const title = data.title || data.courseName || data.subject || "Scheduled Exam";
            const date = data.date || data.examDate || "";

            if (title.toLowerCase().includes(q)) {
                searchResults.push({
                    title: `Exam: ${title}`,
                    description: date ? `Scheduled for: ${date}` : "Check Exams dashboard for timing.",
                    type: "Exam",
                    link: `/exams`
                });
            }
        });

        res.json(searchResults.slice(0, 15));

    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: "Failed to perform search" });
    }
});


// ==========================================
// SYLLABUS & EXAM ROUTES
// ==========================================

app.get('/api/syllabus/:programId/:semesterId', async (req, res) => {
    try {
        const { programId, semesterId } = req.params;

        const subjectsRef = db.collection('programs').doc(programId)
            .collection('semesters').doc(semesterId)
            .collection('subjects');

        const snapshot = await subjectsRef.get();

        if (snapshot.empty) {
            return res.json({ subjects: [] });
        }

        // Check Notes subcollection for each subject in parallel
        const subjects = await Promise.all(snapshot.docs.map(async (doc) => {
            const notesSnapshot = await db.collection('subjects').doc(doc.id).collection('Notes').limit(1).get();
            return { id: doc.id, ...doc.data(), hasNotes: !notesSnapshot.empty };
        }));

        res.json({ subjects });
    } catch (error) {
        console.error("Error fetching subjects list:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/api/syllabus/:programId/:semesterId/:subjects', async (req, res) => {
    try {
        const { programId, semesterId, subjects } = req.params;
        const sanitizedSubject = sanitizeSubjectCode(subjects);

        // Fetch from the root 'subjects' collection which is the source of truth for full syllabus details (including units)
        const docRef = db.collection('subjects').doc(sanitizedSubject);

        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: `Subject ${subjects} not found` });
        }

        res.json(doc.data());
    } catch (error) {
        console.error("Error fetching subject details:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// GET SEMESTER METADATA (Start & End Dates for Progress Circle)
app.get('/api/semester-info/:programId/:semesterId', async (req, res) => {
    try {
        const { programId, semesterId } = req.params;
        const docRef = db.collection('programs').doc(programId)
            .collection('semesters').doc(semesterId);

        const doc = await docRef.get();

        // Ghost Document Fallback: If it doesn't exist or has no fields, return safe dummy dates
        if (!doc.exists || !doc.data().startDate) {
            return res.json({
                startDate: "2026-01-01",
                endDate: "2026-06-01",
                isDefaultFallback: true
            });
        }

        res.json(doc.data());
    } catch (error) {
        console.error("Error fetching semester dates:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/api/exams/:programId/:semesterId', async (req, res) => {
    try {
        const { programId, semesterId } = req.params;
        const examsRef = db.collection('exams');
        const q = examsRef.where('programId', '==', programId).where('semesterId', '==', semesterId);

        const snapshot = await q.get();
        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const exams = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                code: data.subjectCode,
                name: data.subjectName,
                examDate: data.date,
                time: data.time,
                type: data.type,
                fullMarks: data.fullMarks || 100,
                colorClass: data.colorClass || 'exam-blue',
                dotColor: data.dotColor || '#3b82f6'
            };
        });

        const sortedExams = exams.sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
        return res.status(200).json(sortedExams);
    } catch (error) {
        console.error("Error fetching exams from Firestore:", error);
        res.status(500).json({ error: "Failed to fetch exams" });
    }
});


// ==========================================
// ==========================================
// AUTH ROUTES (KYC Onboarding & Verification)
// ==========================================

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("Error connecting to SMTP server:", error);
    } else {
        console.log("Successfully connected to Google SMTP server!");
    }
});

app.post("/api/auth/send-verification-email", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const actionCodeSettings = {
            url: 'https://www.forensync.me/login',
            handleCodeInApp: true
        };

        const firebaseLink = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
        const match = firebaseLink.match(/oobCode=([^&]+)/);
        const token = match ? match[1] : '';
        const link = `https://www.forensync.me/verify-email?token=${token}`;

        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your ForenSync Account</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); text-align: center; }
        .header { padding: 40px 30px 20px; }
        .header h1 { color: #FFFFFF; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .content { padding: 20px 30px 40px; }
        .content h2 { color: #F1F5F9; font-size: 24px; margin-top: 0; margin-bottom: 16px; font-weight: 600; }
        .content p { color: #CBD5E1; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
        .button { display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: #ffffff !important; font-weight: 600; font-size: 16px; text-decoration: none; padding: 16px 36px; border-radius: 9999px; transition: transform 0.2s ease, box-shadow 0.2s ease; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4); }
        .button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6); }
        .footer { background-color: #0F172A; padding: 24px 30px; text-align: center; font-size: 14px; color: #64748B; border-top: 1px solid #1E293B; }
        .footer a { color: #3B82F6; text-decoration: none; transition: color 0.2s ease; }
        .footer a:hover { color: #60A5FA; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ForenSync</h1>
        </div>
        <div class="content">
            <h2>Welcome to the Hub!</h2>
            <p>You're almost there. To ensure the security of your new ForenSync account, please verify your university or personal email address by clicking the button below.</p>
            <a href="${link}" class="button">Verify Email Address</a>
            <p style="font-size: 14px; color: #64748B; margin-bottom: 0;">If you did not request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} ForenSync. All rights reserved.</p>
            <p style="margin: 0;"><a href="https://www.forensync.me">forensync.me</a></p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: 'ForenSync Portal <forensync.nfsu@gmail.com>',
            to: email,
            subject: 'Verify your ForenSync Account',
            html: htmlTemplate
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: "Verification email sent successfully." });
    } catch (error) {
        console.error("Error sending verification email:", error);
        res.status(500).json({ error: "Failed to send verification email" });
    }
});
// ==========================================
app.post("/api/auth/verify-email", async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: "Verification token is required" });
        }

        const apiKey = process.env.FIREBASE_API_KEY;
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oobCode: token })
        });

        const data = await response.json();
        if (!response.ok) {
            return res.status(400).json({ error: data.error.message || "Failed to verify email. Token may be expired or invalid." });
        }

        res.status(200).json({ message: "Email successfully verified!" });
    } catch (error) {
        console.error("Error verifying email via backend:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ==========================================
app.post("/api/auth/send-password-reset-email", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        const actionCodeSettings = {
            url: 'https://www.forensync.me/login',
            handleCodeInApp: true
        };
        const link = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your ForenSync Password</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; text-align: center; }
        .content h2 { color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 16px; }
        .content p { color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
        .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 16px; text-decoration: none; padding: 14px 32px; border-radius: 8px; transition: background-color 0.2s ease; margin-bottom: 24px; }
        .button:hover { background-color: #1d4ed8; }
        .footer { background-color: #f1f5f9; padding: 24px 30px; text-align: center; font-size: 14px; color: #64748b; }
        .footer a { color: #3b82f6; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ForenSync</h1>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset the password for your ForenSync account. If you made this request, please click the button below to securely set a new password.</p>
            <a href="${link}" class="button">Reset Password</a>
            <p style="font-size: 14px; color: #94a3b8;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ForenSync. All rights reserved.</p>
            <p><a href="https://www.forensync.me">forensync.me</a></p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: 'ForenSync Portal <forensync.nfsu@gmail.com>',
            to: email,
            subject: 'Reset Your ForenSync Password',
            html: htmlTemplate
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: "Password reset email sent." });
    } catch (error) {
        console.error("Error sending password reset email:", error);
        res.status(500).json({ error: "Failed to send password reset email" });
    }
});

app.post("/api/auth/send-email-change-verification", async (req, res) => {
    try {
        const { email, newEmail } = req.body;
        if (!email || !newEmail) return res.status(400).json({ error: "Current email and new email are required" });

        const actionCodeSettings = {
            url: 'https://www.forensync.me/dashboard',
            handleCodeInApp: true
        };
        const link = await admin.auth().generateVerifyAndChangeEmailLink(email, newEmail, actionCodeSettings);

        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your New Email Address</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; text-align: center; }
        .content h2 { color: #0f172a; font-size: 24px; margin-top: 0; margin-bottom: 16px; }
        .content p { color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
        .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 16px; text-decoration: none; padding: 14px 32px; border-radius: 8px; transition: background-color 0.2s ease; margin-bottom: 24px; }
        .button:hover { background-color: #1d4ed8; }
        .footer { background-color: #f1f5f9; padding: 24px 30px; text-align: center; font-size: 14px; color: #64748b; }
        .footer a { color: #3b82f6; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ForenSync</h1>
        </div>
        <div class="content">
            <h2>Update Your Email Address</h2>
            <p>You requested to change the email address associated with your ForenSync account to <strong>${newEmail}</strong>. Please confirm this change by clicking the button below.</p>
            <a href="${link}" class="button">Confirm New Email</a>
            <p style="font-size: 14px; color: #94a3b8;">If you did not request this change, please ignore this email and your account will remain tied to your original address.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ForenSync. All rights reserved.</p>
            <p><a href="https://www.forensync.me">forensync.me</a></p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: 'ForenSync Portal <forensync.nfsu@gmail.com>',
            to: newEmail,
            subject: 'Confirm Your New Email Address - ForenSync',
            html: htmlTemplate
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: "Email change verification sent." });
    } catch (error) {
        console.error("Error sending email change verification:", error);
        res.status(500).json({ error: "Failed to send email change verification" });
    }
});

app.post("/api/auth/register", async (req, res) => {
    try {
        const { uid, email, name, role, programId, adminType, isVerifiedAdmin, enrollmentNumber, semesterId, isVerifiedID, profilePictureUrl } = req.body;

        if (!uid || !email || !name) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const usersRef = db.collection("users");

        // Database Uniqueness Constraint (Backend/Firebase)
        if (enrollmentNumber) {
            const enrollmentQuery = await usersRef.where("enrollmentNumber", "==", enrollmentNumber).get();
            if (!enrollmentQuery.empty) {
                const conflictingDocs = enrollmentQuery.docs.filter(d => d.id !== uid);
                if (conflictingDocs.length > 0) {
                    return res.status(400).json({ error: 'This Enrollment Number or Email is already registered.' });
                }
            }
        }

        const emailQuery = await usersRef.where("email", "==", email).get();
        if (!emailQuery.empty) {
            const conflictingDocs = emailQuery.docs.filter(d => d.id !== uid);
            if (conflictingDocs.length > 0) {
                return res.status(400).json({ error: 'This Enrollment Number or Email is already registered.' });
            }
        }

        const userProfile = {
            uid,
            email,
            name,
            role,
            programId,
            ...(profilePictureUrl ? { profilePictureUrl } : {}),
            ...(role === 'Admin' ? { adminType, isVerifiedAdmin: isVerifiedAdmin || false } : {}),
            ...(enrollmentNumber ? { enrollmentNumber, semesterId, isVerifiedID: Boolean(isVerifiedID) } : {})
        };

        await usersRef.doc(uid).set(userProfile);

        return res.status(200).json({ message: "Registration successful", userProfile });
    } catch (error) {
        console.error("KYC Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// ==========================================
// USER ROUTES
// ==========================================
app.get("/api/users/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const userDoc = await db.collection("users").doc(username.toLowerCase()).get();

        if (!userDoc.exists) return res.status(404).json({ error: "User not found." });
        res.json(userDoc.data());
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});


// ==========================================
// ADMIN ROUTES (DRIVE SYNC & UPLOAD)
// ==========================================
app.get('/api/drive/folders', async (req, res) => {
    try {
        const parentId = req.query.parentId || '1bmI8_Bkn1airL4qznDJLWGc96wj76smp';

        const auth = new google.auth.GoogleAuth({
            keyFile: './serviceAccountKey.json',
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });

        const response = await drive.files.list({
            q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        res.json(response.data.files || []);
    } catch (error) {
        console.error("Error fetching folders:", error);
        res.status(500).json({ error: "Failed to fetch folders" });
    }
});

app.post('/api/admin/sync', async (req, res) => {
    try {
        const { programId, semesterId, subjectId, subjects, type } = req.body;

        // Match what the frontend sends (subjectId) but fallback to subjects if older frontend code hits it
        const finalSubjectId = sanitizeSubjectCode(subjectId || subjects);

        // Strict Safety Verification (Prevent Firestore native crashes entirely)
        if (!programId || !semesterId || !finalSubjectId) {
            return res.status(400).json({ error: "Missing required path parameters for Sync" });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GDRIVE_CLIENT_ID,
            process.env.GDRIVE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GDRIVE_REFRESH_TOKEN });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const targetType = type || 'Unknown';
        const ROOT_NFSU_FOLDER_ID = '1bmI8_Bkn1airL4qznDJLWGc96wj76smp';

        // 1. Locate the correct Google Drive folder for this specific Subject dynamically
        const drivePrograms = await getDriveChildren(ROOT_NFSU_FOLDER_ID, drive, true);
        const progFolder = drivePrograms.find(p => p.name === programId);
        if (!progFolder) throw new Error(`Program folder '${programId}' not found in Drive`);

        const driveSemesters = await getDriveChildren(progFolder.id, drive, true);
        const semFolder = driveSemesters.find(s => s.name === semesterId);
        if (!semFolder) throw new Error(`Semester folder '${semesterId}' not found in Drive`);

        const driveTypes = await getDriveChildren(semFolder.id, drive, true);
        const typeFolder = driveTypes.find(t => t.name === targetType);
        if (!typeFolder) throw new Error(`Type folder '${targetType}' not found in Drive`);

        const driveSubjects = await getDriveChildren(typeFolder.id, drive, true);
        const subjFolder = driveSubjects.find(s => s.name === finalSubjectId);
        if (!subjFolder) throw new Error(`Subject folder '${finalSubjectId}' not found in Drive`);

        // FIX: Create parent subject metadata to prevent Ghost Documents
        const subjectDocRef = db.collection("subjects").doc(finalSubjectId);
        await subjectDocRef.set({ name: subjFolder.name, lastSynced: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

        // First, fetch the current list of files from the Google Drive subject folder
        const driveFiles = await fetchAllFilesRecursively(subjFolder.id, drive);

        // Second, fetch the current list of documents from the Firestore collection
        const collectionRef = db.collection("subjects").doc(finalSubjectId)
            .collection(targetType);

        const snapshot = await collectionRef.get();
        const existingDocIds = snapshot.docs.map(doc => doc.id);

        let addedCount = 0;
        let deletedCount = 0;

        let updatedCount = 0;

        // Check for Additions & Updates: If Drive has a new file, add it. If it exists, update it to catch renames.
        for (const file of driveFiles) {
            const fileData = {
                name: file.displayName || file.name,
                category: file.category || null,
                webViewLink: file.webViewLink || "#",
                webContentLink: file.webContentLink || "#",
                mimeType: file.mimeType,
                type: file.mimeType && file.mimeType.includes('pdf') ? 'pdf' : 'doc',
                lastSynced: admin.firestore.FieldValue.serverTimestamp()
            };

            if (!existingDocIds.includes(file.id)) {
                await collectionRef.doc(file.id).set(fileData, { merge: true });
                addedCount++;
            } else {
                // Update the existing document with fresh metadata from Drive
                await collectionRef.doc(file.id).set(fileData, { merge: true });
                updatedCount++;
            }
        }

        // Check for Removals: Compare Firestore against current Drive files
        const driveFileIds = driveFiles.map(file => file.id);
        const checkPromises = snapshot.docs.map(async (doc) => {
            if (!driveFileIds.includes(doc.id)) {
                await collectionRef.doc(doc.id).delete();
                deletedCount++;
            }
        });

        await Promise.all(checkPromises);

        res.status(200).json({
            message: `Sync complete! Added ${addedCount}, Removed ${deletedCount}, Updated ${updatedCount} files.`,
            addedCount: addedCount,
            deletedCount: deletedCount,
            removedCount: deletedCount,
            updatedCount: updatedCount
        });

    } catch (error) {
        console.error("🔥 Sync Error:", error);
        // Safely return precise error preventing hard lockups
        res.status(500).json({ error: error.message || "Failed to sync with Google Drive." });
    }
});

app.post('/api/admin/sync-global', async (req, res) => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GDRIVE_CLIENT_ID,
            process.env.GDRIVE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GDRIVE_REFRESH_TOKEN });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const ROOT_NFSU_FOLDER_ID = '1bmI8_Bkn1airL4qznDJLWGc96wj76smp';
        const programs = await getDriveChildren(ROOT_NFSU_FOLDER_ID, drive, true);

        let totalAdded = 0;
        let totalRemoved = 0;
        let addedFiles = [];
        let removedFiles = [];

        for (const prog of programs) {
            let progId = prog.name;
            const lowerName = prog.name.toLowerCase();
            if (lowerName.includes('b.tech') || lowerName.includes('btech') || lowerName.includes('cyber')) progId = 'btech-mtech-cybersecurity';
            else if (lowerName.includes('b.sc') || lowerName.includes('bsc') || lowerName.includes('forensic')) progId = 'bsc-msc-forensic';

            try {
                const semesters = await getDriveChildren(prog.id, drive, true);
                for (const sem of semesters) {
                    try {
                        const types = await getDriveChildren(sem.id, drive, true);
                        for (const type of types) {
                            try {
                                const subjects = await getDriveChildren(type.id, drive, true);
                                for (const subj of subjects) {
                                    const sanitizedSubjectName = sanitizeSubjectCode(subj.name);

                                    let mappedName = subjectDictionary[sanitizedSubjectName];
                                    if (!mappedName) {
                                        console.warn(`⚠️ Warning: Dictionary is missing a mapping for subject code: ${sanitizedSubjectName}. Falling back to default.`);
                                        mappedName = sanitizedSubjectName;
                                    }

                                    console.log(`\n[SYNC] Scanning: ${prog.name} -> ${sem.name} -> ${type.name} -> ${sanitizedSubjectName}`);
                                    try {
                                        // FIX: Ensure subject isn't a ghost document
                                        const subjectDocRef = db.collection("subjects").doc(sanitizedSubjectName);
                                        await subjectDocRef.set({
                                            name: mappedName,
                                            course: prog.name,
                                            semester: sem.name,
                                            lastSynced: admin.firestore.FieldValue.serverTimestamp()
                                        }, { merge: true });

                                        const driveFiles = await fetchAllFilesRecursively(subj.id, drive);

                                        const collectionRef = db.collection("subjects").doc(sanitizedSubjectName)
                                            .collection(type.name);

                                        const snapshot = await collectionRef.get();
                                        const existingDocs = {};
                                        snapshot.docs.forEach(doc => { existingDocs[doc.id] = doc.data(); });
                                        const existingDocIds = Object.keys(existingDocs);

                                        for (const file of driveFiles) {
                                            const finalName = file.displayName || file.name;
                                            const fileData = {
                                                name: finalName,
                                                category: file.category || null,
                                                webViewLink: file.webViewLink || "#",
                                                webContentLink: file.webContentLink || "#",
                                                mimeType: file.mimeType,
                                                type: file.mimeType && file.mimeType.includes('pdf') ? 'pdf' : 'doc',
                                                lastSynced: admin.firestore.FieldValue.serverTimestamp()
                                            };

                                            if (!existingDocIds.includes(file.id)) {
                                                await collectionRef.doc(file.id).set(fileData, { merge: true });
                                                console.log(`[+] Added to Firestore: ${finalName}`);
                                                addedFiles.push(finalName);
                                                totalAdded++;
                                            } else {
                                                // Check for rename so we can log it clearly
                                                const oldName = existingDocs[file.id].name;
                                                if (oldName !== finalName) {
                                                    await collectionRef.doc(file.id).set(fileData, { merge: true });
                                                    console.log(`[*] Updated rename in Firestore: ${oldName} -> ${finalName}`);
                                                } else {
                                                    // Just refresh links and timestamp silently
                                                    await collectionRef.doc(file.id).set(fileData, { merge: true });
                                                }
                                            }
                                        }

                                        // Check for Removals: Compare Firestore against current Drive files
                                        const driveFileIds = driveFiles.map(file => file.id);
                                        const checkPromises = snapshot.docs.map(async (doc) => {
                                            const fileId = doc.id;
                                            const docData = doc.data();
                                            const docName = docData.name || fileId;

                                            if (!driveFileIds.includes(fileId)) {
                                                await collectionRef.doc(fileId).delete();
                                                console.log(`[-] Removed from Firestore: ${docName}`);
                                                removedFiles.push(docName);
                                                totalRemoved++;
                                            }
                                        });

                                        await Promise.all(checkPromises);
                                    } catch (err) {
                                        console.error(`Error syncing subject ${subj.name}:`, err.message);
                                    }
                                }
                            } catch (err) {
                                console.error(`Error syncing type ${type.name}:`, err.message);
                            }
                        }
                    } catch (err) {
                        console.error(`Error syncing semester ${sem.name}:`, err.message);
                    }
                }
            } catch (err) {
                console.error(`Error syncing program ${prog.name}:`, err.message);
            }
        }

        res.status(200).json({
            message: "Global Sync Complete",
            totalAdded,
            totalRemoved,
            addedFiles,
            removedFiles
        });

    } catch (error) {
        console.error("🔥 Global Sync Error:", error);
        res.status(500).json({ error: "Failed to perform global sync." });
    }
});

app.post('/api/admin/upload', upload.single('file'), async (req, res) => {
    try {
        let { targetDriveFolderId, programId, semesterId, subjects, subjectId, type, fileName, pathArray, uid, userName, uploadDestination } = req.body;
        const fileObject = req.file;

        if (!fileObject) return res.status(400).json({ error: "No file uploaded" });
        if (!uid) return res.status(401).json({ error: "Unauthorized: Missing user ID" });

        // Secure RBAC Verification from Firestore
        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) return res.status(401).json({ error: "Unauthorized: User not found" });
        const userData = userDoc.data();

        const isAuthorizedAdmin = userData.role === 'SuperAdmin' || (userData.role === 'Admin' && userData.isVerifiedAdmin);
        if (!isAuthorizedAdmin) {
            return res.status(403).json({ error: "Access Denied: Unverified Admin" });
        }

        // Update the logic to extract variables from the path array
        if (pathArray) {
            try {
                let parsedPath = typeof pathArray === 'string' ? JSON.parse(pathArray) : pathArray;
                if (Array.isArray(parsedPath) && parsedPath.length > 0) {
                    programId = programId || parsedPath[1] || 'btech-mtech-cybersecurity';
                    semesterId = semesterId || parsedPath.find(n => n && typeof n === 'string' && n.toLowerCase().includes('sem')) || 'sem-1';
                    type = type || parsedPath.find(n => n && typeof n === 'string' && (n.toLowerCase() === 'notes' || n.toLowerCase() === 'pyq')) || 'Notes';
                    let foundSubject = parsedPath.find(n => n && typeof n === 'string' && n.includes('-') && !n.toLowerCase().includes('sem') && n !== programId);
                    if (foundSubject) subjectId = subjectId || foundSubject;
                }
            } catch (err) {
                console.error("Path array parsing failed:", err.message);
            }
        }

        if (userData.adminType === 'ActiveContributor') {
            uploadDestination = 'Community Notes';
        } else if (userData.adminType === 'CR' && type !== 'Attendance') {
            uploadDestination = 'Community Notes';
        }

        const isContributorUpload = uploadDestination === 'Community Notes';

        // Robust handling of missing subjects that don't match the standard Program -> Semester -> Subject -> Type structure
        let actualSubject = sanitizeSubjectCode(subjects || subjectId);
        const hasValidSubject = actualSubject && actualSubject !== 'Global' && actualSubject !== 'undefined' && actualSubject !== 'null' && actualSubject.trim() !== '';

        const oauth2Client = new google.auth.OAuth2(
            process.env.GDRIVE_CLIENT_ID,
            process.env.GDRIVE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GDRIVE_REFRESH_TOKEN
        });

        const uploadDrive = google.drive({ version: 'v3', auth: oauth2Client });

        let finalFolderId = targetDriveFolderId;
        if (isContributorUpload) {
            const folderQuery = `name='Contributors' and '${targetDriveFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const folderRes = await uploadDrive.files.list({
                q: folderQuery,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (folderRes.data.files && folderRes.data.files.length > 0) {
                finalFolderId = folderRes.data.files[0].id;
            } else {
                const newFolder = await uploadDrive.files.create({
                    requestBody: {
                        name: 'Contributors',
                        mimeType: 'application/vnd.google-apps.folder',
                        parents: [targetDriveFolderId]
                    },
                    fields: 'id'
                });
                finalFolderId = newFolder.data.id;

                await uploadDrive.permissions.create({
                    fileId: finalFolderId,
                    requestBody: { role: 'reader', type: 'anyone' },
                });
            }
        }

        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileObject.buffer);

        const driveResponse = await uploadDrive.files.create({
            requestBody: {
                name: fileName || fileObject.originalname,
                parents: [finalFolderId],
                appProperties: {
                    uploaderName: userName || userData.name || 'Unknown',
                    uploaderUid: uid,
                    uploadSource: isContributorUpload ? 'contributor' : 'official'
                }
            },
            media: {
                mimeType: fileObject.mimetype,
                body: bufferStream,
            },
            fields: 'id, webViewLink, webContentLink, mimeType',
        });

        const fileId = driveResponse.data.id;
        let parentFolderName = null;

        if (finalFolderId) {
            try {
                const folderResponse = await uploadDrive.files.get({
                    fileId: finalFolderId,
                    fields: 'name'
                });
                parentFolderName = normalizeFolderName(folderResponse.data?.name);
            } catch (folderError) {
                console.warn("Unable to read parent Drive folder name during upload sync:", folderError.message);
            }
        }

        await uploadDrive.permissions.create({
            fileId: fileId,
            requestBody: { role: 'reader', type: 'anyone' },
        });

        try {
            let docRef;
            if (hasValidSubject) {
                docRef = db.collection("subjects").doc(actualSubject)
                    .collection(type || 'Unknown').doc(fileId);
            } else {
                // Conditional Database Saving: If no subject, attach directly to the semester level without crashing
                docRef = db.collection("programs").doc(programId || 'unknown-program')
                    .collection("semesters").doc(semesterId || 'unknown-semester')
                    .collection(type || 'general').doc(fileId);
            }

            let dbPayload = {
                name: fileName || fileObject.originalname,
                category: parentFolderName || (isContributorUpload ? 'Contributors' : 'Official'),
                webViewLink: driveResponse.data.webViewLink,
                webContentLink: driveResponse.data.webContentLink,
                mimeType: driveResponse.data.mimeType,
                type: 'pdf',
                source: isContributorUpload ? 'contributor' : 'official',
                lastSynced: admin.firestore.FieldValue.serverTimestamp()
            };

            if (isContributorUpload) {
                dbPayload.contributorName = userName || userData.name || 'Unknown';
                dbPayload.contributorUid = uid;
            }

            await docRef.set(dbPayload);

            // Always returns a 200 OK if the Drive upload and Database sync both succeed
            res.status(200).json({ message: "Upload successful!" });
        } catch (dbError) {
            console.error("🔥 Database Sync Error:", dbError.message);
            // Catch firestore error without bringing down the whole express endpoint violently
            res.status(500).json({ error: "File uploaded to Drive perfectly, but Database sync failed." });
        }
    } catch (error) {
        console.error("🔥 Detailed Upload Error:", error.message);
        res.status(500).json({ error: "Failed to upload file to Drive." });
    }
});


// ==========================================
// REEJIT'S MOCK TEST ENGINE
// ==========================================

// 🛠️ THE HYBRID BACKGROUND WORKER
async function processFileInBackground(fileBuffer, mimeType) {
    try {
        console.log("Background: 1. Saving original PDF locally...");
        const uploadsDir = path.join(__dirname, "uploads");
        try { await fs.access(uploadsDir); } catch { await fs.mkdir(uploadsDir); }
        const fileName = `Exam_${Date.now()}.pdf`;
        const filePath = path.join(uploadsDir, fileName);
        await fs.writeFile(filePath, fileBuffer);
        const serverPort = process.env.PORT || 5001;
        const pdfDownloadUrl = `http://localhost:${serverPort}/uploads/${fileName}`;

        console.log("Background: 2. Extracting questions with Gemini...");
        const extractedData = await extractQuestions(fileBuffer, mimeType);

        console.log("Background: 3. Saving to Firebase Firestore...");

        // 🛡️ SAFETY NET FUNCTIONS
        const formatSemester = (sem) => {
            if (!sem) return "sem-unknown";
            const s = sem.toLowerCase();
            if (s.includes("sem-")) return s;

            const numMatch = s.match(/\d+/);
            if (numMatch) return `sem-${numMatch[0]}`;

            if (s.includes("viii")) return "sem-8";
            if (s.includes("vii")) return "sem-7";
            if (s.includes("vi")) return "sem-6";
            if (s.includes("iv")) return "sem-4";
            if (s.includes("v")) return "sem-5";
            if (s.includes("iii")) return "sem-3";
            if (s.includes("ii")) return "sem-2";
            if (s.includes("i")) return "sem-1";
            return "sem-unknown";
        };

        const formatProgram = (prog) => {
            if (!prog) return "btech-mtech-cybersecurity";
            const p = prog.toLowerCase();
            if (p.includes("btech") || p.includes("cyber")) return "btech-mtech-cybersecurity";
            if (p.includes("bsc") || p.includes("forensic")) return "bsc-msc-forensic";
            return "btech-mtech-cybersecurity";
        };

        const batch = db.batch();

        extractedData.forEach((q) => {
            const docRef = db.collection("question_bank").doc();
            batch.set(docRef, {
                question_text: q.question_text,
                program_name: formatProgram(q.program_name),
                semester: formatSemester(q.semester),
                subject_name: q.subject_name,
                subject_code: q.subject_code,
                type: q.type,
                source_pdf_url: pdfDownloadUrl,
                added_at: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();

        console.log("\n✅ SUCCESS: EXAM PROCESSED AND SAVED!");
        console.log(`🎓 Program ID:  ${formatProgram(extractedData[0]?.program_name)}`);
        console.log(`📅 Semester ID: ${formatSemester(extractedData[0]?.semester)}`);
        console.log(`🔢 Questions:   ${extractedData.length} saved\n`);

    } catch (error) {
        console.error("🔥 Background Worker Failed:", error);
    }
}

app.post("/api/upload-pyq", upload.single("paper"), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        res.status(202).json({ message: "File received! Extracting questions in the background... ⏳" });
        processFileInBackground(req.file.buffer, req.file.mimetype).catch(err => console.error(err));
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.get("/api/get-test", async (req, res) => {
    try {
        const { program, semester, subject_code } = req.query;

        let query = db.collection("question_bank");

        if (program) query = query.where("program_name", "==", program);
        if (semester) query = query.where("semester", "==", semester);

        if (subject_code && subject_code !== "All") {
            query = query.where("subject_code", "==", subject_code);
        }

        const snapshot = await query.limit(10).get();

        if (snapshot.empty) {
            return res.status(404).json({ error: "No questions found for this curriculum yet. Try uploading a PYQ!" });
        }

        const questions = [];
        snapshot.forEach((doc) => {
            questions.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(questions);
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ error: "Failed to generate test" });
    }
});

app.post("/api/instant-test", upload.single("paper"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const extractedData = await extractQuestions(req.file.buffer, req.file.mimetype);
        res.status(200).json(extractedData);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate instant test." });
    }
});

// 4. Fetch Subjects for PYQ Exams page
app.get('/api/programs/:programId/semesters/:semesterId/exams/:examType/subjects', async (req, res) => {
    try {
        const { programId, semesterId } = req.params;
        const snapshot = await db.collection('programs').doc(programId)
            .collection('semesters').doc(semesterId)
            .collection('subjects').get();
        // Check PYQ subcollection for each subject in parallel
        const subjects = await Promise.all(snapshot.docs.map(async (doc) => {
            const pyqSnapshot = await db.collection('subjects').doc(doc.id).collection('PYQ').limit(1).get();
            return {
                id: doc.id,
                code: doc.data().code || doc.id,
                name: doc.data().name || "Unnamed Subject",
                teacher: doc.data().teacher || null,
                hasPYQs: !pyqSnapshot.empty
            };
        }));
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch subjects for exam" });
    }
});

// ==========================================
// 🗄️ DYNAMIC CURRICULUM FETCHING ROUTES
// ==========================================

// 1. Fetch all Programs
app.get('/api/db/programs', async (req, res) => {
    try {
        const programs = Object.keys(syllabusData).map(key => ({
            id: key,
            name: syllabusData[key].programName || key
        }));
        res.json(programs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch programs" });
    }
});

// 2. Fetch Semesters for a specific Program
app.get('/api/db/programs/:programId/semesters', async (req, res) => {
    try {
        const { programId } = req.params;
        const programData = syllabusData[programId];

        if (!programData || !programData.semesters) {
            return res.json([]);
        }

        const semesters = Object.keys(programData.semesters).map(key => {
            // Attempt to prettify the semester ID (sem-1 -> Semester 1)
            let prettyName = key;
            if (key.startsWith('sem-')) {
                prettyName = `Semester ${key.replace('sem-', '')}`;
            }
            return { id: key, name: prettyName };
        });

        // Sort semi-intelligently so Semester 10 is after Semester 9
        semesters.sort((a, b) => {
            const numA = parseInt(a.id.replace('sem-', ''), 10) || 0;
            const numB = parseInt(b.id.replace('sem-', ''), 10) || 0;
            return numA - numB;
        });

        res.json(semesters);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch semesters" });
    }
});

// 3. Fetch Subjects for a specific Semester
app.get('/api/db/programs/:programId/semesters/:semesterId/subjects', async (req, res) => {
    try {
        const { programId, semesterId } = req.params;
        const snapshot = await db.collection('programs').doc(programId)
            .collection('semesters').doc(semesterId)
            .collection('subjects').get();
        const subjects = [];
        snapshot.forEach(doc => {
            subjects.push({
                id: doc.id,
                code: doc.data().code || doc.id,
                name: doc.data().name || "Unnamed Subject"
            });
        });
        res.json(subjects);
    } catch (error) {
        console.error("Subject fetch error:", error);
        res.status(500).json({ error: "Failed to fetch subjects" });
    }
});

// 4. Fetch Global Subject Dictionary Map
app.get('/api/db/subjects/dictionary', (req, res) => {
    try {
        res.json(subjectDictionary);
    } catch (error) {
        console.error("Dictionary fetch error:", error);
        res.status(500).json({ error: "Failed to fetch subject dictionary" });
    }
});

// ==========================================
// ForenSync → Grievance SSO Bridge
// ==========================================

// Route 1: Generate the "Claim Ticket"
const crypto = require('crypto'); // Built into Node.js

app.post('/api/sso/generate-code', async (req, res) => {
    // Note: Assuming you have middleware that checks if the user is currently logged into ForenSync
    // For this example, let's say the frontend passes the user's email and name
    const { email, name } = req.body;

    // Generate a random 32-character string
    const authCode = crypto.randomBytes(16).toString('hex');

    try {
        // Save to a new Firestore collection called 'sso_codes'
        await db.collection('sso_codes').doc(authCode).set({
            email: email,
            name: name,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ code: authCode });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate SSO code" });
    }
});

// Route 2: The Verification & Burn (Server-to-Server)
app.post('/api/sso/verify-code', async (req, res) => {
    const { code } = req.body;
    const clientSecret = req.headers['x-sso-secret'];

    // 1. Verify it's actually the Grievance server asking
    if (clientSecret !== process.env.SSO_SHARED_SECRET) {
        return res.status(403).json({ error: "Unauthorized server" });
    }

    try {
        const codeDoc = await db.collection('sso_codes').doc(code).get();

        // 2. Check if the code exists
        if (!codeDoc.exists) {
            return res.status(404).json({ error: "Invalid or expired code" });
        }

        const userData = codeDoc.data();

        // 3. Optional but highly recommended: Check if it's older than 60 seconds
        // (You can add timestamp logic here)

        // 4. BURN THE TICKET! Delete it instantly so it can never be reused.
        await db.collection('sso_codes').doc(code).delete();

        // 5. Send the ENRICHED user data to the Grievance server
        res.json({
            email: userData.email,
            name: userData.name,
            role: userData.role,               // e.g., "Student"
            rollNumber: userData.rollNumber,   // e.g., "250324004018"
            programId: userData.programId,     // e.g., "bsc-msc-forensic"
            semesterId: userData.semesterId    // e.g., "sem-2"
        });

    } catch (error) {
        res.status(500).json({ error: "Server error during verification" });
    }
});

// ==========================================
// 3. Catch users coming FROM Grievance to ForenSync
// ==========================================
app.post('/api/auth/grievance', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: "No SSO code provided" });
    }

    try {
        // 1. Ask the live Grievance server if this code is real
        const grievanceVerifyUrl = 'https://nfsu-student-grievance-portal.vercel.app/api/sso/verify-code';

        const grievanceRes = await fetch(grievanceVerifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-sso-secret': process.env.SSO_SHARED_SECRET
            },
            body: JSON.stringify({ code: code })
        });

        if (!grievanceRes.ok) {
            return res.status(401).json({ error: "Invalid or expired SSO code from Grievance" });
        }

        // 1. Extract the enriched data from the Grievance server's response
        const userData = await grievanceRes.json();
        const { email, name, role, rollNumber, programId, semesterId } = userData;

        // 2. Find this user in Firebase Auth, or create them if they are brand new
        let uid;
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            uid = userRecord.uid;
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                const newUser = await admin.auth().createUser({
                    email: email,
                    displayName: name || "Grievance User"
                });
                uid = newUser.uid;
            } else {
                throw error;
            }
        }

        // 🔥 3. Save/Update their full profile in the Firestore database
        await db.collection('users').doc(uid).set({
            email: email,
            name: name,
            role: role || "Student",
            rollNumber: rollNumber || "",
            programId: programId || "",
            semesterId: semesterId || "",
            uid: uid
        }, { merge: true });

        // 4. Mint the Custom Token using Firebase Admin
        const customToken = await admin.auth().createCustomToken(uid);

        // 4. Send the token back to your React frontend to finish the login
        res.json({ token: customToken });

    } catch (error) {
        console.error("ForenSync SSO Catch Error:", error);
        res.status(500).json({ error: "Failed to authenticate Grievance user" });
    }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`🚀 ForenSync Master Server running on port ${PORT}`));
