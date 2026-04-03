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
  console.log("🚀 Starting Exam Data Sync & Cleanup...");
  let successCount = 0;
  let failCount = 0;
  let deletedCount = 0;
  
  try {
    const promises = [];

    for (const programId in examData) {
      const semesters = examData[programId];
      
      for (const semesterId in semesters) {
        const exams = semesters[semesterId];
        const examsRef = db.collection("programs").doc(programId)
                           .collection("semesters").doc(semesterId)
                           .collection("exams");

        // 1. Calculate Valid IDs
        const validIds = exams.map(exam => {
          const cleanType = exam.type.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
          return `${exam.code}-${cleanType}`;
        });
        
        // 2. Fetch Existing Documents and track Ghost Document Deletions
        const existingDocsSnapshot = await examsRef.get();
        
        existingDocsSnapshot.forEach(doc => {
          if (!validIds.includes(doc.id)) {
            const deletePromise = doc.ref.delete()
              .then(() => {
                console.log(`[CLEANUP] Deleted old ghost record: ${doc.id}`);
                deletedCount++;
              })
              .catch((err) => {
                console.error(`[ERROR] Failed to delete ghost record: ${doc.id}`, err);
                failCount++;
              });
            promises.push(deletePromise);
          }
        });
        
        // 3. Write new data
        for (const exam of exams) {
          const cleanType = exam.type.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
          const docId = `${exam.code}-${cleanType}`;
          const docRef = examsRef.doc(docId);
          
          const writePromise = docRef.set(exam, { merge: true })
            .then(() => {
              console.log(`[SUCCESS] Updated exam: ${exam.name} (${exam.type}) in ${programId} -> ${semesterId}`);
              successCount++;
            })
            .catch((err) => {
              console.error(`[ERROR] Failed to update exam: ${exam.name} (${exam.type}):`, err);
              failCount++;
            });
            
          promises.push(writePromise);
        }
      }
    }
    
    // Await all promises to ensure script does not end prematurely
    await Promise.all(promises);
    
    console.log(`\n✅ Sync & Cleanup Complete!`);
    console.log(`   - Successfully updated: ${successCount} exams`);
    console.log(`   - Cleaned up ghost documents: ${deletedCount}`);
    if (failCount > 0) {
      console.log(`   - Failures: ${failCount}`);
    }
    
    process.exit(0);

  } catch (error) {
    console.error("❌ Fatal Sync Error:", error);
    process.exit(1);
  }
}

seedExams();