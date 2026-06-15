const admin = require("firebase-admin");
const examData = require("./examData");
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

async function migrateExams() {
    console.log("🔍 Extracting exams from examData...");
    let batch = db.batch();
    let count = 0;

    for (const [programId, programSemesters] of Object.entries(examData)) {
        for (const [semesterId, examsList] of Object.entries(programSemesters)) {
            for (const exam of examsList) {
                const sanitizedCode = sanitizeSubjectCode(exam.code);
                const examRef = db.collection('exams').doc(sanitizedCode + "-" + semesterId);
                
                batch.set(examRef, {
                    subjectCode: sanitizedCode,
                    programId: programId,
                    semesterId: semesterId,
                    subjectName: exam.name || sanitizedCode,
                    date: exam.examDate || "",
                    time: exam.time || "",
                    type: exam.type || "Unknown",
                    fullMarks: exam.fullMarks || 100,
                    colorClass: exam.colorClass || 'exam-blue',
                    dotColor: exam.dotColor || '#3b82f6'
                }, { merge: true });
                
                count++;
                if (count % 500 === 0) {
                    await batch.commit();
                    batch = db.batch();
                }
            }
        }
    }

    if (count % 500 !== 0) {
        await batch.commit();
    }
    console.log(`✅ Successfully migrated ${count} exams to Firestore.`);
    process.exit(0);
}

migrateExams();
