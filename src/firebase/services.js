import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  runTransaction
} from 'firebase/firestore';

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { db, auth } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

// User Management Services
export const userService = {
  // Create new user account
  async createUser(email, password, displayName, profileData = {}) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, { displayName });
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user document in Firestore
      const userDoc = {
        uid: user.uid,
        email: user.email,
        displayName,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        profilePicture: profileData.profilePicture || null,
        ruleOfLifeWeights: profileData.ruleOfLifeWeights || {
          worship: 0.2,
          vocation: 0.2,
          household: 0.15,
          mind: 0.15,
          body: 0.15,
          fellowship: 0.15
        },
        privacyDefaults: profileData.privacyDefaults || {
          tasksPublic: false,
          buildsPublic: false
        },
        totalPoints: 0,
        totalStreakDays: 0,
        activeBuilds: 0,
        completedBuilds: 0,
        level: 1,
        friends: [],
        friendRequests: [],
        pendingFriendRequests: []
      };
      
      await setDoc(doc(db, 'users', user.uid), userDoc);
      
      return { user, userDoc };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  },

  // Sign in user
  async signInUser(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp()
      });
      
      return user;
    } catch (error) {
      throw new Error(`Failed to sign in: ${error.message}`);
    }
  },

  // Sign out user
  async signOutUser() {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(`Failed to sign out: ${error.message}`);
    }
  },

  // Get user profile
  async getUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { uid, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  },

  // Update user profile
  async updateUserProfile(uid, updates) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  },

  // Search users by display name
  async searchUsers(searchTerm, currentUserId) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentUserId) {
          users.push({ uid: doc.id, ...doc.data() });
        }
      });
      
      return users;
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  },

  // Listen to user profile changes
  onUserProfileChange(uid, callback) {
    return onSnapshot(doc(db, 'users', uid), (doc) => {
      if (doc.exists()) {
        callback({ uid: doc.id, ...doc.data() });
      }
    });
  }
};

// Friend Management Services
export const friendService = {
  // Send friend request
  async sendFriendRequest(fromUserId, toUserId) {
    try {
      const batch = [];
      
      // Add to sender's pending requests
      batch.push(updateDoc(doc(db, 'users', fromUserId), {
        pendingFriendRequests: arrayUnion(toUserId)
      }));
      
      // Add to receiver's friend requests
      batch.push(updateDoc(doc(db, 'users', toUserId), {
        friendRequests: arrayUnion(fromUserId)
      }));
      
      // Create friend request document
      batch.push(setDoc(doc(db, 'friendRequests', `${fromUserId}_${toUserId}`), {
        fromUserId,
        toUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      }));
      
      await Promise.all(batch);
    } catch (error) {
      throw new Error(`Failed to send friend request: ${error.message}`);
    }
  },

  // Accept friend request
  async acceptFriendRequest(fromUserId, toUserId) {
    try {
      const batch = [];
      
      // Add to both users' friends lists
      batch.push(updateDoc(doc(db, 'users', fromUserId), {
        friends: arrayUnion(toUserId)
      }));
      
      batch.push(updateDoc(doc(db, 'users', toUserId), {
        friends: arrayUnion(fromUserId)
      }));
      
      // Remove from friend requests
      batch.push(updateDoc(doc(db, 'users', fromUserId), {
        pendingFriendRequests: arrayRemove(toUserId)
      }));
      
      batch.push(updateDoc(doc(db, 'users', toUserId), {
        friendRequests: arrayRemove(fromUserId)
      }));
      
      // Update friend request status
      batch.push(updateDoc(doc(db, 'friendRequests', `${fromUserId}_${toUserId}`), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      }));
      
      await Promise.all(batch);
    } catch (error) {
      throw new Error(`Failed to accept friend request: ${error.message}`);
    }
  },

  // Reject friend request
  async rejectFriendRequest(fromUserId, toUserId) {
    try {
      const batch = [];
      
      // Remove from both users' request lists
      batch.push(updateDoc(doc(db, 'users', fromUserId), {
        pendingFriendRequests: arrayRemove(toUserId)
      }));
      
      batch.push(updateDoc(doc(db, 'users', toUserId), {
        friendRequests: arrayRemove(fromUserId)
      }));
      
      // Delete friend request document
      batch.push(deleteDoc(doc(db, 'friendRequests', `${fromUserId}_${toUserId}`)));
      
      await Promise.all(batch);
    } catch (error) {
      throw new Error(`Failed to reject friend request: ${error.message}`);
    }
  },

  // Get user's friends
  async getUserFriends(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) return [];
      
      const { friends = [] } = userDoc.data();
      if (friends.length === 0) return [];
      
      const friendsData = [];
      for (const friendId of friends) {
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        if (friendDoc.exists()) {
          friendsData.push({ uid: friendId, ...friendDoc.data() });
        }
      }
      
      return friendsData;
    } catch (error) {
      throw new Error(`Failed to get user friends: ${error.message}`);
    }
  }
};

