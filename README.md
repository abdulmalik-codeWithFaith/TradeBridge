# TradeBridge

TradeBridge is an Africa-focused cross-border commerce platform that combines
seller verification, local-currency payment, delivery protection, and dispute
resolution into a single transaction — so buying and selling across African
borders doesn't require trusting a stranger on faith.

> A buyer in Ghana wants ₦150,000 worth of goods from a seller in Nigeria.
> TradeBridge lets the buyer pay in cedis while the seller sees their earnings
> in naira. The payment is held until the buyer confirms delivery, and either
> side can open a dispute if something goes wrong.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Firebase Auth** (email/password + Google)
- **Firestore** (data + security rules)
- **Firebase Admin SDK** (server-only, for trust-sensitive writes)
- **Flutterwave** (payment collection + payout transfers)

## Getting started

```bash
npm install
npm install firebase firebase-admin
cp .env.local.example .env.local   # then fill in the values below
npm run dev
```

### Environment variables

See `.env.local.example` for the full list. In short:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project settings → Your apps → SDK setup |
| `FLW_SECRET_KEY` | Flutterwave Dashboard → Settings → API Keys |
| `FLW_WEBHOOK_HASH` | A secret string you choose, set in Flutterwave Dashboard → Settings → Webhooks |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Firebase Console → Project settings → Service accounts → Generate new private key |

**Restart `npm run dev` after editing `.env.local`** — Next.js only reads env
files at server startup, not on hot reload.

### Firebase setup checklist

- Enable **Email/Password** and **Google** under Authentication → Sign-in method
- Deploy `firestore.rules`: `firebase deploy --only firestore:rules` (or paste
  it into Console → Firestore Database → Rules)
- Register `https://yourdomain.com/api/payments/webhook` as a webhook URL in
  your Flutterwave dashboard, using the same secret hash as `FLW_WEBHOOK_HASH`

## Project structure

```
app/
  page.tsx                    Landing page
  layout.tsx, globals.css     Root layout, fonts, design tokens

  signup/page.tsx             Email/password + Google signup, required role selection
  login/page.tsx              Email/password + Google login, password reset

  dashboard/page.tsx          Order list, role-aware actions (ship, deliver, confirm, dispute)
  orders/new/page.tsx         Create an order (buyer or seller initiated)

  seller/
    earnings/page.tsx         Earnings by currency, reputation stats, track record
    payout-details/page.tsx   Bank account for payouts, verified via Flutterwave

  api/
    payments/
      initiate/route.ts       Starts a Flutterwave checkout session
      webhook/route.ts        Confirms payment, flips order to "paid"
      release/route.ts        Confirms delivery, pays the seller out
    flutterwave/
      resolve-account/route.ts  Verifies a bank account number -> holder name
      banks/route.ts            Lists banks for a country

lib/
  firebase.ts                 Client Firebase init (Auth, Firestore)
  firebaseAdmin.ts            Server-only Admin SDK init
  flutterwave.ts              Server-only Flutterwave API client
  types.ts                    Shared TypeScript types (User, Order, Dispute)
  users.ts                    Create user profile on signup
  orders.ts                   Subscribe to / update orders
  disputes.ts                 Open a dispute
  fx.ts                       ⚠️ Placeholder static currency conversion

firestore.rules               Security rules — see "Data model" below
```

## Data model

**`users/{uid}`** — profile, `role` (`buyer` | `seller`), `verified` flag.
Role and verification are set once and can't be self-edited by the client.

**`orders/{orderId}`** — the core object. Status moves through a fixed
sequence:

```
pending_payment → paid → shipped → delivered → confirmed → released
                                                      ↘
                                                    disputed (from paid/shipped/delivered)
```

Each transition is restricted to the party allowed to make it (see
`firestore.rules`). Notably:

- `pending_payment → paid` and `delivered → confirmed → released` are **not**
  settable by the client at all — they only happen server-side, in the
  payment webhook and release route, using the Admin SDK. A buyer's browser
  can't just claim "I paid" or trigger their own payout.

**`disputes/{disputeId}`** — linked to an order, readable/creatable only by
that order's buyer or seller. Resolution is admin-only.

## How a payment actually moves

1. Buyer clicks **Pay now** → `/api/payments/initiate` verifies they're the
   buyer on a `pending_payment` order, then calls Flutterwave to create a
   hosted checkout session and redirects them to it.
2. Buyer pays. Flutterwave sends a webhook to `/api/payments/webhook`.
3. The webhook **re-verifies the transaction directly with Flutterwave**
   (never trusts the webhook payload alone), checks the amount/currency
   match, and flips the order to `paid`.
4. Seller ships, attaches proof → `shipped`. Buyer marks delivered → `delivered`.
5. Buyer clicks **Confirm & release** → `/api/payments/release` verifies
   they're the buyer, marks the order `confirmed`, then calls Flutterwave's
   Transfer API to pay the seller's saved bank account → `released`.

## Known gaps / not production-ready yet

- **`lib/fx.ts` uses hardcoded, approximate exchange rates.** This needs to
  be replaced with a live FX provider before any real transaction relies on
  the converted amount.
- **Failed payouts aren't retried automatically.** If the Flutterwave
  transfer in `/api/payments/release` fails after an order is marked
  `confirmed`, it's logged to `lastReleaseError` on the order but needs a
  human (or a future retry job) to act on it.
- **No dispute freeze on in-flight payouts.** A dispute opened at the same
  moment a payout is processing isn't currently blocked.
- **Proof of shipping/delivery is a URL field, not a file upload.** Wiring
  this to Firebase Storage is a natural next step.
- **Not every currency in `SUPPORTED_CURRENCIES` is guaranteed to have
  working Flutterwave transfer support in every country** — confirm actual
  coverage with Flutterwave before launch.
- **No email notifications** (order paid, shipped, disputed, etc.) — this is
  currently a purely in-app experience.
- **No admin panel** for reviewing seller verification requests or resolving
  disputes — those are modeled in the data/rules but have no UI yet.

## Suggested next steps

1. Wire seller verification (KYC) submission + an admin review flow
2. Swap `lib/fx.ts` for a live FX API
3. Add Firebase Storage for shipping/delivery photo uploads
4. Build the dispute resolution admin UI
5. Add a retry mechanism for failed payouts