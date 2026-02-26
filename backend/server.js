require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const admin = require("firebase-admin");
const fs = require("fs").promises;
const path = require("path");
const { google } = require('googleapis'); 

const syllabusData = require("./syllabusData");

// Import extractor
const { extractQuestions } = require("./extractor"); 

const stream = require("stream");

// Initialize Firebase Database Connection
const serviceAccount = require("./serviceAccountKey.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

// Initialize Express Server
const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Serve static files for the downloaded PDFs
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const upload = multer({ storage: multer.memoryStorage() });



// GOOGLE DRIVE SYNC
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


// RECURSIVE DEEP FETCHER IN FOLDER (everyth)
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
        console.log("🚀 Starting deep sync from Google Drive...");

        // Authenticate Google Drive
        const auth = new google.auth.GoogleAuth({
            keyFile: './serviceAccountKey.json',
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });
        
        const ROOT_NFSU_FOLDER_ID = '1bmI8_Bkn1airL4qznDJLWGc96wj76smp'; 

        // Crawl Programs (btech-mtech-cybersecurity)
        const programs = await getDriveChildren(ROOT_NFSU_FOLDER_ID, drive, true);
        
        for (const prog of programs) {
            // Crawl Semesters (sem-1)
            const semesters = await getDriveChildren(prog.id, drive, true);
            
            for (const sem of semesters) {
                // Crawl Types (Notes, PYQ,..)
                const types = await getDriveChildren(sem.id, drive, true);
                
                for (const type of types) {
                    // Crawl Subjects (CTBT-BSC-101...)
                    const subjects = await getDriveChildren(type.id, drive, true);
                    
                    for (const subj of subjects) {
                        // Fetch all folder even in subfolder
                        const files = await fetchAllFilesRecursively(subj.id, drive);
                        
                        for (const file of files) {
                            // Save to Firebase dynamically!
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
        console.log("✅ Sync complete!");
        res.json({ message: "Drive Sync successful! Database updated." });
    } catch (error) {
        console.error("Sync failed.", error);
        res.status(500).json({ error: "Sync failed check server logs." });
    }
});


// Firebase Fetch
app.get("/api/notes/:programId/:semesterId/:subjectId", async (req, res) => {
    try {
        const { programId, semesterId, subjectId } = req.params;
        const type = req.query.type || 'Notes'; 

        // grab the cached files from Firebase Database
        const snapshot = await db.collection("programs").doc(programId)
                                 .collection("semesters").doc(semesterId)
                                 .collection("subjects").doc(subjectId)
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


// SYLLABUS ROUTES
app.get("/api/programs/:programId/semesters", (req, res) => {
    try {
        const { programId } = req.params;
        const program = syllabusData[programId];
        if (!program) return res.status(404).json({ error: "Program not found." });

        const formattedSemesters = Object.keys(program.semesters).map((key, index) => {
            const subjectCount = Object.keys(program.semesters[key]).length;
            return {
                id: index + 1,
                name: `Semester ${index + 1}`,
                desc: subjectCount > 0 ? `${subjectCount} Subjects` : "Syllabus pending"
            };
        });
        res.json(formattedSemesters);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch semesters." });
    }
});



// GET ALL SUBJECTS FOR A SPECIFIC SEMESTER
app.get('/api/syllabus/:programId/:semesterId', async (req, res) => {
  try {
    const { programId, semesterId } = req.params;
    
    const subjectsRef = db.collection('programs').doc(programId)
                          .collection('semesters').doc(semesterId)
                          .collection('subjects');
                          
    const snapshot = await subjectsRef.get();
    
    // If the semester exists but has no subjects yet, return an empty array
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

app.get('/api/syllabus/:programId/:semesterId/:subjectId', async (req, res) => {
  try {
    const { programId, semesterId, subjectId } = req.params;
    
    const docRef = db.collection('programs').doc(programId)
                     .collection('semesters').doc(semesterId)
                     .collection('subjects').doc(subjectId);
                     
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: `Subject ${subjectId} not found` });
    }
    
    res.json(doc.data());
  } catch (error) {
    console.error("Error fetching subject details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// USER ROUTES
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


// Reejit'S Routes: Mock Test Engine
async function processFileInBackground(fileBuffer, mimeType) {
    try {
        const uploadsDir = path.join(__dirname, "uploads");
        try { await fs.access(uploadsDir); } catch { await fs.mkdir(uploadsDir); }

        const fileName = `Exam_${Date.now()}.pdf`;
        const filePath = path.join(uploadsDir, fileName);
        await fs.writeFile(filePath, fileBuffer);
        
        const pdfDownloadUrl = `http://localhost:5001/uploads/${fileName}`;
        const extractedData = await extractQuestions(fileBuffer, mimeType);
        
        const batch = db.batch(); 
        extractedData.forEach((q) => {
          const docRef = db.collection("question_bank").doc(); 
          batch.set(docRef, {
            question_text: q.question_text,
            subject: q.subject,
            type: q.type,
            source_pdf_url: pdfDownloadUrl, 
            added_at: admin.firestore.FieldValue.serverTimestamp()
          });
        });

        await batch.commit();
        console.log("Background: Success! Pipeline complete. ✅");
    } catch (error) {
        console.error("🔥 Background Worker Failed:", error);
    }
}


// FETCH EXAMS FOR CALENDAR
app.get('/api/exams/:programId/:semesterId', async (req, res) => {
  try {
    const { programId, semesterId } = req.params;
    
    const snapshot = await db.collection("programs").doc(programId)
                             .collection("semesters").doc(semesterId)
                             .collection("exams")
                             .orderBy("examDate", "asc")
                             .get();

    if (snapshot.empty) {
      return res.status(200).json([]); 
    }

    const exams = [];
    snapshot.forEach(doc => {
      exams.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({ error: "Failed to fetch exams" });
  }
});

// ADMIN: MINI DRIVE EXPLORER
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


// ADMIN: DRIVE + FIREBASE UPLOADER
app.post('/api/admin/upload', upload.single('file'), async (req, res) => {
    try {
        const { targetDriveFolderId, programId, semesterId, subjectId, type, fileName } = req.body;
        const fileObject = req.file;

        if (!fileObject) return res.status(400).json({ error: "No file uploaded" });

        // Authenticate with FULL Drive permissions to upload
        const uploadAuth = new google.auth.GoogleAuth({
            keyFile: './serviceAccountKey.json',
            scopes: ['https://www.googleapis.com/auth/drive'], 
        });
        const uploadDrive = google.drive({ version: 'v3', auth: uploadAuth });

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

        const docRef = db.collection("programs").doc(programId)
                         .collection("semesters").doc(semesterId)
                         .collection("subjects").doc(subjectId)
                         .collection(type).doc(fileId); // Use the Drive File ID as the Firebase Doc ID!
        
        await docRef.set({
            name: fileName || fileObject.originalname,
            webViewLink: driveResponse.data.webViewLink,
            webContentLink: driveResponse.data.webContentLink,
            mimeType: driveResponse.data.mimeType,
            type: 'pdf',
            lastSynced: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: "Upload successful!" });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});

// GET SEMESTER METADATA (Start & End Dates)
app.get('/api/semester-info/:programId/:semesterId', async (req, res) => {
  try {
    const { programId, semesterId } = req.params;
    
    const docRef = db.collection('programs').doc(programId)
                     .collection('semesters').doc(semesterId);
                     
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: "Semester not found" });
    }
    
    res.json(doc.data());
  } catch (error) {
    console.error("Error fetching semester dates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/api/upload-pyq", upload.single("paper"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.status(202).json({ message: "File received! Extracting questions in the background... ⏳" });
    processFileInBackground(req.file.buffer, req.file.mimetype).catch(err => console.error(err));
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/get-subjects", async (req, res) => {
  try {
    const snapshot = await db.collection("question_bank").select("subject").get();
    const subjects = new Set(); 
    snapshot.forEach(doc => { if (doc.data().subject) subjects.add(doc.data().subject); });
    res.status(200).json(Array.from(subjects));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

app.get("/api/get-test", async (req, res) => {
  try {
    const { subject } = req.query; 
    let query = db.collection("question_bank");
    if (subject && subject !== "All") query = query.where("subject", "==", subject);
    
    const snapshot = await query.limit(10).get(); 
    if (snapshot.empty) return res.status(404).json({ error: "No questions found." });

    const questions = [];
    snapshot.forEach(doc => questions.push({ id: doc.id, ...doc.data() }));
    res.status(200).json(questions);
  } catch (error) {
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

// Start the Server
const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 ForenSync Master Server running on port ${PORT}`));