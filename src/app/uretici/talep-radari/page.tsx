import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tazelik } from "@/lib/stok";
import { zamanOnce } from "@/lib/types";

/* =========================================================
   TALEP RADARI / SATIŞ ZEKÂSI — veri-moat (üretici).
   Rakipler stok gösterir; biz emlakçı AĞINDAKİ davranışı ölçeriz.
   Tüm sayı GERÇEK events'ten. SCOPE: kodda üreticinin kendi proje id'leri
   (events RLS'e güvenmeden) → çapraz-üretici sızıntı imkânsız.
   ========================================================= */

type EventRaw = {
  tip: string;
  proje_id: string | null;
  birim_id: string | null;
  profile_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};
type BirimRaw = { proje_id: string; durum: string; son_guncelleme: string | null };

const OLAY_ETIKET: Record<string, string> = {
  paylasim: "Paylaşım", goruntuleme: "Görüntüleme", lead: "Lead",
  satis: "Satış", opsiyon: "Opsiyon talebi", durum: "Durum değişimi",
};
const OLAY_RENK: Record<string, string> = {
  satis: "var(--color-red)", opsiyon: "var(--color-amber)", lead: "var(--color-green)",
  paylasim: "var(--color-navy)", goruntuleme: "var(--color-ink-soft)", durum: "var(--color-ink-soft)",
};
const KANAL_ETIKET: Record<string, string> = {
  mikrosite: "Mikrosite", "proje karti": "Proje kartı", manuel: "Manuel", diğer: "Diğer",
};

function gunOnce(g: number): string {
  return new Date(Date.now() - g * 86_400_000).toISOString();
}

