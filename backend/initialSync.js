const admin = require('firebase-admin');
const { google } = require('googleapis');
const serviceAccount = require('./serviceAccountKey.json'); 

// 1. Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// 2. Initialize Google Drive
const auth = new google.auth.GoogleAuth({
  keyFile: './serviceAccountKey.json',
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth });

// 🌟 I pulled this Folder ID from your screenshot!
// Make sure this is the ID of your "Notes" folder in Google Drive.
const NOTES_FOLDER_ID = '1KKFiqcX9Tact-XFoLeiB0ETLZquQv2Wm';

async function syncDriveToFirebase() {
  console.log("🚀 Starting Google Drive Sync...");

  try {
    // Get all subject folders inside the main "Notes" folder
    const foldersRes = await drive.files.list({
      q: `'${NOTES_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
    });

    const subjectFolders = foldersRes.data.files;
    if (!subjectFolders || subjectFolders.length === 0) {
      console.log("❌ No subject folders found. Check your Folder ID!");
      return;
    }

    console.log(`📂 Found ${subjectFolders.length} subject folders.`);
    const batch = db.batch();

    // Loop through each folder (e.g., CTBT-BSC-101, CTBT-ESC-101)
    for (const folder of subjectFolders) {
      const subjectCode = folder.name; 
      console.log(`  ↳ Scanning folder: ${subjectCode}...`);

      // Get all PDF/Doc files inside this specific subject folder
      const filesRes = await drive.files.list({
        q: `'${folder.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name, webViewLink, webContentLink, mimeType, modifiedTime)',
      });

      const files = filesRes.data.files;

      if (files && files.length > 0) {
        files.forEach(file => {
          // Save to Firebase matching your exact React URL structure!
          const docRef = db.collection("semesters").doc("sem-1")
                           .collection("subjects").doc(subjectCode)
                           .collection("notes").doc(file.id);

          batch.set(docRef, {
            driveFileId: file.id,
            name: file.name,
            webViewLink: file.webViewLink || "#",
            webContentLink: file.webContentLink || "#",
            mimeType: file.mimeType,
            modifiedTime: file.modifiedTime
          }, { merge: true });
        });
        console.log(`    ✅ Saved ${files.length} files for ${subjectCode}`);
      } else {
        console.log(`    ⚠️ No files found inside ${subjectCode}`);
      }
    }

    await batch.commit();
    console.log("\n🎉 Sync Complete! Firebase is fully updated with your new folder names.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Sync Error:", error.message);
    process.exit(1);
  }
}

syncDriveToFirebase();

//---------------------

// // initialSync.js
// const admin = require('firebase-admin');
// const { google } = require('googleapis');
// const serviceAccount = require('./serviceAccountKey.json');

// let subjectsArray = [];
// // let result=``;

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
// const db = admin.firestore();

// const auth = new google.auth.GoogleAuth({
//   keyFile: './serviceAccountKey.json',
//   scopes: ['https://www.googleapis.com/auth/drive.readonly'],
// });
// const drive = google.drive({ version: 'v3', auth });

// async function getAllFiles(folderId, folderName = "Main Subject Folder") {
//   let filesFound = [];
//   console.log(`   🔍 Scanning inside: [${folderName}]...`);
  
//   const response = await drive.files.list({
//     q: `'${folderId}' in parents and trashed = false`,
//     fields: 'files(id, name, webViewLink, mimeType, modifiedTime)',
//   });

//   const items = response.data.files;
//   if (!items || items.length === 0) return filesFound;

//   for (const item of items) {
//     if (item.mimeType === 'application/vnd.google-apps.folder') {
//       const subFolderFiles = await getAllFiles(item.id, item.name);
//       filesFound = filesFound.concat(subFolderFiles);
//     } else {
//       filesFound.push(item);
//     }
//   }
//   return filesFound;
// }

