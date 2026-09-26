"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Listing } from "@/lib/types";
import { subscribeToActiveListings } from "@/lib/listings";

export default function DiscoverPage() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => onAuthStateChanged(auth, setAuthUser), []);
  useEffect(() => subscribeToActiveListings(setListings), []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return listings;
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(term) ||
        l.description.toLowerCase().includes(term) ||
        l.sellerName.toLowerCase().includes(term)
    );
  }, [listings, search]);

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[var(--sand-border)]">
        <div className="container-page flex h-16 items-center justify-between">
          <a href="/" className="text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            TradeBridge
          </a>
          <a
            href={authUser ? "/dashboard" : "/login"}
            className="text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            {authUser ? "Dashboard" : "Log in"}
          </a>
        </div>
      </header>

      <div className="container-page py-12">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Find a verified seller
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--ink-muted)]">
          Browse what's for sale across TradeBridge sellers. Prices convert to
          your own currency once you start an order.
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by item or seller"
          className="mt-6 w-full max-w-md rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
        />

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-[var(--sand-border)] p-10 text-center text-[var(--ink-muted)]">
            {listings.length === 0
              ? "No listings yet — check back soon."
              : "Nothing matches that search."}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <a
                key={listing.id}
                href={`/orders/new?listingId=${listing.id}`}
                className="group rounded-2xl border border-[var(--sand-border)] p-5 transition-colors hover:border-[var(--ink)]"
              >
                {listing.imageUrl && (
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="mb-4 h-40 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                )}
                <p className="font-semibold">{listing.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-muted)]">
                  {listing.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="tnum text-lg" style={{ fontFamily: "var(--font-heading)" }}>
                    {listing.currency} {listing.price.toLocaleString()}
                  </span>
                  {listing.sellerVerified && (
                    <span className="rounded-full bg-[var(--leaf)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--leaf)]">
                      Verified
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-[var(--ink-muted)]">Sold by {listing.sellerName}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}