import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ASAMA_ETIKET, type InsaatAsama } from "@/lib/types";
import { EmlakciStok } from "@/components/EmlakciStok";
import { generateShareToken } from "@/lib/sharing";

type Belge = { id: string; tip: string | null; ad: string | null; url: string | null };
type Mahal = { id: string; mahal: string; zemin: string | null; duvar: string | null; tavan: string | null };

function trTarih(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { year: "numeric", month: "short" });
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
          "id, blok_id, tip_id, kat, daire_no, durum, liste_fiyati, para_birimi, satilabilir, net_m2, brut_m2, yon, manzara, serefiye, durum_notu, son_guncelleme",
        )
        .eq("proje_id", id),
      supabase.from("proje_belge").select("id, tip, ad, url").eq("proje_id", id).order("created_at", { ascending: false }),
      supabase.from("mahal").select("id, mahal, zemin, duvar, tavan").eq("proje_id", id).order("sira").order("created_at"),
    ]);

  const belgeler = (belgelerRaw ?? []) as Belge[];
  const mahaller = (mahallerRaw ?? []) as Mahal[];
  const kunye = (proje.kunye ?? {}) as Record<string, unknown>;

  const kapak = belgeler.find((b) => b.tip === "kapak")?.url ?? null;
  const fotolar = belgeler.filter((b) => b.tip === "foto" && b.url);
  const videolar = belgeler.filter((b) => b.tip === "video" && b.url);
  const brosurler = belgeler.filter((b) => b.tip === "brosur" && b.url);
  const konum = [proje.mahalle, proje.ilce, proje.il].filter(Boolean).join(", ") || "—";

  const donati = Array.isArray(kunye.donati) ? (kunye.donati as string[]) : [];
  const malzeme = Array.isArray(kunye.malzeme) ? (kunye.malzeme as string[]) : [];
  const kunyeSatir: [string, string][] = [
    ["Ada / Parsel", `${proje.ada ?? "—"} / ${proje.parsel ?? "—"}`],
    ["Emsal", proje.emsal ? String(proje.emsal) : "—"],
    ["İmar", (kunye.imar_durumu as string) ?? "—"],
    ["Otopark", (kunye.otopark as string) ?? "—"],
  ];
  const kunyeVar = !!(proje.ada || proje.emsal || kunye.imar_durumu || kunye.otopark || donati.length || malzeme.length);

  const toplam = birimler?.length ?? 0;
  const shareUrlMap = Object.fromEntries(
    (birimler ?? []).map((b) => [b.id, `${appUrl}/p/${emlakciId}/${b.id}/${generateShareToken(emlakciId, b.id)}`]),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/havuz" className="text-sm font-medium text-teal hover:underline">
        ← Havuz
      </Link>

      {hata ? (
        <p role="alert" className="mt-4 rounded-xl border border-red/30 bg-red-soft px-3 py-2 text-sm text-red">
          {hata}
        </p>
      ) : null}
      {mesaj ? (
        <p className="mt-4 rounded-xl border border-green/30 bg-green-soft px-3 py-2 text-sm text-teal-d">{mesaj}</p>
      ) : null}

      {/* KAPAK HERO */}
      <div className="relative mt-3 overflow-hidden rounded-2xl border border-hair bg-soft shadow-card">
        <div className="aspect-[16/7] w-full">
          {kapak ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kapak} alt={proje.ad} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-soft via-teal-soft to-soft">
              <span className="select-none font-display text-6xl font-bold text-teal-d/25">{(proje.ad ?? "P").charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold text-white drop-shadow sm:text-2xl">{proje.ad}</h1>
            {proje.belge_dogrulandi ? (
              <span className="rounded-full bg-teal/30 px-2 py-0.5 text-[11px] font-semibold text-white ring-1 ring-inset ring-teal/50">
                Doğrulanmış
              </span>
            ) : null}
          </div>
          <p className="text-sm text-white/85">{konum}</p>
        </div>
      </div>

      {/* İNŞAAT */}
      <div className="mt-4 rounded-2xl border border-hair bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">
            İnşaat: {ASAMA_ETIKET[proje.insaat_asamasi as InsaatAsama]}
            {proje.etap ? ` · ${proje.etap}` : ""}
          </span>
          <span className="font-mono text-sm text-teal-d">%{proje.ilerleme_yuzde}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-hair">
          <div className="h-full rounded-full bg-gradient-to-r from-teal to-green" style={{ width: `${proje.ilerleme_yuzde}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          {([
            ["Başlama", proje.baslama_tarihi],
            ["Teslim", proje.teslim_tarihi],
            ["İskân", proje.iskan_tarihi],
          ] as [string, string | null][]).map(([et, t]) => (
            <div key={et}>
              <p className="text-xs text-gray">{et}</p>
              <p className="font-mono text-ink">{trTarih(t)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KÜNYE + DONATI */}
      {kunyeVar ? (
        <div className="mt-4 rounded-2xl border border-hair bg-card p-5 shadow-card">
          <h2 className="font-display text-sm font-semibold text-ink">Künye</h2>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            {kunyeSatir.map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-gray">{k}</p>
                <p className="font-medium text-ink">{v}</p>
              </div>
            ))}
          </div>
          {donati.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs text-gray">Sosyal donatı</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {donati.map((d) => (
                  <span key={d} className="rounded-full border border-hair bg-soft px-2.5 py-1 text-xs text-ink">{d}</span>
                ))}
              </div>
            </div>
          ) : null}
          {malzeme.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs text-gray">Malzeme</p>
              <ul className="mt-1 grid gap-0.5 text-sm text-ink sm:grid-cols-2">
                {malzeme.map((m) => (
                  <li key={m}>· {m}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* TANITIM GALERİSİ */}
      {fotolar.length > 0 || videolar.length > 0 || brosurler.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-hair bg-card p-5 shadow-card">
          <h2 className="font-display text-sm font-semibold text-ink">Tanıtım</h2>
          {fotolar.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {fotolar.map((f) => (
                <a key={f.id} href={f.url!} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-lg border border-hair">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url!} alt={f.ad ?? "Foto"} className="aspect-square w-full object-cover transition-transform hover:scale-105" />
                </a>
              ))}
            </div>
          ) : null}
          {videolar.length > 0 || brosurler.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {videolar.map((v) => (
                <a key={v.id} href={v.url!} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-hair px-3 py-1.5 text-sm font-medium text-teal-d hover:border-teal">
                  ▶ {v.ad || "Video"}
                </a>
              ))}
              {brosurler.map((b) => (
                <a key={b.id} href={b.url!} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-hair px-3 py-1.5 text-sm font-medium text-teal-d hover:border-teal">
                  Broşür: {b.ad || "PDF"}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* MAHAL LİSTESİ */}
      {mahaller.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-hair bg-card p-5 shadow-card">
          <h2 className="font-display text-sm font-semibold text-ink">Mahal Listesi · teslim standardı</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray">
                  <th className="pb-2 pr-3 font-medium">Mahal</th>
                  <th className="pb-2 pr-3 font-medium">Zemin</th>
                  <th className="pb-2 pr-3 font-medium">Duvar</th>
                  <th className="pb-2 font-medium">Tavan</th>
                </tr>
              </thead>
              <tbody>
                {mahaller.map((m) => (
                  <tr key={m.id} className="border-t border-hair">
                    <td className="py-2 pr-3 font-medium text-ink">{m.mahal}</td>
                    <td className="py-2 pr-3 text-gray">{m.zemin ?? "—"}</td>
                    <td className="py-2 pr-3 text-gray">{m.duvar ?? "—"}</td>
                    <td className="py-2 text-gray">{m.tavan ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* STOK — bloklar master/detail */}
      <div className="mt-6">
        {toplam === 0 ? (
          <p className="rounded-2xl border border-dashed border-hair bg-card/60 p-8 text-center text-sm text-gray">
            Bu projede sana tahsisli birim yok. Üretici tahsis edince burada canlı görünür.
          </p>
        ) : (
          <EmlakciStok
            projeId={id}
            projeAd={proje.ad}
            bloklar={bloklar ?? []}
            tipler={tipler ?? []}
            baslangic={(birimler ?? []) as never}
            shareUrlMap={shareUrlMap}
          />
        )}
      </div>
    </div>
  );
}
