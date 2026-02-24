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
app.use(cors({ origin: "http://localhost:5173" })); // Kept your React port!
app.use(express.json());

// Serve static files for the downloaded PDFs
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const upload = multer({ storage: multer.memoryStorage() });
// ==========================================
// ROUTE 0: Get Semesters for a Program
// ==========================================
app.get("/api/programs/:programId/semesters", (req, res) => {
    try {
        const { programId } = req.params;
        const program = syllabusData[programId];

        // If the program (e.g., btech-mtech-cse) doesn't exist, send a 404
        if (!program) {
            return res.status(404).json({ error: "Program not found in syllabusData." });
        }

        // Grab all the keys (sem-1, sem-2, etc.) and format them for React
        const semesterKeys = Object.keys(program.semesters);
        const formattedSemesters = semesterKeys.map((key, index) => {
            const subjectCount = Object.keys(program.semesters[key]).length;
            return {
                id: index + 1, // 1, 2, 3...
                name: `Semester ${index + 1}`,
                desc: subjectCount > 0 ? `${subjectCount} Subjects` : "Syllabus pending"
            };
        });

        res.json(formattedSemesters);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch semesters." });
    }
});


// ==========================================
// ROUTE 1: Get Subjects for a Specific Semester
// ==========================================
app.get("/api/syllabus/:programId/:semesterId", (req, res) => {
    try {
        const { programId, semesterId } = req.params;
        const program = syllabusData[programId];

        // 1. Check if the program and semester actually exist in syllabusData.js
        if (!program || !program.semesters[semesterId]) {
            return res.status(404).json({ error: "Semester data not found." });
        }

        // 2. Grab the subjects for that specific semester
        const subjectsObj = program.semesters[semesterId];

        // 3. Convert that object into an array so your React frontend can map over it easily
        const subjectsList = Object.keys(subjectsObj).map(subjectCode => {
            return {
                id: subjectCode, // e.g., "CTBT-BSC-101"
                ...subjectsObj[subjectCode] // e.g., name, credits, teacher, etc.
            };
        });

        // 4. Send it to the frontend!
        res.json({ 
            stats: { title: `Details for ${semesterId}` }, 
            subjects: subjectsList 
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch syllabus." });
    }
});

app.get("/api/syllabus/:programId/:semesterId/:subjectId", (req, res) => {
    try {
        const { programId, semesterId, subjectId } = req.params;
        const program = syllabusData[programId];

        // Ensure the program, semester, and specific subject exist
        if (!program || !program.semesters[semesterId] || !program.semesters[semesterId][subjectId]) {
            return res.status(404).json({ error: "Subject not found in syllabusData." });
        }

        // Send back the specific subject object (name, units, etc.)
        res.json(program.semesters[semesterId][subjectId]);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch subject details." });
    }
});

// ==========================================
// ROUTE 3: User Login
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
// ROUTE 4 & 5: Google Drive Notes & Sync
// ==========================================
app.get("/api/notes/:programId/:semesterId/:subjectId", async (req, res) => {
    try {
        const { semesterId, subjectId } = req.params;
        const notesSnapshot = await db.collection("semesters").doc(semesterId)
                                      .collection("subjects").doc(subjectId)
                                      .collection("notes").get();

        if (notesSnapshot.empty) return res.json({ files: [] });

        const filesList = notesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || "Untitled Document",
                webViewLink: data.webViewLink || "#",
                webContentLink: data.webContentLink || "#",
                type: data.mimeType && data.mimeType.includes('pdf') ? 'pdf' : 'doc'
            };
        });
        res.json({ files: filesList });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notes." });
    }
});

app.post("/api/sync-drive", async (req, res) => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: './serviceAccountKey.json',
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });
        const NOTES_FOLDER_ID = '1KKFiqcX3Tact-XFoLeiB0ETLZquQv2Wm'; 

        const foldersRes = await drive.files.list({
            q: `'${NOTES_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id, name)',
        });

        const batch = db.batch();
        for (const folder of foldersRes.data.files) {
            const filesRes = await drive.files.list({
                q: `'${folder.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'files(id, name, webViewLink, webContentLink, mimeType)',
            });

            if (filesRes.data.files) {
                filesRes.data.files.forEach(file => {
                    const docRef = db.collection("semesters").doc("sem-1")
                                     .collection("subjects").doc(folder.name)
                                     .collection("notes").doc(file.id);
                    batch.set(docRef, {
                        name: file.name,
                        webViewLink: file.webViewLink || "#",
                        webContentLink: file.webContentLink || "#",
                        mimeType: file.mimeType
                    }, { merge: true });
                });
            }
        }
        await batch.commit();
        res.json({ message: "Sync successful!" });
    } catch (error) {
        res.status(500).json({ error: "Sync failed." });
    }
});

// ==========================================
// TEAMMATE'S ROUTES: Mock Test Engine
// ==========================================

// Background Worker Function
async function processFileInBackground(fileBuffer, mimeType) {
    try {
        const uploadsDir = path.join(__dirname, "uploads");
        try { await fs.access(uploadsDir); } catch { await fs.mkdir(uploadsDir); }

        const fileName = `Exam_${Date.now()}.pdf`;
        const filePath = path.join(uploadsDir, fileName);
        await fs.writeFile(filePath, fileBuffer);
        
        // Changed to port 5001 to match your server!
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

// 1. Upload PYQ
app.post("/api/upload-pyq", upload.single("paper"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.status(202).json({ message: "File received! Extracting questions in the background... ⏳" });
    processFileInBackground(req.file.buffer, req.file.mimetype).catch(err => console.error(err));
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 2. Get unique subjects
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

// 3. Get Test questions
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

// 4. Instant Test
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

//----------------------

// // server.js
// const express = require("express");
// const multer = require("multer");
// const admin = require("firebase-admin");
// const { db } = require("./database");
// // Import the Gemini function you just built!
// const { extractQuestions } = require("./extractor"); 

// const app = express();
// const upload = multer({ storage: multer.memoryStorage() }); // Keep file in RAM for speed

// app.post("/api/upload-pyq", upload.single("paper"), async (req, res) => {
//   try {
//     const fileBuffer = req.file.buffer;
//     const mimeType = req.file.mimetype;

//     // 1. Run your extractor model
//     console.log("Extracting questions...");
//     const extractedData = await extractQuestions(fileBuffer, mimeType);

//     // 2. Save to Firebase
//     console.log("Saving to Firestore...");
//     const batch = db.batch(); // Use a batch write for efficiency
    
//     extractedData.forEach((q) => {
//       // Create a new document reference in the 'question_bank' collection
//       const docRef = db.collection("question_bank").doc(); 
//       batch.set(docRef, {
//         question_text: q.question_text,
//         subject: q.subject,
//         chapter: q.chapter,
//         type: q.type,
//         added_at: admin.firestore.FieldValue.serverTimestamp()
//       });
//     });

//     await batch.commit();
//     res.status(200).json({ message: "Questions extracted and saved successfully!" });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// });

// app.listen(5000, () => console.log("Server running on port 5000"));
