import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb, requireUid } from "@/lib/firebaseAdmin";
import { submitBiometricKyc } from "@/lib/smileid";

export async function POST(req: NextRequest) {
  try {
    const uid = await requireUid(req.headers.get("authorization"));
    const { country, idType, idNumber, selfieBase64 } = await req.json();

    if (!country || !idType || !idNumber || !selfieBase64) {
      return NextResponse.json(
        { error: "country, idType, idNumber, and a selfie are all required" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const user = userSnap.data();

    if (!user || user.role !== "seller") {
      return NextResponse.json({ error: "Only seller accounts can verify" }, { status: 403 });
    }
    if (user.kycStatus === "pending") {
      return NextResponse.json({ error: "A verification is already in progress" }, { status: 409 });
    }

    const jobId = randomUUID();
    const origin = req.headers.get("origin") || new URL(req.url).origin;

    await submitBiometricKyc({
      jobId,
      userId: uid,
      country,
      idType,
      idNumber,
      selfieBase64,
      callbackUrl: `${origin}/api/kyc/webhook`,
    });

    await userRef.update({
      kycStatus: "pending",
      kycJobId: jobId,
      kycReason: null,
    });

    return NextResponse.json({ status: "pending" });
  } catch (err) {
    console.error("kyc/submit error", err);
    return NextResponse.json({ error: "Could not start verification" }, { status: 500 });
  }
}