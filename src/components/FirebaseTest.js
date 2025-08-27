import React, { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const FirebaseTest = () => {
  const [status, setStatus] = useState('Starting...');

  useEffect(() => {
    (async () => {
      try {
        setStatus('Signing in anonymously...');
        const cred = await signInAnonymously(auth);
        const uid = cred.user.uid;

        setStatus('Writing to Firestore...');
        await setDoc(doc(db, 'smokeTests', uid), { ok: true, ts: Date.now() });

        setStatus('Reading from Firestore...');
        const snap = await getDoc(doc(db, 'smokeTests', uid));
        setStatus('Success! ' + JSON.stringify(snap.data()));
      } catch (error) {
        setStatus('Error: ' + error.message);
        console.error('Firebase test error:', error);
      }
    })();
  }, []);

  return (
    <div style={{ 
      padding: 24, 
      fontFamily: 'monospace',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      minHeight: '100vh'
    }}>
      <h2>Firebase Connection Test</h2>
      <div style={{ 
        padding: 16, 
        backgroundColor: '#2a2a2a', 
        borderRadius: 4,
        marginTop: 16
      }}>
        {status}
      </div>
      <div style={{ marginTop: 16, fontSize: '14px', color: '#888' }}>
        If you see "Success! ..." you are officially linked to Firebase! ✅
      </div>
    </div>
  );
};

export default FirebaseTest;
