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
        const { programId, semesterId, subjects, type } = req.body;

        const oauth2Client = new google.auth.OAuth2(
            process.env.GDRIVE_CLIENT_ID,
            process.env.GDRIVE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GDRIVE_REFRESH_TOKEN });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const collectionRef = db.collection("programs").doc(programId)
                                .collection("semesters").doc(semesterId)
                                .collection("subjects").doc(subjects)
                                .collection(type);
                                
        const snapshot = await collectionRef.get();
        let deletedCount = 0;

        const checkPromises = snapshot.docs.map(async (doc) => {
            const fileId = doc.id; 
            
            try {
                const driveFile = await drive.files.get({
                    fileId: fileId,
                    fields: 'id, trashed'
                });

                if (driveFile.data.trashed) {
                    await collectionRef.doc(fileId).delete();
                    deletedCount++;
                }
            } catch (error) {
                if (error.code === 404 || error.status === 404) {
                    await collectionRef.doc(fileId).delete();
                    deletedCount++;
                } else {
                    console.error(`Warning: Couldn't check file ${fileId}`, error.message);
                }
            }
        });

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
        const { targetDriveFolderId, programId, semesterId, subjects, type, fileName } = req.body;
        const fileObject = req.file;

        if (!fileObject) return res.status(400).json({ error: "No file uploaded" });

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

        const docRef = db.collection("programs").doc(programId)
                         .collection("semesters").doc(semesterId)
                         .collection("subjects").doc(subjects)
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