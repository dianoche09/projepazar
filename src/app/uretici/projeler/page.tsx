import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { projeKapak } from "@/lib/gorsel";
import { paraKisa, tazelik, bosOzet, type Ozet } from "@/lib/stok";

/* =========================================================
   PROJELER — kapaklı kart grid (üretici).
   Her kart canlı stok dağılımı + tazelik + fiyat aralığı taşır → /uretici/proje/[id].
   Sinyal: yeşil=müsait, amber=opsiyon, kırmızı=satıldı.
   ========================================================= */

type BirimMini = { proje_id: string; durum: string; liste_fiyati: number | null };

export default async function UreticiProjeler() {
  const supabase = await createClient();

  const { data: projeler } = await supabase
    .from("proje")
    .select(
      "id, ad, il, ilce, insaat_asamasi, ilerleme_yuzde, teslim_tarihi, belge_dogrulandi, para_birimi, son_guncelleme, created_at",
    )
    .order("created_at", { ascending: false });

  const { data: birimRaw } = await supabase
    .from("birim")
    .select("proje_id, durum, liste_fiyati");
  const birimler = (birimRaw ?? []) as BirimMini[];

  const { data: kapaklar } = await supabase
    .from("proje_belge")
    .select("proje_id, url")
    .eq("tip", "kapak");
  const kapakMap = new Map((kapaklar ?? []).map((k) => [k.proje_id, k.url as string | null]));

  // Proje başı özet + fiyat aralığı (tek geçiş)
  const ozet = new Map<string, Ozet>();
  const fiyatlar = new Map<string, number[]>();
  for (const b of birimler) {
    const o = ozet.get(b.proje_id) ?? bosOzet();
    o.toplam++;
    if (b.durum === "musait") o.musait++;
    else if (b.durum === "opsiyonlu" || b.durum === "satis_beklemede") o.opsiyon++;
    else if (b.durum === "satildi") o.satildi++;
    ozet.set(b.proje_id, o);
    if (b.liste_fiyati != null && b.liste_fiyati > 0) {
      const arr = fiyatlar.get(b.proje_id) ?? [];
      arr.push(b.liste_fiyati);
      fiyatlar.set(b.proje_id, arr);
    }
  }

  const toplamProje = projeler?.length ?? 0;
  const toplamBirim = birimler.length;
  const toplamMusait = birimler.filter((b) => b.durum === "musait").length;

  return (
    <div className="mx-auto max-w-[1640px] px-4 py-6 text-ink sm:px-6">
      {/* başlık */}
      <header className="belir mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[27px] font-bold tracking-tight text-ink">Projeler</h1>
            <span className="inline-flex items-center gap-2 rounded-full bg-green-soft px-2.5 py-[5px] text-[11.5px] font-semibold text-[#1f7d4c]">
              <span className="nabiz inline-block size-[7px] rounded-full bg-green" aria-hidden />
              Canlı
            </span>
          </div>
          <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
            {toplamProje} proje · <span className="mono">{toplamBirim}</span> birim ·{" "}
            <span className="mono text-green">{toplamMusait}</span> müsait
          </p>
        </div>
        <Link href="/uretici/proje/yeni" className="btn-primary h-[42px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Yeni proje
        </Link>
      </header>

      <div className="belir belir-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(projeler ?? []).map((p) => {
          const o = ozet.get(p.id) ?? bosOzet();
          const t = tazelik(p.son_guncelleme);
          const sig =
            o.opsiyon > o.satildi
              ? "var(--color-amber)"
              : o.satildi > 0
                ? "var(--color-red)"
                : "var(--color-green)";
          const pf = fiyatlar.get(p.id) ?? [];
          const pMin = pf.length ? Math.min(...pf) : 0;
          const pMax = pf.length ? Math.max(...pf) : 0;
          const kapak = projeKapak(kapakMap.get(p.id), p.id);
          return (
            <Link
              key={p.id}
              href={`/uretici/proje/${p.id}`}
              className="kart kart-3d signal-top group block overflow-hidden p-0"
              style={{ ["--_sig" as string]: sig }}
            >
              <div className="relative h-32 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={kapak}
                  alt={p.ad}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                {p.belge_dogrulandi ? (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/90 px-1.5 py-[3px] text-[10px] font-semibold text-teal shadow-sm">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Belgeli
                  </span>
                ) : null}
                <span className={`taze ${t.sinif} absolute bottom-2.5 left-3 rounded-full bg-white/90 px-2 py-[3px] shadow-sm`}>
                  <span className="nokta" />
                  <span className="mono">{t.metin}</span>
                </span>
              </div>

              <div className="p-4">
                <h3 className="truncate font-display text-[16px] font-bold text-ink">{p.ad}</h3>
                <div className="mt-0.5 text-[11.5px] text-[var(--ink-faint)]">
                  {[p.il, p.ilce].filter(Boolean).join(" · ") || "—"}
                </div>

                <div className="mb-3 mt-3 grid grid-cols-4 gap-2">
                  <KutuSayi deger={o.toplam} etiket="birim" renk="text-ink" />
                  <KutuSayi deger={o.musait} etiket="müsait" renk="text-green" />
                  <KutuSayi deger={o.opsiyon} etiket="opsiyon" renk="text-amber" />
                  <KutuSayi deger={o.satildi} etiket="satıldı" renk="text-red" />
                </div>

                <div className="stokbar mb-3">
                  <span style={{ width: `${o.toplam ? (o.musait / o.toplam) * 100 : 0}%`, background: "var(--color-green)" }} />
                  <span style={{ width: `${o.toplam ? (o.opsiyon / o.toplam) * 100 : 0}%`, background: "var(--color-amber)" }} />
                  <span style={{ width: `${o.toplam ? (o.satildi / o.toplam) * 100 : 0}%`, background: "var(--color-red)" }} />
                </div>

                <div className="flex items-center justify-between text-[11.5px]">
                  <div className="flex items-center gap-1.5 text-ink-soft">
                    <span>İnşaat</span>
                    <b className="mono text-ink">%{p.ilerleme_yuzde ?? 0}</b>
                    <span className="ml-1 inline-block h-[5px] w-[40px] overflow-hidden rounded-full bg-[rgba(16,36,58,.08)]">
                      <span className="block h-full rounded-full bg-teal" style={{ width: `${Math.min(100, p.ilerleme_yuzde ?? 0)}%` }} />
                    </span>
                  </div>
                  {p.teslim_tarihi ? (
                    <span className="text-[var(--ink-faint)]">
                      Teslim <span className="mono text-ink-soft">{new Date(p.teslim_tarihi).getFullYear()}</span>
                    </span>
                  ) : null}
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-[var(--cizgi)] pt-2.5">
                  <span className="mono text-[13px] font-semibold text-ink">
                    {pf.length ? `${paraKisa(pMin, p.para_birimi)} – ${paraKisa(pMax, p.para_birimi)}` : "Fiyat —"}
                  </span>
                  <span className="text-[11px] font-semibold text-teal">Yönet →</span>
                </div>
              </div>
            </Link>
          );
        })}

        {toplamProje === 0 ? (
          <div className="kart col-span-full p-10 text-center">
            <p className="text-sm font-bold text-[var(--ink-faint)]">Henüz proje yok.</p>
            <Link href="/uretici/proje/yeni" className="mt-3 inline-block text-sm font-bold text-teal hover:underline">
              İlk projeni oluştur →
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function KutuSayi({ deger, etiket, renk }: { deger: number; etiket: string; renk: string }) {
  return (
    <div>
      <div className={`mono text-[18px] font-semibold ${renk}`}>{deger}</div>
      <div className="text-[10px] text-[var(--ink-faint)]">{etiket}</div>
    </div>
  );
}
