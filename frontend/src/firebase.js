import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// You get this from your Firebase Console > Project Settings > General > Your Apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
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

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();