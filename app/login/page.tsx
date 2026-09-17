"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<"email" | "google" | null>(null);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResetMessage(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading("email");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setResetMessage(null);
    setLoading("google");
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(null);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setResetMessage(null);

    if (!email.trim()) {
      setError("Enter your email above first, then click \u201CForgot password\u201D.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage("Check your inbox for a link to reset your password.");
    } catch (err) {
      setError(friendlyAuthError(err));
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
            "Buyers outside Kenya used to disappear after I shipped. Now the
            payment is already held before I send anything."
          </p>
          <p className="mt-5 text-sm text-[var(--paper-muted)]">
            Brian K., seller in Nairobi
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
            Log in
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            New to TradeBridge?{" "}
            <a href="/get-started" className="font-medium text-[var(--ink)] underline underline-offset-2">
              Create an account
            </a>
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading !== null}
            className="btn btn-ink mt-8 w-full disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-[var(--ink-muted)]">
            <span className="h-px flex-1 bg-[var(--sand-border)]" />
            or log in with email
            <span className="h-px flex-1 bg-[var(--sand-border)]" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-[var(--ink-muted)] underline underline-offset-2 hover:text-[var(--ink)]"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--sand-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                placeholder="Your password"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-[var(--clay)]">
                {error}
              </p>
            )}

            {resetMessage && (
              <p role="status" className="text-sm text-[var(--leaf)]">
                {resetMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading !== null}
              className="btn btn-primary w-full disabled:opacity-60"
            >
              {loading === "email" ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";
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