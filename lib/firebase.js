import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Set NEXT_PUBLIC_AUTH_ENABLED=false in .env.local to turn sign-in off everywhere
export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false";

export const firebaseConfigured = AUTH_ENABLED && Boolean(config.apiKey && config.authDomain && config.projectId);

let auth = null;

// Only create the Firebase app in the browser (Next.js also renders on the server)
function getFirebaseAuth() {
  if (typeof window === "undefined" || !firebaseConfigured) return null;
  if (!auth) {
    const app = getApps()[0] || initializeApp(config);
    auth = getAuth(app);
  }
  return auth;
}

export async function signInWithGoogle() {
  const a = getFirebaseAuth();
  if (!a) throw new Error("Firebase is not configured. Add your keys to .env.local.");
  const result = await signInWithPopup(a, new GoogleAuthProvider());
  return result.user;
}

export function signOutUser() {
  const a = getFirebaseAuth();
  return a ? signOut(a) : Promise.resolve();
}

export function watchAuth(callback) {
  const a = getFirebaseAuth();
  if (!a) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(a, callback);
}

export async function getIdToken() {
  const a = getFirebaseAuth();
  return a && a.currentUser ? a.currentUser.getIdToken() : null;
}
