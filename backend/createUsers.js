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
    semesterId: "sem-2",
    cgpa: 8.29,
    attendance: { total: 82, math: 85, ethics: 78, physics: 83 }
  },
  {
    username: "anindya_bhar",
    name: "Anindya Bhar",
    enrollmentNo: "250348004015", 
    courseName: "B.Tech-M.Tech CSE (Cybersecurity)",
    programId: "btech-mtech-cybersecurity",
    semesterId: "sem-2",
    cgpa: 8.29,
    attendance: { total: 75, math: 70, ethics: 80, physics: 75 }
  },
  {
    username: "reeji",
    name: "Reejit Maji",
    enrollmentNo: "250348004002",
    courseName: "B.Tech-M.Tech CSE (Cybersecurity)",
    programId: "btech-mtech-cybersecurity",
    semesterId: "sem-2",
    cgpa: 7.8,
    attendance: { total: 91, math: 95, ethics: 88, physics: 90 }
  },
  {
    username: "kundu",
    name: "Raunak Kundu",
    enrollmentNo: "250348004026",
    courseName: "B.Tech-M.Tech CSE (Cybersecurity)",
    programId: "btech-mtech-cybersecurity",
    semesterId: "sem-2",
    cgpa: 7.29,
    attendance: { total: 91, math: 95, ethics: 88, physics: 90 }
  },
  {
    username: "priyangshu",
    name: "Priyangshu Paul",
    enrollmentNo: "250348004006",
    courseName: "B.Tech-M.Tech CSE (Cybersecurity)",
    programId: "btech-mtech-cybersecurity",
    semesterId: "sem-2",
    cgpa: 7.67,
    attendance: { total: 91, math: 95, ethics: 88, physics: 90 }
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