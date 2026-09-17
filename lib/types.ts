import type { Timestamp } from "firebase/firestore";

export type UserRole = "buyer" | "seller";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  verified: boolean;
  createdAt: Timestamp;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "shipped"
  | "delivered"
  | "confirmed"
  | "disputed"
  | "released"
  | "cancelled";

export interface OrderProof {
  url: string;
  note?: string;
  uploadedAt: Timestamp;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;

  itemDescription: string;

  sellerCurrency: string; // e.g. "NGN"
  buyerCurrency: string; // e.g. "GHS"
  amountSellerCurrency: number; // what the seller set/earns, in sellerCurrency
  amountBuyerCurrency: number; // what the buyer pays, in buyerCurrency
  exchangeRate: number; // amountBuyerCurrency / amountSellerCurrency, snapshotted at creation

  status: OrderStatus;

  shippingProof?: OrderProof;
  deliveryProof?: OrderProof;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved_buyer"
  | "resolved_seller"
  | "closed";

export interface Dispute {
  id: string;
  orderId: string;
  openedBy: string; // uid of buyer or seller
  reason: string;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}