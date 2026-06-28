/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst } from "serwist";

// PWA service worker (serwist). next.config.ts swSrc tarafından derlenir.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Sayfa gezinmeleri NetworkFirst → online'da HER ZAMAN taze build gelir
  // (eski "deploy sonrası eski görünüyor" sorununu bitirir); offline'da cache fallback.
  runtimeCaching: [
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({ cacheName: "sayfalar", networkTimeoutSeconds: 3 }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
