import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from "react";

import { isAdminClaim } from "../../admin-claims";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  adminChecked: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
};

let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
} catch {
  app = initializeApp(firebaseConfig, "blazing-cms");
}

const auth = getAuth(app);

async function checkAdminClaim(user: User): Promise<boolean> {
  try {
    const result = await user.getIdTokenResult();
    return isAdminClaim(result.claims as Record<string, unknown>);
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const admin = await checkAdminClaim(u);
        setIsAdmin(admin);
        setAdminChecked(true);
      } else {
        setIsAdmin(false);
        setAdminChecked(true);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setIsAdmin(false);
    setAdminChecked(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ adminChecked, isAdmin, loading, login, loginWithGoogle, logout, user }}
    >
      {children}
    </AuthContext.Provider>
  );
}
