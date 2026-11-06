import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeBridge — Buy and sell across Africa, safely",
  description:
    "TradeBridge helps Africans safely buy and sell across borders by combining seller verification, local-currency payment, delivery protection, and disputes into one transaction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}