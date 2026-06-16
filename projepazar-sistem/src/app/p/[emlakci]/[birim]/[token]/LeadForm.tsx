"use client";

import { useState } from "react";

export default function LeadForm({
  projeId,
  birimId,
  emlakciId,
}: {
  projeId: string;
  birimId: string;
  emlakciId: string;
}) {
  const [ad, setAd] = useState("");
  const [telefon, setTelefon] = useState("");
  const [kvkk, setKvkk] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basarili, setBasarili] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kvkk) {
      setHata("Lütfen KVKK metnini onaylayın.");
      return;
    }

    setYukleniyor(true);
    setHata(null);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projeId,
          birimId,
          emlakciId,
          ad,
          telefon,
          kvkk,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.hata || "Bir hata oluştu");
      }

      setBasarili(true);
    } catch (err: any) {
      setHata(err.message || "İstek gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  }

  if (basarili) {
    return (
      <div className="rounded-2xl border border-green/30 bg-green/10 p-6 text-center">
        <h4 className="font-display text-lg font-semibold text-ink">Talebiniz Alındı!</h4>
        <p className="mt-2 text-sm text-gray">
          Gayrimenkul danışmanınız en kısa sürede sizinle iletişime geçecektir.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-hair bg-card p-5 shadow-sm">
      <h4 className="font-display text-base font-semibold text-ink">Bilgi Almak İstiyorum</h4>
      <p className="text-xs text-gray">
        Bu daire veya proje hakkında detaylı bilgi ve ödeme planı almak için formu doldurun.
      </p>

      {hata ? (
        <p role="alert" className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
          {hata}
        </p>
      ) : null}

      <div>
        <label htmlFor="ad" className="text-xs font-medium text-gray">Ad Soyad</label>
        <input
          id="ad"
          type="text"
          required
          disabled={yukleniyor}
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          placeholder="Örn. Ahmet Yılmaz"
          className="mt-1 w-full rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="telefon" className="text-xs font-medium text-gray">Telefon Numarası</label>
        <input
          id="telefon"
          type="tel"
          required
          disabled={yukleniyor}
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
          placeholder="Örn. 0532 123 45 67"
          className="mt-1 w-full rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal disabled:opacity-50"
        />
      </div>

      <div className="flex items-start gap-2 pt-1">
        <input
          id="kvkk"
          type="checkbox"
          required
          disabled={yukleniyor}
          checked={kvkk}
          onChange={(e) => setKvkk(e.target.checked)}
          className="mt-0.5 size-4 rounded border-hair text-teal focus:ring-teal"
        />
        <label htmlFor="kvkk" className="text-xs leading-normal text-gray">
          Aydınlatma metni çerçevesinde kişisel verilerimin işlenmesini ve danışmanın benimle iletişime geçmesini onaylıyorum.
        </label>
      </div>

      <button
        type="submit"
        disabled={yukleniyor}
        className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {yukleniyor ? "Gönderiliyor…" : "Detaylı Bilgi Gönder"}
      </button>
    </form>
  );
}
