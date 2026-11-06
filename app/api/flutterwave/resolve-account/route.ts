import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { account_number, account_bank } = await req.json();

  if (!account_number || !account_bank) {
    return NextResponse.json(
      { status: "error", message: "account_number and account_bank are required" },
      { status: 400 }
    );
  }

  const res = await fetch("https://api.flutterwave.com/v3/accounts/resolve", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ account_number, account_bank }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}