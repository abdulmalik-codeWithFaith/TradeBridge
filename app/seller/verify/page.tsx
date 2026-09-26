"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
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

const ID_TYPES = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver's license" },
  { value: "VOTER_ID", label: "Voter's card" },
];

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  none: { label: "Not started", tone: "text-[var(--ink-muted)]" },
  pending: { label: "Verification in progress — usually a few minutes", tone: "text-[var(--marigold-dark)]" },
  verified: { label: "Verified", tone: "text-[var(--leaf)]" },
  rejected: { label: "Verification failed", tone: "text-[var(--clay)]" },
  needs_review: { label: "Under manual review", tone: "text-[var(--marigold-dark)]" },
};

export default function SellerVerifyPage() {
  const router = useRouter();

  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [country, setCountry] = useState("NG");
  const [idType, setIdType] = useState("NATIONAL_ID");
  const [idNumber, setIdNumber] = useState("");
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (!user) router.push("/login");
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    if (!authUser) return;
    return onSnapshot(doc(db, "users", authUser.uid), (snap) => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
    });
  }, [authUser]);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the "data:image/jpeg;base64," prefix — Smile ID wants raw base64.
        resolve(result.split(",")[1] ?? result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!authUser) return;
    if (!idNumber.trim() || !selfieFile) {
      setError("Enter your ID number and add a selfie.");
      return;
    }

    setSubmitting(true);
    try {
      const selfieBase64 = await fileToBase64(selfieFile);
      const token = await authUser.getIdToken();

      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ country, idType, idNumber: idNumber.trim(), selfieBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification could not be started");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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

  const status = profile?.kycStatus ?? "none";
  const statusInfo = STATUS_COPY[status] ?? STATUS_COPY.none;
  const canSubmit = status !== "pending";

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
          Get verified
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Verified sellers show a badge on their listings and build trust with buyers faster.
        </p>

        <div className="mt-6 rounded-xl bg-[var(--sand)] p-4 text-sm">
          <p className="font-medium">Status</p>
          <p className={`mt-1 ${statusInfo.tone}`}>{statusInfo.label}</p>
          {profile?.kycReason && status !== "verified" && (
            <p className="mt-1 text-xs text-[var(--ink-muted)]">{profile.kycReason}</p>
          )}
        </div>

        {status === "verified" ? (
          <p className="mt-8 text-sm text-[var(--ink-muted)]">
            You're all set — no further action needed.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="text-sm font-medium">Country</label>
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
                <label htmlFor="idType" className="text-sm font-medium">ID type</label>
                <select
                  id="idType"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                >
                  {ID_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="idNumber" className="text-sm font-medium">ID number</label>
              <input
                id="idNumber"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                placeholder="As it appears on your ID"
              />
            </div>

            <div>
              <label htmlFor="selfie" className="text-sm font-medium">Selfie</label>
              <input
                id="selfie"
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
                className="mt-1.5 w-full text-sm"
              />
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                On a phone, this opens your front camera. On desktop, upload a clear photo of your face.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-[var(--clay)]">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="btn btn-primary w-full disabled:opacity-60"
            >
              {submitting ? "Submitting…" : status === "rejected" || status === "needs_review" ? "Try again" : "Submit for verification"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}