// async function syncEntireSemester() {
//   const parentSubjectsFolderId = '1KKFiqcX9Tact-XFoLeiB0ETLZquQv2Wm'; 
//   const campusId = 'nfsu'; 
//   const semesterId = 'sem-1';
//   // --- SUBJECT DETAILS CHEAT SHEET ---
//   const subjectDetails = {
//     "sem-1": {
//       "Engineering Mathematics-1": { teacher: "Dr. Suman Debnath", code: "CTBT-BSC-101" },
//       "Engineering Physics": { teacher: "Dr. Bapi Dey", code: "CTBT-BSC-102" },
//       "Communication Skills": { teacher: "Dr. Debasish Acharjee", code: "CTBT-HSM-101" },
//       "Engineering Graphics": { teacher: "Dr. Sandipan Debnath", code: "CTBT-ESC-103" },
//       "Basic of Electrical Engineering": { teacher: "Mr. Abhijit Das", code: "CTBT-ESC-101" },
//       "Programming for Problem Solving": { teacher: "Dr. Priya Saha", code: "CTBT-ESC-102" }
//     }
//   }; 

//   try {
//     console.log(`Scanning Google Drive for subjects in semester: ${semesterId}...`);
    
//     const subjectsResponse = await drive.files.list({
//       q: `'${parentSubjectsFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
//       fields: 'files(id, name)',
//     });

//     const subjectFolders = subjectsResponse.data.files;
//     if (!subjectFolders || subjectFolders.length === 0) return console.log('No subject folders found.');

//     for (const subject of subjectFolders) {
//       console.log(`\n➔ Processing Subject: ${subject.name}`);
//       // subjectsArray.push(subject.name);
//       //result+=subject.name;
      
//       const safeSubjectId = subject.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
//       const subjectRef = db.collection('campuses').doc(campusId)
//                            .collection('semesters').doc(semesterId)
//                            .collection('subjects').doc(safeSubjectId);
                           
//       // 1. Look up the details for this specific subject and semester.
//       // If it's a brand new folder not on our cheat sheet yet, default to "TBA".
//       const details = subjectDetails[semesterId]?.[subject.name] || { teacher: "TBA", code: "TBA" };
      
//       // Pack the full object into the array to send to React!
//       subjectsArray.push({
//         name: subject.name,
//         teacher: details.teacher,
//         code: details.code
//       });
      
//       // 2. Save the subject name, folder ID, teacher, AND code to Firestore!
//       await subjectRef.set({ 
//         name: subject.name, 
//         driveFolderId: subject.id,
//         teacher: details.teacher,
//         code: details.code
//       }, { merge: true });

//       const notes = await getAllFiles(subject.id, subject.name);

//       if (!notes || notes.length === 0) {
//         console.log(`   ❌ No notes found in ${subject.name}.`);
//         continue; 
//       }

//       const batch = db.batch();
//       const notesCollectionRef = subjectRef.collection('notes');

//       notes.forEach((note) => {
//         const noteDocRef = notesCollectionRef.doc(note.id); 
//         batch.set(noteDocRef, {
//           name: note.name,
//           webViewLink: note.webViewLink,
//           mimeType: note.mimeType,
//           driveFileId: note.id,
//           modifiedTime: note.modifiedTime
//         }, { merge: true });
//       });

//       await batch.commit();
//       console.log(`   ✅ Success! Synced ${notes.length} notes.`);
//     }
//     console.log('\n🎉 ALL DONE! The entire semester is synced.');

//   } catch (error) {
//     console.error('\n❌ Sync failed:', error.message);
//   }
// }

// syncEntireSemester();

// // ------------------------

// // backend/server.js
// const express = require("express");
// const cors = require("cors");

// const app = express();

// app.use(cors());          // allow frontend to access backend
// app.use(express.json());  // parse JSON

// app.get("/api/message", (req, res) => {
//     // We send the array inside an object so the frontend can easily read it
//     res.json({ subjects: subjectsArray });
// });
// // app.get("/api/message", (req, res) => {
// //     // res.json({ message: `Hello from backend 🚀<br> `});
// //     res.json({ message: `Hello from backend 🚀<br> `+result });
// //     // res.json({ message: `Hello from backend 🚀\n ` });
// // });

// const PORT = 5000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

