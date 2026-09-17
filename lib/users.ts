import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";

export type UserRole = "buyer" | "seller";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  verified: boolean;
  createdAt: unknown;
}

/**
 * Creates the Firestore profile document for a newly signed-up user.
 * Only writes if a profile doesn't already exist, so this is safe to call
 * for both email/password and Google sign-up flows without overwriting
 * an existing user's role on a later login.
 */
export async function createUserProfile(user: User, role: UserRole) {
  const ref = doc(db, "users", user.uid);
  const existing = await getDoc(ref);

  if (existing.exists()) {
    return existing.data() as UserProfile;
  }

  const profile: Omit<UserProfile, "createdAt"> & { createdAt: unknown } = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role,
    verified: false,
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, profile);
  return profile;
}