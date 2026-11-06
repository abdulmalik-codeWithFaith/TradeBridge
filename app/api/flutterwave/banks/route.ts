import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://api.flutterwave.com/v3/banks/NG", {
    headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
    next: { revalidate: 86400 },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}