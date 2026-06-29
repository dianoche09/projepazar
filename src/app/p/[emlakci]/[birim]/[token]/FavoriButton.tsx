"use client";

import { useEffect, useState } from "react";

/** Mikrosite favori — anonim sinyal (localStorage hatırlar; ilk favoride event yazar). */
export function FavoriButton({
  emlakci,
  birim,
  proje,
  token,
}: {
  emlakci: string;
  birim: string;
  proje: string;
  token: string;
}) {
  const [favori, setFavori] = useState(false);
  const anahtar = `favori:${birim}`;

  useEffect(() => {
    try {
      setFavori(localStorage.getItem(anahtar) === "1");
    } catch {
      /* localStorage yok */
    }
  }, [anahtar]);

  function toggle() {
    const yeni = !favori;
    setFavori(yeni);
    try {
      localStorage.setItem(anahtar, yeni ? "1" : "0");
    } catch {
      /* yok */
    }
    if (yeni) {
      // yalnız favorilemede sinyal yaz (fire-and-forget)
      void fetch("/api/etkilesim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emlakci, birim, proje, token, tip: "favori" }),
      }).catch(() => {});
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favori}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
        favori ? "border-red/30 bg-red/10 text-red" : "border-hair text-ink hover:bg-paper"
      }`}
    >
      <svg className="size-4" viewBox="0 0 24 24" fill={favori ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {favori ? "Favorilendi" : "Favorile"}
    </button>
  );
}
