// backend/createUsers.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const teamMembers = [
  {
    username: "iamanuragdn", 
    name: "Anurag Debnath",
    enrollmentNo: "250348004012", 
    courseName: "B.Tech-M.Tech CSE (Cybersecurity)",
    programId: "btech-mtech-cybersecurity",
    semesterId: "sem-1",
    cgpa: 8.29
  },
  {
    username: "anindya_bhar",
    name: "Anindya Bhar",
    enrollmentNo: "250348004015", 
    courseName: "B.Tech-M.Tech CSE (Cybersecurity)",
    programId: "btech-mtech-cybersecurity",
    semesterId: "sem-1",
    cgpa: 8.29
  },
  {
    username: "reeji",
    name: "Reejit Maji",
    enrollmentNo: "250348004002",
    courseName: "B.Tech-M.Tech CSE (Cybersecurity)",
    programId: "btech-mtech-cybersecurity",
    semesterId: "sem-1",
    cgpa: 7.8
  }
];

async function uploadUsers() {
  console.log("🚀 Creating users in Firestore...");
  const batch = db.batch();
  
teamMembers.forEach((user) => {
    const userRef = db.collection("users").doc(user.username);
    batch.set(userRef, user); 
  });

  await batch.commit();
  console.log("✅ All user profiles updated successfully!");
}

uploadUsers();