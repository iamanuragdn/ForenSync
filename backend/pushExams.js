const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); 
const examData = require('./examData');

//Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function seedExams() {

  try {
    
    for (const programId in examData) {
      const semesters = examData[programId];
      
      for (const semesterId in semesters) {
        const exams = semesters[semesterId];
        
        for (const exam of exams) {
          // Path: programs/btech-mtech-cybersecurity/semesters/sem-2/exams/CTBT-PCC-201
          const docRef = db.collection("programs").doc(programId)
                           .collection("semesters").doc(semesterId)
                           .collection("exams").doc(exam.code);
          
          await docRef.set(exam, { merge: true });
        }
      }
    }
    
    process.exit(0);

  } catch (error) {
    console.error("❌ Sync Error:", error);
    process.exit(1);
  }
}

seedExams();