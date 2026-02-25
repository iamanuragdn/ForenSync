require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const admin = require("firebase-admin");
const fs = require("fs").promises;
const path = require("path");
const { google } = require('googleapis'); 

const syllabusData = require("./syllabusData");

// Import your teammate's extractor!
const { extractQuestions } = require("./extractor"); 

// 1. Initialize Firebase Database Connection
const serviceAccount = require("./serviceAccountKey.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

// 2. Initialize Express Server
const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // React frontend
app.use(express.json());

// Serve static files for the downloaded PDFs
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const upload = multer({ storage: multer.memoryStorage() });


// ==========================================
// GOOGLE DRIVE SYNC ENGINE (The New Crawler)
// ==========================================

// Helper to grab children (either folders or files) from a Drive folder
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

// ==========================================
// RECURSIVE DEEP FETCHER 
// ==========================================
// This function looks inside a folder. If it finds a file, it saves it.
// If it finds a folder, it dives inside that folder automatically!
async function fetchAllFilesRecursively(folderId, drive, pathPrefix = "") {
    let allFiles = [];
    try {
        // Notice we don't filter out folders here, we want everything!
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, webViewLink, webContentLink, mimeType)',
            spaces: 'drive'
        });

        const items = res.data.files || [];

        for (const item of items) {
            if (item.mimeType === 'application/vnd.google-apps.folder') {
                // It's a folder! Call this exact same function again to look inside it.
                // We also attach the folder name to the pathPrefix.
                const subFiles = await fetchAllFilesRecursively(item.id, drive, `${pathPrefix}${item.name} / `);
                allFiles = allFiles.concat(subFiles);
            } else {
                // It's a file! Add it to our list.
                allFiles.push({
                    ...item,
                    // This creates names like: "Question Bank / Paper.pdf"
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
        
        // 🌟 IMPORTANT: Put the ID of your top-level "NFSU" folder here
        const ROOT_NFSU_FOLDER_ID = '1bmI8_Bkn1airL4qznDJLWGc96wj76smp'; 

        // 1. Crawl Programs (e.g., btech-mtech-cybersecurity)
        const programs = await getDriveChildren(ROOT_NFSU_FOLDER_ID, drive, true);
        
        for (const prog of programs) {
            // 2. Crawl Semesters (e.g., sem-1)
            const semesters = await getDriveChildren(prog.id, drive, true);
            
            for (const sem of semesters) {
                // 3. Crawl Types (e.g., Notes, PYQ)
                const types = await getDriveChildren(sem.id, drive, true);
                
                for (const type of types) {
                    // 4. Crawl Subjects (e.g., CTBT-BSC-101)
                    const subjects = await getDriveChildren(type.id, drive, true);
                    
                    for (const subj of subjects) {
                        // 5. 🔥 Fetch ALL files, even the ones hidden inside sub-folders!
                        const files = await fetchAllFilesRecursively(subj.id, drive);
                        
                        for (const file of files) {
                            // 6. Save to Firebase dynamically!
                            const docRef = db.collection("programs").doc(prog.name)
                                             .collection("semesters").doc(sem.name)
                                             .collection("subjects").doc(subj.name)
                                             .collection(type.name).doc(file.id);
                            
                            await docRef.set({
                                // Use the new displayName so the UI shows the folder path!
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


// ==========================================
// FAST FIREBASE FETCH (Lightning Fast Loading)
// ==========================================
app.get("/api/notes/:programId/:semesterId/:subjectId", async (req, res) => {
    try {
        const { programId, semesterId, subjectId } = req.params;
        const type = req.query.type || 'Notes'; // Defaults to Notes, but can fetch PYQ!

        // Instantly grab the cached files from Firebase Database
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


// ==========================================
// SYLLABUS ROUTES
// ==========================================
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


// GET SPECIFIC SUBJECT DETAILS
// GET ALL SUBJECTS FOR A SPECIFIC SEMESTER
// GET SPECIFIC SUBJECT DETAILS
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
      // Include the document ID so the frontend can use it for navigation
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
// TEAMMATE'S ROUTES: Mock Test Engine
// ==========================================
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

// ==========================================
// FETCH EXAMS FOR CALENDAR
// ==========================================
app.get('/api/exams/:programId/:semesterId', async (req, res) => {
  try {
    const { programId, semesterId } = req.params;
    
    // Look inside your specific program and semester for the 'exams' collection
    const snapshot = await db.collection("programs").doc(programId)
                             .collection("semesters").doc(semesterId)
                             .collection("exams")
                             .orderBy("examDate", "asc") // Automatically sort by earliest date!
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

// 3. Start the Server
const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 ForenSync Master Server running on port ${PORT}`));