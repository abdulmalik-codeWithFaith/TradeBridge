import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order, OrderProof } from "./types";

/**
 * Subscribes to every order where `uid` is either the buyer or the seller.
 * Firestore can't OR across two different fields in one query, so this runs
 * two listeners and merges the results, de-duplicating by order id.
 *
 * Returns an unsubscribe function that tears down both listeners.
 */
export function subscribeToUserOrders(
  uid: string,
  onChange: (orders: Order[]) => void
) {
  const ordersRef = collection(db, "orders");
  const asBuyer = query(ordersRef, where("buyerId", "==", uid));
  const asSeller = query(ordersRef, where("sellerId", "==", uid));

  const merged = new Map<string, Order>();

  function emit() {
    const orders = Array.from(merged.values()).sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() ?? 0;
      const bTime = b.updatedAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
    onChange(orders);
  }

  const unsubBuyer = onSnapshot(asBuyer, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === "removed") {
        merged.delete(change.doc.id);
      } else {
        merged.set(change.doc.id, { id: change.doc.id, ...change.doc.data() } as Order);
      }
    });
    emit();
  });

  const unsubSeller = onSnapshot(asSeller, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === "removed") {
        merged.delete(change.doc.id);
      } else {
        merged.set(change.doc.id, { id: change.doc.id, ...change.doc.data() } as Order);
      }
    });
    emit();
  });

  return () => {
    unsubBuyer();
    unsubSeller();
  };
}

function makeProof(url: string, note?: string): OrderProof {
  return {
    url,
    note: note || undefined,
    // Cast needed because serverTimestamp() returns a sentinel, not a real Timestamp,
    // until Firestore resolves it server-side.
    uploadedAt: serverTimestamp() as unknown as OrderProof["uploadedAt"],
  };
}

export async function markPaid(orderId: string) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "paid",
    updatedAt: serverTimestamp(),
  });
}

export async function markShipped(orderId: string, proofUrl: string, note?: string) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "shipped",
    shippingProof: makeProof(proofUrl, note),
    updatedAt: serverTimestamp(),
  });
}

export async function markDelivered(orderId: string, proofUrl: string, note?: string) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "delivered",
    deliveryProof: makeProof(proofUrl, note),
    updatedAt: serverTimestamp(),
  });
}

export async function confirmOrder(orderId: string) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "confirmed",
    updatedAt: serverTimestamp(),
  });
}

export async function markDisputed(orderId: string) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "disputed",
    updatedAt: serverTimestamp(),
  });
}