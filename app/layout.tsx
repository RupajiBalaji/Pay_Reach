import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayReach — AI Payment-Collection Agent for Card-less Users",
  description:
    "An AI decision-layer payment collection agent for card-less/first-time bank account holders in India, preventing silent NPCI U16 rejections through bank risk modeling and automated rail fallback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
