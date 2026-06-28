import { notFound } from "next/navigation";
import { verifyShareToken } from "@/lib/sharing";
import { createAdminClient } from "@/lib/supabase/admin";
import { DURUM_BG, DURUM_ETIKET, ASAMA_ETIKET, zamanOnce, type BirimDurum, type InsaatAsama } from "@/lib/types";
import LeadForm from "./LeadForm";
import { GridMark } from "@/components/GridMark";

const fmt = (n: number) => n.toLocaleString("tr-TR");
const PARA_SIMGE: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€", GBP: "£", AED: "AED" };
/** Tazelik renk tier'ları (tasarım dili): 0-24sa yeşil · 1-7g teal · 7-15g amber · 15g+ gri. */
function tazelikRenk(iso: string): { dot: string; text: string } {
  const gun = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  if (gun <= 1) return { dot: "bg-green", text: "text-green" };
  if (gun <= 7) return { dot: "bg-teal", text: "text-teal-d" };
  if (gun <= 15) return { dot: "bg-amber", text: "text-amber" };
  return { dot: "bg-gray", text: "text-gray" };
}

export default async function PublicBirimPage({
  params,
}: {
  params: Promise<{ emlakci: string; birim: string; token: string }>;
}) {
  const { emlakci, birim, token } = await params;

  // 1. URL imzası (Cryptographic Signature) doğrula
  if (!verifyShareToken(emlakci, birim, token)) {
    notFound();
  }

  // 2. RLS bypass eden admin client'ı ile veriyi çek (public ziyaretçiler RLS'e takılmamalı)
  const supabase = createAdminClient();

  // Danışman profili
  const { data: profile } = await supabase
    .from("profiles")
    .select("ad, telefon, foto_url, logo_url")
    .eq("id", emlakci)
    .single();

  if (!profile) notFound();

  // Birim detayları + Proje + Üretici + Daire Tipi
  const { data: birimData } = await supabase
    .from("birim")
    .select(`
      id, daire_no, kat, durum, liste_fiyati, para_birimi, net_m2, brut_m2, yon, manzara, satilabilir, son_guncelleme, odeme_plani,
      proje:proje_id (
        id, ad, il, ilce, mahalle, insaat_asamasi, ilerleme_yuzde, teslim_tarihi, sorumlu_ad, sorumlu_tel, lat, lng, kira_getirisi_pct, amortisman_yil, oturum_uygun, golden_visa_esik,
        uretici:uretici_id (
          id, ad, dogrulanmis
        )
      ),
      tip:tip_id (
        ad, oda, net_m2, brut_m2, plan_url
      )
    `)
    .eq("id", birim)
    .single();

  if (!birimData) notFound();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const p = birimData.proje as any;
  const u = p?.uretici as any;
  const t = birimData.tip as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const b = birimData;

  const { data: kapakBelge } = await supabase
    .from("proje_belge")
    .select("url")
    .eq("proje_id", p?.id)
    .eq("tip", "kapak")
    .maybeSingle();
  const kapak = kapakBelge?.url ?? null;

  const bDurum = b.durum as BirimDurum;
  const liste = b.liste_fiyati;
  const psim = PARA_SIMGE[b.para_birimi as string] ?? "₺";
  const tazelik = tazelikRenk(b.son_guncelleme);
  const op = b.odeme_plani as {
    pesinat_pct?: number | null;
    taksit_sayisi?: number | null;
    vade_farki_pct?: number | null;
    ara_odemeler?: { ay: number; pct: number }[] | null;
  } | null;
  let odeme: { pesinat: number; ay: number; aylik: number; vade: number } | null = null;
  if (liste != null && op && (op.pesinat_pct != null || op.taksit_sayisi != null)) {
    const araPct = (op.ara_odemeler ?? []).reduce((s, a) => s + (a?.pct ?? 0), 0);
    const pesinat = Math.round((liste * (op.pesinat_pct ?? 0)) / 100);
    const kalan = Math.max(0, liste - pesinat - Math.round((liste * araPct) / 100));
    const ay = op.taksit_sayisi ?? 0;
    const vade = op.vade_farki_pct ?? 0;
    odeme = { pesinat, ay, aylik: ay > 0 ? Math.round((kalan * (1 + vade / 100)) / ay) : 0, vade };
  }

  return (
    <div className="min-h-screen bg-paper pb-16">
      {/* Üst Bar / Header */}
      <header className="border-b border-hair bg-card py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <GridMark />
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              Proje<span className="text-teal">Pazar</span>
            </span>
          </div>
          <div className={`flex items-center gap-1.5 font-mono text-xs ${tazelik.text}`}>
            <span className="relative flex size-2">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${tazelik.dot} opacity-75`}></span>
              <span className={`relative inline-flex size-2 rounded-full ${tazelik.dot}`}></span>
            </span>
            Canlı stoktan alındı · {zamanOnce(b.son_guncelleme)} güncellendi
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-5xl px-6">
        {kapak ? (
          <div className="mb-6 overflow-hidden rounded-2xl border border-hair shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={kapak} alt={p?.ad} className="h-48 w-full object-cover sm:h-72" />
          </div>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sol Kolon: Proje & Daire Detayları */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proje Başlığı & Doğrulama */}
            <div className="rounded-2xl border border-hair bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-ink">{p?.ad}</h1>
                  <p className="mt-1 text-sm text-gray">
                    {[p?.mahalle, p?.ilce, p?.il].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                {u?.dogrulanmis ? (
                  <span className="inline-flex items-center rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
                    ✓ Doğrulanmış Üretici
                  </span>
                ) : null}
              </div>
              {p?.kira_getirisi_pct != null || p?.oturum_uygun || p?.golden_visa_esik != null ? (
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-medium">
                  {p.kira_getirisi_pct != null ? (
                    <span className="rounded-md bg-teal-soft px-2 py-0.5 text-teal-d">%{p.kira_getirisi_pct} yıllık kira getirisi</span>
                  ) : null}
                  {p.oturum_uygun ? (
                    <span className="rounded-md bg-navy-soft px-2 py-0.5 text-navy">Oturum izni uygun</span>
                  ) : null}
                  {p.golden_visa_esik != null ? (
                    <span className="rounded-md bg-amber/15 px-2 py-0.5 text-amber">Golden Vize</span>
                  ) : null}
                </div>
              ) : null}

              {/* İnşaat Zaman Çizelgesi */}
              <div className="mt-6 border-t border-hair pt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">
                    İnşaat: {ASAMA_ETIKET[p?.insaat_asamasi as InsaatAsama] || "Planlama"}
                  </span>
                  <span className="font-mono font-medium text-teal">%{p?.ilerleme_yuzde ?? 0}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-hair">
                  <div
                    className="h-full bg-teal transition-all duration-500"
                    style={{ width: `${p?.ilerleme_yuzde ?? 0}%` }}
                  />
                </div>
                {p?.teslim_tarihi ? (
                  <p className="mt-3 text-xs text-gray">
                    Tahmini Teslim: <span className="font-mono text-ink">{new Date(p.teslim_tarihi).toLocaleDateString("tr-TR", { year: 'numeric', month: 'long' })}</span>
                  </p>
                ) : null}
              </div>
            </div>

            {/* Daire Kat Planı ve Özellikleri */}
            <div className="rounded-2xl border border-hair bg-card p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-ink">Daire Detayları</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${DURUM_BG[bDurum]}`}>
                  {DURUM_ETIKET[bDurum]}
                </span>
              </div>

              {/* Daire Kat Planı Görseli */}
              {t?.plan_url ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-hair bg-paper flex items-center justify-center">
                  <img
                    src={t.plan_url}
                    alt="Daire Kat Planı"
                    className="max-h-full max-w-full object-contain p-4"
                  />
                </div>
              ) : null}

              {/* Özellikler Tablosu */}
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div className="rounded-xl bg-paper p-3">
                  <p className="text-xs text-gray">Daire No</p>
                  <p className="mt-1 font-mono text-base font-semibold text-ink">{b.daire_no || "—"}</p>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <p className="text-xs text-gray">Kat</p>
                  <p className="mt-1 font-mono text-base font-semibold text-ink">{b.kat != null ? `${b.kat}. Kat` : "—"}</p>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <p className="text-xs text-gray">Oda Sayısı</p>
                  <p className="mt-1 text-base font-semibold text-ink">{t?.oda || "—"}</p>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <p className="text-xs text-gray">Net Alan</p>
                  <p className="mt-1 font-mono text-base font-semibold text-ink">{b.net_m2 || t?.net_m2 || "—"} m²</p>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <p className="text-xs text-gray">Brüt Alan</p>
                  <p className="mt-1 font-mono text-base font-semibold text-ink">{b.brut_m2 || t?.brut_m2 || "—"} m²</p>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <p className="text-xs text-gray">Yön / Manzara</p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {[b.yon, b.manzara].filter(Boolean).join(" - ") || "—"}
                  </p>
                </div>
              </div>

              {/* Fiyat Bilgisi */}
              {liste != null && b.satilabilir ? (
                <div className="rounded-xl border border-hair bg-paper p-4 font-mono">
                  <span className="text-xs text-gray block">Liste Fiyatı</span>
                  <span className="text-2xl font-bold text-ink">{fmt(liste)} {psim}</span>
                  {odeme ? (
                    <div className="mt-3 space-y-1 border-t border-hair pt-3 text-sm">
                      {odeme.pesinat ? (
                        <div className="flex justify-between"><span className="text-gray">Peşinat</span><span className="text-ink">{fmt(odeme.pesinat)} {psim}</span></div>
                      ) : null}
                      {odeme.aylik ? (
                        <div className="flex justify-between"><span className="text-gray">{odeme.ay} ay taksit</span><span className="font-semibold text-ink">{fmt(odeme.aylik)} {psim}/ay</span></div>
                      ) : null}
                      {odeme.vade === 0 ? <p className="text-[11px] font-medium text-teal-d">Vade farksız</p> : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl bg-red/5 border border-red/10 p-4">
                  <p className="text-sm font-medium text-red">Bu birim satışa veya paylaşıma kapalıdır.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sağ Kolon: İletişim / Danışman & Lead Formu */}
          <div className="space-y-6">
            {/* Emlakçı Profil Kartı */}
            <div className="rounded-2xl border border-hair bg-card p-5 shadow-sm text-center">
              <p className="text-xs text-gray font-medium uppercase tracking-wider">Yetkili Danışman</p>
              
              <div className="mt-4 flex flex-col items-center">
                {profile.foto_url ? (
                  <div className="relative size-20 overflow-hidden rounded-full border border-hair flex items-center justify-center">
                    <img
                      src={profile.foto_url}
                      alt={profile.ad || "Danışman"}
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-full bg-navy text-2xl font-bold text-white font-display">
                    {profile.ad?.charAt(0).toUpperCase() || "E"}
                  </div>
                )}
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">{profile.ad || "—"}</h3>
                <p className="text-xs text-gray mt-0.5">Gayrimenkul Danışmanı</p>
                <div className="mt-4 flex w-full flex-col gap-2">
                  <a
                    href={`tel:${profile.telefon}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-hair px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper"
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {profile.telefon || "Ara"}
                  </a>
                  {profile.telefon ? (
                    <a
                      href={`https://wa.me/${profile.telefon.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-green px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      WhatsApp ile yaz
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Lead Formu */}
            {b.satilabilir && bDurum === "musait" ? (
              <LeadForm
                projeId={p?.id}
                birimId={b.id}
                emlakciId={emlakci}
              />
            ) : (
              <div className="rounded-2xl border border-hair bg-paper p-5 text-center">
                <p className="text-sm text-gray font-medium">
                  Bu daire {DURUM_ETIKET[bDurum]} olduğu için talep alımına kapalıdır.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
