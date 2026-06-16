import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// PWA: serwist service worker (Devir Dokümanı DEĞİŞMEZ #6 — mobil-önce + PWA)
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Geliştirmede SW kapalı (HMR ile çakışmasın); prod'da aktif
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Üst dizindeki ilgisiz package-lock.json'ı workspace root sanmasını engelle
  outputFileTracingRoot: import.meta.dirname,
};

export default withSerwist(nextConfig);
