import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustBid Docs",
  description: "Financial management and traceability for social foundations and NGOs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans antialiased">{children}</body>
    </html>
  );
}
