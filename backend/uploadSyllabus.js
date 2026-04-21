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

async function uploadToFirestore() {

  try {
    console.log("🔍 Starting syllabus upload to Firebase...");
    let overallSubjects = 0;

    for (const [programId, programData] of Object.entries(syllabusData)) {
      console.log(`📂 Processing program: ${programData.programName}...`);
      const programRef = db.collection("programs").doc(programId);
      await programRef.set({ name: programData.programName }, { merge: true });

      if (programData.semesters) {
        for (const [semesterId, subjectsObj] of Object.entries(programData.semesters)) {
          console.log(`  🔄 Processing semester: ${semesterId}...`);
          
          const semesterRef = programRef.collection("semesters").doc(semesterId);
          const batch = db.batch(); 

          let totalCredits = 0;
          let totalSubjects = 0;
          let labCount = 0;

          for (const [subjectCodeStr, subjectDetails] of Object.entries(subjectsObj)) {
            totalSubjects++;
            overallSubjects++;
            totalCredits += subjectDetails.credits || 0;
            if (subjectDetails.type === "Lab") labCount++;

            // Force the Document ID to be the Subject Code
            const subjectCode = sanitizeSubjectCode(subjectCodeStr); // e.g., "CTBT-BSC-201"
            console.log(`    🔄 Uploading details for: ${subjectCode}...`);

            const subjectRef = db.collection('subjects').doc(subjectCode);
            
            batch.set(subjectRef, {
              code: subjectCode,
              name: subjectDetails.name,
              credits: subjectDetails.credits,
              teacher: subjectDetails.teacher || "TBA",
              type: subjectDetails.type || "Core",
              units: subjectDetails.units || []
            }, { merge: true });

            console.log(`    💾 Merging Syllabus data into Firebase for ${subjectCode}... Success!`);
          }

          batch.set(semesterRef, {
            semesterName: semesterId.replace('-', ' ').toUpperCase(),
            totalCredits: totalCredits,
            totalSubjects: totalSubjects,
            totalLabs: labCount,
            totalTheory: totalSubjects - labCount
          }, { merge: true });

          await batch.commit();
          console.log(`  ➡️ Batch commit successful for ${semesterId}. Moving to next document...`);
        }
      }
    }
    console.log(`🎉 Syllabus upload process is 100% complete! Total subjects matched: ${overallSubjects}`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Error uploading data:", error);
    process.exit(1);
  }
}

uploadToFirestore();