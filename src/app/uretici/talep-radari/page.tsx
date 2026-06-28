import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { tazelik } from "@/lib/stok";
import { zamanOnce } from "@/lib/types";

/* =========================================================
   TALEP RADARI — gerçek stok metriklerinden içgörü (üretici).
   UYDURMA görüntülenme/talep YOK. Sayılar canlı stok + (RLS ile) kendi
   projelerinin events kayıtlarından gelir. İçgörü çok, grafik az.
   ========================================================= */

type BirimRaw = {
  proje_id: string;
  durum: string;
  son_guncelleme: string | null;
};

type EventRaw = {
  tip: string;
  proje_id: string | null;
  created_at: string;
};

const OLAY_ETIKET: Record<string, string> = {
  paylasim: "Paylaşım",
  goruntuleme: "Görüntüleme",
  lead: "Lead",
  satis: "Satış",
  opsiyon: "Opsiyon",
  durum: "Durum değişimi",
};

const OLAY_RENK: Record<string, string> = {
  satis: "var(--color-red)",
  opsiyon: "var(--color-amber)",
  lead: "var(--color-teal)",
  paylasim: "var(--color-navy)",
  goruntuleme: "var(--color-ink-soft)",
  durum: "var(--color-ink-soft)",
};

export default async function UreticiTalepRadari() {
  const supabase = await createClient();

  const [{ data: projeler }, { data: birimRaw }, { data: eventRaw }] = await Promise.all([
    supabase.from("proje").select("id, ad").order("created_at", { ascending: false }),
    supabase.from("birim").select("proje_id, durum, son_guncelleme"),
    supabase
      .from("events")
      .select("tip, proje_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const birimler = (birimRaw ?? []) as BirimRaw[];
  const events = (eventRaw ?? []) as EventRaw[];
  const projeAd = new Map((projeler ?? []).map((p) => [p.id, p.ad as string]));

  // Proje başı özet (müsait sayısı + satış oranı)
  type Ozet = { toplam: number; musait: number; opsiyon: number; satildi: number };
  const ozet = new Map<string, Ozet>();
  for (const b of birimler) {
    const o = ozet.get(b.proje_id) ?? { toplam: 0, musait: 0, opsiyon: 0, satildi: 0 };
    o.toplam++;
    if (b.durum === "musait") o.musait++;
    else if (b.durum === "opsiyonlu" || b.durum === "satis_beklemede") o.opsiyon++;
    else if (b.durum === "satildi") o.satildi++;
    ozet.set(b.proje_id, o);
  }

  // — İçgörü metrikleri (hepsi gerçek) —
  const toplam = birimler.length;
  const opsiyon = birimler.filter((b) => b.durum === "opsiyonlu" || b.durum === "satis_beklemede").length;
  const eskiBirimSay = birimler.filter((b) => tazelik(b.son_guncelleme).gun > 15).length;

  const enCokMusait = [...ozet.entries()].sort((a, b) => b[1].musait - a[1].musait)[0] ?? null;
  const enCokMusaitId = enCokMusait?.[0] ?? null;
  const enCokMusaitN = enCokMusait?.[1].musait ?? 0;

  // En yüksek satış oranlı proje (en az 1 birim)
  const oranliste = [...ozet.entries()]
    .filter(([, o]) => o.toplam > 0)
    .map(([id, o]) => ({ id, oran: Math.round((o.satildi / o.toplam) * 100), o }))
    .sort((a, b) => b.oran - a.oran);
  const enHizli = oranliste[0] ?? null;

  return (
    <div className="mx-auto max-w-[1640px] px-4 py-6 text-ink sm:px-6">
      <header className="belir mb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[27px] font-bold tracking-tight text-ink">Talep Radarı</h1>
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-soft px-2.5 py-[5px] text-[11.5px] font-semibold text-teal">
            <span className="inline-block size-[7px] rounded-full bg-teal" aria-hidden />
            Stoktan
          </span>
        </div>
        <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
          Canlı stoğundan türetilen içgörüler — şişen görüntülenme yok, yalnız gerçek hareket.
        </p>
      </header>

      {toplam === 0 ? (
        <div className="kart belir belir-1 p-12 text-center">
          <p className="text-[15px] font-bold text-ink">Radar için stok yok</p>
          <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
            Birim ekledikçe içgörüler burada belirir.
          </p>
          <Link href="/uretici/proje/yeni" className="mt-4 inline-block text-[13px] font-semibold text-teal hover:underline">
            Proje oluştur →
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* İÇGÖRÜ KARTLARI */}
          <div className="belir belir-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {opsiyon > 0 ? (
              <Insight
                sig="var(--color-amber)"
                ust="Aktif opsiyon"
                deger={String(opsiyon)}
                renk="text-amber"
                metin="birim karar bekliyor — teyit veya serbest bırakma için takip et."
                href="/uretici/opsiyonlar"
                hrefMetin="Opsiyonları gör →"
              />
            ) : null}

            {enCokMusaitId ? (
              <Insight
                sig="var(--color-green)"
                ust="En çok müsait stok"
                deger={String(enCokMusaitN)}
                renk="text-green"
                metin={`${projeAd.get(enCokMusaitId) ?? "—"} — paylaşıma en hazır proje.`}
                href={`/uretici/proje/${enCokMusaitId}`}
                hrefMetin="Projeyi aç →"
              />
            ) : null}

            {enHizli && enHizli.o.satildi > 0 ? (
              <Insight
                sig="var(--color-red)"
                ust="En hızlı satan proje"
                deger={`%${enHizli.oran}`}
                renk="text-ink"
                metin={`${projeAd.get(enHizli.id) ?? "—"} — ${enHizli.o.satildi}/${enHizli.o.toplam} birim satıldı.`}
                href={`/uretici/proje/${enHizli.id}`}
                hrefMetin="Projeyi aç →"
              />
            ) : null}

            {eskiBirimSay > 0 ? (
              <Insight
                sig="var(--color-red)"
                ust="Bayat stok"
                deger={String(eskiBirimSay)}
                renk="text-red"
                metin="birim 15 günden eski — fiyat/durum tazelenmesi öneriliyor (stale rozeti)."
                href="/uretici/stok"
                hrefMetin="Stoğu tazele →"
              />
            ) : null}

            {opsiyon === 0 && !enCokMusaitId && eskiBirimSay === 0 ? (
              <div className="kart col-span-full p-8 text-center text-[13px] text-[var(--ink-faint)]">
                Stok hareketlendikçe içgörüler burada belirir.
              </div>
            ) : null}
          </div>

          {/* SON HAREKETLER (events — RLS: kendi projeleri) */}
          <div className="kart belir belir-2 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--cizgi)] px-5 py-3.5">
              <svg width="16" height="16" className="text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <h2 className="font-display text-[15px] font-bold text-ink">Son Hareketler</h2>
              {events.length > 0 ? (
                <span className="ml-auto mono text-[11px] text-[var(--ink-faint)]">son {events.length}</span>
              ) : null}
            </div>

            {events.length === 0 ? (
              <p className="px-5 py-8 text-center text-[12.5px] text-[var(--ink-faint)]">
                Henüz hareket kaydı yok. Paylaşım, opsiyon ve satış olayları burada akar.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--cizgi)]">
                {events.map((e, i) => (
                  <li key={`${e.created_at}-${i}`} className="flex items-center gap-3 px-5 py-2.5">
                    <span
                      className="size-[7px] shrink-0 rounded-full"
                      style={{ background: OLAY_RENK[e.tip] ?? "var(--color-ink-soft)" }}
                    />
                    <span className="text-[12.5px] font-medium text-ink">{OLAY_ETIKET[e.tip] ?? e.tip}</span>
                    <span className="truncate text-[11.5px] text-[var(--ink-faint)]">
                      {e.proje_id ? projeAd.get(e.proje_id) ?? "—" : "—"}
                    </span>
                    <span className="mono ml-auto shrink-0 text-[11px] text-[var(--ink-faint)]">
                      {zamanOnce(e.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Insight({
  sig,
  ust,
  deger,
  renk,
  metin,
  href,
  hrefMetin,
}: {
  sig: string;
  ust: string;
  deger: string;
  renk: string;
  metin: string;
  href: string;
  hrefMetin: string;
}) {
  return (
    <Link
      href={href}
      className="kart kart-3d signal-top group block p-5"
      style={{ ["--_sig" as string]: sig }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{ust}</div>
      <div className={`mono mt-1 text-[30px] font-semibold leading-none ${renk}`}>{deger}</div>
      <p className="mt-2 text-[12.5px] leading-snug text-ink-soft">{metin}</p>
      <span className="mt-3 inline-block text-[11.5px] font-semibold text-teal group-hover:underline">
        {hrefMetin}
      </span>
    </Link>
  );
}
