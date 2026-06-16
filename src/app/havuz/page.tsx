import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { zamanOnce } from "@/lib/types";

type Ozet = {
  toplam: number;
  musait: number;
  opsiyon: number;
  satildi: number;
  min: number;
  max: number;
};

function fmtFiyat(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n.toLocaleString("tr-TR");
}

export default async function Havuz() {
  const supabase = await createClient();

  // RLS: proje_emlakci_select + birim_emlakci_select → yalnız tahsisli projeler/birimler
  const { data: projeler } = await supabase
    .from("proje")
    .select("id, ad, il, ilce, mahalle, belge_dogrulandi, son_guncelleme, teslim_tarihi")
    .order("son_guncelleme", { ascending: false });
  const { data: birimler } = await supabase
    .from("birim")
    .select("proje_id, durum, liste_fiyati");

  const ozet = new Map<string, Ozet>();
  for (const b of birimler ?? []) {
    const o =
      ozet.get(b.proje_id) ??
      { toplam: 0, musait: 0, opsiyon: 0, satildi: 0, min: Infinity, max: 0 };
    o.toplam++;
    if (b.durum === "musait") o.musait++;
    else if (b.durum === "opsiyonlu" || b.durum === "satis_beklemede") o.opsiyon++;
    else if (b.durum === "satildi") o.satildi++;
    const f = Number(b.liste_fiyati) || 0;
    if (f > 0) {
      o.min = Math.min(o.min, f);
      o.max = Math.max(o.max, f);
    }
    ozet.set(b.proje_id, o);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Emlakçı Havuzu</h1>
      <p className="mt-1 text-sm text-gray">
        Sana tahsisli yetkili projeler — tek canlı havuz. İncelemek için projeye tıkla.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(projeler ?? []).map((p) => {
          const o = ozet.get(p.id);
          const yuzde = (n: number) => (o && o.toplam ? (n / o.toplam) * 100 : 0);
          return (
            <Link
              key={p.id}
              href={`/havuz/proje/${p.id}`}
              className="block rounded-2xl border border-hair bg-card p-5 transition-colors hover:border-teal"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">{p.ad}</h3>
                  <p className="text-sm text-gray">
                    {[p.mahalle, p.ilce, p.il].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                {p.belge_dogrulandi ? (
                  <span className="shrink-0 rounded-full bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal">
                    ✓ Doğrulanmış
                  </span>
                ) : null}
              </div>

              {o ? (
                <>
                  <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-hair">
                    <div className="bg-green" style={{ width: `${yuzde(o.musait)}%` }} />
                    <div className="bg-amber" style={{ width: `${yuzde(o.opsiyon)}%` }} />
                    <div className="bg-red" style={{ width: `${yuzde(o.satildi)}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono text-xs text-gray">
                    <span>
                      {o.musait} müsait · {o.opsiyon} opsiyon · {o.satildi} satıldı
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-green" />
                      {zamanOnce(p.son_guncelleme)}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-sm text-ink">
                    {o.min < Infinity ? `${fmtFiyat(o.min)} – ${fmtFiyat(o.max)} ₺` : "fiyat —"}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-gray">Bu projede sana tahsisli birim yok.</p>
              )}
            </Link>
          );
        })}
        {!projeler || projeler.length === 0 ? (
          <p className="text-sm text-gray">
            Sana tahsisli proje yok. Üretici sana tahsis edince burada canlı görünür.
          </p>
        ) : null}
      </div>
    </div>
  );
}
