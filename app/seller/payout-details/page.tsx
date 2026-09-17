"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

const COUNTRIES = [
  { code: "NG", label: "Nigeria" },
  { code: "GH", label: "Ghana" },
  { code: "KE", label: "Kenya" },
  { code: "ZA", label: "South Africa" },
  { code: "UG", label: "Uganda" },
  { code: "TZ", label: "Tanzania" },
  { code: "RW", label: "Rwanda" },
];

interface Bank {
  id: number;
  code: string;
  name: string;
}

interface PayoutDetails {
  country: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export default function PayoutDetailsPage() {
  const router = useRouter();

  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [existingPayout, setExistingPayout] = useState<PayoutDetails | null>(null);

  const [country, setCountry] = useState("NG");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);

  const [loadingBanks, setLoadingBanks] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
      if (snap.exists()) {
        const data = snap.data() as UserProfile & { payout?: PayoutDetails };
        setProfile(data);
        if (data.payout) setExistingPayout(data.payout);
      }
    });
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    setLoadingBanks(true);
    setBankCode("");
    setResolvedName(null);
    authUser.getIdToken().then(async (token) => {
      try {
        const res = await fetch(`/api/flutterwave/banks?country=${country}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setBanks(res.ok ? data.banks : []);
      } finally {
        setLoadingBanks(false);
      }
    });
  }, [authUser, country]);

  async function handleVerify() {
    if (!authUser || !bankCode || !accountNumber) return;
    setVerifying(true);
    setError(null);
    setResolvedName(null);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch("/api/flutterwave/resolve-account", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accountNumber, accountBank: bankCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResolvedName(data.accountName);
    } catch {
      setError("Couldn't verify that account. Double-check the number and bank.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSave() {
    if (!authUser || !resolvedName) return;
    setSaving(true);
    setError(null);
    try {
      const bank = banks.find((b) => b.code === bankCode);
      await updateDoc(doc(db, "users", authUser.uid), {
        payout: {
          country,
          bankCode,
          bankName: bank?.name ?? "",
          accountNumber,
          accountName: resolvedName,
        },
      });
      setSaved(true);
    } catch {
      setError("Couldn't save your payout details. Please try again.");
    } finally {
      setSaving(false);
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

      <div className="container-page max-w-md py-14">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Payout details
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          This is the bank account TradeBridge pays out to once a buyer confirms an order.
        </p>

        {existingPayout && !saved && (
          <div className="mt-6 rounded-xl bg-[var(--sand)] p-4 text-sm">
            <p className="font-medium">Currently on file</p>
            <p className="mt-1 text-[var(--ink-muted)]">
              {existingPayout.accountName} · {existingPayout.bankName} ·{" "}
              {maskAccount(existingPayout.accountNumber)}
            </p>
          </div>
        )}

        {saved ? (
          <div className="mt-8 rounded-xl bg-[var(--leaf)]/10 p-5 text-sm text-[var(--leaf)]">
            Payout details saved. Future confirmed orders will pay out here.
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            <div>
              <label htmlFor="country" className="text-sm font-medium">
                Country
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="bank" className="text-sm font-medium">
                Bank
              </label>
              <select
                id="bank"
                value={bankCode}
                onChange={(e) => {
                  setBankCode(e.target.value);
                  setResolvedName(null);
                }}
                disabled={loadingBanks}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)] disabled:opacity-60"
              >
                <option value="">{loadingBanks ? "Loading banks…" : "Select a bank"}</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="accountNumber" className="text-sm font-medium">
                Account number
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    setResolvedName(null);
                  }}
                  className="w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                  placeholder="0123456789"
                />
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying || !bankCode || !accountNumber}
                  className="btn btn-ink shrink-0 text-sm disabled:opacity-60"
                >
                  {verifying ? "Checking…" : "Verify"}
                </button>
              </div>
            </div>

            {resolvedName && (
              <div className="rounded-xl bg-[var(--leaf)]/10 p-4 text-sm text-[var(--leaf)]">
                Account holder: <span className="font-semibold">{resolvedName}</span>
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-[var(--clay)]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={!resolvedName || saving}
              className="btn btn-primary w-full disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save payout details"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function maskAccount(accountNumber: string) {
  if (accountNumber.length <= 4) return accountNumber;
  return `••••${accountNumber.slice(-4)}`;
}