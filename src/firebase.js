import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDJc36gr43UDjzs2QKwnJ7252vT2NS1pFQ",
    authDomain: "webcab-try-one.firebaseapp.com",
    projectId: "webcab-try-one",
    storageBucket: "webcab-try-one.firebasestorage.app",
    messagingSenderId: "506076879576",
    appId: "1:506076879576:web:6ac1b682d42762a467d5ad"
  };
  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const db = getFirestore(app);
  export { app }; // Added named export
  export default app; // Keep default export for compatibility