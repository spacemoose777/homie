"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  getUserDoc,
  getMemberProfile,
  createHousehold,
  joinHousehold,
  findInviteByToken,
  markInviteUsed,
} from "@/lib/firebase/firestore";
import type { MemberProfile, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  householdId: string | null;
  memberProfile: MemberProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, inviteToken?: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    inviteToken?: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadHouseholdData(u: User) {
    try {
      const userDoc = await getUserDoc(u.uid);
      if (!userDoc) return;
      setHouseholdId(userDoc.householdId);
      const profile = await getMemberProfile(userDoc.householdId, u.uid);
      setMemberProfile(profile);
    } catch (err) {
      console.error("Failed to load household data", err);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false); // Auth state is known — unblock the UI immediately
      if (u) {
        loadHouseholdData(u); // Profile/householdId load in background
      } else {
        setHouseholdId(null);
        setMemberProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, inviteToken?: string) => {
    try {
      const { user: signedInUser } = await signInWithEmailAndPassword(auth, email, password);

      if (inviteToken) {
        const result = await findInviteByToken(inviteToken);
        if (!result) return { error: "Invite not found or expired" };
        if (result.invite.used) return { error: "This invite has already been used" };
        if (result.invite.expiry.toDate() < new Date()) return { error: "Invite has expired" };

        await joinHousehold(
          result.householdId,
          signedInUser.uid,
          signedInUser.email ?? email,
          signedInUser.displayName ?? email,
          result.invite.role as UserRole
        );
        await markInviteUsed(result.householdId, inviteToken);

        // Reload so client state reflects the joined household immediately.
        await loadHouseholdData(signedInUser);
      }

      return { error: null };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      return { error: getFirebaseErrorMessage(code) };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    inviteToken?: string
  ) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(newUser, { displayName });

      if (inviteToken) {
        // Join existing household via invite
        const result = await findInviteByToken(inviteToken);
        if (!result) return { error: "Invite not found or expired" };
        if (result.invite.used) return { error: "This invite has already been used" };
        if (result.invite.expiry.toDate() < new Date()) return { error: "Invite has expired" };

        await joinHousehold(
          result.householdId,
          newUser.uid,
          email,
          displayName,
          result.invite.role as UserRole
        );
        await markInviteUsed(result.householdId, inviteToken);
      } else {
        // Create new household
        await createHousehold(newUser.uid, email, displayName);
      }

      // Reload household data now that Firestore writes are complete.
      // onAuthStateChanged fires before these writes finish, so we must
      // explicitly sync after sign-up.
      await loadHouseholdData(newUser);

      return { error: null };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      return { error: getFirebaseErrorMessage(code) };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setHouseholdId(null);
    setMemberProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await loadHouseholdData(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        householdId,
        memberProfile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password";
    case "auth/email-already-in-use":
      return "An account with this email already exists";
    case "auth/weak-password":
      return "Password must be at least 6 characters";
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later";
    case "auth/user-disabled":
      return "This account has been disabled";
    default:
      return "An error occurred. Please try again";
  }
}
