// src/lib/completeOnboarding.js
import { auth, db, storage } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function waitForUser() {
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve, reject) => {
    const off = onAuthStateChanged(auth, (u) => {
      off();
      u ? resolve(u) : reject(new Error("not-signed-in"));
    }, reject);
  });
}

export async function completeOnboarding({
  email,
  password,
  realName,
  birthdateISO,        // "YYYY-MM-DD"
  profilePhotoFile,    // required
  username,            // optional handle
  idFile               // optional (dev placeholder)
}) {
  // 1) Validate inputs early
  if (!email?.trim()) throw new Error("Please enter your email.");
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");
  if (!realName?.trim()) throw new Error("Please enter your real name.");
  if (!birthdateISO) throw new Error("Please enter your birthdate.");
  if (!profilePhotoFile) throw new Error("Please upload a profile photo.");

  // 2) Create user account or get existing user
  let user = auth.currentUser;
  
  if (!user) {
    console.log("Creating new user account...");
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    user = userCredential.user;
    console.log("User account created:", user.uid);
  } else if (!user.email) {
    console.log("Linking email to existing user...");
    const { EmailAuthProvider, linkWithCredential } = await import('firebase/auth');
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(user, credential);
    console.log("Email linked to existing user");
  } else {
    console.log("Using existing authenticated user:", user.uid);
  }
  
  const uid = user.uid;
  const now = serverTimestamp();
  
  // 2.5) Verify storage bucket is accessible
  console.log("Verifying storage bucket access...");
  console.log("Storage bucket:", storage.app.options.storageBucket);
  console.log("Current user UID:", uid);

      try {
      console.log("Starting onboarding for user:", { uid: user.uid });

      // 3) Upload avatar (public)
      console.log("Uploading profile photo...");
      const avatarRef = ref(storage, `profilePhotos/${uid}/${uid}.jpg`);
      console.log("Storage reference created:", avatarRef.fullPath);
      
      console.log("Starting file upload...");
      await uploadBytes(avatarRef, profilePhotoFile);
      console.log("File upload completed, getting download URL...");
      
      const photoURL = await getDownloadURL(avatarRef);
      console.log("Profile photo uploaded:", photoURL);

          // 4) (Dev) Upload ID file to private path if provided
      let idPath = null;
      if (idFile) {
        console.log("Uploading ID file...");
        const idRef = ref(storage, `idUploads/${uid}/${idFile.name}`);
        console.log("ID storage reference created:", idRef.fullPath);
        
        console.log("Starting ID file upload...");
        await uploadBytes(idRef, idFile);
        console.log("ID file upload completed");
        
        idPath = idRef.fullPath; // stored privately
        console.log("ID file uploaded to:", idPath);
      }

    // 5) Send email verification if needed
    if (user && !user.emailVerified) {
      console.log("Sending email verification...");
      const { sendEmailVerification } = await import('firebase/auth');
      await sendEmailVerification(user);
      console.log("Email verification sent");
    }

          // 6) Update existing user document with onboarding data
      console.log("Updating user document...");
      const userDocRef = doc(db, "users", uid);
      console.log("User document reference created:", userDocRef.path);
      
      const userData = {
        email: user.email,
        realName,
        realNameLowercase: realName.toLowerCase(),
        photoURL,
        handle: username?.trim() || uid.slice(0, 6),
        updatedAt: now,
        verification: {
          email: user.emailVerified ? "verified" : "unverified",
          idCheck: idFile ? "submitted" : "unverified"
        },
        stats: { score: 0, streak: 0 },
        birthdate: birthdateISO,
        idUploadPath: idPath,
        hasCompletedOnboarding: true
      };
      
      console.log("User data prepared, writing to Firestore...");
      await setDoc(userDocRef, userData, { merge: true });
      console.log("User document updated successfully");

          // 7) Seed leaderboard doc
      console.log("Seeding leaderboard...");
      const leaderboardRef = doc(db, "leaderboards", "global", "scores", uid);
      console.log("Leaderboard reference created:", leaderboardRef.path);
      
      const leaderboardData = {
        score: 0, streak: 0, updatedAt: now
      };
      
      console.log("Leaderboard data prepared, writing to Firestore...");
      await setDoc(leaderboardRef, leaderboardData, { merge: true });
      console.log("Leaderboard seeded successfully");

      console.log("Onboarding completed successfully!");
      return { uid, photoURL };
  } catch (error) {
    console.error("Onboarding error:", error);
    
    // Provide specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error("Storage access denied. Please check your Firebase configuration.");
    } else if (error.code === 'storage/bucket-not-found') {
      throw new Error("Storage bucket not found. Please enable Firebase Storage.");
    } else if (error.code === 'permission-denied') {
      throw new Error("Database access denied. Please check your Firestore rules.");
    } else if (error.message === 'not-signed-in') {
      throw new Error("You must be signed in to complete onboarding.");
    } else {
      throw new Error(`Onboarding failed: ${error.message}`);
    }
  }
}
