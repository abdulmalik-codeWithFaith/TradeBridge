"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { createUserProfile, type UserRole } from "@/lib/users";

const roles: { value: UserRole; title: string; body: string }[] = [
  {
    value: "buyer",
    title: "I'm here to buy",
    body: "Find verified sellers, pay in your own currency, and track your orders.",
  },
  {
    value: "seller",
    title: "I'm here to sell",
    body: "Reach buyers across borders and get paid once an order is confirmed.",
  },
];

export default function SignupPage() {
  const router = useRouter();

  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRoleError, setShowRoleError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"email" | "google" | null>(null);

  function validate(): string | null {
    if (!role) return "Choose whether you're buying or selling to continue.";
    if (!name.trim()) return "Enter your name.";
    if (!email.trim()) return "Enter your email.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords don't match.";
    return null;
  }

  async function handleEmailSignup(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!role) {
      setShowRoleError(true);
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading("email");
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name.trim() });
      await createUserProfile(credential.user, role);
      router.push("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogleSignup() {
    setError(null);

    if (!role) {
      setShowRoleError(true);
      return;
    }

    setLoading("google");
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await createUserProfile(credential.user, role);
      router.push("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="grid min-h-screen bg-[var(--paper)] text-[var(--ink)] lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between bg-[var(--ink)] p-12 text-[var(--paper)] lg:flex">
        <a href="/" className="text-lg" style={{ fontFamily: "var(--font-heading)" }}>
          TradeBridge
        </a>

        <div className="max-w-sm">
          <p className="text-2xl leading-snug" style={{ fontFamily: "var(--font-heading)" }}>
            "I used to ask cousins to carry cash across the border for me. Now I
            just send the payment and watch the order move."
          </p>
          <p className="mt-5 text-sm text-[var(--paper-muted)]">
            Adaeze O., buyer in Accra
          </p>
        </div>

        <p className="text-xs text-[var(--paper-muted)]">
          © {new Date().getFullYear()} TradeBridge. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-sm">
          <a
            href="/"
            className="mb-8 inline-block text-lg lg:hidden"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            TradeBridge
          </a>

          <h1 className="text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Already have one?{" "}
            <a href="/login" className="font-medium text-[var(--ink)] underline underline-offset-2">
              Log in
            </a>
          </p>

          {/* Role selection — required, no default */}
          <fieldset className="mt-8">
            <legend className="text-sm font-medium">
              How will you use TradeBridge?
            </legend>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {roles.map((r) => {
                const selected = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      setRole(r.value);
                      setShowRoleError(false);
                    }}
                    aria-pressed={selected}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      selected
                        ? "border-[var(--ink)] bg-[var(--sand)]"
                        : "border-[var(--sand-border)] hover:border-[var(--ink)]/40"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{r.title}</span>
                    <span className="mt-1 block text-xs text-[var(--ink-muted)]">
                      {r.body}
                    </span>
                  </button>
                );
              })}
            </div>
            {showRoleError && (
              <p className="mt-2 text-sm text-[var(--clay)]">
                Choose buyer or seller to continue.
              </p>
            )}
          </fieldset>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading !== null}
            className="btn btn-ink mt-6 w-full disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-[var(--ink-muted)]">
            <span className="h-px flex-1 bg-[var(--sand-border)]" />
            or sign up with email
            <span className="h-px flex-1 bg-[var(--sand-border)]" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailSignup} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                placeholder="Amara Bello"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                placeholder="Re-enter your password"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-[var(--clay)]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading !== null}
              className="btn btn-primary w-full disabled:opacity-60"
            >
              {loading === "email" ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-xs text-[var(--ink-muted)]">
            By creating an account, you agree to TradeBridge's Terms of Service
            and Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  );
}

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 8 characters).";
    case "auth/popup-closed-by-user":
      return "Google sign-up was cancelled.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}