"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import { convert, SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/fx";

export default function NewOrderPage() {
  const router = useRouter();

  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [counterpartyEmail, setCounterpartyEmail] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [sellerCurrency, setSellerCurrency] = useState<SupportedCurrency>("NGN");
  const [buyerCurrency, setBuyerCurrency] = useState<SupportedCurrency>("GHS");
  const [amountSellerCurrency, setAmountSellerCurrency] = useState("");
  const [amountBuyerCurrency, setAmountBuyerCurrency] = useState("");
  const [buyerAmountTouched, setBuyerAmountTouched] = useState(false);

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

  // Auto-fill the buyer amount from the seller amount + currencies, unless
  // the person has manually edited it.
  useEffect(() => {
    if (buyerAmountTouched) return;
    const sellerAmt = parseFloat(amountSellerCurrency);
    if (!sellerAmt || sellerAmt <= 0) {
      setAmountBuyerCurrency("");
      return;
    }
    const converted = convert(sellerAmt, sellerCurrency, buyerCurrency);
    setAmountBuyerCurrency(converted.toFixed(2));
  }, [amountSellerCurrency, sellerCurrency, buyerCurrency, buyerAmountTouched]);

  if (authUser === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] text-[var(--ink-muted)]">
        Loading…
      </main>
    );
  }
  if (!authUser) return null;

  const myRole = profile?.role;
  const otherRole = myRole === "buyer" ? "seller" : "buyer";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!authUser || !myRole) {
      setError("Your profile is still loading — try again in a moment.");
      return;
    }
    if (!counterpartyEmail.trim() || !itemDescription.trim() || !amountSellerCurrency || !amountBuyerCurrency) {
      setError("Fill in every field before creating the order.");
      return;
    }

    setSubmitting(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", counterpartyEmail.trim().toLowerCase()));
      const results = await getDocs(q);

      if (results.empty) {
        setError(
          `No ${otherRole} found with that email. They'll need a TradeBridge account first.`
        );
        setSubmitting(false);
        return;
      }

      const counterparty = results.docs[0].data() as UserProfile;

      if (counterparty.uid === authUser.uid) {
        setError("You can't create an order with yourself.");
        setSubmitting(false);
        return;
      }
      if (counterparty.role !== otherRole) {
        setError(`That account is registered as a ${counterparty.role}, not a ${otherRole}.`);
        setSubmitting(false);
        return;
      }

      const buyerId = myRole === "buyer" ? authUser.uid : counterparty.uid;
      const sellerId = myRole === "seller" ? authUser.uid : counterparty.uid;

      const sellerAmt = parseFloat(amountSellerCurrency);
      const buyerAmt = parseFloat(amountBuyerCurrency);

      const docRef = await addDoc(collection(db, "orders"), {
        buyerId,
        sellerId,
        itemDescription: itemDescription.trim(),
        sellerCurrency,
        buyerCurrency,
        amountSellerCurrency: sellerAmt,
        amountBuyerCurrency: buyerAmt,
        exchangeRate: buyerAmt / sellerAmt,
        status: "pending_payment",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push(`/dashboard`);
      void docRef;
    } catch (err) {
      setError("Couldn't create that order. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

      <div className="container-page max-w-lg py-14">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Create an order
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          {myRole
            ? `You're creating this as the ${myRole}. Enter the ${otherRole}'s email to bring them into the trade.`
            : "Loading your account…"}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <div>
            <label htmlFor="counterpartyEmail" className="text-sm font-medium">
              {otherRole === "seller" ? "Seller's" : "Buyer's"} email
            </label>
            <input
              id="counterpartyEmail"
              type="email"
              value={counterpartyEmail}
              onChange={(e) => setCounterpartyEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
              placeholder="them@example.com"
            />
          </div>

          <div>
            <label htmlFor="itemDescription" className="text-sm font-medium">
              What's being traded
            </label>
            <input
              id="itemDescription"
              type="text"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
              placeholder="40 yards of Ankara fabric"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sellerCurrency" className="text-sm font-medium">
                Seller's currency
              </label>
              <select
                id="sellerCurrency"
                value={sellerCurrency}
                onChange={(e) => setSellerCurrency(e.target.value as SupportedCurrency)}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="amountSellerCurrency" className="text-sm font-medium">
                Price (seller earns)
              </label>
              <input
                id="amountSellerCurrency"
                type="number"
                min="0"
                step="0.01"
                value={amountSellerCurrency}
                onChange={(e) => setAmountSellerCurrency(e.target.value)}
                className="tnum mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                placeholder="150000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="buyerCurrency" className="text-sm font-medium">
                Buyer's currency
              </label>
              <select
                id="buyerCurrency"
                value={buyerCurrency}
                onChange={(e) => setBuyerCurrency(e.target.value as SupportedCurrency)}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="amountBuyerCurrency" className="text-sm font-medium">
                Buyer pays
              </label>
              <input
                id="amountBuyerCurrency"
                type="number"
                min="0"
                step="0.01"
                value={amountBuyerCurrency}
                onChange={(e) => {
                  setAmountBuyerCurrency(e.target.value);
                  setBuyerAmountTouched(true);
                }}
                className="tnum mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                placeholder="Auto-filled from an estimated rate"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-[var(--ink-muted)]">
            This conversion is an estimate for now — confirm the amount before sending.
          </p>

          {error && (
            <p role="alert" className="text-sm text-[var(--clay)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !myRole}
            className="btn btn-primary w-full disabled:opacity-60"
          >
            {submitting ? "Creating order…" : "Create order"}
          </button>
        </form>
      </div>
    </main>
  );
}