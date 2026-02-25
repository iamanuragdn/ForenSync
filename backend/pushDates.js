const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); 

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function pushSemesterDates() {
  try {
    console.log("Pushing semester dates to Firebase...");

    // Semester 1 Dates
    await db.collection("programs").doc("btech-mtech-cybersecurity")
            .collection("semesters").doc("sem-1")
            .set({ 
              startDate: "2025-08-01", 
              endDate: "2025-12-15" 
            }, { merge: true }); // merge: true ensures we don't delete your existing subjects!

    // Semester 2 Dates (Your current semester)
    await db.collection("programs").doc("btech-mtech-cybersecurity")
            .collection("semesters").doc("sem-2")
            .set({ 
              startDate: "2026-01-01", 
              endDate: "2026-04-30" 
            }, { merge: true });

    console.log("✅ SUCCESS: Dates injected into database!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

pushSemesterDates();