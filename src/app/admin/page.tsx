import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmtPara, zamanOnce, ABONELIK_DURUM_ETIKET, type AbonelikDurum } from "@/lib/types";
import { kullaniciOnayla, kullaniciReddet } from "./actions";
import { Donut } from "@/components/ui/Grafik";

const C = { navy: "#13314B", teal: "#1E9B8A", amber: "#E3A12C" };

// Avatar gradyanı — ada göre deterministik (4 ton arası).
const AVATAR_GRADIENT = [
  "linear-gradient(150deg,#1b5e6e,#1e9b8a)",
  "linear-gradient(150deg,#c98a2e,#e3a12c)",
  "linear-gradient(150deg,#2a4d6e,#13314b)",
  "linear-gradient(150deg,#6b7a8c,#98a2b3)",
];
function gradyan(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_GRADIENT[Math.abs(h) % AVATAR_GRADIENT.length];
}
function basHarf(ad: string | null): string {
  if (!ad) return "—";
  const p = ad.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || ad.slice(0, 2).toUpperCase();
}

// Rol → rozet stili (onay kuyruğu)
const ROL_ROZET: Record<string, string> = {
  uretici: "bg-navy/10 text-navy",
  emlakci: "bg-teal/12 text-teal-d",
  ofis_yetkili: "bg-amber-soft text-amber",
  marka_yetkili: "bg-navy/10 text-navy",
  arsa_sahibi: "bg-gray/12 text-gray",
};
const ROL_KISA: Record<string, string> = {
  uretici: "Üretici",
  emlakci: "Emlakçı",
  ofis_yetkili: "Ofis yetkilisi",
  marka_yetkili: "Marka yetkilisi",
  arsa_sahibi: "Arsa sahibi",
};

// Denetim olay tipi → renk + etiket (v2-admin iz zinciri)
const TIP_RENK: Record<string, { ad: string; dot: string; rozet: string }> = {
  opsiyon: { ad: "opsiyon", dot: C.amber, rozet: "bg-amber-soft text-amber" },
  satis: { ad: "satış", dot: "#d15a4e", rozet: "bg-red/12 text-red" },
  durum: { ad: "stok", dot: C.teal, rozet: "bg-teal/12 text-teal-d" },
  lead: { ad: "lead", dot: C.navy, rozet: "bg-navy/10 text-navy" },
  paylasim: { ad: "paylaşım", dot: C.teal, rozet: "bg-teal/12 text-teal-d" },
  goruntuleme: { ad: "görüntüleme", dot: "#98a2b3", rozet: "bg-gray/12 text-gray" },
};
const TIP_BASLIK: Record<string, string> = {
  opsiyon: "Opsiyon alındı",
  satis: "Satış kapandı",
  durum: "Durum değişti",
  lead: "Lead düştü",
  paylasim: "Paylaşıldı",
  goruntuleme: "Görüntülendi",
};

