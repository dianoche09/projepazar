import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { zamanOnce } from "@/lib/types";
import { projeKapak } from "@/lib/gorsel";

/* =========================================================
   ÜRETİCİ KOKPİTİ — v2-muteahhit-A görünümü, gerçek Supabase verisi
   Sinyal: yeşil=müsait, amber=opsiyon, kırmızı=satıldı.
   ========================================================= */

type DurumKova = "musait" | "opsiyon" | "satildi" | "diger";
type Ozet = { toplam: number; musait: number; opsiyon: number; satildi: number };

/** birim.durum → kokpit kovası (opsiyonlu+satis_beklemede = opsiyon). */
function kova(d: string): DurumKova {
  if (d === "musait") return "musait";
  if (d === "opsiyonlu" || d === "satis_beklemede") return "opsiyon";
  if (d === "satildi") return "satildi";
  return "diger";
}

/** Para — kısa biçim (₺8.75M). Simge para_birimi alanından. */
function sembol(birim: string | null): string {
  return birim === "USD" ? "$" : birim === "EUR" ? "€" : birim === "GBP" ? "£" : "₺";
}
function paraKisa(n: number, birim: string | null = "TRY"): string {
  const s = sembol(birim);
  if (n >= 1_000_000) return `${s}${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`;
  if (n >= 1_000) return `${s}${Math.round(n / 1_000)}K`;
  return `${s}${n.toLocaleString("tr-TR")}`;
}

/** Tazelik → v2 `taze tX` sınıfı + insan-okunur metin. */
function tazelik(iso: string | null): { sinif: string; metin: string; gun: number } {
  if (!iso) return { sinif: "t-eski", metin: "—", gun: 999 };
  const fark = Date.now() - new Date(iso).getTime();
  const gun = Math.floor(fark / 86_400_000);
  const sinif = gun <= 0 ? "t-0" : gun <= 7 ? "t-7" : gun <= 15 ? "t-15" : "t-eski";
  return { sinif, metin: zamanOnce(iso), gun };
}

const DURUM_SINIF: Record<DurumKova, string> = {
  musait: "d-musait",
  opsiyon: "d-opsiyon",
  satildi: "d-satildi",
  diger: "d-musait",
};
const DURUM_AD: Record<DurumKova, string> = {
  musait: "Müsait",
  opsiyon: "Opsiyon",
  satildi: "Satıldı",
  diger: "—",
};

type BirimSatir = {
  proje_id: string;
  blok_id: string | null;
  tip_id: string | null;
  kat: number | null;
  daire_no: string | null;
  durum: string;
  liste_fiyati: number | null;
  para_birimi: string | null;
  net_m2: number | null;
  son_guncelleme: string | null;
};

