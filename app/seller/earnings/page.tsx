"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Order, UserProfile } from "@/lib/types";
import { subscribeToUserOrders } from "@/lib/orders";

const RELEASED_STATUSES = new Set(["confirmed", "released"]);
const PENDING_STATUSES = new Set(["paid", "shipped", "delivered"]);

export default function SellerEarningsPage() {
  const router = useRouter();

  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

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
    const unsub = subscribeToUserOrders(authUser.uid, setOrders);
    return unsub;
  }, [authUser]);

  // Only orders where this account is the seller count toward earnings/reputation.
  const sellerOrders = useMemo(
    () => (authUser ? orders.filter((o) => o.sellerId === authUser.uid) : []),
    [orders, authUser]
  );

  const earnedByCurrency = useMemo(() => sumByCurrency(sellerOrders, RELEASED_STATUSES), [sellerOrders]);
  const pendingByCurrency = useMemo(() => sumByCurrency(sellerOrders, PENDING_STATUSES), [sellerOrders]);

  const completedCount = sellerOrders.filter((o) => RELEASED_STATUSES.has(o.status)).length;
  const disputedCount = sellerOrders.filter((o) => o.status === "disputed").length;
  const totalDecided = completedCount + disputedCount; // excludes still-in-progress orders
  const disputeRate = totalDecided > 0 ? Math.round((disputedCount / totalDecided) * 100) : null;

  const recentCompleted = sellerOrders
    .filter((o) => RELEASED_STATUSES.has(o.status))
    .slice(0, 6);

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
        <p className="text-sm text-[var(--ink-muted)]">
          Your account is registered as a buyer, so there's nothing to show here yet.
        </p>
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

      <div className="container-page py-12">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Earnings & reputation
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {profile?.verified ? "Verified seller" : "Not yet verified"} ·{" "}
          {completedCount} completed order{completedCount === 1 ? "" : "s"}
        </p>

        {/* Earnings */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--sand-border)] bg-[var(--sand)] p-6">
            <p className="text-sm text-[var(--ink-muted)]">Total earned</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">Released once buyers confirm delivery</p>
            <div className="mt-4 space-y-1">
              {currencyRows(earnedByCurrency, "No earnings released yet")}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--sand-border)] p-6">
            <p className="text-sm text-[var(--ink-muted)]">Pending</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">Held in protection until the order is confirmed</p>
            <div className="mt-4 space-y-1">
              {currencyRows(pendingByCurrency, "Nothing in progress right now")}
            </div>
          </div>
        </div>

        {/* Reputation */}
        <div className="mt-10">
          <h2 className="text-xl">Reputation</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Completed orders" value={completedCount} />
            <StatCard label="Disputes" value={disputedCount} tone={disputedCount > 0 ? "clay" : undefined} />
            <StatCard
              label="Dispute rate"
              value={disputeRate === null ? "—" : `${disputeRate}%`}
              tone={disputeRate !== null && disputeRate > 0 ? "clay" : undefined}
            />
          </div>
          <p className="mt-3 text-xs text-[var(--ink-muted)]">
            Dispute rate is calculated only from decided orders (completed or disputed) —
            orders still in progress aren't counted either way yet.
          </p>
        </div>

        {/* Track record */}
        <div className="mt-10">
          <h2 className="text-xl">Track record</h2>
          {recentCompleted.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-muted)]">
              Completed orders will show up here as buyers confirm delivery.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentCompleted.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--sand-border)] px-5 py-3"
                >
                  <span className="text-sm font-medium">{order.itemDescription}</span>
                  <span className="tnum text-sm text-[var(--ink-muted)]">
                    {order.sellerCurrency} {order.amountSellerCurrency.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function sumByCurrency(orders: Order[], statuses: Set<string>): Record<string, number> {
  const totals: Record<string, number> = {};
  orders
    .filter((o) => statuses.has(o.status))
    .forEach((o) => {
      totals[o.sellerCurrency] = (totals[o.sellerCurrency] ?? 0) + o.amountSellerCurrency;
    });
  return totals;
}

function currencyRows(totals: Record<string, number>, emptyLabel: string) {
  const entries = Object.entries(totals);
  if (entries.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">{emptyLabel}</p>;
  }
  return entries.map(([currency, amount]) => (
    <p key={currency} className="tnum text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
      {currency} {amount.toLocaleString()}
    </p>
  ));
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "clay";
}) {
  return (
    <div className="rounded-2xl border border-[var(--sand-border)] bg-[var(--sand)] p-5">
      <p className="text-sm text-[var(--ink-muted)]">{label}</p>
      <p
        className={`tnum mt-1 text-2xl ${tone === "clay" ? "text-[var(--clay)]" : ""}`}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </p>
    </div>
  );
}