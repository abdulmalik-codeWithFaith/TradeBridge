import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { markDisputed } from "./orders";

export async function openDispute(params: {
  orderId: string;
  openedBy: string;
  reason: string;
  description: string;
}) {
  // Create the dispute record, then flip the order into `disputed`.
  // These are two separate writes because Firestore security rules treat
  // "create a dispute" and "change an order's status" as different
  // permissions — a client can't do a multi-document transaction that
  // bypasses either rule.
  await addDoc(collection(db, "disputes"), {
    orderId: params.orderId,
    openedBy: params.openedBy,
    reason: params.reason,
    description: params.description,
    evidenceUrls: [],
    status: "open",
    createdAt: serverTimestamp(),
  });

  await markDisputed(params.orderId);
}