// Illustrative currency conversion only. These are approximate, static rates
// (units of currency per 1 USD) and are NOT suitable for real transactions.
// Before handling real money, replace `convert()` with a call to a live FX
// provider (e.g. exchangerate.host, Wise, or your payment processor's own
// rate endpoint) and snapshot the rate at order-creation time.

export const SUPPORTED_CURRENCIES = [
  "NGN", "GHS", "KES", "ZAR", "EGP", "XOF",
  "TZS", "UGX", "MAD", "RWF", "ETB", "XAF", "USD",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const UNITS_PER_USD: Record<SupportedCurrency, number> = {
  NGN: 1550,
  GHS: 15.6,
  KES: 129,
  ZAR: 18,
  EGP: 48,
  XOF: 610,
  TZS: 2500,
  UGX: 3700,
  MAD: 9.9,
  RWF: 1300,
  ETB: 118,
  XAF: 610,
  USD: 1,
};

/** Converts an amount from one supported currency to another. */
export function convert(amount: number, from: SupportedCurrency, to: SupportedCurrency): number {
  const usd = amount / UNITS_PER_USD[from];
  return usd * UNITS_PER_USD[to];
}