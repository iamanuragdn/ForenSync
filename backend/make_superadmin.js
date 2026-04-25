const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function makeSuperAdmin() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', 'forensync.nfsu@gmail.com').get();
    
    if (snapshot.empty) {
      console.log('User not found.');
      process.exit(1);
    }

    snapshot.forEach(async (doc) => {
      await usersRef.doc(doc.id).update({
        role: 'SuperAdmin',
        isVerifiedAdmin: true,
        isVerifiedID: true
      });
      console.log(`Successfully upgraded ${doc.id} to SuperAdmin!`);
    });
    
    setTimeout(() => process.exit(0), 2000);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeSuperAdmin();
