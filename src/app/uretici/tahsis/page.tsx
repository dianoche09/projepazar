import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { tahsisEmlakcilari } from "@/lib/tahsis";

/* =========================================================
   TAHSİS — dağıtım ağı (MOAT). Hangi kapsam kime açık, komisyon ne.
   Emlakçı yalnız tahsisli + satılabilir birimi görür/satar.
   Proje bazlı gruplu tablo. Her satır → /uretici/proje/[id].
   ========================================================= */

type TahsisRaw = {
  id: string;
  proje_id: string;
  kapsam: { bloklar?: string[]; katlar?: number[]; tipler?: string[] } | null;
  hedef_tip: "herkes" | "ofis" | "danisman";
  hedef_id: string | null;
  munhasir: boolean | null;
  kontenjan: number | null;
  fiyat_gorunur: boolean | null;
  komisyon_tip: "yuzde" | "sabit" | "yok";
  komisyon_deger: number | null;
};

function komisyonMetin(t: TahsisRaw): string {
  if (t.komisyon_tip === "yok") return "yok";
  if (t.komisyon_tip === "yuzde") return `%${t.komisyon_deger ?? 0}`;
  return `${Number(t.komisyon_deger ?? 0).toLocaleString("tr-TR")}₺`;
}

export default async function UreticiTahsis() {
  const supabase = await createClient();

  const [{ data: projeler }, { data: tahsisRaw }, { data: ofisler }, { data: bloklar }] =
    await Promise.all([
      supabase.from("proje").select("id, ad, il, ilce").order("created_at", { ascending: false }),
      supabase
        .from("tahsis")
        .select(
          "id, proje_id, kapsam, hedef_tip, hedef_id, munhasir, kontenjan, fiyat_gorunur, komisyon_tip, komisyon_deger",
        ),
      supabase.from("ofis").select("id, ad"),
      supabase.from("blok").select("id, ad"),
    ]);
  // Danışman adları: profiles_self RLS engeli → admin client (server-only)
  const emlakcilar = await tahsisEmlakcilari();

  const tahsisler = (tahsisRaw ?? []) as TahsisRaw[];
  const ofisAd = new Map((ofisler ?? []).map((o) => [o.id, o.ad as string]));
  const blokAd = new Map((bloklar ?? []).map((b) => [b.id, b.ad as string | null]));
  const danismanAd = new Map(emlakcilar.map((e) => [e.id, e.ad]));

  // proje_id → tahsis listesi
  const projeTahsis = new Map<string, TahsisRaw[]>();
  for (const t of tahsisler) {
    const arr = projeTahsis.get(t.proje_id) ?? [];
    arr.push(t);
    projeTahsis.set(t.proje_id, arr);
  }

  const hedefMetin = (t: TahsisRaw): string => {
    if (t.hedef_tip === "herkes") return "Herkese açık";
    if (t.hedef_tip === "ofis") return ofisAd.get(t.hedef_id ?? "") ?? "Ofis";
    return danismanAd.get(t.hedef_id ?? "") ?? "Danışman";
  };

  const kapsamMetin = (t: TahsisRaw): string => {
    const bloklarAd = (t.kapsam?.bloklar ?? []).map((bid) => blokAd.get(bid) ?? "?").filter(Boolean);
    if (bloklarAd.length) return `${bloklarAd.join(", ")} blok`;
    const katlar = t.kapsam?.katlar ?? [];
    if (katlar.length) return `Kat ${katlar.join(", ")}`;
    return "Tüm proje";
  };

  const toplamTahsis = tahsisler.length;
  const tahsisliProje = projeTahsis.size;
  const munhasirSay = tahsisler.filter((t) => t.munhasir).length;

  return (
    <div className="mx-auto max-w-[1640px] px-4 py-6 text-ink sm:px-6">
      <header className="belir mb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[27px] font-bold tracking-tight text-ink">Tahsis</h1>
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-soft px-2.5 py-[5px] text-[11.5px] font-semibold text-teal">
            <span className="inline-block size-[7px] rounded-full bg-teal" aria-hidden />
            Dağıtım ağı
          </span>
        </div>
        <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
          Dağıtım ağı (MOAT) — kapsam kime açık, komisyon ne. Emlakçı yalnız tahsisli birimi görür.
        </p>
      </header>

      {/* KPI ŞERİDİ */}
      <section className="kart belir belir-1 mb-5 p-1">
        <div className="grid grid-cols-3 divide-x divide-[var(--cizgi)]">
          <Kpi etiket="Toplam Tahsis" deger={String(toplamTahsis)} alt="dağıtım kuralı" />
          <Kpi etiket="Dağıtımda" deger={String(tahsisliProje)} alt="proje paylaşımda" />
          <Kpi etiket="Münhasır" deger={String(munhasirSay)} renk="text-teal" alt="tek-kanal tahsis" />
        </div>
      </section>

      <div className="belir belir-2 flex flex-col gap-5">
        {(projeler ?? []).map((p) => {
          const liste = projeTahsis.get(p.id) ?? [];
          return (
            <section key={p.id} className="kart overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cizgi)] px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-[16px] font-bold text-ink">{p.ad}</h2>
                  <span className="text-[11.5px] text-[var(--ink-faint)]">
                    {[p.il, p.ilce].filter(Boolean).join(" · ") || "—"}
                  </span>
                  <span className="mono rounded-md bg-navy-soft px-2 py-[2px] text-[11px] text-ink-soft">
                    {liste.length} tahsis
                  </span>
                </div>
                <Link
                  href={`/uretici/proje/${p.id}`}
                  className="text-[12px] font-semibold text-teal hover:underline"
                >
                  Tahsis yönet →
                </Link>
              </div>

              {liste.length === 0 ? (
                <p className="px-5 py-6 text-[13px] text-[var(--ink-faint)]">
                  Bu proje henüz kimseye tahsisli değil — kimse göremez.{" "}
                  <Link href={`/uretici/proje/${p.id}`} className="font-semibold text-teal hover:underline">
                    Tahsis ekle →
                  </Link>
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Hedef</th>
                        <th>Kapsam</th>
                        <th>Komisyon</th>
                        <th>Münhasır</th>
                        <th className="text-right">Kontenjan</th>
                        <th>Fiyat</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {liste.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <span
                              className={`rozet ${
                                t.hedef_tip === "herkes" ? "bg-navy-soft text-ink-soft" : "bg-teal-soft text-teal"
                              }`}
                            >
                              {hedefMetin(t)}
                            </span>
                          </td>
                          <td className="text-[12.5px] text-ink-soft">{kapsamMetin(t)}</td>
                          <td className="mono">{komisyonMetin(t)}</td>
                          <td>
                            {t.munhasir ? (
                              <span className="rozet bg-amber-soft text-[#9a6a12]">Münhasır</span>
                            ) : (
                              <span className="rozet bg-navy-soft text-ink-soft">Paylaşımlı</span>
                            )}
                          </td>
                          <td className="mono text-right">{t.kontenjan ?? "—"}</td>
                          <td>
                            {t.fiyat_gorunur ? (
                              <span className="rozet bg-green-soft text-[#1f7d4c]">Görünür</span>
                            ) : (
                              <span className="rozet bg-navy-soft text-ink-soft">Gizli</span>
                            )}
                          </td>
                          <td>
                            <Link
                              href={`/uretici/proje/${t.proje_id}`}
                              className="btn-action h-auto min-h-0 px-2.5 py-[5px] text-[11px]"
                            >
                              Düzenle
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}

        {(projeler?.length ?? 0) === 0 ? (
          <div className="kart p-10 text-center">
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
