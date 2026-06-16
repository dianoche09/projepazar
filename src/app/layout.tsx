import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

// Berrak Güven tipografisi (Bölüm 8): başlık / arayüz / veri
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});
const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProjePazar — Canlı Konut Stoğu Dağıtım Ağı",
  description:
    "Çok-müteahhitli, üretici-kontrollü canlı konut stoğu dağıtım ağı. Tek doğru kaynak, granüler tahsis, çift-satış kalkanı, görünür tazelik.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ProjePazar" },
};

export const viewport: Viewport = {
  themeColor: "#13314b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${bricolage.variable} ${instrument.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
