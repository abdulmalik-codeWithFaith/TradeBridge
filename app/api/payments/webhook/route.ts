import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyTransaction } from "@/lib/flutterwave";
import type { Order } from "@/lib/types";

export async function POST(req: NextRequest) {
  // Flutterwave signs webhooks with a secret hash you set in your dashboard
  // (Settings -> Webhooks), sent back as the `verif-hash` header. This is
  // NOT the same as the secret API key.
  const signature = req.headers.get("verif-hash");
  if (!signature || signature !== process.env.FLW_WEBHOOK_HASH) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = await req.json();

  try {
    if (payload.event !== "charge.completed" || payload.data?.status !== "successful") {
      // Acknowledge and ignore events we don't act on (failed charges, etc.)
      return NextResponse.json({ received: true });
    }

    // Never trust the webhook body alone — re-fetch the transaction from
    // Flutterwave's servers to confirm it actually succeeded.
    const verified = await verifyTransaction(String(payload.data.id));
    const orderId = verified.meta?.orderId;

    if (verified.status !== "successful" || !orderId) {
      return NextResponse.json({ received: true });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) {
      console.error("Webhook: order not found", orderId);
      return NextResponse.json({ received: true });
    }

    const order = snap.data() as Order;

    // Idempotency: if this order is already past pending_payment (e.g. the
    // webhook fired twice), don't process it again.
    if (order.status !== "pending_payment") {
      return NextResponse.json({ received: true });
    }

    // Sanity-check the amount and currency match what the order expects.
    const amountMatches = Math.abs(verified.amount - order.amountBuyerCurrency) < 0.01;
    const currencyMatches = verified.currency === order.buyerCurrency;
    if (!amountMatches || !currencyMatches) {
      console.error("Webhook: amount/currency mismatch for order", orderId, verified);
      return NextResponse.json({ received: true });
    }

    await orderRef.update({
      status: "paid",
      paymentReference: String(payload.data.id),
      updatedAt: new Date(),
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("payments/webhook error", err);
    // Still return 200 so Flutterwave doesn't hammer retries on our bug;
    // the error is logged for investigation instead.
    return NextResponse.json({ received: true });
  }
}