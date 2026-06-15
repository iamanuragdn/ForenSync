const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function check() {
  const rootSubject = await db.collection('subjects').doc('CTBT-BSC-301').get();
  console.log("Root Subject CTBT-BSC-301:", rootSubject.data() ? "EXISTS" : "MISSING", rootSubject.data());

  const nestedSubjects = await db.collection('programs').doc('btech-mtech-cybersecurity').collection('semesters').doc('sem-3').collection('subjects').get();
  console.log("Nested Subjects in sem-3:");
  nestedSubjects.forEach(doc => console.log(doc.id, doc.data()));
}
check();
