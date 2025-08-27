# 🔥 Firebase Setup Guide for ACME App

This guide will walk you through setting up Firebase for your ACME social productivity app, enabling real user authentication, data storage, and social features.

## 🚀 Quick Start

1. **Install Firebase**: `npm install firebase` ✅ (Already done)
2. **Create Firebase Project**: Follow steps below
3. **Configure App**: Copy config to `src/firebase/config.js`
4. **Set Security Rules**: Configure database permissions
5. **Test**: Run the app and create your first account!

## 📋 Prerequisites

- Google account
- Node.js project (already set up)
- Firebase CLI (optional, for advanced features)

## 🏗️ Step 1: Create Firebase Project

### 1.1 Go to Firebase Console
- Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
- Sign in with your Google account

### 1.2 Create New Project
- Click **"Create a project"**
- Enter project name: `acme-wins-network` (or your preferred name)
- Choose whether to enable Google Analytics (recommended for production)
- Click **"Create project"**

### 1.3 Wait for Project Creation
- Firebase will set up your project
- Click **"Continue"** when ready

## 🔐 Step 2: Enable Authentication

### 2.1 Navigate to Authentication
- In the left sidebar, click **"Authentication"**
- Click **"Get started"**

### 2.2 Enable Sign-in Methods
- Click **"Sign-in method"** tab
- Click **"Email/Password"**
- Toggle **"Enable"** to ON
- Check **"Email verification"** (recommended)
- Click **"Save"**

### 2.3 (Optional) Add Other Providers
- You can also enable Google, Facebook, etc. for additional sign-in options
- For now, Email/Password is sufficient

## 🗄️ Step 3: Set Up Firestore Database

### 3.1 Create Firestore Database
- In the left sidebar, click **"Firestore Database"**
- Click **"Create database"**
- Choose **"Start in test mode"** (for development)
- Click **"Next"**

### 3.2 Choose Location
- Select a location close to your users
- Click **"Done"**

### 3.3 Set Security Rules
- Click **"Rules"** tab
- Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Builds can be read by owner or if public
    match /builds/{buildId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || resource.data.isPublic == true);
    }
    
    // Activities are readable by authenticated users
    match /activities/{activityId} {
      allow read, write: if request.auth != null;
    }
    
    // Friend requests are accessible by involved users
    match /friendRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

- Click **"Publish"**

## ⚡ Step 4: Set Up Realtime Database

### 4.1 Create Realtime Database
- In the left sidebar, click **"Realtime Database"**
- Click **"Create database"**
- Choose **"Start in test mode"**
- Click **"Next"**

### 4.2 Choose Location
- Select the same location as Firestore
- Click **"Done"**

### 4.3 Set Security Rules
- Click **"Rules"** tab
- Replace the rules with:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

- Click **"Publish"**

## ⚙️ Step 5: Get Your Configuration

### 5.1 Access Project Settings
- Click the gear icon ⚙️ next to "Project Overview"
- Select **"Project settings"**

### 5.2 Add Web App
- Scroll down to **"Your apps"**
- Click **"Add app"** (</> icon)
- Choose **"Web"**
- Enter app nickname: `acme-web-app`
- Click **"Register app"**

### 5.3 Copy Configuration
- Copy the `firebaseConfig` object
- It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com"
};
```

## 🔧 Step 6: Configure Your App

### 6.1 Update Firebase Config
- Copy `firebase-config.example.js` to `src/firebase/config.js`
- Replace the placeholder values with your actual Firebase config
- Save the file

### 6.2 Test Configuration
- Run `npm start` to test your app
- Try creating a new account
- Verify data appears in Firebase console

## 🧪 Step 7: Test Your Setup

### 7.1 Create Test Account
- Open your app in the browser
- Click **"Need an account? Sign Up"**
- Enter test credentials:
  - Email: `test@example.com`
  - Password: `test123456`
  - Display Name: `Test User`

### 7.2 Verify in Firebase Console
- Go back to Firebase Console
- Check **Authentication > Users** - you should see your test user
- Check **Firestore Database** - you should see user document
- Check **Realtime Database** - you should see user data

## 🚨 Troubleshooting

### Common Issues

#### 1. "Firebase: Error (auth/invalid-api-key)"
- **Solution**: Check your API key in `src/firebase/config.js`
- Make sure you copied the entire config object

#### 2. "Firebase: Error (auth/operation-not-allowed)"
- **Solution**: Enable Email/Password authentication in Firebase Console
- Go to Authentication > Sign-in method > Email/Password

#### 3. "Firebase: Error (permission-denied)"
- **Solution**: Check your Firestore security rules
- Make sure they allow authenticated users to read/write

#### 4. "Firebase: Error (database/permission-denied)"
- **Solution**: Check your Realtime Database security rules
- Make sure they allow authenticated users to read/write

### Debug Mode
- Open browser console (F12)
- Look for Firebase-related errors
- Check network tab for failed requests

## 🔒 Security Best Practices

### Development vs Production
- **Development**: Use test mode rules for easy development
- **Production**: Implement proper security rules before deployment

### User Data Protection
- Users can only access their own data
- Public builds are readable by all authenticated users
- Friend requests require mutual consent

### API Key Security
- Firebase API keys are safe to expose in client-side code
- They're restricted by security rules and domain restrictions
- Never expose Firebase service account keys

## 🚀 Next Steps

### Advanced Features
- **Push Notifications**: Enable Firebase Cloud Messaging
- **File Storage**: Add Firebase Storage for profile pictures
- **Analytics**: Enable Firebase Analytics for user insights
- **Performance**: Add Firebase Performance Monitoring

### Deployment
- **Hosting**: Use Firebase Hosting for production deployment
- **Custom Domain**: Configure your own domain
- **SSL**: Automatic HTTPS with Firebase Hosting

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Community](https://firebase.google.com/community)

## 🎯 Success Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created with security rules
- [ ] Realtime database created with security rules
- [ ] Configuration copied to `src/firebase/config.js`
- [ ] App runs without Firebase errors
- [ ] Can create new user account
- [ ] User data appears in Firebase console
- [ ] Can create builds and complete tasks
- [ ] Data persists across app restarts

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your Firebase configuration
3. Check browser console for error messages
4. Ensure all Firebase services are enabled
5. Verify security rules are published

---

**🎉 Congratulations!** You've successfully set up Firebase for your ACME app. You now have a fully functional social productivity app with real user authentication, data persistence, and social features!