export default async function UreticiKokpit() {
  const supabase = await createClient();

  // — Projeler (RLS: yalnız üreticinin/admin projeleri) —
  const { data: projeler } = await supabase
    .from("proje")
    .select(
      "id, ad, il, ilce, insaat_asamasi, ilerleme_yuzde, teslim_tarihi, belge_dogrulandi, para_birimi, son_guncelleme, created_at",
    )
    .order("created_at", { ascending: false });

  // — Tüm birimler (proje detay JOIN paterni: blok adı + tip adı/oda) —
  const { data: birimRaw } = await supabase
    .from("birim")
    .select(
      "proje_id, blok_id, tip_id, kat, daire_no, durum, liste_fiyati, para_birimi, net_m2, son_guncelleme",
    );
  const birimler = (birimRaw ?? []) as BirimSatir[];

  const { data: bloklar } = await supabase.from("blok").select("id, ad, kat_sayisi");
  const { data: tipler } = await supabase.from("daire_tipi").select("id, ad, oda, net_m2");
  const { data: kapaklar } = await supabase
    .from("proje_belge")
    .select("proje_id, url")
    .eq("tip", "kapak");

  const blokAd = new Map((bloklar ?? []).map((b) => [b.id, b.ad as string | null]));
  const tipOda = new Map(
    (tipler ?? []).map((t) => [t.id, (t.oda as string | null) ?? (t.ad as string | null)]),
  );
  const tipNet = new Map((tipler ?? []).map((t) => [t.id, t.net_m2 as number | null]));
  const kapakMap = new Map((kapaklar ?? []).map((k) => [k.proje_id, k.url as string | null]));
  const projeAd = new Map((projeler ?? []).map((p) => [p.id, p.ad as string]));

  // — Proje başı özet —
  const ozet = new Map<string, Ozet>();
  for (const b of birimler) {
    const o = ozet.get(b.proje_id) ?? { toplam: 0, musait: 0, opsiyon: 0, satildi: 0 };
    o.toplam++;
    const k = kova(b.durum);
    if (k === "musait") o.musait++;
    else if (k === "opsiyon") o.opsiyon++;
    else if (k === "satildi") o.satildi++;
    ozet.set(b.proje_id, o);
  }

  // — Genel KPI —
  const toplamBirim = birimler.length;
  const musait = birimler.filter((b) => kova(b.durum) === "musait").length;
  const opsiyon = birimler.filter((b) => kova(b.durum) === "opsiyon").length;
  const satildi = birimler.filter((b) => kova(b.durum) === "satildi").length;
  const satisOrani = toplamBirim ? Math.round((satildi / toplamBirim) * 100) : 0;
  const musaitPct = toplamBirim ? Math.round((musait / toplamBirim) * 100) : 0;

  const fiyatlar = birimler
    .map((b) => b.liste_fiyati)
    .filter((f): f is number => f != null && f > 0);
  const minFiyat = fiyatlar.length ? Math.min(...fiyatlar) : 0;
  const maxFiyat = fiyatlar.length ? Math.max(...fiyatlar) : 0;
  const anaPara = (projeler?.[0]?.para_birimi as string | null) ?? "TRY";

  // — Stok dağılım barı (% genişlik) —
  const w = (n: number) => (toplamBirim ? (n / toplamBirim) * 100 : 0);

  // — En çok birimi olan proje (stok tablosu "tümünü gör" hedefi) —
  const enBuyukProje = [...ozet.entries()].sort((a, b) => b[1].toplam - a[1].toplam)[0]?.[0] ?? null;

  // — Talep Radarı (gerçek stok metrikleri; uydurma sayı YOK) —
  const eskiBirimSay = birimler.filter((b) => tazelik(b.son_guncelleme).gun > 15).length;
  const enCokMusaitId =
    [...ozet.entries()].sort((a, b) => b[1].musait - a[1].musait)[0]?.[0] ?? null;
  const enCokMusaitAd = enCokMusaitId ? projeAd.get(enCokMusaitId) : null;
  const enCokMusaitN = enCokMusaitId ? ozet.get(enCokMusaitId)?.musait ?? 0 : 0;

  // — Son senkron —
  const enYeni = birimler
    .map((b) => b.son_guncelleme)
    .filter((s): s is string => Boolean(s))
    .sort()
    .at(-1);
  const sonSenkron = tazelik(enYeni ?? null);

  // — Stok tablosu satırları (ilk 20, son güncellemeye göre yeni → eski) —
  const tabloSatirlar = [...birimler]
    .sort((a, b) => (b.son_guncelleme ?? "").localeCompare(a.son_guncelleme ?? ""))
    .slice(0, 20);

  return (
    <div className="mx-auto max-w-[1640px] px-4 py-6 text-ink sm:px-6">
      {/* ---------- BAŞLIK ---------- */}
      <header className="belir mb-5 flex flex-wrap items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[27px] font-bold tracking-tight text-ink">Kokpit</h1>
            <span className="inline-flex items-center gap-2 rounded-full bg-green-soft px-2.5 py-[5px] text-[11.5px] font-semibold text-[#1f7d4c]">
              <span className="nabiz inline-block size-[7px] rounded-full bg-green" aria-hidden />
              Canlı
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--ink-faint)]">
            <span>Son senkron</span>
            <span className={`taze ${sonSenkron.sinif}`}>
              <span className="nokta" />
              <span className="mono">{sonSenkron.metin}</span>
            </span>
            <span className="text-[var(--cizgi-2)]">·</span>
            <span>
              {projeler?.length ?? 0} proje · <span className="mono">{toplamBirim}</span> birim
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <Link href="/uretici/lead-sorgu" className="btn-ghost h-[42px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Müşteri sorgula
          </Link>
          <Link href="/uretici/proje/yeni" className="btn-primary h-[42px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Yeni proje
          </Link>
        </div>
      </header>

      {/* ---------- KPI ŞERİDİ ---------- */}
      <section className="kart belir belir-1 mb-4 p-1">
        <div className="grid grid-cols-2 divide-x divide-y divide-[var(--cizgi)] md:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
          <Kpi etiket="Toplam Birim" deger={String(toplamBirim)} alt={`${projeler?.length ?? 0} aktif proje`} />
          <Kpi etiket="Müsait" deger={String(musait)} renk="text-green" alt={`%${musaitPct} stok`} />
          <Kpi etiket="Opsiyon" deger={String(opsiyon)} renk="text-amber" alt="karar bekliyor" />
          <Kpi etiket="Satıldı" deger={String(satildi)} renk="text-red" alt={`${satildi} / ${toplamBirim}`} />
          <Kpi etiket="Satış Oranı" deger={`%${satisOrani}`} alt={`${satildi} / ${toplamBirim} birim`} />
          <div className="px-5 py-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
              Liste Aralığı
            </div>
            {fiyatlar.length ? (
              <div className="mono text-[19px] font-semibold leading-tight text-ink">
                {paraKisa(minFiyat, anaPara)}
                <span className="text-[13px] text-[var(--ink-faint)]">–{paraKisa(maxFiyat, anaPara).replace(/^[₺$€£]/, "")}</span>
              </div>
            ) : (
              <div className="mono text-[19px] font-semibold leading-tight text-[var(--ink-faint)]">—</div>
            )}
            <div className="mt-2 text-[11.5px] text-[var(--ink-faint)]">birim fiyat bandı</div>
          </div>
        </div>
      </section>

      {/* ---------- STOK DAĞILIMI BAR + LEJANT ---------- */}
      <section className="kart belir belir-1 mb-5 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="min-w-[280px] flex-1">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-ink-soft">Stok dağılımı · tüm projeler</span>
              <span className="mono text-[12px] text-[var(--ink-faint)]">{toplamBirim} birim</span>
            </div>
            <div className="stokbar" style={{ height: 14 }}>
              <span style={{ width: `${w(musait)}%`, background: "linear-gradient(90deg,#37c178,#2fb36b)" }} />
              <span style={{ width: `${w(opsiyon)}%`, background: "var(--color-amber)" }} />
              <span style={{ width: `${w(satildi)}%`, background: "var(--color-red)" }} />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <LejantPunto renk="var(--color-green)" etiket="Müsait" deger={musait} />
            <LejantPunto renk="var(--color-amber)" etiket="Opsiyon" deger={opsiyon} />
            <LejantPunto renk="var(--color-red)" etiket="Satıldı" deger={satildi} />
          </div>
        </div>
      </section>

      {/* ===================== ANA GRID ===================== */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ============ SOL: PROJE KARTLARI ============ */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* proje kartları — en fazla 3 yanyana */}
          <div className="belir belir-2 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(projeler ?? []).map((p) => {
              const o = ozet.get(p.id) ?? { toplam: 0, musait: 0, opsiyon: 0, satildi: 0 };
              const t = tazelik(p.son_guncelleme);
              const sig =
                o.opsiyon > o.satildi ? "var(--color-amber)" : o.satildi > 0 ? "var(--color-red)" : "var(--color-green)";
              const pFiyatlar = birimler
                .filter((b) => b.proje_id === p.id)
                .map((b) => b.liste_fiyati)
                .filter((f): f is number => f != null && f > 0);
              const pMin = pFiyatlar.length ? Math.min(...pFiyatlar) : 0;
              const pMax = pFiyatlar.length ? Math.max(...pFiyatlar) : 0;
              const kapak = projeKapak(kapakMap.get(p.id), p.id);
              return (
                <Link
                  key={p.id}
                  href={`/uretici/proje/${p.id}`}
                  className="kart kart-3d signal-top group block overflow-hidden p-0"
                  style={{ ["--_sig" as string]: sig }}
                >
                  <div className="relative h-28 overflow-hidden">
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-[16px] font-bold text-ink">{p.ad}</h3>
                        <div className="mt-0.5 text-[11.5px] text-[var(--ink-faint)]">
                          {[p.il, p.ilce].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
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
                        <span className="ml-1 inline-block h-[5px] w-[42px] overflow-hidden rounded-full bg-[rgba(16,36,58,.08)]">
                          <span className="block h-full rounded-full bg-teal" style={{ width: `${Math.min(100, p.ilerleme_yuzde ?? 0)}%` }} />
                        </span>
                      </div>
                      {p.teslim_tarihi ? (
                        <div className="text-[var(--ink-faint)]">
                          Teslim{" "}
                          <span className="mono text-ink-soft">
                            {new Date(p.teslim_tarihi).getFullYear()}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-[var(--cizgi)] pt-2.5">
                      <span className="mono text-[13px] font-semibold text-ink">
                        {pFiyatlar.length ? `${paraKisa(pMin, p.para_birimi)} – ${paraKisa(pMax, p.para_birimi)}` : "Fiyat —"}
                      </span>
                      <span className="text-[11px] font-semibold text-teal">Yönet →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
            {(projeler?.length ?? 0) === 0 ? (
              <div className="kart col-span-full p-10 text-center">
                <p className="text-sm font-bold text-[var(--ink-faint)]">Henüz proje yok.</p>
                <Link href="/uretici/proje/yeni" className="mt-3 inline-block text-sm font-bold text-teal hover:underline">
                  İlk projeni oluştur →
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {/* ============ SAĞ RAIL ============ */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* TALEP RADARI — gerçek stok içgörüleri */}
          <div className="kart belir belir-3 p-4">
            <div className="mb-3 flex items-center gap-2">
              <svg width="17" height="17" className="text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <h2 className="font-display text-[15px] font-bold text-ink">Talep Radarı</h2>
              <span className="ml-auto rounded-md bg-teal-soft px-2 py-[2px] text-[10.5px] font-semibold text-teal">stoktan</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {opsiyon > 0 ? (
                <Insight renk="var(--color-amber)">
                  <span className="mono flex-none text-[15px] font-bold text-amber">{opsiyon}</span>
                  <p className="text-[12.5px] leading-snug text-ink-soft">
                    <b className="text-ink">aktif opsiyon</b> karar bekliyor — teyit/serbest bırakma için takip et.
                  </p>
                </Insight>
              ) : null}

              {enCokMusaitAd ? (
                <Insight renk="var(--color-green)">
                  <span className="mono flex-none text-[15px] font-bold text-green">{enCokMusaitN}</span>
                  <p className="text-[12.5px] leading-snug text-ink-soft">
                    En çok müsait stok <b className="text-ink">{enCokMusaitAd}</b> — paylaşıma en hazır proje.
                  </p>
                </Insight>
              ) : null}

              {eskiBirimSay > 0 ? (
                <Insight renk="var(--color-red)">
                  <svg width="16" height="16" className="mt-[2px] flex-none text-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 2" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  <p className="text-[12.5px] leading-snug text-ink-soft">
                    <b className="mono text-ink">{eskiBirimSay} birim</b> 15 günden eski — fiyat/durum tazelenmesi öneriliyor.
                  </p>
                </Insight>
              ) : null}

              {opsiyon === 0 && eskiBirimSay === 0 && !enCokMusaitAd ? (
                <p className="rounded-[12px] bg-navy-soft px-3 py-4 text-center text-[12px] text-[var(--ink-faint)]">
                  Stok eklendikçe içgörüler burada belirir.
                </p>
              ) : null}
            </div>
          </div>

          {/* MÜŞTERİ SORGULA */}
          <div className="kart belir belir-4 p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <svg width="17" height="17" className="text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <h2 className="font-display text-[15px] font-bold text-ink">Müşteri Sorgula</h2>
            </div>
            <p className="mb-3 text-[11.5px] text-[var(--ink-faint)]">
              Telefon / TCKN ile çift-satış ve mevcut opsiyon kontrolü. Lead sana otomatik akmaz — yalnız sorgu.
            </p>
            <Link href="/uretici/lead-sorgu" className="btn-primary h-[44px] w-full justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Sorgula
            </Link>
            <div className="mt-3 flex items-center gap-2 border-t border-[var(--cizgi)] pt-3 text-[11px] text-[var(--ink-faint)]">
              <svg width="13" height="13" className="text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Sorgu kayıt altına alınır · güven protokolü
            </div>
          </div>
        </div>

        {/* ============ STOK TABLOSU — FULL WIDTH (row 2) ============ */}
        <div className="kart belir belir-3 overflow-hidden lg:col-span-2">
            <div className="flex flex-wrap items-center gap-3 border-b border-[var(--cizgi)] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[16px] font-bold text-ink">Stok Tablosu</h2>
                <span className="mono rounded-md bg-navy-soft px-2 py-[2px] text-[11px] text-ink-soft">
                  {toplamBirim} birim
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Link href="/uretici/stok?durum=musait" className="chip h-8 px-3 text-[12px]">
                  <span className="size-[7px] rounded-full bg-green" />
                  Müsait
                </Link>
                <Link href="/uretici/stok?durum=opsiyon" className="chip h-8 px-3 text-[12px]">
                  <span className="size-[7px] rounded-full bg-amber" />
                  Opsiyon
                </Link>
                <Link href="/uretici/stok" className="btn-ghost h-8 min-h-0 px-3 text-[12px]">
                  Tümünü gör →
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto" style={{ maxHeight: 560, overflowY: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Proje</th>
                    <th>Blok</th>
                    <th>Kat</th>
                    <th>No</th>
                    <th>Tip</th>
                    <th className="text-right">Net m²</th>
                    <th className="text-right">Fiyat</th>
                    <th>Durum</th>
                    <th>Son Güncelleme</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {tabloSatirlar.map((b, i) => {
                    const k = kova(b.durum);
                    const t = tazelik(b.son_guncelleme);
                    const net = b.net_m2 ?? tipNet.get(b.tip_id ?? "") ?? null;
                    const satir =
                      k === "satildi"
                        ? { background: "rgba(209,90,78,.035)" }
                        : k === "opsiyon"
                          ? { background: "rgba(227,161,44,.045)" }
                          : undefined;
                    return (
                      <tr key={`${b.proje_id}-${b.daire_no}-${i}`} style={satir}>
                        <td>
                          <span className="text-[12px] text-ink-soft">{projeAd.get(b.proje_id) ?? "—"}</span>
                        </td>
                        <td className="mono font-medium">{blokAd.get(b.blok_id ?? "") ?? "—"}</td>
                        <td className="mono">{b.kat ?? "—"}</td>
                        <td className="mono">{b.daire_no ?? "—"}</td>
                        <td>{tipOda.get(b.tip_id ?? "") ?? "—"}</td>
                        <td className="mono text-right">{net != null ? net : "—"}</td>
                        <td
                          className="mono text-right font-semibold"
                          style={k === "satildi" ? { color: "var(--ink-faint)" } : undefined}
                        >
                          {b.liste_fiyati ? paraKisa(b.liste_fiyati, b.para_birimi) : "—"}
                        </td>
                        <td>
                          <span className={`durum ${DURUM_SINIF[k]}`}>
                            <span className="nokta" />
                            {DURUM_AD[k]}
                          </span>
                        </td>
                        <td>
                          <span className={`taze ${t.sinif}`}>
                            <span className="nokta" />
                            <span className="mono">{t.metin}</span>
                          </span>
                        </td>
                        <td>
                          {k === "musait" ? (
                            <Link href={`/uretici/proje/${b.proje_id}`} className="btn-action h-auto min-h-0 px-2.5 py-[5px] text-[11px]">
                              Yönet
                            </Link>
                          ) : (
                            <span className="text-[11px] text-[var(--ink-faint)]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {tabloSatirlar.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-sm text-[var(--ink-faint)]">
                        Henüz birim yok — proje kurulumundan üret.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--cizgi)] px-5 py-3">
              <span className="text-[12px] text-[var(--ink-faint)]">
                {tabloSatirlar.length} / {toplamBirim} birim gösteriliyor
              </span>
              {enBuyukProje ? (
                <Link
                  href={`/uretici/proje/${enBuyukProje}`}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold text-teal"
                >
                  Tümünü gör
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              ) : null}
            </div>
          </div>
        </div>

      <footer className="mt-6 flex items-center gap-2 text-[11px] text-[var(--ink-faint)]">
        <span className="nabiz inline-block size-[6px] rounded-full bg-green" aria-hidden />
        ProjePazar · canlı konut stoğu dağıtım ağı · veriler gerçek zamanlı senkronlanır
      </footer>
    </div>
  );
}

/* ---------- küçük sunum bileşenleri (server, etkileşimsiz) ---------- */

function Kpi({
  etiket,
  deger,
  alt,
  renk = "text-ink",
}: {
  etiket: string;
  deger: string;
  alt?: string;
  renk?: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{etiket}</div>
      <div className={`mono text-[30px] font-semibold leading-none ${renk}`}>{deger}</div>
      {alt ? <div className="mono mt-2 text-[11.5px] text-[var(--ink-faint)]">{alt}</div> : null}
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

function LejantPunto({ renk, etiket, deger }: { renk: string; etiket: string; deger: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-3 rounded-[4px]" style={{ background: renk }} />
      <span className="text-[12px] text-ink-soft">
        {etiket} <b className="mono">{deger}</b>
      </span>
    </div>
  );
}

function Insight({ renk, children }: { renk: string; children: React.ReactNode }) {
  return (
    <div
      className="relative rounded-[14px] border border-[var(--cizgi)] bg-white/70 px-3.5 py-3"
      style={{ paddingLeft: 15 }}
    >
      <span className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-[3px]" style={{ background: renk }} />
      <div className="flex items-start gap-2">{children}</div>
    </div>
  );
}
