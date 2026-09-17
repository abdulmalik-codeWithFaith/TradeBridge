"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Order, OrderStatus, UserProfile } from "@/lib/types";
import { subscribeToUserOrders, markShipped, markDelivered } from "@/lib/orders";
import { openDispute } from "@/lib/disputes";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid — awaiting shipment",
  shipped: "Shipped",
  delivered: "Delivered — awaiting confirmation",
  confirmed: "Confirmed",
  disputed: "In dispute",
  released: "Funds released",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<OrderStatus, string> = {
  pending_payment: "bg-[var(--sand)] text-[var(--ink)]",
  paid: "bg-[var(--marigold)]/20 text-[var(--marigold-dark)]",
  shipped: "bg-[var(--marigold)]/20 text-[var(--marigold-dark)]",
  delivered: "bg-[var(--marigold)]/20 text-[var(--marigold-dark)]",
  confirmed: "bg-[var(--leaf)]/15 text-[var(--leaf)]",
  released: "bg-[var(--leaf)]/15 text-[var(--leaf)]",
  disputed: "bg-[var(--clay)]/15 text-[var(--clay)]",
  cancelled: "bg-black/5 text-[var(--ink-muted)]",
};

export default function DashboardPage() {
  const router = useRouter();

  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [counterparties, setCounterparties] = useState<Record<string, UserProfile>>({});

  // Auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (!user) router.push("/login");
    });
    return unsub;
  }, [router]);

  // Load profile
  useEffect(() => {
    if (!authUser) return;
    getDoc(doc(db, "users", authUser.uid)).then((snap) => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
    });
  }, [authUser]);

  // Subscribe to orders
  useEffect(() => {
    if (!authUser) return;
    const unsub = subscribeToUserOrders(authUser.uid, setOrders);
    return unsub;
  }, [authUser]);

  // Lazily fetch counterparty profiles as new ones show up
  useEffect(() => {
    if (!authUser) return;
    const missing = new Set<string>();
    orders.forEach((o) => {
      const otherId = o.buyerId === authUser.uid ? o.sellerId : o.buyerId;
      if (otherId && !counterparties[otherId]) missing.add(otherId);
    });
    if (missing.size === 0) return;

    missing.forEach(async (uid) => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setCounterparties((prev) => ({ ...prev, [uid]: snap.data() as UserProfile }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, authUser]);

  if (authUser === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] text-[var(--ink-muted)]">
        Loading…
      </main>
    );
  }

  if (!authUser) return null; // redirecting to /login

  const active = orders.filter((o) => !["confirmed", "released", "cancelled"].includes(o.status));
  const completed = orders.filter((o) => ["confirmed", "released"].includes(o.status));
  const disputed = orders.filter((o) => o.status === "disputed");

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[var(--sand-border)]">
        <div className="container-page flex h-16 items-center justify-between">
          <a href="/" className="text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            TradeBridge
          </a>
          <button
            onClick={() => signOut(auth)}
            className="text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="container-page py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
              {profile?.displayName ? `Welcome back, ${profile.displayName.split(" ")[0]}` : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {profile
                ? `${profile.role === "buyer" ? "Buyer" : "Seller"} account · ${
                    profile.verified ? "Verified" : "Not yet verified"
                  }`
                : "Loading your profile…"}
            </p>
          </div>
          <a href="/orders/new" className="btn btn-primary text-sm">
            New order
          </a>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <StatCard label="Active" value={active.length} />
          <StatCard label="Completed" value={completed.length} />
          <StatCard label="In dispute" value={disputed.length} tone={disputed.length > 0 ? "clay" : undefined} />
        </div>

        {/* Orders */}
        <div className="mt-12">
          <h2 className="text-xl">Your orders</h2>

          {orders.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-[var(--sand-border)] p-10 text-center">
              <p className="text-[var(--ink-muted)]">
                No orders yet. Once you start or receive a trade, it'll show up here.
              </p>
              <a href="/orders/new" className="btn btn-primary mt-5 inline-flex text-sm">
                Create your first order
              </a>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  authUser={authUser}
                  counterparty={
                    counterparties[order.buyerId === authUser.uid ? order.sellerId : order.buyerId]
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
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

function OrderCard({
  order,
  authUser,
  counterparty,
}: {
  order: Order;
  authUser: User;
  counterparty?: UserProfile;
}) {
  const myUid = authUser.uid;
  const isBuyer = order.buyerId === myUid;
  const [panel, setPanel] = useState<"ship" | "deliver" | "dispute" | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setPanel(null);
      setProofUrl("");
      setNote("");
      setReason("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That action didn't go through. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function callPaymentApi(path: string) {
    const token = await authUser.getIdToken();
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId: order.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function handlePay() {
    const { link } = await callPaymentApi("/api/payments/initiate");
    window.location.href = link; // send the buyer to Flutterwave's checkout
  }

  async function handleConfirmAndRelease() {
    await callPaymentApi("/api/payments/release");
  }

  return (
    <div className="rounded-2xl border border-[var(--sand-border)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--ink-muted)]">
            Order #{order.id.slice(0, 6).toUpperCase()} · {isBuyer ? "You're buying" : "You're selling"}
          </p>
          <p className="mt-1 font-medium">{order.itemDescription}</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {counterparty?.displayName ? `With ${counterparty.displayName}` : "Loading counterparty…"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[order.status]}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="ticket-divider my-4" />

      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <span className="text-[var(--ink-muted)]">Seller earns </span>
          <span className="tnum font-medium">
            {order.sellerCurrency} {order.amountSellerCurrency.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[var(--ink-muted)]">Buyer pays </span>
          <span className="tnum font-medium">
            {order.buyerCurrency} {order.amountBuyerCurrency.toLocaleString()}
          </span>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-[var(--clay)]">{error}</p>}

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-3">
        {isBuyer && order.status === "pending_payment" && (
          <button
            disabled={busy}
            onClick={() => run(handlePay)}
            className="btn btn-primary text-sm disabled:opacity-60"
          >
            {busy ? "Redirecting to payment…" : "Pay now"}
          </button>
        )}

        {!isBuyer && order.status === "paid" && panel !== "ship" && (
          <button onClick={() => setPanel("ship")} className="btn btn-primary text-sm">
            Add shipping proof
          </button>
        )}

        {isBuyer && order.status === "shipped" && panel !== "deliver" && (
          <button onClick={() => setPanel("deliver")} className="btn btn-primary text-sm">
            Mark as delivered
          </button>
        )}

        {isBuyer && order.status === "delivered" && (
          <button
            disabled={busy}
            onClick={() => run(handleConfirmAndRelease)}
            className="btn btn-primary text-sm disabled:opacity-60"
          >
            {busy ? "Confirming…" : "Confirm & release"}
          </button>
        )}

        {["paid", "shipped", "delivered"].includes(order.status) && panel !== "dispute" && (
          <button onClick={() => setPanel("dispute")} className="btn btn-outline border-[var(--clay)] !text-[var(--clay)] text-sm">
            Open a dispute
          </button>
        )}
      </div>

      {/* Shipping proof form */}
      {panel === "ship" && (
        <div className="mt-4 space-y-3 rounded-xl bg-[var(--sand)] p-4">
          <input
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="Link to shipping receipt or tracking page"
            className="w-full rounded-lg border border-[var(--sand-border)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional) — courier, tracking number…"
            className="w-full rounded-lg border border-[var(--sand-border)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]"
          />
          <div className="flex gap-2">
            <button
              disabled={busy || !proofUrl.trim()}
              onClick={() => run(() => markShipped(order.id, proofUrl.trim(), note.trim()))}
              className="btn btn-primary text-sm disabled:opacity-60"
            >
              Submit
            </button>
            <button onClick={() => setPanel(null)} className="text-sm text-[var(--ink-muted)]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delivery proof form */}
      {panel === "deliver" && (
        <div className="mt-4 space-y-3 rounded-xl bg-[var(--sand)] p-4">
          <input
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="Link to a delivery photo or confirmation"
            className="w-full rounded-lg border border-[var(--sand-border)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full rounded-lg border border-[var(--sand-border)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]"
          />
          <div className="flex gap-2">
            <button
              disabled={busy || !proofUrl.trim()}
              onClick={() => run(() => markDelivered(order.id, proofUrl.trim(), note.trim()))}
              className="btn btn-primary text-sm disabled:opacity-60"
            >
              Submit
            </button>
            <button onClick={() => setPanel(null)} className="text-sm text-[var(--ink-muted)]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dispute form */}
      {panel === "dispute" && (
        <div className="mt-4 space-y-3 rounded-xl bg-[var(--clay)]/5 p-4">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (e.g. item not as described, not received)"
            className="w-full rounded-lg border border-[var(--sand-border)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened?"
            rows={3}
            className="w-full rounded-lg border border-[var(--sand-border)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]"
          />
          <div className="flex gap-2">
            <button
              disabled={busy || !reason.trim() || !description.trim()}
              onClick={() =>
                run(() =>
                  openDispute({
                    orderId: order.id,
                    openedBy: myUid,
                    reason: reason.trim(),
                    description: description.trim(),
                  })
                )
              }
              className="btn text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--clay)" }}
            >
              Open dispute
            </button>
            <button onClick={() => setPanel(null)} className="text-sm text-[var(--ink-muted)]">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}