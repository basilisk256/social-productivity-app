import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { userService } from '../firebase/services';


const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener...');
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('AuthContext: TIMEOUT - forcing loading to false');
      setIsLoading(false);
    }, 10000); // 10 second timeout
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: Auth state changed:', user ? `User ${user.uid}` : 'No user');
      
      if (user) {
        setCurrentUser(user);
        console.log('AuthContext: User authenticated, checking profile...');
        
        // First check if user has completed onboarding
        try {
          // Try to get profile from Firestore directly
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('../lib/firebase');
          
          console.log('AuthContext: Checking Firestore for user profile...');
          
          // Check both collections for profile data
          const [userDoc, profileDoc] = await Promise.all([
            getDoc(doc(db, "users", user.uid)),
            getDoc(doc(db, "profiles", user.uid))
          ]);
          
          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            console.log('AuthContext: Profile document found:', profileData);
            setUserProfile(profileData);
            // Define "completed" as: profile exists with realName + photoURL
            setHasCompletedOnboarding(!!(profileData?.realName && profileData?.photoURL));
            console.log('AuthContext: Profile loaded, onboarding state:', !!(profileData?.realName && profileData?.photoURL));
          } else if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('AuthContext: User document found but no profile:', userData);
            setUserProfile(userData);
            setHasCompletedOnboarding(userData.hasCompletedOnboarding || false);
            console.log('AuthContext: User profile loaded, onboarding state:', userData.hasCompletedOnboarding || false);
          } else {
            console.log('AuthContext: No documents found, user needs onboarding');
            // User exists but hasn't completed onboarding
            setUserProfile({ uid: user.uid, email: user.email, displayName: user.displayName || 'New User' });
            setHasCompletedOnboarding(false);
          }
        } catch (error) {
          console.error('AuthContext: Failed to get user profile:', error);
          setUserProfile({ uid: user.uid, email: user.email, displayName: user.displayName || 'New User' });
          setHasCompletedOnboarding(false);
        }
      } else {
        console.log('AuthContext: No user, clearing state');
        setCurrentUser(null);
        setUserProfile(null);
        setHasCompletedOnboarding(false);
      }
      
      console.log('AuthContext: Setting isLoading to false');
      clearTimeout(timeoutId);
      setIsLoading(false);
    });
    
    console.log('AuthContext: Auth state listener set up');
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      const user = await userService.signInUser(email, password);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email, password, displayName, profileData = {}) => {
    try {
      const { user, userDoc } = await userService.createUser(email, password, displayName, profileData);
      return { user, userDoc };
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const sendPasswordReset = async (email) => {
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await userService.signOutUser();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserProfile = async (updates) => {
    if (!currentUser) return;
    
    try {
      await userService.updateUserProfile(currentUser.uid, updates);
      setUserProfile(prev => ({ ...prev, ...updates }));
    } catch (error) {
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      console.log('AuthContext: refreshUserProfile called for user:', currentUser.uid);
      // Try to get user document from Firestore directly
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      // Check both collections for profile data
      const [userDoc, profileDoc] = await Promise.all([
        getDoc(doc(db, "users", currentUser.uid)),
        getDoc(doc(db, "profiles", currentUser.uid))
      ]);
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        console.log('AuthContext: Profile document found:', profileData);
        setUserProfile(profileData);
        // Define "completed" as: profile exists with realName + photoURL
        setHasCompletedOnboarding(!!(profileData?.realName && profileData?.photoURL));
        console.log('AuthContext: Profile loaded, onboarding state:', !!(profileData?.realName && profileData?.photoURL));
      } else if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('AuthContext: User document found but no profile:', userData);
        setUserProfile(userData);
        setHasCompletedOnboarding(userData.hasCompletedOnboarding || false);
        console.log('AuthContext: User profile loaded, onboarding state:', userData.hasCompletedOnboarding || false);
      } else {
        console.log('AuthContext: No documents found, setting onboarding to false');
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      console.error('AuthContext: Failed to refresh user profile:', error);
      setHasCompletedOnboarding(false);
    }
  };

  const completeOnboarding = async (data) => {
    try {
      console.log('AuthContext: completeOnboarding called with data:', data);
      
      if (!currentUser) throw new Error("Not signed in.");
      const uid = currentUser.uid;

      // Import Firebase functions
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { storage, db } = await import('../lib/firebase');

      // 1) upload avatar
      console.log('Uploading profile photo...');
      const avatarRef = ref(storage, `profilePhotos/${uid}/${uid}.jpg`);
      await uploadBytes(avatarRef, data.profilePhotoFile);
      const photoURL = await getDownloadURL(avatarRef);
      console.log('Profile photo uploaded:', photoURL);

      // 2) (optional) upload ID (private)
      let idPath = null;
      if (data.idFile instanceof File) {
        console.log('Uploading ID file...');
        const idRef = ref(storage, `idUploads/${uid}/${data.idFile.name}`);
        await uploadBytes(idRef, data.idFile);
        idPath = idRef.fullPath;
        console.log('ID file uploaded to:', idPath);
      }

      const now = serverTimestamp();

      // 3) write public + private docs
      console.log('Writing documents to Firestore...');
      await Promise.all([
        setDoc(doc(db, "profiles", uid), {
          realName: data.realName,
          realNameLowercase: data.realName.toLowerCase(),
          handle: data.username?.trim() || uid.slice(0, 6),
          photoURL,
          createdAt: now,
          updatedAt: now,
          verification: {
            email: currentUser.emailVerified ? "verified" : "unverified",
            idCheck: idPath ? "submitted" : "unverified",
          },
          stats: { score: 0, streak: 0 },
        }, { merge: true }),
        setDoc(doc(db, "profilesPrivate", uid), {
          birthdate: data.birthdateISO,
          idUploadPath: idPath,
          audit: { createdAt: now },
        }, { merge: true }),
        setDoc(doc(db, "leaderboards", "global", "scores", uid), {
          score: 0, streak: 0, updatedAt: now
        }, { merge: true }),
      ]);

      console.log('All documents written successfully');

      // 4) flip the flag immediately so App.js switches views without waiting for snapshot lag
      setHasCompletedOnboarding(true);
      console.log('AuthContext: hasCompletedOnboarding set to true');
      
      // 5) Update user profile state
      setUserProfile(prev => ({
        ...prev,
        realName: data.realName,
        photoURL,
        handle: data.username?.trim() || uid.slice(0, 6),
        verification: {
          email: currentUser.emailVerified ? "verified" : "unverified",
          idCheck: idPath ? "submitted" : "unverified",
        },
        stats: { score: 0, streak: 0 },
        hasCompletedOnboarding: true
      }));

    } catch (error) {
      console.error('AuthContext: Failed to complete onboarding:', error);
      throw error; // Re-throw so OnboardingPage can show the error
    }
  };

  const value = {
    currentUser,
    userProfile,
    hasCompletedOnboarding,
    signIn,
    signUp,
    signInWithGoogle,
    sendPasswordReset,
    logout,
    updateUserProfile,
    refreshUserProfile,
    completeOnboarding,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
