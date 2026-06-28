import type { Metadata, Viewport } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { PwaKur } from "@/components/ui/PwaKur";
import "./globals.css";

// Modern space typography: Outfit (UI & display) + Geist Mono (data/numbers)
const outfit = Outfit({
  variable: "--font-outfit",
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
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f4f5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink font-sans">
        <NextTopLoader color="#2563eb" height={3} shadow="0 0 8px #2563eb" showSpinner={false} speed={250} />
        {children}
        <PwaKur />
      </body>
    </html>
  );
}