// //--------------------------------------

// // // initialSync.js
// // const admin = require('firebase-admin');
// // const { google } = require('googleapis');
// // const serviceAccount = require('./serviceAccountKey.json');

// // // 1. Initialize Firebase Admin
// // admin.initializeApp({
// //   credential: admin.credential.cert(serviceAccount)
// // });
// // const db = admin.firestore();

// // // 2. Initialize Google Drive Auth
// // const auth = new google.auth.GoogleAuth({
// //   keyFile: './serviceAccountKey.json',
// //   scopes: ['https://www.googleapis.com/auth/drive.readonly'],
// // });
// // const drive = google.drive({ version: 'v3', auth });

// // async function syncEntireSemester() {
// //   // --- CONFIGURATION ---
// //   // Get the Drive ID of the folder that *contains* the 6 subject folders
// //   // (e.g., the ID of the "subjects" folder inside nfsu > sem1 > notes > subjects)
// //   const parentSubjectsFolderId = '1KKFiqcX9Tact-XFoLeiB0ETLZquQv2Wm'; 
  
// //   // Define where in Firestore this semester belongs
// //   const campusId = 'nfsu'; 
// //   const semesterId = 'sem-1'; 

// //   try {
// //     console.log(`Scanning Google Drive for subjects in semester: ${semesterId}...`);
    
// //     // 3. Find all folders (subjects) inside the parent 'subjects' folder
// //     const subjectsResponse = await drive.files.list({
// //       q: `'${parentSubjectsFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
// //       fields: 'files(id, name)',
// //     });

// //     const subjectFolders = subjectsResponse.data.files;
    
// //     if (!subjectFolders || subjectFolders.length === 0) {
// //       console.log('No subject folders found inside this Drive folder.');
// //       return;
// //     }

// //     console.log(`Found ${subjectFolders.length} subjects. Starting deep sync...`);

// //     // 4. Loop through each subject folder and sync its notes
// //     for (const subject of subjectFolders) {
// //       console.log(`<br>➔ Processing Subject: ${subject.name}`);
      
// //       // Create/Update the subject document in Firestore
// //       // We format the name to lower case with hyphens for a clean ID (e.g., "Cyber Security" -> "cyber-security")
// //       const safeSubjectId = subject.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
// //       const subjectRef = db.collection('campuses').doc(campusId)
// //                            .collection('semesters').doc(semesterId)
// //                            .collection('subjects').doc(safeSubjectId);
                           
// //       await subjectRef.set({
// //         name: subject.name,
// //         driveFolderId: subject.id
// //       }, { merge: true });

// //       // 5. Fetch all files (notes) inside this specific subject folder
// //       const notesResponse = await drive.files.list({
// //         q: `'${subject.id}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed = false`,
// //         fields: 'files(id, name, webViewLink, mimeType, modifiedTime)',
// //       });

// //       const notes = notesResponse.data.files;

// //       if (!notes || notes.length === 0) {
// //         console.log(`   - No notes found in ${subject.name}.`);
// //         continue; // Skip to the next subject
// //       }

// //       console.log(`   - Found ${notes.length} notes. Saving to Firestore...`);

// //       // 6. Batch write the notes to Firestore
// //       const batch = db.batch();
// //       const notesCollectionRef = subjectRef.collection('notes');

// //       notes.forEach((note) => {
// //         const noteDocRef = notesCollectionRef.doc(note.id); 
// //         batch.set(noteDocRef, {
// //           name: note.name,
// //           webViewLink: note.webViewLink,
// //           mimeType: note.mimeType,
// //           driveFileId: note.id,
// //           modifiedTime: note.modifiedTime
// //         }, { merge: true });
// //       });

// //       await batch.commit();
// //       console.log(`   - ✅ ${subject.name} synced successfully.`);
// //     }

// //     console.log('<br>🎉 ALL DONE! The entire semester has been synced to Firestore.');

// //   } catch (error) {
// //     console.error('<br>❌ Sync failed:', error.message);
// //   }
// // }

// // syncEntireSemester();