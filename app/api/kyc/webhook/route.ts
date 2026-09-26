import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyIncomingSignature } from "@/lib/smileid";

// ⚠️ The exact shape of this payload (field names, Actions values, result
// codes) should be confirmed against a real callback from your Smile ID
// sandbox before relying on this in production — see the caveat in
// lib/smileid.ts. The logic below is deliberately conservative: anything
// that doesn't clearly read as a pass or a clear fail is routed to
// "needs_review" rather than guessed at, so a human looks at the raw
// result rather than an ambiguous case silently verifying someone.

interface SmileIdCallback {
  signature: string;
  timestamp: string;
  PartnerParams?: { job_id?: string; user_id?: string };
  ResultCode?: string;
  ResultText?: string;
  ConfidenceValue?: string | number;
  Actions?: Record<string, string>;
}

function classify(actions: Record<string, string> | undefined): "verified" | "rejected" | "needs_review" {
  if (!actions) return "needs_review";

  const values = Object.values(actions).map((v) => v.toLowerCase());
  const anyClearFail = values.some((v) => v.includes("not verified") || v.includes("fraud") || v.includes("rejected"));
  if (anyClearFail) return "rejected";

  const relevant = ["verify_id_number", "selfie_check", "selfie_provided"]
    .map((key) => actions[key] || actions[key.toUpperCase()])
    .filter(Boolean);

  const allPass = relevant.length > 0 && relevant.every((v) => v.toLowerCase().includes("verified") || v.toLowerCase().includes("approved"));

  return allPass ? "verified" : "needs_review";
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as SmileIdCallback;

    if (!payload.timestamp || !payload.signature || !verifyIncomingSignature(payload.timestamp, payload.signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const uid = payload.PartnerParams?.user_id;
    const jobId = payload.PartnerParams?.job_id;
    if (!uid) {
      console.error("kyc/webhook: missing user_id in callback", payload);
      return NextResponse.json({ received: true });
    }

    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      console.error("kyc/webhook: no user found for", uid);
      return NextResponse.json({ received: true });
    }

    // Idempotency: only act if this callback matches the job we're
    // currently waiting on for this user.
    const user = userSnap.data();
    if (jobId && user?.kycJobId && user.kycJobId !== jobId) {
      return NextResponse.json({ received: true });
    }

    const outcome = classify(payload.Actions);

    await userRef.update({
      kycStatus: outcome,
      verified: outcome === "verified",
      kycReason: outcome === "verified" ? null : payload.ResultText || "Needs manual review",
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("kyc/webhook error", err);
    return NextResponse.json({ received: true });
  }
}