// Build Management Services
export const buildService = {
  // Create new build
  async createBuild(userId, buildData) {
    try {
      const buildDoc = {
        userId,
        name: buildData.name,
        category: buildData.category,
        target: buildData.target,
        description: buildData.description,
        difficulty: buildData.difficulty || 'Medium',
        pointValue: buildData.pointValue || 150,
        currentStreak: 0,
        bestStreak: 0,
        startDate: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        status: 'active',
        dailyTasks: buildData.dailyTasks || [],
        isPublic: buildData.isPublic || false,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'builds'), buildDoc);
      
      // Update user's active builds count
      await updateDoc(doc(db, 'users', userId), {
        activeBuilds: arrayUnion(docRef.id)
      });
      
      return { id: docRef.id, ...buildDoc };
    } catch (error) {
      throw new Error(`Failed to create build: ${error.message}`);
    }
  },

  // Get user's builds
  async getUserBuilds(userId) {
    try {
      const buildsRef = collection(db, 'builds');
      const q = query(
        buildsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const builds = [];
      
      querySnapshot.forEach((doc) => {
        builds.push({ id: doc.id, ...doc.data() });
      });
      
      return builds;
    } catch (error) {
      throw new Error(`Failed to get user builds: ${error.message}`);
    }
  },

  // Get public builds from friends
  async getFriendsPublicBuilds(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return [];
      
      const { friends = [] } = userDoc.data();
      if (friends.length === 0) return [];
      
      const buildsRef = collection(db, 'builds');
      const q = query(
        buildsRef,
        where('userId', 'in', friends),
        where('isPublic', '==', true),
        orderBy('lastUpdated', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const builds = [];
      
      querySnapshot.forEach((doc) => {
        builds.push({ id: doc.id, ...doc.data() });
      });
      
      return builds;
    } catch (error) {
      throw new Error(`Failed to get friends builds: ${error.message}`);
    }
  },

  // Update build
  async updateBuild(buildId, updates) {
    try {
      await updateDoc(doc(db, 'builds', buildId), {
        ...updates,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      throw new Error(`Failed to update build: ${error.message}`);
    }
  },

  // Delete build
  async deleteBuild(buildId, userId) {
    try {
      await deleteDoc(doc(db, 'builds', buildId));
      
      // Update user's active builds count
      await updateDoc(doc(db, 'users', userId), {
        activeBuilds: arrayRemove(buildId)
      });
    } catch (error) {
      throw new Error(`Failed to delete build: ${error.message}`);
    }
  },

  // Listen to user's builds changes
  onUserBuildsChange(userId, callback) {
    const buildsRef = collection(db, 'builds');
    const q = query(
      buildsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const builds = [];
      querySnapshot.forEach((doc) => {
        builds.push({ id: doc.id, ...doc.data() });
      });
      callback(builds);
    });
  }
};

// Task Management Services
export const taskService = {
  // Complete daily task
  async completeDailyTask(buildId, taskId, userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get current build
      const buildDoc = await getDoc(doc(db, 'builds', buildId));
      if (!buildDoc.exists()) {
        throw new Error('Build not found');
      }
      
      const build = buildDoc.data();
      const taskIndex = build.dailyTasks.findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }
      
      const task = build.dailyTasks[taskIndex];
      
      // Check if already completed today
      if (task.completedDates && task.completedDates.includes(today)) {
        throw new Error('Task already completed today');
      }
      
      // Update task completion
      const updatedTasks = [...build.dailyTasks];
      updatedTasks[taskIndex] = {
        ...task,
        completedDates: [...(task.completedDates || []), today]
      };
      
      // Update build
      await updateDoc(doc(db, 'builds', buildId), {
        dailyTasks: updatedTasks,
        lastUpdated: serverTimestamp()
      });
      
      // Update user points and streak
      await updateDoc(doc(db, 'users', userId), {
        totalPoints: arrayUnion(build.pointValue),
        totalStreakDays: arrayUnion(1)
      });
      
      return { success: true, task: updatedTasks[taskIndex] };
    } catch (error) {
      throw new Error(`Failed to complete task: ${error.message}`);
    }
  }
};

