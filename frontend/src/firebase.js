import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCTkX6rjpgJMOdmvtuUt4QrQvyC-4JMMjs",
  authDomain: "social-media-app-64b7a.firebaseapp.com",
  projectId: "social-media-app-64b7a",
  storageBucket: "social-media-app-64b7a.firebasestorage.app",
  messagingSenderId: "128938351025",
  appId: "1:128938351025:web:a5784f9393fb8bf4c58590",
  measurementId: "G-N7EGGG6VCP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
export default app;
