import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MahnungsMeister - Professionelles Mahnwesen",
  description: "Automatisieren Sie Ihr Mahnwesen mit MahnungsMeister. Erstellen Sie Rechnungen, verwalten Sie Kunden und senden Sie Mahnungen per E-Mail.",
  keywords: ["Mahnung", "Rechnung", "Forderungsmanagement", "Mahnwesen", "Zahlungserinnerung"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
