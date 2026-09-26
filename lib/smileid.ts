// Server-only. Holds the Smile ID API key — never import from a "use client"
// component.
//
// ⚠️ Verify before production: Smile ID's exact v3 request/response field
// names (job_type constants, image_type_id values, the shape of the
// callback payload) should be confirmed against a real sandbox call in
// your Smile ID portal before trusting this in production. The signature
// generation below is taken directly from Smile ID's documented examples
// and is solid; the request/response body shapes are Smile ID's documented
// v3 conventions but the API has changed shape before (see their own
// changelog), so a live sandbox test is worth doing before launch.

import crypto from "crypto";

const SANDBOX = process.env.SMILE_ID_ENV !== "production";
const BASE_URL = SANDBOX ? "https://testapi.smileidentity.com/v3" : "https://api.smileidentity.com/v3";

function partnerId(): string {
  const id = process.env.SMILE_PARTNER_ID;
  if (!id) throw new Error("SMILE_PARTNER_ID is not set");
  return id;
}

function apiKey(): string {
  const key = process.env.SMILE_API_KEY;
  if (!key) throw new Error("SMILE_API_KEY is not set");
  return key;
}

/** Smile ID's documented HMAC-SHA256 signature scheme. */
export function generateSignature(timestamp = new Date().toISOString()) {
  const hmac = crypto.createHmac("sha256", apiKey());
  hmac.update(timestamp, "utf8");
  hmac.update(partnerId(), "utf8");
  hmac.update("sid_request", "utf8");
  const signature = hmac.digest("base64");
  return { signature, timestamp };
}

/** Recomputes a signature and compares it to one received in a callback. */
export function verifyIncomingSignature(timestamp: string, receivedSignature: string): boolean {
  const { signature } = generateSignature(timestamp);
  // Constant-time compare to avoid timing side-channels on the comparison.
  const a = Buffer.from(signature);
  const b = Buffer.from(receivedSignature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function getAuthToken(): Promise<string> {
  const { signature, timestamp } = generateSignature();
  const res = await fetch(`${BASE_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partner_id: partnerId(),
      signature,
      timestamp,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Could not get a Smile ID auth token");
  return body.token as string;
}

export interface BiometricKycParams {
  jobId: string;
  userId: string;
  country: string; // e.g. "NG", "GH", "KE"
  idType: string; // e.g. "NATIONAL_ID", "PASSPORT", "DRIVERS_LICENSE"
  idNumber: string;
  selfieBase64: string; // no data: prefix, raw base64 image bytes
  callbackUrl: string;
}

/**
 * Submits a combined selfie + ID-authority lookup job. Smile ID processes
 * this asynchronously and posts the result to `callbackUrl` — this call
 * only confirms the job was accepted, not that verification passed.
 */
export async function submitBiometricKyc(params: BiometricKycParams) {
  const token = await getAuthToken();
  const { signature, timestamp } = generateSignature();

  const res = await fetch(`${BASE_URL}/biometric_kyc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "SmileID-Token": token,
    },
    body: JSON.stringify({
      source_sdk: "rest_api",
      partner_id: partnerId(),
      signature,
      timestamp,
      callback_url: params.callbackUrl,
      partner_params: {
        job_id: params.jobId,
        user_id: params.userId,
        job_type: 1, // Biometric KYC job type, per Smile ID's job type table
      },
      id_info: {
        country: params.country,
        id_type: params.idType,
        id_number: params.idNumber,
      },
      // image_type_id 2 = selfie image, base64-encoded, per Smile ID's
      // documented image type conventions.
      images: [{ image_type_id: 2, image: params.selfieBase64 }],
    }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Smile ID rejected the KYC submission");
  return body as { job_id: string; job_complete?: boolean };
}