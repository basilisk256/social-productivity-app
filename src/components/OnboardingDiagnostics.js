"use client";
import { useState } from "react";
import { auth, db, storage } from "../lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";



export default function OnboardingDiagnostics() {
  const [steps, setSteps] = useState([]);

  async function run() {
    const log = (name, ok, msg) =>
      setSteps((s) => [...s, { name, ok, msg }]);

    setSteps([]);
    try {
      // 1) Auth
      log("Auth: signing in…", undefined);
      if (!auth.currentUser) await signInAnonymously(auth);
      const uid = auth.currentUser.uid;
      log("Auth: signed in", true, uid);

      // 2) Firestore write
      log("Firestore: writing…", undefined);
      await setDoc(doc(db, "diagnostics", uid), { ts: serverTimestamp() }, { merge: true });
      log("Firestore: write OK", true);

      // 3) Storage upload (tiny blob)
      log("Storage: uploading…", undefined);
      const r = ref(storage, `diagnostics/${uid}/ping.txt`);
      await uploadBytes(r, new Blob(["ok"]));
      const url = await getDownloadURL(r);
      log("Storage: upload OK", true, url);

      log("DONE ✅", true);
    } catch (e) {
      log("FAILED ❌", false, e?.message || String(e));
      console.error("DIAG FAIL", e);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "ui-sans-serif" }}>
      <h1>Onboarding Diagnostics</h1>
      <button onClick={run} style={{ padding: 8 }}>Run</button>
      <ul style={{ marginTop: 16 }}>
        {steps.map((s, i) => (
          <li key={i}>
            <strong>{s.name}</strong> {s.ok === undefined ? "" : s.ok ? "✓" : "✗"} {s.msg && `— ${s.msg}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
