import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ASAMA_ETIKET, fmtPara, type InsaatAsama } from "@/lib/types";
import { EmlakciStok } from "@/components/EmlakciStok";
import { PaylasWhatsApp } from "@/components/PaylasWhatsApp";
import { projeKapak } from "@/lib/gorsel";
import { generateShareToken } from "@/lib/sharing";

type Belge = { id: string; tip: string | null; ad: string | null; url: string | null };
type Mahal = { id: string; mahal: string; zemin: string | null; duvar: string | null; tavan: string | null; marka: string | null };
type Tip = { id: string; ad: string | null; oda: string | null; net_m2: number | null; taban_fiyat: number | null; plan_url: string | null };

function trTarih(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { year: "numeric", month: "short" });
}

/** Bölüm başlığı — v2 spatial: mono caps + ince ayraç. */
function BolumBaslik({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mono border-b border-hair pb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
      {children}
    </h2>
  );
}

export default async function HavuzProjeDetay({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { id } = await params;
  const { hata, mesaj } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const emlakciId = user?.id ?? "";

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3535";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const appUrl = `${protocol}://${host}`;

  // RLS: proje_emlakci_select → tahsisli değilse satır gelmez
  const { data: proje } = await supabase.from("proje").select("*").eq("id", id).single();
  if (!proje) notFound();

  const [{ data: bloklar }, { data: tipler }, { data: birimler }, { data: belgelerRaw }, { data: mahallerRaw }] =
    await Promise.all([
      supabase.from("blok").select("id, ad, kat_sayisi").eq("proje_id", id).order("ad"),
      supabase.from("daire_tipi").select("id, ad, oda, net_m2, taban_fiyat, plan_url").eq("proje_id", id).order("ad"),
      supabase
        .from("birim")
        .select(
          "id, blok_id, tip_id, kat, daire_no, durum, liste_fiyati, para_birimi, satilabilir, net_m2, brut_m2, yon, manzara, serefiye, odeme_plani, durum_notu, son_guncelleme",
        )
        .eq("proje_id", id),
      supabase.from("proje_belge").select("id, tip, ad, url").eq("proje_id", id).order("created_at", { ascending: false }),
      supabase.from("mahal").select("id, mahal, zemin, duvar, tavan, marka").eq("proje_id", id).order("sira").order("created_at"),
    ]);

  const belgeler = (belgelerRaw ?? []) as Belge[];
  const mahaller = (mahallerRaw ?? []) as Mahal[];
  const tipListe = (tipler ?? []) as Tip[];
  const kunye = (proje.kunye ?? {}) as Record<string, unknown>;

  const kapakBelge = belgeler.find((b) => b.tip === "kapak")?.url ?? null;
  const kapak = projeKapak(kapakBelge, proje.id);
  const fotolar = belgeler.filter((b) => b.tip === "foto" && b.url);
  const videoBelgeler = belgeler.filter((b) => b.tip === "video" && b.url);
  const brosurler = belgeler.filter((b) => b.tip === "brosur" && b.url);
  const planliTipler = tipListe.filter((t) => t.plan_url);
  const konum = [proje.mahalle, proje.ilce, proje.il].filter(Boolean).join(", ") || "—";
  const haritaVar = proje.lat != null && proje.lng != null;
  const haritaUrl = haritaVar ? `https://www.google.com/maps/search/?api=1&query=${proje.lat},${proje.lng}` : null;

  const donati = Array.isArray(kunye.donati) ? (kunye.donati as string[]) : [];
  const malzeme = Array.isArray(kunye.malzeme) ? (kunye.malzeme as string[]) : [];
  const kunyeSatir: [string, string][] = [
    ["Ada / Parsel", `${proje.ada ?? "—"} / ${proje.parsel ?? "—"}`],
    ["Emsal (KAKS)", proje.emsal ? String(proje.emsal) : "—"],
    ["TAKS", proje.taks ? String(proje.taks) : "—"],
    ["İmar Durumu", (kunye.imar_durumu as string) ?? "—"],
    ["Arsa Alanı", kunye.arsa_alani ? `${kunye.arsa_alani} m²` : "—"],
    ["Otopark", (kunye.otopark as string) ?? "—"],
  ];
  const kunyeVar = !!(
    proje.ada ||
    proje.emsal ||
    proje.taks ||
    kunye.imar_durumu ||
    kunye.otopark ||
    kunye.arsa_alani ||
    donati.length ||
    malzeme.length
  );

  // Tahsisli stoktan KPI — fiyat aralığı yalnız müsait birimlerden
  const stok = birimler ?? [];
  const toplam = stok.length;
  const musait = stok.filter((b) => b.durum === "musait").length;
  const opsiyon = stok.filter((b) => b.durum === "opsiyonlu" || b.durum === "satis_beklemede").length;
  const fiyatlar = stok
    .filter((b) => b.durum === "musait" && Number(b.liste_fiyati) > 0)
    .map((b) => Number(b.liste_fiyati));
  const paraBirim = (stok.find((b) => b.para_birimi)?.para_birimi as string) ?? "TRY";
  const fiyatAralik =
    fiyatlar.length === 0
      ? "—"
      : Math.min(...fiyatlar) === Math.max(...fiyatlar)
        ? fmtPara(Math.min(...fiyatlar), paraBirim)
        : `${fmtPara(Math.min(...fiyatlar), paraBirim)} – ${fmtPara(Math.max(...fiyatlar), paraBirim)}`;

  const shareUrlMap = Object.fromEntries(
    stok.map((b) => [b.id, `${appUrl}/p/${emlakciId}/${b.id}/${generateShareToken(emlakciId, b.id)}`]),
  );

  // Bu emlakçının KENDİ opsiyonladığı birimler (DaireModal'da "Opsiyonu bırak" yalnız bunlarda)
  const { data: benimOps } = await supabase
    .from("opsiyon")
    .select("birim_id")
    .eq("satici_id", emlakciId)
    .in("durum", ["opsiyonlu", "satis_beklemede"]);
  const benimOpsiyonlar = (benimOps ?? []).map((o) => o.birim_id as string);

  // WhatsApp paylaşım — proje konum/aşama özeti. (public_slug /proje route'u Faz-2; 404 link basma.)
  const paylasimMetni = `${proje.ad} · ${konum}\nİnşaat: ${ASAMA_ETIKET[proje.insaat_asamasi as InsaatAsama]} (%${proje.ilerleme_yuzde})`;

  return (
    <div className="belir mx-auto max-w-5xl py-2">
      <Link
        href="/havuz"
        className="mono mb-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-teal-d transition-colors hover:text-teal"
      >
        <span aria-hidden>←</span> Havuz Listesine Dön
      </Link>

      {hata ? (
        <p role="alert" className="mb-4 rounded-xl border border-red/20 bg-red-soft px-4 py-2.5 text-sm font-medium text-red">
          {hata}
        </p>
      ) : null}
      {mesaj ? (
        <p className="mb-4 rounded-xl border border-green/20 bg-green-soft px-4 py-2.5 text-sm font-medium text-teal-d">
          {mesaj}
        </p>
      ) : null}

      {/* ===== HERO ===== */}
      <div className="relative overflow-hidden rounded-[20px] border border-hair bg-card shadow-card">
        <div className="relative aspect-[16/8] w-full sm:aspect-[16/6]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={kapak} alt={proje.ad} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />

          {/* Paylaş — sağ üst */}
          <PaylasWhatsApp text={paylasimMetni} projeId={id} className="btn-wa absolute right-4 top-4 z-10 shadow-card">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.5 14.2c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3.2-.7-2.7-1.1-4.4-3.9-4.5-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.2-.2.3-.3.5l-.5.5c-.2.2-.3.3-.1.6.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.6 1.6.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1l1.8.9c.2.1.4.2.5.3.1.2.1.7-.1 1.2Z" />
            </svg>
            WhatsApp Paylaş
          </PaylasWhatsApp>
        </div>

        {/* Hero alt bilgi */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-white drop-shadow sm:text-3xl">{proje.ad}</h1>
            {proje.belge_dogrulandi ? (
              <span className="rozet bg-teal-soft text-teal-d shadow-card">✓ Doğrulanmış</span>
            ) : null}
            {proje.etap ? <span className="rozet bg-white/90 text-ink">{proje.etap}</span> : null}
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-white/85">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {konum}
          </p>

          {/* İlerleme barı */}
          <div className="mt-4 max-w-xl">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-white/85">
              <span>
                İnşaat: <span className="font-bold text-white">{ASAMA_ETIKET[proje.insaat_asamasi as InsaatAsama]}</span>
              </span>
              <span className="mono font-bold text-white">%{proje.ilerleme_yuzde}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal to-green"
                style={{ width: `${proje.ilerleme_yuzde}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-white/80">
              {([
                ["Başlama", proje.baslama_tarihi],
                ["Teslim", proje.teslim_tarihi],
                ["İskân", proje.iskan_tarihi],
              ] as [string, string | null][]).map(([et, t]) => (
                <span key={et} className="mono">
                  <span className="text-white/60">{et}:</span> <span className="font-semibold text-white">{trTarih(t)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== HIZLI KPI ŞERİDİ ===== */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          ["Tahsisli Stok", String(toplam), "var(--color-navy)"],
          ["Müsait", String(musait), "var(--color-green)"],
          ["Opsiyonlu", String(opsiyon), "var(--color-amber)"],
          ["Fiyat Aralığı", fiyatAralik, "var(--color-teal)"],
        ] as [string, string, string][]).map(([et, sy, sig]) => (
          <div
            key={et}
            className="kart signal-top p-4"
            style={{ ["--_sig" as string]: sig }}
          >
            <p className="mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">{et}</p>
            <p className="mono mt-1 text-xl font-semibold tabular-nums text-ink sm:text-2xl">{sy}</p>
          </div>
        ))}
      </div>

      {/* ===== GÖRSELLER ===== */}
      {fotolar.length > 0 ? (
        <div className="kart mt-5 p-5 sm:p-6">
          <BolumBaslik>Görseller · {fotolar.length}</BolumBaslik>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {fotolar.map((f) => (
              <a
                key={f.id}
                href={f.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="group block aspect-[4/3] overflow-hidden rounded-2xl border border-hair bg-soft"
                title={f.ad ?? "Görseli büyüt"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url!}
                  alt={f.ad ?? "Proje görseli"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {/* ===== VİDEO ===== */}
      {videoBelgeler.length > 0 || proje.video_url ? (
        <div className="kart mt-5 p-5 sm:p-6">
          <BolumBaslik>Tanıtım Videosu</BolumBaslik>
          <div className="mt-4 flex flex-wrap gap-3">
            {proje.video_url ? (
              <a
                href={proje.video_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-action"
              >
                <span aria-hidden>▶</span> Tanıtım Videosunu İzle
              </a>
            ) : null}
            {videoBelgeler.map((v) => (
              <a key={v.id} href={v.url!} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <span aria-hidden>▶</span> {v.ad || "Video"}
              </a>
            ))}
            {brosurler.map((b) => (
              <a key={b.id} href={b.url!} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <span aria-hidden>📄</span> {b.ad || "Broşür / E-Katalog"}
              </a>
            ))}
          </div>
        </div>
      ) : brosurler.length > 0 ? (
        <div className="kart mt-5 p-5 sm:p-6">
          <BolumBaslik>Katalog</BolumBaslik>
          <div className="mt-4 flex flex-wrap gap-3">
            {brosurler.map((b) => (
              <a key={b.id} href={b.url!} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <span aria-hidden>📄</span> {b.ad || "Broşür / E-Katalog"}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {/* ===== KAT PLANLARI ===== */}
      {planliTipler.length > 0 ? (
        <div className="kart mt-5 p-5 sm:p-6">
          <BolumBaslik>Kat Planları · {planliTipler.length} tip</BolumBaslik>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {planliTipler.map((t) => (
              <a
                key={t.id}
                href={t.plan_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-2xl border border-hair bg-card transition-all hover:shadow-card"
              >
                <div className="aspect-square overflow-hidden bg-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.plan_url!}
                    alt={`${t.ad ?? "Tip"} kat planı`}
                    className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="border-t border-hair px-3 py-2.5">
                  <p className="text-sm font-semibold text-ink">{t.ad ?? "Tip"}</p>
                  <p className="mono mt-0.5 text-[11px] text-gray">
                    {[t.oda, t.net_m2 ? `${t.net_m2} m²` : null].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {/* ===== KÜNYE & DONATI ===== */}
      {kunyeVar ? (
        <div className="kart mt-5 p-5 sm:p-6">
          <BolumBaslik>Künye &amp; Donatı</BolumBaslik>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {kunyeSatir.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-hair bg-soft p-3">
                <p className="mono text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">{k}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{v}</p>
              </div>
            ))}
          </div>

          {donati.length > 0 ? (
            <div className="mt-5">
              <p className="mono mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
                Sosyal Donatılar
              </p>
              <div className="flex flex-wrap gap-2">
                {donati.map((d) => (
                  <span key={d} className="rounded-xl border border-hair bg-teal-soft px-3 py-1.5 text-[13px] font-semibold text-teal-d">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {malzeme.length > 0 ? (
            <div className="mt-5">
              <p className="mono mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
                Yapı Malzemeleri &amp; Standartlar
              </p>
              <ul className="grid gap-2 text-[13px] font-medium text-ink sm:grid-cols-2">
                {malzeme.map((m) => (
                  <li key={m} className="flex items-center gap-2 rounded-xl border border-hair bg-soft px-3 py-2">
                    <span className="size-1.5 shrink-0 rounded-full bg-teal" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ===== MAHAL LİSTESİ ===== */}
      {mahaller.length > 0 ? (
        <div className="kart mt-5 p-5 sm:p-6">
          <BolumBaslik>Mahal Listesi · Teslim Standardı</BolumBaslik>
          <div className="mt-4 overflow-x-auto">
            <table className="tbl min-w-[460px]">
              <thead>
                <tr>
                  <th>Mahal</th>
                  <th>Zemin</th>
                  <th>Duvar</th>
                  <th>Tavan</th>
                  <th>Marka</th>
                </tr>
              </thead>
              <tbody>
                {mahaller.map((m) => (
                  <tr key={m.id}>
                    <td className="font-semibold text-ink">{m.mahal}</td>
                    <td className="mono text-gray">{m.zemin ?? "—"}</td>
                    <td className="mono text-gray">{m.duvar ?? "—"}</td>
                    <td className="mono text-gray">{m.tavan ?? "—"}</td>
                    <td className="font-semibold text-ink">{m.marka ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* ===== KONUM ===== */}
      {haritaVar || proje.mahalle || proje.ilce ? (
        <div className="kart mt-5 p-5 sm:p-6">
          <BolumBaslik>Konum</BolumBaslik>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">{konum}</p>
              {haritaVar ? (
                <p className="mono mt-0.5 text-[11px] text-gray">
                  {Number(proje.lat).toFixed(5)}, {Number(proje.lng).toFixed(5)}
                </p>
              ) : null}
            </div>
            {haritaUrl ? (
              <a href={haritaUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Haritada Aç
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ===== FİYAT LİSTESİ · CANLI STOK ===== */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Fiyat Listesi · Canlı Stok</h2>
        <div className="mt-4">
          {toplam === 0 ? (
            <p className="rounded-2xl border border-dashed border-hair bg-card/60 p-10 text-center text-sm leading-relaxed text-gray">
              Bu projede size tahsis edilmiş herhangi bir stok bulunmuyor. Üretici tanımladığında burada görüntülenecektir.
            </p>
          ) : (
            <EmlakciStok
              projeId={id}
              projeAd={proje.ad}
              bloklar={bloklar ?? []}
              tipler={tipler ?? []}
              baslangic={stok as never}
              shareUrlMap={shareUrlMap}
              benimOpsiyonlar={benimOpsiyonlar}
            />
          )}
        </div>
      </div>
    </div>
  );
}
