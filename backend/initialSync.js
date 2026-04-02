const admin = require('firebase-admin');
const { google } = require('googleapis');
const serviceAccount = require('./serviceAccountKey.json'); 

//Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

//Initialize Google Drive
const auth = new google.auth.GoogleAuth({
  keyFile: './serviceAccountKey.json',
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth });

const ROOT_NFSU_FOLDER_ID = '1bmI8_Bkn1airL4qznDJLWGc96wj76smp'; //NFSU folder ID!



// HELPER FUNCTIONS (Same as your server.js!)
async function getDriveChildren(parentId, drive, isFolder = true) {
    let q = `'${parentId}' in parents and trashed=false`;
    q += isFolder ? ` and mimeType='application/vnd.google-apps.folder'` : ` and mimeType!='application/vnd.google-apps.folder'`;
    try {
        const res = await drive.files.list({ q, fields: 'files(id, name)', spaces: 'drive' });
        return res.data.files || [];
    } catch (error) {
        console.error(`Error fetching children:`, error.message);
        return [];
    }
}

async function fetchAllFilesRecursively(folderId, drive, pathPrefix = "") {
    let allFiles = [];
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, webViewLink, webContentLink, mimeType, modifiedTime)',
            spaces: 'drive'
        });
        const items = res.data.files || [];
        for (const item of items) {
            if (item.mimeType === 'application/vnd.google-apps.folder') {
                const subFiles = await fetchAllFilesRecursively(item.id, drive, `${pathPrefix}${item.name} / `);
                allFiles = allFiles.concat(subFiles);
            } else {
                allFiles.push({ ...item, displayName: `${pathPrefix}${item.name}` });
            }
        }
    } catch (error) {
        console.error(`Error crawling folder:`, error.message);
    }
    return allFiles;
}


// THE MAIN DEEP CRAWLER
async function syncDriveToFirebase() {

    try {
        const programs = await getDriveChildren(ROOT_NFSU_FOLDER_ID, drive, true);
        if (programs.length === 0) {
            return;
        }

        let totalFilesSaved = 0;

        //Crawl Programs
        for (const prog of programs) {
            let progId = prog.name;
            const lowerName = prog.name.toLowerCase();
            if (lowerName.includes('b.tech') || lowerName.includes('btech') || lowerName.includes('cyber')) progId = 'btech-mtech-cybersecurity';
            else if (lowerName.includes('b.sc') || lowerName.includes('bsc') || lowerName.includes('forensic')) progId = 'bsc-msc-forensic';

            const semesters = await getDriveChildren(prog.id, drive, true);
            
            //Crawl Semesters
            for (const sem of semesters) {
                const types = await getDriveChildren(sem.id, drive, true);
                
                //Crawl Types (Notes/PYQ)
                for (const type of types) {
                    const subjects = await getDriveChildren(type.id, drive, true);
                    
                    //Crawl Subjects (CTBT-BSC-101)
                    for (const subj of subjects) {
                        
                        //Recursively fetch all files inside (CA1/CA2 folders)
                        const files = await fetchAllFilesRecursively(subj.id, drive);
                        
                        if (files.length > 0) {
                            for (const file of files) {
                                
                                const docRef = db.collection("programs").doc(progId)
                                                 .collection("semesters").doc(sem.name)
                                                 .collection("subjects").doc(subj.name)
                                                 .collection(type.name).doc(file.id);
                                
                                await docRef.set({
                                    driveFileId: file.id,
                                    name: file.displayName || file.name,
                                    webViewLink: file.webViewLink || "#",
                                    webContentLink: file.webContentLink || "#",
                                    mimeType: file.mimeType,
                                    type: file.mimeType && file.mimeType.includes('pdf') ? 'pdf' : 'doc',
                                    modifiedTime: file.modifiedTime,
                                    lastSynced: admin.firestore.FieldValue.serverTimestamp()
                                }, { merge: true });
                                
                                totalFilesSaved++;
                            }
                        } else {
                        }
                    }
                }
            }
        }
        process.exit(0);

    } catch (error) {
        console.error("❌ Sync Error:", error.message);
        process.exit(1);
    }
}

syncDriveToFirebase();