// Leaderboard Services
export const leaderboardService = {
  // Get global leaderboard
  async getGlobalLeaderboard(limit = 50) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        orderBy('totalPoints', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const leaderboard = [];
      
      querySnapshot.forEach((doc, index) => {
        leaderboard.push({
          rank: index + 1,
          uid: doc.id,
          ...doc.data()
        });
      });
      
      return leaderboard;
    } catch (error) {
      throw new Error(`Failed to get global leaderboard: ${error.message}`);
    }
  },

  // Get friends leaderboard
  async getFriendsLeaderboard(userId, limit = 20) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return [];
      
      const { friends = [] } = userDoc.data();
      if (friends.length === 0) return [];
      
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('uid', 'in', friends),
        orderBy('totalPoints', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const leaderboard = [];
      
      querySnapshot.forEach((doc, index) => {
        leaderboard.push({
          rank: index + 1,
          uid: doc.id,
          ...doc.data()
        });
      });
      
      return leaderboard;
    } catch (error) {
      throw new Error(`Failed to get friends leaderboard: ${error.message}`);
    }
  }
};

// Activity Feed Services
export const activityService = {
  // Create activity entry
  async createActivity(userId, activityData) {
    try {
      const activityDoc = {
        userId,
        type: activityData.type,
        description: activityData.description,
        buildId: activityData.buildId || null,
        buildName: activityData.buildName || null,
        points: activityData.points || 0,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'activities'), activityDoc);
    } catch (error) {
      throw new Error(`Failed to create activity: ${error.message}`);
    }
  },

  // Get user's activity feed
  async getUserActivityFeed(userId, limit = 20) {
    try {
      const activitiesRef = collection(db, 'activities');
      const q = query(
        activitiesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = [];
      
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      
      return activities;
    } catch (error) {
      throw new Error(`Failed to get user activity: ${error.message}`);
    }
  },

  // Get friends activity feed
  async getFriendsActivityFeed(userId, limit = 30) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return [];
      
      const { friends = [] } = userDoc.data();
      if (friends.length === 0) return [];
      
      const activitiesRef = collection(db, 'activities');
      const q = query(
        activitiesRef,
        where('userId', 'in', friends),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = [];
      
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      
      return activities;
    } catch (error) {
      throw new Error(`Failed to get friends activity: ${error.message}`);
    }
  }
};

// Real-time Services (using Firestore instead of Realtime Database)
export const realtimeService = {
  // Listen to real-time updates using Firestore
  onRealtimeUpdate(collectionPath, callback) {
    const collectionRef = collection(db, collectionPath);
    return onSnapshot(collectionRef, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      callback(data);
    });
  },

  // Update real-time data using Firestore
  async updateRealtimeData(collectionPath, docId, data) {
    try {
      const docRef = doc(db, collectionPath, docId);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      throw new Error(`Failed to update real-time data: ${error.message}`);
    }
  }
};

