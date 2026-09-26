"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Listing, UserProfile } from "@/lib/types";
import { createListing, setListingActive, subscribeToMyListings } from "@/lib/listings";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/fx";

export default function MyListingsPage() {
  const router = useRouter();

  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<SupportedCurrency>("NGN");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (!user) router.push("/login");
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    if (!authUser) return;
    getDoc(doc(db, "users", authUser.uid)).then((snap) => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
    });
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    return subscribeToMyListings(authUser.uid, setListings);
  }, [authUser]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!authUser || !profile) return;
    const priceNum = parseFloat(price);
    if (!title.trim() || !description.trim() || !priceNum || priceNum <= 0) {
      setError("Fill in a title, description, and a price above zero.");
      return;
    }

    setSubmitting(true);
    try {
      await createListing({
        sellerId: authUser.uid,
        sellerName: profile.displayName || "TradeBridge seller",
        sellerVerified: profile.verified,
        title: title.trim(),
        description: description.trim(),
        currency,
        price: priceNum,
        imageUrl: imageUrl.trim() || undefined,
      });
      setTitle("");
      setDescription("");
      setPrice("");
      setImageUrl("");
    } catch {
      setError("Couldn't create that listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authUser === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] text-[var(--ink-muted)]">
        Loading…
      </main>
    );
  }
  if (!authUser) return null;

  if (profile && profile.role !== "seller") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--paper)] px-6 text-center text-[var(--ink)]">
        <p className="text-lg font-medium">This page is for seller accounts.</p>
        <a href="/dashboard" className="btn btn-primary mt-2 text-sm">
          Back to dashboard
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[var(--sand-border)]">
        <div className="container-page flex h-16 items-center justify-between">
          <a href="/" className="text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            TradeBridge
          </a>
          <a href="/dashboard" className="text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]">
            Back to dashboard
          </a>
        </div>
      </header>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_1.3fr]">
        {/* Create form */}
        <div>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
            List something for sale
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Buyers find this on the discover page and can start an order directly from it.
          </p>

          <form onSubmit={handleCreate} className="mt-6 space-y-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                placeholder="40 yards of Ankara fabric"
              />
            </div>
            <div>
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                placeholder="Handwoven, bold prints, sold by the yard."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="currency" className="text-sm font-medium">Currency</label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="price" className="text-sm font-medium">Price</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="tnum mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                  placeholder="150000"
                />
              </div>
            </div>
            <div>
              <label htmlFor="imageUrl" className="text-sm font-medium">Photo URL (optional)</label>
              <input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                placeholder="https://…"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-[var(--clay)]">{error}</p>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary w-full disabled:opacity-60">
              {submitting ? "Publishing…" : "Publish listing"}
            </button>
          </form>
        </div>

        {/* My listings */}
        <div>
          <h2 className="text-xl">Your listings</h2>
          {listings.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-muted)]">
              Nothing published yet — your first listing will show up here.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--sand-border)] p-4"
                >
                  <div>
                    <p className="font-medium">{listing.title}</p>
                    <p className="tnum text-sm text-[var(--ink-muted)]">
                      {listing.currency} {listing.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        listing.active
                          ? "bg-[var(--leaf)]/10 text-[var(--leaf)]"
                          : "bg-black/5 text-[var(--ink-muted)]"
                      }`}
                    >
                      {listing.active ? "Live" : "Hidden"}
                    </span>
                    <button
                      onClick={() => setListingActive(listing.id, !listing.active)}
                      className="text-sm font-medium text-[var(--ink-muted)] underline underline-offset-2 hover:text-[var(--ink)]"
                    >
                      {listing.active ? "Hide" : "Republish"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}