import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6MV7my4yULQy3R4CwYtu-6B2sPoRiVNc",
  authDomain: "neu-docs.firebaseapp.com",
  projectId: "neu-docs",
  storageBucket: "neu-docs.firebasestorage.app",
  messagingSenderId: "833202333849",
  appId: "1:833202333849:web:8e41597742c8677acaf008"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();