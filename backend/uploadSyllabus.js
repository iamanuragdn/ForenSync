const admin = require("firebase-admin");
const syllabusData = require("./syllabusData"); //existing local data

// Initialize Firebase
const serviceAccount = require("./serviceAccountKey.json");
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function uploadToFirestore() {
  console.log("🚀 Starting upload to Firestore...");

  try {
    for (const [programId, programData] of Object.entries(syllabusData)) {
      console.log(`\n📂 Processing Program: ${programId}`);
      
      const programRef = db.collection("programs").doc(programId);
      await programRef.set({ name: programData.programName }, { merge: true });

      if (programData.semesters) {
        for (const [semesterId, subjectsObj] of Object.entries(programData.semesters)) {
          console.log(`  ↳ 📁 Processing Semester: ${semesterId}`);
          
          const semesterRef = programRef.collection("semesters").doc(semesterId);
          const batch = db.batch(); 

          let totalCredits = 0;
          let totalSubjects = 0;
          let labCount = 0;

          for (const [subjectCode, subjectDetails] of Object.entries(subjectsObj)) {
            totalSubjects++;
            totalCredits += subjectDetails.credits || 0;
            if (subjectDetails.type === "Lab") labCount++;

            const subjectRef = semesterRef.collection("subjects").doc(subjectCode);
            
            batch.set(subjectRef, {
              code: subjectCode,
              name: subjectDetails.name,
              credits: subjectDetails.credits,
              teacher: subjectDetails.teacher || "TBA",
              type: subjectDetails.type || "Core",
              units: subjectDetails.units || []
            }, { merge: true });
          }

          batch.set(semesterRef, {
            semesterName: semesterId.replace('-', ' ').toUpperCase(),
            totalCredits: totalCredits,
            totalSubjects: totalSubjects,
            totalLabs: labCount,
            totalTheory: totalSubjects - labCount
          }, { merge: true });

          await batch.commit();
          console.log(`    ✅ Uploaded ${totalSubjects} subjects for ${semesterId}`);
        }
      }
    }
    console.log("\n🎉 ALL DATA UPLOADED SUCCESSFULLY!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error uploading data:", error);
    process.exit(1);
  }
}

uploadToFirestore();