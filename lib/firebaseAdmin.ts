import { cert, getApps, getApp, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";


function getAdminApp(): App {
  if (getApps().length) return getApp();

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private keys from env vars often have literal "\n" sequences instead
      // of real newlines — this restores them.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);

/** Verifies a Firebase ID token sent from the client and returns the uid. */
export async function requireUid(authorizationHeader: string | null): Promise<string> {
  const token = authorizationHeader?.replace(/^Bearer /, "");
  if (!token) throw new Error("Missing Authorization header");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}