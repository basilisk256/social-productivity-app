// Firebase Configuration Example
// Copy this file to src/firebase/config.js and fill in your Firebase project details

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// Your Firebase configuration
// Get these values from your Firebase project console
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

export default app;

/*
SETUP INSTRUCTIONS:

1. Go to https://console.firebase.google.com/
2. Create a new project or select existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication
   - Optionally enable Email verification

4. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in test mode (for development)
   - Set security rules to allow read/write for authenticated users

5. Enable Realtime Database:
   - Go to Realtime Database
   - Create database in test mode
   - Set security rules to allow read/write for authenticated users

6. Get your config:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click "Add app" if you haven't already
   - Select Web app
   - Copy the config object
   - Replace the values in this file

7. Security Rules (Firestore):
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /builds/{buildId} {
         allow read, write: if request.auth != null && 
           (resource.data.userId == request.auth.uid || resource.data.isPublic == true);
       }
       match /activities/{activityId} {
         allow read, write: if request.auth != null;
       }
       match /friendRequests/{requestId} {
         allow read, write: if request.auth != null;
       }
     }
   }

8. Security Rules (Realtime Database):
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
*/
