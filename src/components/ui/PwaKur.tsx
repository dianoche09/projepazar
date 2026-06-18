"use client";

import { useEffect, useState } from "react";

type KurOlayi = Event & { prompt: () => Promise<void> };

/**
 * PWA "Ana ekrana ekle" istemi. Android/Chrome'da beforeinstallprompt yakalanır;
 * iOS Safari'de (API yok) Paylaş→Ana Ekrana Ekle ipucu gösterilir. Kapatınca bir
 * daha gösterilmez (localStorage). Zaten kuruluysa (standalone) hiç çıkmaz.
 */
export function PwaKur() {
  const [olay, setOlay] = useState<KurOlayi | null>(null);
  const [ios, setIos] = useState(false);
  const [gorunur, setGorunur] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa-kur-kapali") === "1") return;
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    if (standalone) return;

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      queueMicrotask(() => {
        setIos(true);
        setGorunur(true);
      });
      return;
    }

    const dinle = (e: Event) => {
      e.preventDefault();
      setOlay(e as KurOlayi);
      setGorunur(true);
    };
    window.addEventListener("beforeinstallprompt", dinle);
    return () => window.removeEventListener("beforeinstallprompt", dinle);
  }, []);

  if (!gorunur) return null;

  const kapat = () => {
    setGorunur(false);
    localStorage.setItem("pwa-kur-kapali", "1");
  };
  const kur = async () => {
    if (olay) await olay.prompt();
    kapat();
  };

  return (
    <div className="fixed inset-x-3 bottom-24 z-[60] mx-auto max-w-md rounded-2xl border border-hair bg-card p-3 shadow-cardlg md:bottom-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="size-9 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">ProjePazar&apos;ı kur</p>
          <p className="text-xs text-gray">
            {ios ? "Paylaş → “Ana Ekrana Ekle”" : "Ana ekranına ekle, uygulama gibi aç"}
          </p>
        </div>
        {!ios ? (
          <button onClick={kur} className="rounded-lg bg-navy px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-ink">
            Kur
          </button>
        ) : null}
        <button onClick={kapat} className="rounded-lg px-2 py-1 text-gray transition-colors hover:bg-paper" aria-label="Kapat">
          ✕
        </button>
      </div>
    </div>
  );
}
