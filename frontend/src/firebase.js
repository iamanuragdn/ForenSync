import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; 

// TODO: Replace this with your actual Firebase config object!
// You get this from your Firebase Console > Project Settings > General > Your Apps
const firebaseConfig = {
  apiKey: "AIzaSyBhZUfUCffFbWreZRVLE5lRsTBOcy3JSN4",
  authDomain: "forensync-98f32.firebaseapp.com",
  projectId: "forensync-98f32",
  storageBucket: "forensync-98f32.firebasestorage.app",
  messagingSenderId: "904337909476",
  appId: "1:904337909476:web:aead9fb29ae3c6202beef1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore database
export const db = getFirestore(app);

// Initialize and export Auth and Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();