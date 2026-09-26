import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Listing } from "./types";

/** Subscribes to every active listing, for the public discovery page. */
export function subscribeToActiveListings(onChange: (listings: Listing[]) => void) {
  const q = query(collection(db, "listings"), where("active", "==", true));
  return onSnapshot(q, (snap) => {
    const listings = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Listing)
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    onChange(listings);
  });
}

/** Subscribes to one seller's own listings (active and inactive), for their management page. */
export function subscribeToMyListings(sellerId: string, onChange: (listings: Listing[]) => void) {
  const q = query(collection(db, "listings"), where("sellerId", "==", sellerId));
  return onSnapshot(q, (snap) => {
    const listings = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Listing)
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    onChange(listings);
  });
}

export async function createListing(params: {
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  title: string;
  description: string;
  currency: string;
  price: number;
  imageUrl?: string;
}) {
  await addDoc(collection(db, "listings"), {
    ...params,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setListingActive(listingId: string, active: boolean) {
  await updateDoc(doc(db, "listings", listingId), { active, updatedAt: serverTimestamp() });
}