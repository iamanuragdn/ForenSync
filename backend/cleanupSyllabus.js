const admin = require("firebase-admin");
const syllabusData = require("./syllabusData");

// Initialize Firebase
const serviceAccount = require("./serviceAccountKey.json");
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function cleanupSyllabus() {
  try {
    let totalDeleted = 0;

    for (const programId of Object.keys(syllabusData)) {
      console.log(`\n========================================`);
      console.log(`🚀 Checking Program: ${programId}`);
      
      const programSemesters = syllabusData[programId]?.semesters;
      if (!programSemesters) {
        console.error(`❌ No semesters found for ${programId}`);
        continue;
      }
      
      // Loop through each semester dynamically
    for (const semesterId of Object.keys(programSemesters)) {
      console.log(`\n========================================`);
      console.log(`🧹 Scanning Semester: ${semesterId}`);
      
      const localSubjects = programSemesters[semesterId];
      const localSubjectKeys = Object.keys(localSubjects);
      
      console.log(`📦 Found ${localSubjectKeys.length} valid subjects locally.`);
      console.log(`🔍 Fetching current Document IDs from Firestore...`);
      
      const subjectsRef = db.collection("programs").doc(programId)
                            .collection("semesters").doc(semesterId)
                            .collection("subjects");
                            
      const snapshot = await subjectsRef.get();
      
      if (snapshot.empty) {
        console.log("⚠️ No subjects found in Firestore at this path.");
        continue; // Move to the next semester
      }

      let semesterDeletedCount = 0;
      
      for (const doc of snapshot.docs) {
        const dbSubjectId = doc.id;
        
        if (!localSubjectKeys.includes(dbSubjectId)) {
          console.log(`🗑️ Deleting orphaned subject: ${dbSubjectId}`);
          await subjectsRef.doc(dbSubjectId).delete();
          semesterDeletedCount++;
          totalDeleted++;
        } else {
          console.log(`✅ Keeping valid subject: ${dbSubjectId}`);
        }
      }
      
      console.log(`✨ Finished ${semesterId} for ${programId}. Removed ${semesterDeletedCount} orphans.`);
    }
    }
    
    console.log(`\n🎉 Global Cleanup complete! Successfully removed a total of ${totalDeleted} orphaned subjects.`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupSyllabus();