export default async function UreticiTalepRadari() {
  const supabase = await createClient();
  const otuzGunOnce = gunOnce(30);
  const yediGunOnce = gunOnce(7);

  const [{ data: projeler }, { data: birimRaw }, { data: eventRaw }] = await Promise.all([
    supabase.from("proje").select("id, ad").order("created_at", { ascending: false }),
    supabase.from("birim").select("proje_id, durum, son_guncelleme"),
    supabase
      .from("events")
      .select("tip, proje_id, birim_id, profile_id, payload, created_at")
      .gte("created_at", otuzGunOnce)
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const projeAd = new Map((projeler ?? []).map((p) => [p.id, p.ad as string]));
  const projeIds = new Set(projeAd.keys());
  // SCOPE: yalnız üreticinin kendi projeleri (events RLS'e güvenme)
  const events = ((eventRaw ?? []) as EventRaw[]).filter((e) => e.proje_id && projeIds.has(e.proje_id));
  const birimler = ((birimRaw ?? []) as BirimRaw[]).filter((b) => projeIds.has(b.proje_id));
  const son7 = events.filter((e) => e.created_at >= yediGunOnce);
  const say = (tip: string) => son7.filter((e) => e.tip === tip).length;

  // — DÖNÜŞÜM HUNİSİ (7g) —
  const funnel = [
    { ad: "Paylaşım", n: say("paylasim"), renk: "var(--color-navy)" },
    { ad: "Görüntüleme", n: say("goruntuleme"), renk: "var(--color-teal)" },
    { ad: "Lead", n: say("lead"), renk: "var(--color-green)" },
    { ad: "Opsiyon talebi", n: say("opsiyon"), renk: "var(--color-amber)" },
  ];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.n));
  const funnelToplam = funnel.reduce((t, f) => t + f.n, 0);

  // — KANAL dağılımı (paylaşım+görüntüleme kaynak) —
  const kanal = new Map<string, number>();
  for (const e of son7)
    if (e.tip === "paylasim" || e.tip === "goruntuleme") {
      const k = ((e.payload?.kaynak as string) || "diğer").toLowerCase();
      kanal.set(k, (kanal.get(k) ?? 0) + 1);
    }
  const kanalListe = [...kanal.entries()].sort((a, b) => b[1] - a[1]);
  const kanalToplam = Math.max(1, kanalListe.reduce((t, [, n]) => t + n, 0));

  // — DANIŞMAN aktivite (7g) → admin client ile ad —
  const danAkt = new Map<string, number>();
  for (const e of son7)
    if (e.profile_id && (e.tip === "paylasim" || e.tip === "goruntuleme"))
      danAkt.set(e.profile_id, (danAkt.get(e.profile_id) ?? 0) + 1);
  const danTop = [...danAkt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  let danAd = new Map<string, string | null>();
  if (danTop.length) {
    try {
      const admin = createAdminClient();
      const { data: prof } = await admin.from("profiles").select("id, ad").in("id", danTop.map((d) => d[0]));
      danAd = new Map((prof ?? []).map((p) => [p.id as string, p.ad as string | null]));
    } catch {
      danAd = new Map();
    }
  }

  // — Proje özetleri (müsait/opsiyon/satıldı) —
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
  const toplam = birimler.length;
  const opsiyon = birimler.filter((b) => b.durum === "opsiyonlu" || b.durum === "satis_beklemede").length;
  const eskiBirimSay = birimler.filter((b) => tazelik(b.son_guncelleme).gun > 15).length;

  // — İLGİ VAR, OPSİYON YOK (7g görüntüleme yüksek + 0 opsiyon) —
  const projGor = new Map<string, number>();
  for (const e of son7) if (e.tip === "goruntuleme" && e.proje_id) projGor.set(e.proje_id, (projGor.get(e.proje_id) ?? 0) + 1);
  const ilgiOpsYok =
    [...projGor.entries()]
      .filter(([id, g]) => g >= 5 && (ozet.get(id)?.opsiyon ?? 0) === 0)
      .sort((a, b) => b[1] - a[1])[0] ?? null;

  const enCokGor = [...projGor.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const enCokMusait = [...ozet.entries()].sort((a, b) => b[1].musait - a[1].musait)[0] ?? null;
  const oranliste = [...ozet.entries()]
    .filter(([, o]) => o.toplam > 0 && o.satildi > 0)
    .map(([id, o]) => ({ id, oran: Math.round((o.satildi / o.toplam) * 100), o }))
    .sort((a, b) => b.oran - a.oran);
  const enHizli = oranliste[0] ?? null;
  const feed = events.slice(0, 18);

  return (
    <div className="mx-auto max-w-[1640px] px-4 py-6 text-ink sm:px-6">
      <header className="belir mb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[27px] font-bold tracking-tight text-ink">Talep Radarı · Satış Zekâsı</h1>
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-soft px-2.5 py-[5px] text-[11.5px] font-semibold text-teal">
            <span className="nabiz inline-block size-[7px] rounded-full bg-teal" aria-hidden />
            son 7 gün
          </span>
        </div>
        <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
          Emlakçı ağındaki gerçek davranış — paylaşım → görüntüleme → lead → talep. Şişirilmiş veri yok; geçmişe doldurulamaz (= moat).
        </p>
      </header>

      {toplam === 0 ? (
        <div className="kart belir belir-1 p-12 text-center">
          <p className="text-[15px] font-bold text-ink">Radar için stok yok</p>
          <Link href="/uretici/proje/yeni" className="mt-3 inline-block text-[13px] font-semibold text-teal hover:underline">Proje oluştur →</Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="belir belir-1 space-y-5">
            {/* DÖNÜŞÜM HUNİSİ */}
            <section className="kart p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[15px] font-bold text-ink">Dönüşüm Hunisi · 7g</h2>
                <span className="mono text-[11px] text-[var(--ink-faint)]">{funnelToplam} olay</span>
              </div>
              {funnelToplam === 0 ? (
                <p className="mt-3 text-[12.5px] text-[var(--ink-faint)]">
                  Henüz hareket yok. Emlakçılar paylaştıkça/müşteri görüntüledikçe huni burada dolar.
                </p>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {funnel.map((f, i) => {
                    const onceki = i > 0 ? funnel[i - 1].n : null;
                    const oran = onceki && onceki > 0 ? Math.round((f.n / onceki) * 100) : null;
                    return (
                      <div key={f.ad} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-[12.5px] font-medium text-ink-soft">{f.ad}</span>
                        <div className="flex-1 overflow-hidden rounded-lg bg-soft">
                          <div
                            className="flex h-7 items-center justify-end rounded-lg px-2.5 transition-all"
                            style={{ width: `${Math.max(8, (f.n / funnelMax) * 100)}%`, background: f.renk }}
                          >
                            <span className="mono text-[12px] font-bold text-white">{f.n}</span>
                          </div>
                        </div>
                        <span className="w-12 shrink-0 text-right mono text-[11px] text-[var(--ink-faint)]">
                          {oran != null ? `${oran}%` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* İÇGÖRÜ KARTLARI */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ilgiOpsYok ? (
                <Insight sig="var(--color-amber)" ust="İlgi var, opsiyon yok ⚠" deger={String(ilgiOpsYok[1])}
                  renk="text-amber" metin={`${projeAd.get(ilgiOpsYok[0]) ?? "—"} — 7g'de ${ilgiOpsYok[1]} görüntüleme ama hiç opsiyon talebi yok. Fiyat/tahsis gözden geçir.`}
                  href={`/uretici/proje/${ilgiOpsYok[0]}`} hrefMetin="Projeyi aç →" />
              ) : null}
              {enCokGor ? (
                <Insight sig="var(--color-teal)" ust="En çok ilgi gören · 7g" deger={String(enCokGor[1])}
                  renk="text-teal-d" metin={`${projeAd.get(enCokGor[0]) ?? "—"} — son 7 günde en çok görüntülenen proje.`}
                  href={`/uretici/proje/${enCokGor[0]}`} hrefMetin="Projeyi aç →" />
              ) : null}
              {opsiyon > 0 ? (
                <Insight sig="var(--color-amber)" ust="Aktif opsiyon" deger={String(opsiyon)}
                  renk="text-amber" metin="birim karar bekliyor — teyit veya serbest bırak." href="/uretici/opsiyonlar" hrefMetin="Opsiyonları gör →" />
              ) : null}
              {enCokMusait ? (
                <Insight sig="var(--color-green)" ust="En çok müsait stok" deger={String(enCokMusait[1].musait)}
                  renk="text-green" metin={`${projeAd.get(enCokMusait[0]) ?? "—"} — paylaşıma en hazır proje.`}
                  href={`/uretici/proje/${enCokMusait[0]}`} hrefMetin="Projeyi aç →" />
              ) : null}
              {enHizli ? (
                <Insight sig="var(--color-red)" ust="En hızlı satan" deger={`%${enHizli.oran}`}
                  renk="text-ink" metin={`${projeAd.get(enHizli.id) ?? "—"} — ${enHizli.o.satildi}/${enHizli.o.toplam} satıldı.`}
                  href={`/uretici/proje/${enHizli.id}`} hrefMetin="Projeyi aç →" />
              ) : null}
              {eskiBirimSay > 0 ? (
                <Insight sig="var(--color-red)" ust="Bayat stok" deger={String(eskiBirimSay)}
                  renk="text-red" metin="birim 15 günden eski — fiyat/durum tazele (stale rozeti)." href="/uretici/stok" hrefMetin="Stoğu tazele →" />
              ) : null}
            </div>

            {/* KANAL DAĞILIMI */}
            {kanalListe.length > 0 ? (
              <section className="kart p-5">
                <h2 className="font-display text-[15px] font-bold text-ink">Kanal Dağılımı · 7g</h2>
                <div className="mt-3 space-y-2">
                  {kanalListe.map(([k, n]) => (
                    <div key={k} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-[12.5px] text-ink-soft">{KANAL_ETIKET[k] ?? k}</span>
                      <div className="flex-1 overflow-hidden rounded-md bg-soft">
                        <div className="h-2.5 rounded-md bg-teal" style={{ width: `${(n / kanalToplam) * 100}%` }} />
                      </div>
                      <span className="w-16 shrink-0 text-right mono text-[11.5px] text-ink-soft">{n} · %{Math.round((n / kanalToplam) * 100)}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* SAĞ RAY: danışman aktivite + son hareketler */}
          <div className="belir belir-2 space-y-5">
            {danTop.length > 0 ? (
              <section className="kart overflow-hidden">
                <div className="border-b border-[var(--cizgi)] px-5 py-3.5">
                  <h2 className="font-display text-[15px] font-bold text-ink">En Aktif Danışmanlar · 7g</h2>
                </div>
                <ul className="divide-y divide-[var(--cizgi)]">
                  {danTop.map(([id, n], i) => (
                    <li key={id} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="mono w-5 shrink-0 text-[12px] font-bold text-[var(--ink-faint)]">{i + 1}</span>
                      <span className="flex-1 truncate text-[13px] font-medium text-ink">{danAd.get(id) ?? "Danışman"}</span>
                      <span className="mono shrink-0 text-[12px] font-semibold text-teal-d">{n}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="kart overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[var(--cizgi)] px-5 py-3.5">
                <svg width="16" height="16" className="text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                <h2 className="font-display text-[15px] font-bold text-ink">Son Hareketler</h2>
              </div>
              {feed.length === 0 ? (
                <p className="px-5 py-8 text-center text-[12.5px] text-[var(--ink-faint)]">Henüz hareket yok.</p>
              ) : (
                <ul className="divide-y divide-[var(--cizgi)]">
                  {feed.map((e, i) => (
                    <li key={`${e.created_at}-${i}`} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="size-[7px] shrink-0 rounded-full" style={{ background: OLAY_RENK[e.tip] ?? "var(--color-ink-soft)" }} />
                      <span className="text-[12.5px] font-medium text-ink">{OLAY_ETIKET[e.tip] ?? e.tip}</span>
                      <span className="truncate text-[11.5px] text-[var(--ink-faint)]">{e.proje_id ? projeAd.get(e.proje_id) ?? "—" : "—"}</span>
                      <span className="mono ml-auto shrink-0 text-[11px] text-[var(--ink-faint)]">{zamanOnce(e.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function Insight({ sig, ust, deger, renk, metin, href, hrefMetin }: {
  sig: string; ust: string; deger: string; renk: string; metin: string; href: string; hrefMetin: string;
}) {
  return (
    <Link href={href} className="kart kart-3d signal-top group block p-5" style={{ ["--_sig" as string]: sig }}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{ust}</div>
      <div className={`mono mt-1 text-[30px] font-semibold leading-none ${renk}`}>{deger}</div>
      <p className="mt-2 text-[12.5px] leading-snug text-ink-soft">{metin}</p>
      <span className="mt-3 inline-block text-[11.5px] font-semibold text-teal group-hover:underline">{hrefMetin}</span>
    </Link>
  );
}
