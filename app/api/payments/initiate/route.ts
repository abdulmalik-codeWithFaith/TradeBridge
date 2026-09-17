import { NextRequest, NextResponse } from "next/server";
import { adminDb, requireUid } from "@/lib/firebaseAdmin";
import { initiatePayment } from "@/lib/flutterwave";
import type { Order } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const uid = await requireUid(req.headers.get("authorization"));
    const { orderId } = await req.json();

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = snap.data() as Order;

    if (order.buyerId !== uid) {
      return NextResponse.json({ error: "Only the buyer on this order can pay" }, { status: 403 });
    }
    if (order.status !== "pending_payment") {
      return NextResponse.json({ error: "This order isn't awaiting payment" }, { status: 409 });
    }

    const buyerSnap = await adminDb.collection("users").doc(uid).get();
    const buyer = buyerSnap.data();

    const origin = req.headers.get("origin") || new URL(req.url).origin;
    // tx_ref must be unique per attempt, not per order, in case a buyer retries.
    const txRef = `${orderId}-${Date.now()}`;

    const link = await initiatePayment({
      txRef,
      amount: order.amountBuyerCurrency,
      currency: order.buyerCurrency,
      redirectUrl: `${origin}/orders/${orderId}?payment=return`,
      customerEmail: buyer?.email || "buyer@tradebridge.app",
      customerName: buyer?.displayName || "TradeBridge buyer",
      orderId,
    });

    // Record the pending attempt so the webhook can cross-check tx_ref -> orderId.
    await orderRef.update({ lastPaymentTxRef: txRef });

    return NextResponse.json({ link });
  } catch (err) {
    console.error("payments/initiate error", err);
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }
}