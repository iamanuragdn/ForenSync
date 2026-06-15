const admin = require("firebase-admin");
const syllabusData = require("./syllabusData");

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

async function migrate() {
  console.log("🔍 Extracting teachers from syllabusData...");
  const teachersMap = new Map();
  let teacherCounter = 1;

  for (const [programId, programData] of Object.entries(syllabusData)) {
    if (programData.semesters) {
      for (const [semesterId, subjectsObj] of Object.entries(programData.semesters)) {
        for (const [subjectCodeStr, subjectDetails] of Object.entries(subjectsObj)) {
          let teacherName = subjectDetails.teacher;
          if (teacherName && teacherName !== "null" && teacherName !== "TBA") {
            teacherName = teacherName.trim();
            if (!teachersMap.has(teacherName)) {
              const teacherCode = `TCH-${String(teacherCounter).padStart(3, '0')}`;
              teachersMap.set(teacherName, teacherCode);
              teacherCounter++;
            }
          }
        }
      }
    }
  }

  console.log(`✅ Found ${teachersMap.size} unique teachers. Uploading to 'teachers' collection...`);
  const teachersBatch = db.batch();
  for (const [teacherName, teacherCode] of teachersMap.entries()) {
    const teacherRef = db.collection('teachers').doc(teacherCode);
    teachersBatch.set(teacherRef, {
      teacherCode: teacherCode,
      name: teacherName,
      subjects: []
    }, { merge: true });
  }
  await teachersBatch.commit();
  console.log(`✅ Teachers uploaded successfully!`);

  console.log("🔍 Starting syllabus upload to Firebase with Teacher Codes...");
  for (const [programId, programData] of Object.entries(syllabusData)) {
    const programRef = db.collection("programs").doc(programId);
    await programRef.set({ name: programData.programName }, { merge: true });

    if (programData.semesters) {
      for (const [semesterId, subjectsObj] of Object.entries(programData.semesters)) {
        const semesterRef = programRef.collection("semesters").doc(semesterId);
        const batch = db.batch();

        let totalCredits = 0;
        let totalSubjects = 0;
        let labCount = 0;

        for (const [subjectCodeStr, subjectDetails] of Object.entries(subjectsObj)) {
          totalSubjects++;
          totalCredits += subjectDetails.credits || 0;
          if (subjectDetails.type === "Lab") labCount++;

          const subjectCode = sanitizeSubjectCode(subjectCodeStr);
          const subjectRef = db.collection('subjects').doc(subjectCode);

          let teacherCode = "TBA";
          if (subjectDetails.teacher && subjectDetails.teacher !== "null" && subjectDetails.teacher !== "TBA") {
            teacherCode = teachersMap.get(subjectDetails.teacher.trim()) || "TBA";
          }

          batch.set(subjectRef, {
            code: subjectCode,
            course: programId,
            semester: semesterId,
            subjectCode: subjectCode,
            name: subjectDetails.name,
            credits: subjectDetails.credits,
            teacherCode: teacherCode, // Store relations
            teacherName: subjectDetails.teacher || "TBA", // Keep name as fallback for now
            teacher: subjectDetails.teacher || "TBA",
            type: subjectDetails.type || "Core",
            units: subjectDetails.units || [],
            lastSynced: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' }) + " IST"
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
      }
    }
  }
  console.log(`🎉 Syllabus migration process is 100% complete! Relational DB established.`);
  process.exit(0);
}

migrate();
