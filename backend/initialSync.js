const admin = require('firebase-admin');
const { google } = require('googleapis');
const serviceAccount = require('./serviceAccountKey.json'); 
const subjectDictionary = require('./src/data/subjectDictionary.json');

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

function normalizeFolderName(folderName) {
    if (typeof folderName !== 'string') return null;
    const normalized = folderName.replace(/\s+/g, ' ').trim();
    return normalized || null;
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
    let pageToken = null;
    try {
        do {
            const res = await drive.files.list({
                q: `'${folderId}' in parents and trashed=false`,
                fields: 'nextPageToken, files(id, name, webViewLink, webContentLink, mimeType, modifiedTime)',
                spaces: 'drive',
                pageToken: pageToken
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
                } else if (item.mimeType !== 'application/vnd.google-apps.shortcut') {
                    allFiles.push({
                        ...item,
                        displayName: `${pathPrefix}${item.name}`,
                        category: normalizeFolderName(parentFolderName)
                    });
                }
            }
            pageToken = res.data.nextPageToken;
        } while (pageToken);
    } catch (error) {
        console.error(`Error crawling folder ${folderId}:`, error.message);
    }
    return allFiles;
}

async function cleanupDuplicates(db) {
    console.log("🧹 Starting database deduplication cleanup...");
    const subjectsRef = db.collection('subjects');
    const snapshot = await subjectsRef.get();
    
    // Group by subjectCode
    const subjectMap = {};
    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.subjectCode) {
            if (!subjectMap[data.subjectCode]) {
                subjectMap[data.subjectCode] = [];
            }
            subjectMap[data.subjectCode].push(doc);
        }
    }

    let deletedCount = 0;

    for (const [subjectCode, docs] of Object.entries(subjectMap)) {
        if (docs.length > 1) {
            console.log(`⚠️ Found ${docs.length} documents for ${subjectCode}. Merging duplicates...`);
            const canonicalRef = subjectsRef.doc(subjectCode);
            
            for (const doc of docs) {
                if (doc.id !== subjectCode) {
                    // Merge main fields securely without wiping existing ones
                    await canonicalRef.set(doc.data(), { merge: true });
                    
                    // Copy Notes subcollection
                    const notesSnap = await doc.ref.collection('Notes').get();
                    for (const noteDoc of notesSnap.docs) {
                        await canonicalRef.collection('Notes').doc(noteDoc.id).set(noteDoc.data(), { merge: true });
                        await noteDoc.ref.delete();
                    }
                    
                    // Copy PYQ subcollection
                    const pyqSnap = await doc.ref.collection('PYQ').get();
                    for (const pyqDoc of pyqSnap.docs) {
                        await canonicalRef.collection('PYQ').doc(pyqDoc.id).set(pyqDoc.data(), { merge: true });
                        await pyqDoc.ref.delete();
                    }

                    // Delete the duplicate document permanently!
                    await doc.ref.delete();
                    deletedCount++;
                }
            }
        }
    }
    console.log(`✅ Deduplication complete. Safely merged and deleted ${deletedCount} duplicate documents.`);
}


// THE MAIN DEEP CRAWLER
async function syncDriveToFirebase() {

    try {
        console.log("🔍 Starting initial sync...");
        const programs = await getDriveChildren(ROOT_NFSU_FOLDER_ID, drive, true);
        if (programs.length === 0) {
            console.log("⚠️ No programs found in Drive root folder.");
            return;
        }
        console.log(`✅ Found ${programs.length} programs in Drive.`);

        let totalFilesSaved = 0;

        //Crawl Programs
        for (const prog of programs) {
            console.log(`📂 Scanning Google Drive for program: ${prog.name}...`);
            let progId = prog.name;
            const lowerName = prog.name.toLowerCase();
            if (lowerName.includes('b.tech') || lowerName.includes('btech') || lowerName.includes('cyber')) progId = 'btech-mtech-cybersecurity';
            else if (lowerName.includes('b.sc') || lowerName.includes('bsc') || lowerName.includes('forensic')) progId = 'bsc-msc-forensic';

            const semesters = await getDriveChildren(prog.id, drive, true);
            
            //Crawl Semesters
            for (const sem of semesters) {
                console.log(`📂 Scanning semester: ${sem.name}...`);
                const types = await getDriveChildren(sem.id, drive, true);
                
                //Crawl Types (Notes/PYQ)
                for (const type of types) {
                    const subjects = await getDriveChildren(type.id, drive, true);
                    
                    //Crawl Subjects (CTBT-BSC-101)
                    for (const subj of subjects) {
                        
                        // Force the Document ID to be the Subject Code to ensure proper merging
                        const subjectCodeRaw = subj.name.split(' ')[0].trim(); // e.g., "CTBT-BSC-201"
                        const subjectCode = sanitizeSubjectCode(subjectCodeRaw);
                        console.log(`🔄 Processing: ${subjectCode} (${subj.name})...`);

                        let mappedName = subjectDictionary[subjectCode];
                        if (!mappedName) {
                            console.warn(`⚠️ Warning: Dictionary is missing a mapping for subject code: ${subjectCode}. Falling back to default.`);
                            mappedName = subjectCode;
                        }

                        const subjectRef = db.collection('subjects').doc(subjectCode);
                        await subjectRef.set({
                            name: mappedName,
                            course: prog.name,
                            semester: sem.name,
                            subjectCode: subjectCode,
                            lastSynced: admin.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });

                        console.log(`💾 Merging subject status into Firebase for ${subjectCode}... Success!`);

                        //Recursively fetch all files inside (CA1/CA2 folders)
                        const files = await fetchAllFilesRecursively(subj.id, drive);
                        
                        if (subjectCode === 'CTBT-BSC-201') {
                            console.log('Files found:', files);
                        }

                        if (files.length > 0) {
                            console.log(`✅ Found ${files.length} files in Drive for ${subjectCode}.`);
                            for (const file of files) {
                                
                                const docRef = subjectRef.collection(type.name).doc(file.id);
                                
                                await docRef.set({
                                    driveFileId: file.id,
                                    name: file.displayName || file.name,
                                    category: file.category || null,
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
                            console.log(`⚠️ No files found for ${subjectCode}.`);
                        }
                        console.log(`➡️ Moving to next document...`);
                    }
                }
            }
        }
        console.log(`🎉 Entire initial sync process is 100% complete! Total files tracked: ${totalFilesSaved}`);
        
        await cleanupDuplicates(db);
        process.exit(0);

    } catch (error) {
        console.error("❌ Sync Error:", error.message);
        process.exit(1);
    }
}

syncDriveToFirebase();
