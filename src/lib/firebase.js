// /src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDde0Mh01ZX0zqGW5j38W5yC-wNJ22Mz9I",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "acme-43eaf.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "acme-43eaf",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "acme-43eaf.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "499141806487",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:499141806487:web:01bc91384ebc7a35405cd2",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-P326RD2QER",
};

// Make sure we only initialize once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export ready-to-use clients
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app, "gs://acme-43eaf.appspot.com");

// Safe analytics (only runs in the browser and only if enabled)
let analytics = null;
export const getAnalyticsSafe = async () => {
  if (analytics) return analytics;
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.measurementId) return null;
  const { getAnalytics } = await import("firebase/analytics");
  analytics = getAnalytics(app);
  return analytics;
};
