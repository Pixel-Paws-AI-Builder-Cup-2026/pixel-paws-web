"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { AUTH_ENABLED, firebaseConfigured, signInWithGoogle, signOutUser, watchAuth } from "../lib/firebase";
import { CloseIcon, LockIcon, UserIcon } from "./Icons";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Used when sign-in is turned off: everyone acts as this guest, nothing is gated
const GUEST = { displayName: "Guest volunteer", email: "", photoURL: null, isGuest: true };

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(AUTH_ENABLED ? null : GUEST);
  const [ready, setReady] = useState(!AUTH_ENABLED);
  const [gate, setGate] = useState(null); // { title, message, onSuccess }
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!AUTH_ENABLED) return;
    return watchAuth((u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  async function signIn() {
    setSigningIn(true);
    setError("");
    try {
      const u = await signInWithGoogle();
      setUser(u);
      return u;
    } catch (e) {
      if (e && e.code !== "auth/popup-closed-by-user") setError(e.message || "Sign-in failed.");
      return null;
    } finally {
      setSigningIn(false);
    }
  }

  // Run an action that needs a signed-in user; shows the sign-in sheet first if needed
  function requireAuth(title, message, onSuccess) {
    if (user) return onSuccess(user);
    setError("");
    setGate({ title, message, onSuccess });
  }

  async function signInFromGate() {
    const u = await signIn();
    if (u && gate) {
      const action = gate.onSuccess;
      setGate(null);
      action(u);
    }
  }

  const value = { user, ready, signIn, signOut: signOutUser, requireAuth, signingIn };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {gate && (
        <div className="sheet-layer" style={{ zIndex: 60 }}>
          <button className="sheet-backdrop" aria-label="Close" onClick={() => setGate(null)} />
          <div className="sheet" role="dialog" aria-label={gate.title}>
            <div className="sheet-handle" />
            <div className="row-between">
              <span className="icon-circle">
                <LockIcon size={22} />
              </span>
              <button className="icon-btn" aria-label="Close" onClick={() => setGate(null)}>
                <CloseIcon />
              </button>
            </div>
            <h2 className="sheet-title">{gate.title}</h2>
            <p className="muted">{gate.message}</p>
            {!firebaseConfigured && (
              <p className="error-text">Firebase isn't configured yet. Add your keys to .env.local.</p>
            )}
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-google" onClick={signInFromGate} disabled={signingIn}>
              <UserIcon />
              {signingIn ? "Signing you in…" : "Continue with Google"}
            </button>
            <p className="fine-print">Reporting a stray never needs an account.</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