type Olay = {
  id: number;
  tip: string;
  profile_id: string | null;
  proje_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export default async function AdminPanel() {
  const supabase = await createClient();
  let admin: ReturnType<typeof createAdminClient> | null = null;
  try {
    admin = createAdminClient();
  } catch {
    admin = null; // servis anahtarı yoksa panel çökmez; denetim bloğu boş gelir (DEĞİŞMEZ #6 graceful)
  }

  const [
    { data: ureticiler },
    { data: dogrulanmamisUret },
    { data: ofisler },
    { data: profiller },
    { data: paketler },
    { data: abonelikler },
    { data: bekleyenler },
    { data: ofisAdlar },
  ] = await Promise.all([
    supabase.from("uretici").select("id, dogrulanmis"),
    supabase
      .from("uretici")
      .select("id, ad, vergi_no")
      .eq("dogrulanmis", false)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("ofis").select("id, ad, marka"),
    supabase.from("profiles").select("rol, ofis_id"),
    supabase.from("abonelik_paketi").select("id, ad, fiyat_aylik"),
    supabase.from("abonelik").select("ofis_id, paket_id, durum").in("durum", ["deneme", "aktif"]),
    supabase
      .from("profiles")
      .select("id, ad, talep_rol, created_at")
      .eq("durum", "onay_bekliyor")
      .order("created_at")
      .limit(5),
    supabase.from("ofis").select("id, ad, marka").order("ad").limit(4),
  ]);

  // Denetim — son 5 olay (service-role; servis anahtarı yoksa boş)
  let olaylar: Olay[] = [];
  let olayProfiller: { id: string; ad: string | null }[] = [];
  let olayProjeler: { id: string; ad: string }[] = [];
  if (admin) {
    const { data: olaylarRaw } = await admin
      .from("events")
      .select("id, tip, profile_id, proje_id, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    olaylar = (olaylarRaw ?? []) as Olay[];
    const olayProfilIds = [...new Set(olaylar.map((o) => o.profile_id).filter(Boolean))] as string[];
    const olayProjeIds = [...new Set(olaylar.map((o) => o.proje_id).filter(Boolean))] as string[];
    olayProfiller = olayProfilIds.length
      ? (((await admin.from("profiles").select("id, ad").in("id", olayProfilIds)).data ?? []) as { id: string; ad: string | null }[])
      : [];
    olayProjeler = olayProjeIds.length
      ? (((await admin.from("proje").select("id, ad").in("id", olayProjeIds)).data ?? []) as { id: string; ad: string }[])
      : [];
  }
  const opMap = new Map(olayProfiller.map((p) => [p.id, p.ad as string | null]));
  const oprMap = new Map(olayProjeler.map((p) => [p.id, p.ad as string]));

  // Sayımlar — mevcut mantık korunur
  const rolSay = (r: string) => (profiller ?? []).filter((p) => p.rol === r).length;
  const uretici = rolSay("uretici");
  const ofisYetkili = rolSay("ofis_yetkili");
  const emlakci = rolSay("emlakci");
  const toplamKul = uretici + ofisYetkili + emlakci;
  const dogrulanmamisSay = (ureticiler ?? []).filter((u) => !u.dogrulanmis).length;
  const paketMap = new Map((paketler ?? []).map((p) => [p.id, p]));
  const mrr = (abonelikler ?? []).reduce((t, a) => t + (Number(paketMap.get(a.paket_id)?.fiyat_aylik) || 0), 0);
  const bekleyenSay = (bekleyenler ?? []).length;
  const aktifAbonelik = abonelikler?.length ?? 0;
  const ofisSay = ofisler?.length ?? 0;
  const ofisAktifAbonelik = (abonelikler ?? []).filter((a) => a.ofis_id).length;
  const emlakciUretOran = uretici > 0 ? (emlakci / uretici).toFixed(1) : "—";

  // Ofis abonelik haritası (kısa liste)
  const ofisAbonelik = new Map<string, { paket_id: string; durum: AbonelikDurum }>();
  for (const a of abonelikler ?? []) if (a.ofis_id) ofisAbonelik.set(a.ofis_id, a as never);

  // Donut — v2-admin renkleri: emlakçı=teal, üretici=navy, ofis=amber
  const donut = [
    { etiket: "Emlakçı", deger: emlakci, renk: C.teal },
    { etiket: "Üretici", deger: uretici, renk: C.navy },
    { etiket: "Ofis yetkilisi", deger: ofisYetkili, renk: C.amber },
  ];

  return (
    <div className="mx-auto max-w-[1340px] space-y-4 px-4 py-6 sm:px-6">
      {/* ── BAŞLIK ── */}
      <header className="belir flex flex-wrap items-center gap-4">
        <div>
          <h1 className="font-display text-[27px] font-bold leading-none tracking-tight text-ink">Genel Bakış</h1>
          <div className="mt-1.5 flex items-center gap-2 text-[13px] text-ink-soft">
            <span className="nabiz size-2 rounded-full bg-green" aria-hidden />
            <span className="font-medium">Sistem canlı</span>
            <span className="text-hair">·</span>
            <span className="mono text-xs text-gray">üyelik · abonelik · doğrulama · denetim</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <Link
            href="/admin/kullanicilar"
            className="flex items-center gap-2 rounded-xl border border-hair bg-card px-3.5 py-2 text-[13px] text-gray shadow-card transition-colors hover:text-ink"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            Kullanıcı / firma ara…
          </Link>
          <Link href="/admin/kullanicilar" className="btn-primary !min-h-0 !rounded-xl !px-3.5 !py-2 !text-[13px]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Kullanıcı ekle
          </Link>
        </div>
      </header>

      {/* ── UYARI BARLARI (aksiyon) ── */}
      {bekleyenSay > 0 || dogrulanmamisSay > 0 ? (
        <div className="flex flex-wrap gap-3">
          {bekleyenSay > 0 ? (
            <Link href="/admin/onay" className="inline-flex items-center gap-2 rounded-xl border border-amber/30 bg-amber-soft px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-amber">
              <span className="rounded-full bg-amber px-2 py-0.5 font-mono text-xs text-white">{bekleyenSay}</span>
              kayıt onayı bekliyor →
            </Link>
          ) : null}
          {dogrulanmamisSay > 0 ? (
            <Link href="/admin/ureticiler" className="inline-flex items-center gap-2 rounded-xl border border-red/30 bg-red-soft px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-red">
              <span className="rounded-full bg-red px-2 py-0.5 font-mono text-xs text-white">{dogrulanmamisSay}</span>
              üretici doğrulama bekliyor →
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* ── KPI ŞERİDİ ── */}
      <section className="belir belir-1 grid gap-3.5 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        {/* MRR vurgulu (teal) */}
        <div className="kart signal-top p-5" style={{ ["--_sig" as string]: C.teal }}>
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-ink-soft">Aylık Yinelenen Gelir (MRR)</span>
            <span className="rozet bg-teal/12 text-teal-d">{aktifAbonelik} aktif abonelik</span>
          </div>
          <div className="mt-3 flex items-end gap-2.5">
            <span className="mono text-[34px] font-semibold leading-none tracking-tight text-navy">{fmtPara(mrr)}</span>
          </div>
          <p className="mt-3 text-xs text-gray">ofis + üretici abonelikleri (komisyon yok)</p>
        </div>

        {/* Onay bekleyen (amber) */}
        <div className="kart signal-top p-5" style={{ ["--_sig" as string]: C.amber }}>
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-ink-soft">Onay Bekleyen</span>
            {bekleyenSay > 0 ? <span className="nabiz size-[7px] rounded-full bg-amber" aria-hidden /> : null}
          </div>
          <p className="mono mt-3 text-[34px] font-semibold leading-none tracking-tight text-amber">{bekleyenSay}</p>
          <p className="mt-2 text-xs text-gray">kayıt onayını bekliyor</p>
          {bekleyenSay > 0 ? (
            <Link href="/admin/onay" className="mt-2.5 inline-flex rozet bg-amber-soft text-amber">Aksiyon gerekli →</Link>
          ) : (
            <span className="mt-2.5 inline-flex rozet bg-green-soft text-teal-d">Kuyruk temiz ✓</span>
          )}
        </div>

        {/* Üretici firma */}
        <div className="kart p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-ink-soft">Üretici Firma</span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7d8da0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
            </svg>
          </div>
          <p className="mono mt-3 text-[34px] font-semibold leading-none tracking-tight text-navy">{ureticiler?.length ?? 0}</p>
          <div className="mt-2.5">
            {dogrulanmamisSay > 0 ? (
              <span className="rozet bg-red/12 text-red">{dogrulanmamisSay} doğrulanmamış</span>
            ) : (
              <span className="rozet bg-green-soft text-teal-d">tümü doğrulanmış</span>
            )}
          </div>
        </div>

        {/* Ofis */}
        <div className="kart p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-ink-soft">Ofis</span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7d8da0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <p className="mono mt-3 text-[34px] font-semibold leading-none tracking-tight text-navy">{ofisSay}</p>
          <div className="mt-2.5">
            <span className="rozet bg-teal/12 text-teal-d">{ofisAktifAbonelik} aktif abonelik</span>
          </div>
        </div>
      </section>

      {/* ── ORTA: DONUT + ONAY KUYRUĞU ── */}
      <section className="belir belir-2 grid gap-3.5 lg:grid-cols-[340px_1fr]">
        {/* Donut */}
        <div className="kart p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Kullanıcı Dağılımı</h2>
            <span className="rozet mono bg-navy/10 text-navy">{toplamKul} toplam</span>
          </div>
          <div className="mt-3.5 flex items-center gap-5">
            <Donut parcalar={donut} boyut={130} ortaUst={String(toplamKul)} ortaAlt="kullanıcı" />
            <ul className="flex-1 space-y-3">
              {donut.map((d) => (
                <li key={d.etiket} className="flex items-center gap-2.5">
                  <span className="size-2.5 shrink-0 rounded" style={{ background: d.renk }} aria-hidden />
                  <span className="flex-1 text-[13px] text-ink-soft">{d.etiket}</span>
                  <span className="mono text-sm font-semibold text-ink">{d.deger}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-hair pt-3.5">
            <span className="text-xs text-gray">Emlakçı / üretici oranı</span>
            <span className="rozet mono bg-teal/12 text-teal-d">{emlakciUretOran}×</span>
          </div>
        </div>

        {/* Onay kuyruğu tablosu */}
        <div className="kart signal-top overflow-hidden !p-0" style={{ ["--_sig" as string]: C.amber }}>
          <div className="flex items-center justify-between px-5 pb-3.5 pt-4">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-base font-semibold text-ink">Onay Kuyruğu</h2>
              {bekleyenSay > 0 ? <span className="rozet mono bg-amber-soft text-amber">{bekleyenSay} bekleyen</span> : null}
            </div>
            <Link href="/admin/onay" className="text-[12.5px] font-semibold text-teal-d hover:underline">Tümünü gör →</Link>
          </div>
          {bekleyenSay > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[rgba(16,36,58,0.03)]">
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray">Ad Soyad</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray">Talep Rol</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray">Tarih</th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray">Aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  {(bekleyenler ?? []).map((k) => {
                    const rol = (k.talep_rol as string) ?? "emlakci";
                    return (
                      <tr key={k.id} className="border-t border-hair transition-colors hover:bg-[rgba(16,36,58,0.025)]">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="grid size-[34px] shrink-0 place-items-center rounded-xl font-display text-[13px] font-bold text-white" style={{ background: gradyan(k.id) }}>
                              {basHarf(k.ad)}
                            </span>
                            <span className="text-sm font-semibold text-ink">{k.ad ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`rozet ${ROL_ROZET[rol] ?? "bg-gray/12 text-gray"}`}>{ROL_KISA[rol] ?? rol}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="mono text-[12.5px] text-ink-soft">{zamanOnce(k.created_at)}</span>
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex justify-end gap-1.5">
                            <form action={kullaniciOnayla}>
                              <input type="hidden" name="kullanici_id" value={k.id} />
                              <input type="hidden" name="rol" value={rol} />
                              <input type="hidden" name="ofis_id" value="" />
                              <button className="rounded-lg border border-green/30 bg-green/12 px-2.5 py-1.5 text-xs font-semibold text-teal-d transition-colors hover:bg-green/20">
                                Onayla
                              </button>
                            </form>
                            <form action={kullaniciReddet}>
                              <input type="hidden" name="kullanici_id" value={k.id} />
                              <button className="rounded-lg border border-red/30 bg-card px-2.5 py-1.5 text-xs font-semibold text-red transition-colors hover:bg-red/10">
                                Reddet
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium text-ink">Bekleyen kayıt yok</p>
              <p className="mt-1 text-xs text-gray">Yeni başvurular burada görünür.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── ALT: ÜRETİCİ DOĞRULAMA + OFİSLER ── */}
      <section className="belir belir-3 grid gap-3.5 lg:grid-cols-2">
        {/* Üretici doğrulama */}
        <div className="kart signal-top p-5" style={{ ["--_sig" as string]: "#d15a4e" }}>
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Üretici Doğrulama</h2>
            {dogrulanmamisSay > 0 ? (
              <span className="rozet mono bg-red/12 text-red">{dogrulanmamisSay} belge bekliyor</span>
            ) : (
              <span className="rozet mono bg-green-soft text-teal-d">tümü doğrulandı</span>
            )}
          </div>
          {(dogrulanmamisUret ?? []).length > 0 ? (
            <div className="space-y-2.5">
              {(dogrulanmamisUret ?? []).map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-hair p-3">
                  <span className="grid size-[38px] shrink-0 place-items-center rounded-xl font-display text-[13px] font-bold text-white" style={{ background: gradyan(u.id) }}>
                    {basHarf(u.ad)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{u.ad}</p>
                    <p className="mono mt-0.5 text-[10.5px] text-gray">VKN {u.vergi_no ?? "—"} · doğrulama bekliyor</p>
                  </div>
                  <Link href="/admin/ureticiler" className="btn-action !min-h-0 !rounded-lg !px-3 !py-1.5 !text-xs">Doğrula</Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-hair px-3 py-6 text-center text-sm text-gray">Doğrulama bekleyen üretici yok.</p>
          )}
          <div className="mt-3.5 flex items-center gap-2 border-t border-hair pt-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" />
            </svg>
            <span className="text-xs text-ink-soft">{uretici - dogrulanmamisSay > 0 ? uretici - dogrulanmamisSay : 0} üretici doğrulanmış · güven rozeti aktif</span>
          </div>
        </div>

        {/* Ofisler · abonelik kısa liste */}
        <div className="kart overflow-hidden !p-0">
          <div className="flex items-center justify-between px-5 pb-3.5 pt-4">
            <h2 className="font-display text-base font-semibold text-ink">Ofisler · Abonelik</h2>
            <Link href="/admin/ofisler" className="text-[12.5px] font-semibold text-teal-d hover:underline">Tüm ofisler →</Link>
          </div>
          {(ofisAdlar ?? []).length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[rgba(16,36,58,0.03)]">
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray">Ofis</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray">Paket</th>
                  <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray">Aylık</th>
                </tr>
              </thead>
              <tbody>
                {(ofisAdlar ?? []).map((o) => {
                  const ab = ofisAbonelik.get(o.id);
                  const paket = ab ? paketMap.get(ab.paket_id) : null;
                  const fiyat = Number(paket?.fiyat_aylik) || 0;
                  return (
                    <tr key={o.id} className="border-t border-hair transition-colors hover:bg-[rgba(16,36,58,0.025)]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-[30px] shrink-0 place-items-center rounded-lg font-display text-[11px] font-bold text-white" style={{ background: gradyan(o.id) }}>
                            {basHarf(o.ad)}
                          </span>
                          <span className="text-[13.5px] font-semibold text-ink">{o.ad}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {paket ? (
                          <span className="rozet bg-navy/10 text-navy">{paket.ad}</span>
                        ) : ab ? (
                          <span className="rozet bg-gray/12 text-gray">{ABONELIK_DURUM_ETIKET[ab.durum]}</span>
                        ) : (
                          <span className="rozet bg-gray/12 text-gray">Abonelik yok</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`mono text-[13.5px] font-semibold ${fiyat > 0 ? "text-navy" : "text-gray"}`}>{fmtPara(fiyat)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="px-5 py-12 text-center text-sm text-gray">Henüz ofis yok.</p>
          )}
          <div className="flex items-center justify-between border-t border-hair px-5 py-3">
            <span className="text-xs text-gray">{ofisSay} ofisten {Math.min(ofisSay, ofisAdlar?.length ?? 0)}&apos;i gösteriliyor</span>
            <Link href="/admin/ofisler" className="text-[12.5px] font-semibold text-teal-d hover:underline">Tüm ofisler →</Link>
          </div>
        </div>
      </section>

      {/* ── DENETİM · İZ ZİNCİRİ ── */}
      <section className="belir belir-4">
        <div className="kart signal-top p-5" style={{ ["--_sig" as string]: C.teal }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-base font-semibold text-ink">Denetim · Son Olaylar</h2>
              <span className="rozet bg-teal/12 text-teal-d">
                <span className="nabiz size-1.5 rounded-full bg-teal-d" aria-hidden /> canlı iz zinciri
              </span>
            </div>
            <Link href="/admin/denetim" className="text-[12.5px] font-semibold text-teal-d hover:underline">Denetim kaydı →</Link>
          </div>
          {olaylar.length > 0 ? (
            <ul className="grid gap-x-9 sm:grid-cols-2">
              {olaylar.map((o) => {
                const t = TIP_RENK[o.tip] ?? { ad: o.tip, dot: "#98a2b3", rozet: "bg-gray/12 text-gray" };
                const kim = o.profile_id ? opMap.get(o.profile_id) : null;
                const proje = o.proje_id ? oprMap.get(o.proje_id) : null;
                const eylem = typeof o.payload?.eylem === "string" ? (o.payload.eylem as string) : null;
                return (
                  <li key={o.id} className="relative pb-4 pl-6">
                    <span className="absolute left-1 top-1 size-3 rounded-full border-[2.5px] border-card" style={{ background: t.dot, boxShadow: "0 0 0 1px rgba(16,36,58,.12)" }} aria-hidden />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-ink">{TIP_BASLIK[o.tip] ?? o.tip}</span>
                      <span className={`rozet ${t.rozet} !px-2 !py-0.5 !text-[10.5px]`}>{t.ad}</span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-ink-soft">
                      {kim ? <span className="text-ink">{kim}</span> : null}
                      {kim && (proje || eylem) ? " · " : ""}
                      {proje ?? ""}
                      {proje && eylem ? " · " : ""}
                      {eylem ?? ""}
                      {!kim && !proje && !eylem ? "—" : ""}
                    </p>
                    <p className="mono mt-0.5 text-[11.5px] text-gray">{zamanOnce(o.created_at)}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-2xl border border-hair px-3 py-10 text-center text-sm text-gray">Henüz denetim olayı yok.</p>
          )}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1 text-[11.5px] text-gray">
        <span>ProjePazar Admin Konsolu · Platform İşletmecisi paneli</span>
        <span className="mono">Bu panel stok/birim/bina kesiti görmez — gelir · hesap · doğrulama · denetim odaklıdır.</span>
      </footer>
    </div>
  );
}
