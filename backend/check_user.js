const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function check() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', 'iamanuragdn@gmail.com').get();
  if (snapshot.empty) { console.log("No user found"); return; }
  snapshot.forEach(doc => console.log(doc.data()));
}
check();
