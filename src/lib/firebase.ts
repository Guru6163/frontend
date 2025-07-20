import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// TODO: Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyB7ziHE8m2PYWcY1Zdj2u7xS7oAeB0PDNI",
    authDomain: "om-muruga-company.firebaseapp.com",
    projectId: "om-muruga-company",
    storageBucket: "om-muruga-company.firebasestorage.app",
    messagingSenderId: "884277440694",
    appId: "1:884277440694:web:cc9c12a9771b7ffa397617"
  };

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signUpWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signOutUser() {
  return signOut(auth);
} 