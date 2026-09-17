import { NextRequest, NextResponse } from "next/server";
import { adminDb, requireUid } from "@/lib/firebaseAdmin";
import { initiateTransfer } from "@/lib/flutterwave";
import type { Order, UserProfile } from "@/lib/types";

interface PayoutDetails {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

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
      return NextResponse.json({ error: "Only the buyer on this order can confirm it" }, { status: 403 });
    }
    if (order.status !== "delivered") {
      return NextResponse.json({ error: "This order isn't ready to be confirmed yet" }, { status: 409 });
    }

    const sellerSnap = await adminDb.collection("users").doc(order.sellerId).get();
    const seller = sellerSnap.data() as (UserProfile & { payout?: PayoutDetails }) | undefined;
    const payout = seller?.payout;

    if (!payout?.accountNumber || !payout?.bankCode) {
      return NextResponse.json(
        { error: "The seller hasn't added payout details yet. Try again once they have." },
        { status: 409 }
      );
    }

    // Mark confirmed first, independent of whether the transfer succeeds —
    // the buyer has done their part regardless of a payout hiccup on our side.
    await orderRef.update({ status: "confirmed", updatedAt: new Date() });

    const reference = `release-${orderId}-${Date.now()}`;

    try {
      const transfer = await initiateTransfer({
        accountBank: payout.bankCode,
        accountNumber: payout.accountNumber,
        amount: order.amountSellerCurrency,
        currency: order.sellerCurrency,
        narration: `TradeBridge order ${orderId}`,
        reference,
      });

      await orderRef.update({
        status: "released",
        transferReference: reference,
        transferId: transfer.id,
        updatedAt: new Date(),
      });

      return NextResponse.json({ status: "released" });
    } catch (transferErr) {
      // Payout failed after confirmation — leave the order as `confirmed`
      // (not `released`) and log it. This needs a retry path (manual or a
      // scheduled job) rather than silently losing track of the failure.
      console.error("payments/release transfer failed for order", orderId, transferErr);
      await orderRef.update({
        lastReleaseError: transferErr instanceof Error ? transferErr.message : "Transfer failed",
        updatedAt: new Date(),
      });
      return NextResponse.json(
        { error: "Order confirmed, but the payout to the seller failed. Support has been notified." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("payments/release error", err);
    return NextResponse.json({ error: "Could not confirm this order" }, { status: 500 });
  }
}