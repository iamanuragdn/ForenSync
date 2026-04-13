require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const admin = require("firebase-admin");
const fs = require("fs").promises;
const path = require("path");
const { google } = require('googleapis'); 

const syllabusData = require("./syllabusData");
const examData = require("./examData");

const { extractQuestions } = require("./extractor"); 

const stream = require("stream");

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

// // Strict CORS whitelist
// const allowedOrigins = [
//   'http://localhost:5173',         // Keeps your local VS Code testing working
//   'http://localhost:3000',         // (Just in case you use port 3000)
//   'https://forensync.vercel.app',  // Your original Vercel link
//   'https://forensync.me',          // Your new custom domain
//   'https://www.forensync.me'       // Your new custom domain (with www)
// ];

// app.use(cors({
//   origin: allowedOrigins,
//   credentials: true
// }));

// ==========================================
// MANUAL CORS OVERRIDE (NUCLEAR OPTION)
// ==========================================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = ['https://www.forensync.me', 'https://forensync.me', 'http://localhost:5173', 'https://forensync.vercel.app'];
  
  if (allowed.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // Instantly answer the browser's preflight security ghost-knock
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const upload = multer({ storage: multer.memoryStorage() });

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

async function fetchAllFilesRecursively(folderId, drive, pathPrefix = "") {
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
                const subFiles = await fetchAllFilesRecursively(item.id, drive, `${pathPrefix}${item.name} / `);
                allFiles = allFiles.concat(subFiles);
            } else {             
                allFiles.push({
                    ...item,                   
                    displayName: `${pathPrefix}${item.name}` 
                });
            }
        }
    } catch (error) {
        console.error(`Error crawling folder ${folderId}:`, error.message);
    }
    return allFiles;
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
                        const files = await fetchAllFilesRecursively(subj.id, drive);
                        
                        for (const file of files) {
                            const docRef = db.collection("programs").doc(prog.name)
                                             .collection("semesters").doc(sem.name)
                                             .collection("subjects").doc(subj.name)
                                             .collection(type.name).doc(file.id);
                            
                            await docRef.set({
                                name: file.displayName || file.name, 
                                webViewLink: file.webViewLink || "#",
                                webContentLink: file.webContentLink || "#",
                                mimeType: file.mimeType,
                                type: file.mimeType && file.mimeType.includes('pdf') ? 'pdf' : 'doc',
                                lastSynced: admin.firestore.FieldValue.serverTimestamp()
                            }, { merge: true });
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
        const type = req.query.type || 'Notes'; 

        const snapshot = await db.collection("programs").doc(programId)
                                 .collection("semesters").doc(semesterId)
                                 .collection("subjects").doc(subjects)
                                 .collection(type).get();

        if (snapshot.empty) return res.json({ files: [] });

        const filesList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

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
                const exists = searchResults.find(res => res.title === subjectName);
                if (!exists) {
                  searchResults.push({
                    title: subjectName,
                    description: `Semester ${semId.replace('sem-', '')} Subject`,
                    type: "Subject",
                    link: `/syllabus/${progId}/${semId}/${subjId}`
                  });
                }
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
    
    const subjects = [];
    snapshot.forEach(doc => {
      subjects.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ subjects });
  } catch (error) {
    console.error("Error fetching subjects list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/syllabus/:programId/:semesterId/:subjects', async (req, res) => {
  try {
    const { programId, semesterId, subjects } = req.params;
    
    const docRef = db.collection('programs').doc(programId)
                     .collection('semesters').doc(semesterId)
                     .collection('subjects').doc(subjects);
                     
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
        endDate: "2026-06-01" 
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
    const programExams = examData[programId];
    
    if (programExams && programExams[semesterId]) {
      const sortedExams = programExams[semesterId].sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
      return res.status(200).json(sortedExams);
    } 
    
    return res.status(200).json([]);
  } catch (error) {
    console.error("Error fetching exams from local file:", error);
    res.status(500).json({ error: "Failed to fetch exams" });
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
        const finalSubjectId = subjectId || subjects;

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

        // First, fetch the current list of files from the Google Drive subject folder
        const driveFiles = await fetchAllFilesRecursively(subjFolder.id, drive);

        // Second, fetch the current list of documents from the Firestore collection
        const collectionRef = db.collection("programs").doc(programId)
                                .collection("semesters").doc(semesterId)
                                .collection("subjects").doc(finalSubjectId)
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
                                    console.log(`\n[SYNC] Scanning: ${prog.name} -> ${sem.name} -> ${type.name} -> ${subj.name}`);
                                    try {
                                        const driveFiles = await fetchAllFilesRecursively(subj.id, drive);

                                        const collectionRef = db.collection("programs").doc(progId)
                                                                .collection("semesters").doc(sem.name)
                                                                .collection("subjects").doc(subj.name)
                                                                .collection(type.name);
                                                                
                                        const snapshot = await collectionRef.get();
                                        const existingDocs = {};
                                        snapshot.docs.forEach(doc => { existingDocs[doc.id] = doc.data(); });
                                        const existingDocIds = Object.keys(existingDocs);

                                        for (const file of driveFiles) {
                                            const finalName = file.displayName || file.name;
                                            const fileData = {
                                                name: finalName,
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
        let { targetDriveFolderId, programId, semesterId, subjects, subjectId, type, fileName, pathArray } = req.body;
        const fileObject = req.file;

        if (!fileObject) return res.status(400).json({ error: "No file uploaded" });

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

        // Robust handling of missing subjects that don't match the standard Program -> Semester -> Subject -> Type structure
        let actualSubject = subjects || subjectId;
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

        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileObject.buffer);

        const driveResponse = await uploadDrive.files.create({
            requestBody: {
                name: fileName || fileObject.originalname,
                parents: [targetDriveFolderId], 
            },
            media: {
                mimeType: fileObject.mimetype,
                body: bufferStream,
            },
            fields: 'id, webViewLink, webContentLink, mimeType',
        });

        const fileId = driveResponse.data.id;

        await uploadDrive.permissions.create({
            fileId: fileId,
            requestBody: { role: 'reader', type: 'anyone' },
        });

        try {
            let docRef;
            if (hasValidSubject) {
                docRef = db.collection("programs").doc(programId || 'unknown-program')
                           .collection("semesters").doc(semesterId || 'unknown-semester')
                           .collection("subjects").doc(actualSubject)
                           .collection(type || 'Unknown').doc(fileId); 
            } else {
                // Conditional Database Saving: If no subject, attach directly to the semester level without crashing
                docRef = db.collection("programs").doc(programId || 'unknown-program')
                           .collection("semesters").doc(semesterId || 'unknown-semester')
                           .collection(type || 'general').doc(fileId);
            }
            
            await docRef.set({
                name: fileName || fileObject.originalname,
                webViewLink: driveResponse.data.webViewLink,
                webContentLink: driveResponse.data.webContentLink,
                mimeType: driveResponse.data.mimeType,
                type: 'pdf',
                lastSynced: admin.firestore.FieldValue.serverTimestamp()
            });

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
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

const PORT = process.env.PORT || 5001; 

app.listen(PORT, () => console.log(`🚀 ForenSync Master Server running on port ${PORT}`));