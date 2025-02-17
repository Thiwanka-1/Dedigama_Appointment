// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "dedigama-appointment.firebaseapp.com",
  projectId: "dedigama-appointment",
  storageBucket: "dedigama-appointment.firebasestorage.app",
  messagingSenderId: "16218889321",
  appId: "1:16218889321:web:6673589a39c147156056f8",
  measurementId: "G-MD9H1JG8GS"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