// Profile Management Services
export const profileService = {
  // Complete user onboarding with profile data
  async completeOnboarding({ realName, birthdate, file, idFile, handle }) {
    try {
      const uid = auth.currentUser.uid;
      const lower = realName.toLowerCase();

      // Upload profile photo
      const pRef = ref(storage, `profilePhotos/${uid}/${uid}.jpg`);
      await uploadBytes(pRef, file);
      const photoURL = await getDownloadURL(pRef);

      // Upload ID document
      const idRef = ref(storage, `idDocuments/${uid}/${uid}_id.jpg`);
      await uploadBytes(idRef, idFile);
      const idURL = await getDownloadURL(idRef);

      // Create profile document
      await setDoc(doc(db, "profiles", uid), {
        realName,
        realNameLowercase: lower,
        birthdate,
        photoURL,
        idDocumentURL: idURL,
        handle: handle ?? uid.slice(0, 6),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        verification: {
          email: auth.currentUser.emailVerified ? "verified" : "unverified",
          idCheck: "submitted" // ID uploaded, pending verification
        },
        stats: { score: 0, streak: 0 }
      });

      // Initialize leaderboard score
      await setDoc(doc(db, "leaderboards/global/scores", uid), {
        score: 0,
        streak: 0,
        updatedAt: serverTimestamp()
      });

      return { photoURL };
    } catch (error) {
      throw new Error(`Failed to complete onboarding: ${error.message}`);
    }
  },

  // Get user profile
  async getUserProfile(uid) {
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', uid));
      if (profileDoc.exists()) {
        return { uid, ...profileDoc.data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to get profile: ${error.message}`);
    }
  },

  // Update user profile
  async updateUserProfile(uid, updates) {
    try {
      await updateDoc(doc(db, 'profiles', uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  },

  // Search users by name or handle
  async searchUsers(searchTerm, limit = 20) {
    try {
      const lowerTerm = searchTerm.toLowerCase();
      const profilesRef = collection(db, 'profiles');
      
      // Search by real name (prefix match)
      const nameQuery = query(
        profilesRef,
        where('realNameLowercase', '>=', lowerTerm),
        where('realNameLowercase', '<=', lowerTerm + '\uf8ff'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(nameQuery);
      const profiles = [];
      
      querySnapshot.forEach((doc) => {
        profiles.push({ uid: doc.id, ...doc.data() });
      });
      
      return profiles;
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }
};

// Enhanced Friend Services
export const enhancedFriendService = {
  // Send friend request
  async sendFriendRequest(targetId) {
    try {
      const me = auth.currentUser.uid;
      const base = {
        from: me,
        to: targetId,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await Promise.all([
        setDoc(doc(db, "friends", targetId, "requests", me), base),
        setDoc(doc(db, "friends", me, "requests", targetId), base),
      ]);
    } catch (error) {
      throw new Error(`Failed to send friend request: ${error.message}`);
    }
  },

  // Accept friend request
  async acceptFriendRequest(otherId) {
    try {
      const me = auth.currentUser.uid;
      await Promise.all([
        updateDoc(doc(db, "friends", me, "requests", otherId), {
          status: "accepted",
          updatedAt: serverTimestamp()
        }),
        updateDoc(doc(db, "friends", otherId, "requests", me), {
          status: "accepted",
          updatedAt: serverTimestamp()
        }),
        setDoc(doc(db, "friends", me, "list", otherId), {
          since: serverTimestamp()
        }),
        setDoc(doc(db, "friends", otherId, "list", me), {
          since: serverTimestamp()
        }),
      ]);
    } catch (error) {
      throw new Error(`Failed to accept friend request: ${error.message}`);
    }
  },

  // Decline friend request
  async declineFriendRequest(otherId) {
    try {
      const me = auth.currentUser.uid;
      await Promise.all([
        updateDoc(doc(db, "friends", me, "requests", otherId), {
          status: "declined",
          updatedAt: serverTimestamp()
        }),
        updateDoc(doc(db, "friends", otherId, "requests", me), {
          status: "declined",
          updatedAt: serverTimestamp()
        }),
      ]);
    } catch (error) {
      throw new Error(`Failed to decline friend request: ${error.message}`);
    }
  },

  // Get friend requests
  async getFriendRequests(uid) {
    try {
      const requestsRef = collection(db, 'friends', uid, 'requests');
      const q = query(requestsRef, where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      
      return requests;
    } catch (error) {
      throw new Error(`Failed to get friend requests: ${error.message}`);
    }
  },

  // Get friends list
  async getFriendsList(uid) {
    try {
      const friendsRef = collection(db, 'friends', uid, 'list');
      const querySnapshot = await getDocs(friendsRef);
      
      const friends = [];
      querySnapshot.forEach((doc) => {
        friends.push({ id: doc.id, ...doc.data() });
      });
      
      return friends;
    } catch (error) {
      throw new Error(`Failed to get friends list: ${error.message}`);
    }
  }
};

// Enhanced Build Services with Popularity
export const enhancedBuildService = {
  // Like a build (increases popularity)
  async likeBuild(buildId) {
    try {
      const uid = auth.currentUser.uid;
      
      // Check if already liked
      const likeDoc = await getDoc(doc(db, 'likes', buildId, 'by', uid));
      if (likeDoc.exists()) {
        throw new Error('Already liked this build');
      }
      
      // Add like and update popularity
      await Promise.all([
        setDoc(doc(db, 'likes', buildId, 'by', uid), {
          createdAt: serverTimestamp()
        }),
        runTransaction(db, async (tx) => {
          const bRef = doc(db, 'builds', buildId);
          const snap = await tx.get(bRef);
          if (!snap.exists()) return;
          tx.update(bRef, {
            popularity: (snap.data().popularity ?? 0) + 1
          });
        })
      ]);
    } catch (error) {
      throw new Error(`Failed to like build: ${error.message}`);
    }
  },

  // Unlike a build (decreases popularity)
  async unlikeBuild(buildId) {
    try {
      const uid = auth.currentUser.uid;
      
      // Remove like and update popularity
      await Promise.all([
        deleteDoc(doc(db, 'likes', buildId, 'by', uid)),
        runTransaction(db, async (tx) => {
          const bRef = doc(db, 'builds', buildId);
          const snap = await tx.get(bRef);
          if (!snap.exists()) return;
          const currentPopularity = snap.data().popularity ?? 0;
          tx.update(bRef, {
            popularity: Math.max(0, currentPopularity - 1)
          });
        })
      ]);
    } catch (error) {
      throw new Error(`Failed to unlike build: ${error.message}`);
    }
  },

  // Get public builds sorted by popularity
  async getPublicBuilds(limit = 20) {
    try {
      const buildsRef = collection(db, 'builds');
      const q = query(
        buildsRef,
        where('isPublic', '==', true),
        orderBy('popularity', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const builds = [];
      
      querySnapshot.forEach((doc) => {
        builds.push({ id: doc.id, ...doc.data() });
      });
      
      return builds;
    } catch (error) {
      throw new Error(`Failed to get public builds: ${error.message}`);
    }
  }
};

// Enhanced Leaderboard Services
export const enhancedLeaderboardService = {
  // Update user score and streak
  async updateUserScore(uid, score, streak) {
    try {
      await Promise.all([
        // Update leaderboard
        setDoc(doc(db, 'leaderboards/global/scores', uid), {
          score,
          streak,
          updatedAt: serverTimestamp()
        }, { merge: true }),
        
        // Update profile stats
        updateDoc(doc(db, 'profiles', uid), {
          'stats.score': score,
          'stats.streak': streak,
          updatedAt: serverTimestamp()
        })
      ]);
    } catch (error) {
      throw new Error(`Failed to update user score: ${error.message}`);
    }
  },

  // Get global leaderboard
  async getGlobalLeaderboard(limit = 50) {
    try {
      const scoresRef = collection(db, 'leaderboards/global/scores');
      const q = query(scoresRef, orderBy('score', 'desc'), limit(limit));
      
      const querySnapshot = await getDocs(q);
      const scores = [];
      
      querySnapshot.forEach((doc) => {
        scores.push({ uid: doc.id, ...doc.data() });
      });
      
      // Get profile data for each user
      const leaderboard = await Promise.all(
        scores.map(async (score) => {
          const profile = await profileService.getUserProfile(score.uid);
          return {
            ...score,
            realName: profile?.realName || 'Unknown User',
            photoURL: profile?.photoURL || null,
            handle: profile?.handle || score.uid.slice(0, 6)
          };
        })
      );
      
      return leaderboard;
    } catch (error) {
      throw new Error(`Failed to get global leaderboard: ${error.message}`);
    }
  }
};

// Export all services
const services = {
  userService,
  friendService,
  buildService,
  taskService,
  leaderboardService,
  activityService,
  realtimeService,
  profileService,
  enhancedFriendService,
  enhancedBuildService,
  enhancedLeaderboardService
};

export default services;
