const FLW_BASE = "https://api.flutterwave.com/v3";

function secretKey(): string {
  const key = process.env.FLW_SECRET_KEY;
  if (!key) throw new Error("FLW_SECRET_KEY is not set");
  return key;
}

async function flw<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${FLW_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey()}`,
      ...(init?.headers ?? {}),
    },
  });

  const body = await res.json();
  if (!res.ok || body.status === "error") {
    throw new Error(body.message || `Flutterwave request to ${path} failed`);
  }
  return body as T;
}

export async function initiatePayment(params: {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  customerEmail: string;
  customerName: string;
  orderId: string;
}) {
  const result = await flw<{ data: { link: string } }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirectUrl,
      customer: {
        email: params.customerEmail,
        name: params.customerName,
      },
      meta: {
        orderId: params.orderId,
      },
      customizations: {
        title: "TradeBridge",
        description: "Payment held in protection until delivery is confirmed",
      },
    }),
  });
  return result.data.link;
}

/**
 * Re-fetches a transaction from Flutterwave's own servers to confirm it
 * really succeeded, rather than trusting the webhook payload alone.
 */
export async function verifyTransaction(transactionId: string) {
  const result = await flw<{
    data: {
      status: string;
      amount: number;
      currency: string;
      tx_ref: string;
      meta?: { orderId?: string };
    };
  }>(`/transactions/${transactionId}/verify`, { method: "GET" });
  return result.data;
}

/** Resolves an account number + bank code to the account holder's name. */
export async function resolveAccountName(accountNumber: string, accountBank: string) {
  const result = await flw<{ data: { account_number: string; account_name: string } }>(
    "/accounts/resolve",
    {
      method: "POST",
      body: JSON.stringify({ account_number: accountNumber, account_bank: accountBank }),
    }
  );
  return result.data.account_name;
}

/** Lists banks for a given two-letter-ish country code Flutterwave recognizes (e.g. "NG", "GH", "KE"). */
export async function listBanks(country: string) {
  const result = await flw<{ data: { id: number; code: string; name: string }[] }>(
    `/banks/${country}`,
    { method: "GET" }
  );
  return result.data;
}

/** Pays a seller out to their registered bank account. */
export async function initiateTransfer(params: {
  accountBank: string;
  accountNumber: string;
  amount: number;
  currency: string;
  narration: string;
  reference: string;
}) {
  const result = await flw<{ data: { id: number; status: string } }>("/transfers", {
    method: "POST",
    body: JSON.stringify({
      account_bank: params.accountBank,
      account_number: params.accountNumber,
      amount: params.amount,
      currency: params.currency,
      narration: params.narration,
      reference: params.reference,
    }),
  });
  return result.data;
}