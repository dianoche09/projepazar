import { notFound } from "next/navigation";
import { verifyShareToken } from "@/lib/sharing";
import { createAdminClient } from "@/lib/supabase/admin";
import { DURUM_BG, DURUM_ETIKET, ASAMA_ETIKET, zamanOnce, type BirimDurum, type InsaatAsama } from "@/lib/types";
import LeadForm from "./LeadForm";
import { GridMark } from "@/components/GridMark";

const fmt = (n: number) => n.toLocaleString("tr-TR");

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
      id, daire_no, kat, durum, liste_fiyati, para_birimi, net_m2, brut_m2, yon, manzara, satilabilir, son_guncelleme,
      proje:proje_id (
        id, ad, il, ilce, mahalle, insaat_asamasi, ilerleme_yuzde, teslim_tarihi, sorumlu_ad, sorumlu_tel, lat, lng,
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

  const bDurum = b.durum as BirimDurum;
  const liste = b.liste_fiyati;

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
          <div className="flex items-center gap-1.5 font-mono text-xs text-gray">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-green"></span>
            </span>
            {zamanOnce(b.son_guncelleme)} güncellendi
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-5xl px-6">
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
                  <span className="text-2xl font-bold text-ink">
                    {fmt(liste)} {b.para_birimi === "TRY" ? "₺" : b.para_birimi}
                  </span>
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
                <a
                  href={`tel:${profile.telefon}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-hair px-4 py-2 text-sm font-semibold text-ink hover:bg-paper transition-colors"
                >
                  📞 {profile.telefon || "Arayın"}
                </a>
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
