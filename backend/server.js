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

const serviceAccount = require("./serviceAccountKey.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

const app = express();
app.use(cors({ origin: "*" }));

app.use(express.json());

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

        // Authenticate Google Drive
        const auth = new google.auth.GoogleAuth({
            keyFile: './serviceAccountKey.json',
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });
        
        const ROOT_NFSU_FOLDER_ID = '1bmI8_Bkn1airL4qznDJLWGc96wj76smp'; 

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
        res.json({ message: "Drive Sync successful! Database updated." });
    } catch (error) {
        console.error("Sync failed.", error);
        res.status(500).json({ error: "Sync failed check server logs." });
    }
});


app.get("/api/notes/:programId/:semesterId/:subjectId", async (req, res) => {
    try {
        const { programId, semesterId, subjectId } = req.params;
        const type = req.query.type || 'Notes'; 

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

// GLOBAL SEARCH ENDPOINT
app.get('/api/search', async (req, res) => {
  try {
    const searchQuery = req.query.q;
    if (!searchQuery) return res.json([]);

    const q = searchQuery.toLowerCase();
    let searchResults = [];

    // 1. SEARCH LOCAL STATIC SYLLABUS DATA
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
              
              // Safely extract the subject name depending on how your data is structured
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

    // 2. SEARCH FIREBASE: NOTES & PYQs
    // CollectionGroup searches ALL collections named "Notes" anywhere in the database
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

    // 3. SEARCH FIREBASE: QUESTION BANK (Mock Tests)
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

    // 4. SEARCH FIREBASE: SUBJECTS (Syllabus)
    const subjectsSnapshot = await db.collectionGroup('subjects').get();
    subjectsSnapshot.forEach(doc => {
      const data = doc.data();
      // Sometimes the name is in the document data, sometimes it's the document ID itself
      const subjectName = data.name || doc.id; 

      if (subjectName.toLowerCase().includes(q)) {
        // Extract the exact URL path from the Firebase Document Reference
        // Firebase paths look like: programs/btech-mtech-cybersecurity/semesters/sem-1/subjects/network-security
        const pathParts = doc.ref.path.split('/');
        
        // Make sure it's a deeply nested subject before trying to route to it
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

    // 5. SEARCH FIREBASE: UPCOMING EXAMS
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
    } catch (error) {
        console.error("🔥 Background Worker Failed:", error);
    }
}


app.get('/api/exams/:programId/:semesterId', async (req, res) => {
  try {
    const { programId, semesterId } = req.params;
    
    // 1. Look inside our local examData.js file
    const programExams = examData[programId];
    
    // 2. If the program and semester exist in our file, send them!
    if (programExams && programExams[semesterId]) {
      // Sort them by date before sending just to be safe
      const sortedExams = programExams[semesterId].sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
      return res.status(200).json(sortedExams);
    } 
    
    // 3. If nothing is found, send an empty array so the frontend doesn't crash
    return res.status(200).json([]);
    
  } catch (error) {
    console.error("Error fetching exams from local file:", error);
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

app.post('/api/admin/sync', async (req, res) => {
    try {
        const { programId, semesterId, subjectId, type } = req.body;


        // 1. Authenticate with Google Drive
        const oauth2Client = new google.auth.OAuth2(
            process.env.GDRIVE_CLIENT_ID,
            process.env.GDRIVE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GDRIVE_REFRESH_TOKEN });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // 2. Fetch all file records currently sitting in Firebase
        const collectionRef = db.collection("programs").doc(programId)
                                .collection("semesters").doc(semesterId)
                                .collection("subjects").doc(subjectId)
                                .collection(type);
                                
        const snapshot = await collectionRef.get();
        let deletedCount = 0;

        // 3. Cross-check each file with Google Drive simultaneously 
        const checkPromises = snapshot.docs.map(async (doc) => {
            const fileId = doc.id; // Our Firebase Doc IDs are the Drive File IDs!
            
            try {
                // Ask Drive about this specific file
                const driveFile = await drive.files.get({
                    fileId: fileId,
                    fields: 'id, trashed'
                });

                // If it's in the Drive trash, delete the Firebase record
                if (driveFile.data.trashed) {
                    await collectionRef.doc(fileId).delete();
                    deletedCount++;
                }
            } catch (error) {
                // Error 404 means the file was permanently deleted from Drive
                if (error.code === 404 || error.status === 404) {
                    await collectionRef.doc(fileId).delete();
                    deletedCount++;
                } else {
                    console.error(`Warning: Couldn't check file ${fileId}`, error.message);
                }
            }
        });

        // Wait for all the checks to finish
        await Promise.all(checkPromises);

        res.status(200).json({ 
            message: `Sync complete! Removed ${deletedCount} missing files.`,
            deletedCount: deletedCount 
        });

    } catch (error) {
        console.error("🔥 Sync Error:", error);
        res.status(500).json({ error: "Failed to sync with Google Drive." });
    }
});

app.post('/api/admin/upload', upload.single('file'), async (req, res) => {
    try {
        const { targetDriveFolderId, programId, semesterId, subjectId, type, fileName } = req.body;
        const fileObject = req.file;

        if (!fileObject) return res.status(400).json({ error: "No file uploaded" });


        // 1. Authenticate with OAuth2 (Bypassing the Service Account entirely)
        const oauth2Client = new google.auth.OAuth2(
            process.env.GDRIVE_CLIENT_ID,
            process.env.GDRIVE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GDRIVE_REFRESH_TOKEN
        });

        // 2. Initialize Drive with ONLY the OAuth client
        const uploadDrive = google.drive({ version: 'v3', auth: oauth2Client });

        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileObject.buffer);

        // 3. Upload the file
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

        // 4. Make it readable by anyone
        await uploadDrive.permissions.create({
            fileId: fileId,
            requestBody: { role: 'reader', type: 'anyone' },
        });

        // 5. Save metadata to Firebase
        const docRef = db.collection("programs").doc(programId)
                         .collection("semesters").doc(semesterId)
                         .collection("subjects").doc(subjectId)
                         .collection(type).doc(fileId); 
        
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
        console.error("🔥 Detailed Upload Error:", error.message);
        res.status(500).json({ error: "Failed to upload file to Drive." });
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

const PORT = process.env.PORT || 5001; 

app.listen(PORT, () => console.log(`🚀 ForenSync Master Server running on port ${PORT}`));