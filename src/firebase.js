// Archivo: src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBqcRsc_mvY4ntDax1eAd4OhrRdjxkl6dQ",
    authDomain: "new-game-poker.firebaseapp.com",
    projectId: "new-game-poker",
    storageBucket: "new-game-poker.firebasestorage.app",
    messagingSenderId: "955268474970",
    appId: "1:955268474970:web:7d24cb76c1afc686225063"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
