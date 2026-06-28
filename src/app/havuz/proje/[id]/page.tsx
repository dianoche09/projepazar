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
          "id, blok_id, tip_id, kat, daire_no, durum, liste_fiyati, para_birimi, satilabilir, net_m2, brut_m2, yon, manzara, serefiye, odeme_plani, durum_notu, son_guncelleme",
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
    <div className="belir mx-auto max-w-5xl py-4 relative z-10">
      <Link href="/havuz" className="text-xs font-bold text-teal hover:underline flex items-center gap-1.5 transition-colors mb-4 uppercase tracking-wider font-mono">
        <span>←</span> Havuz Listesine Dön
      </Link>

      {hata ? (
        <p role="alert" className="mt-4 rounded-xl border border-red/20 bg-red-soft px-4 py-2.5 text-sm text-red">
          {hata}
        </p>
      ) : null}
      {mesaj ? (
        <p className="mt-4 rounded-xl border border-green/20 bg-green-soft px-4 py-2.5 text-sm text-green">{mesaj}</p>
      ) : null}

      {/* KAPAK HERO */}
      <div className="relative mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#020617] shadow-card">
        <div className="aspect-[16/7] w-full relative">
          {kapak ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kapak} alt={proje.ad} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617]">
              <span className="select-none font-display text-7xl font-extrabold text-teal/10">{(proje.ad ?? "P").charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 z-10">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-white tracking-tight drop-shadow sm:text-3xl">{proje.ad}</h1>
            {proje.belge_dogrulandi ? (
              <span className="rounded-full bg-teal-soft border border-teal/20 px-2.5 py-0.5 text-[11px] font-semibold text-teal shadow-[0_0_8px_rgba(6,182,212,0.15)]">
                ✓ Doğrulanmış
              </span>
            ) : null}
          </div>
          <p className="text-xs text-gray/80 mt-1 font-medium">{konum}</p>
        </div>
      </div>

      {/* İNŞAAT DURUMU */}
      <div className="mt-6 rounded-2xl glass-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white/90 text-sm">
            İnşaat Aşaması: <span className="text-teal font-bold">{ASAMA_ETIKET[proje.insaat_asamasi as InsaatAsama]}</span>
            {proje.etap ? ` · ${proje.etap}` : ""}
          </span>
          <span className="font-mono text-sm font-bold text-teal shadow-text">%{proje.ilerleme_yuzde}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-teal to-green shadow-[0_0_8px_var(--color-teal)]" style={{ width: `${proje.ilerleme_yuzde}%` }} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-4 text-xs">
          {([
            ["Başlama Tarihi", proje.baslama_tarihi],
            ["Planlanan Teslim", proje.teslim_tarihi],
            ["İskân Durumu", proje.iskan_tarihi],
          ] as [string, string | null][]).map(([et, t]) => (
            <div key={et} className="bg-white/[0.01] border border-white/5 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray/50 uppercase font-mono tracking-wider">{et}</p>
              <p className="font-mono font-bold text-white mt-1">{trTarih(t)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KÜNYE + DONATI */}
      {kunyeVar ? (
        <div className="mt-6 rounded-2xl glass-card p-6 shadow-card">
          <h2 className="font-display text-sm font-bold text-white tracking-tight uppercase font-mono tracking-widest text-gray/50 border-b border-white/5 pb-3">Proje Künyesi</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-xs sm:grid-cols-4">
            {kunyeSatir.map(([k, v]) => (
              <div key={k} className="bg-white/[0.01] border border-white/5 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray/50 uppercase font-mono tracking-wider">{k}</p>
                <p className="font-semibold text-white mt-1">{v}</p>
              </div>
            ))}
          </div>
          {donati.length > 0 ? (
            <div className="mt-5">
              <p className="text-[10px] font-bold text-gray/50 uppercase font-mono tracking-wider mb-2">Sosyal Donatılar</p>
              <div className="flex flex-wrap gap-2">
                {donati.map((d) => (
                  <span key={d} className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-1.5 text-xs text-white/80 font-semibold">{d}</span>
                ))}
              </div>
            </div>
          ) : null}
          {malzeme.length > 0 ? (
            <div className="mt-5">
              <p className="text-[10px] font-bold text-gray/50 uppercase font-mono tracking-wider mb-2">Yapı Malzemeleri & Standartlar</p>
              <ul className="grid gap-2 text-xs font-semibold text-white/80 sm:grid-cols-2">
                {malzeme.map((m) => (
                  <li key={m} className="flex items-center gap-2 bg-white/[0.01] border border-white/5 rounded-xl px-3 py-2">
                    <span className="size-1.5 rounded-full bg-teal" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* TANITIM GALERİSİ */}
      {fotolar.length > 0 || videolar.length > 0 || brosurler.length > 0 ? (
        <div className="mt-6 rounded-2xl glass-card p-6 shadow-card">
          <h2 className="font-display text-sm font-bold text-white tracking-tight uppercase font-mono tracking-widest text-gray/50 border-b border-white/5 pb-3">Görseller & Katalog</h2>
          {fotolar.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {fotolar.map((f) => (
                <a key={f.id} href={f.url!} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-xl border border-white/5 bg-[#0f172a] block group aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url!} alt={f.ad ?? "Foto"} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-103" />
                </a>
              ))}
            </div>
          ) : null}
          {videolar.length > 0 || brosurler.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {videolar.map((v) => (
                <a key={v.id} href={v.url!} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs font-bold text-teal transition-all duration-300 hover:bg-white/10 flex items-center gap-2">
                  <span>▶</span> {v.ad || "Tanıtım Videosu"}
                </a>
              ))}
              {brosurler.map((b) => (
                <a key={b.id} href={b.url!} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs font-bold text-teal transition-all duration-300 hover:bg-white/10 flex items-center gap-2">
                  <span>📄</span> Broşür: {b.ad || "E-Katalog PDF"}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* MAHAL LİSTESİ */}
      {mahaller.length > 0 ? (
        <div className="mt-6 rounded-2xl glass-card p-6 shadow-card">
          <h2 className="font-display text-sm font-bold text-white tracking-tight uppercase font-mono tracking-widest text-gray/50 border-b border-white/5 pb-3">Mahal Listesi (Teslim Standardı)</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[460px] text-xs font-semibold text-white/95">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-gray/50 font-mono border-b border-white/5">
                  <th className="pb-3 pr-3 font-bold">Mahal</th>
                  <th className="pb-3 pr-3 font-bold">Zemin</th>
                  <th className="pb-3 pr-3 font-bold">Duvar</th>
                  <th className="pb-3 font-bold">Tavan</th>
                </tr>
              </thead>
              <tbody>
                {mahaller.map((m) => (
                  <tr key={m.id} className="border-t border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 pr-3 font-bold text-white">{m.mahal}</td>
                    <td className="py-3 pr-3 text-gray/80 font-mono">{m.zemin ?? "—"}</td>
                    <td className="py-3 pr-3 text-gray/80 font-mono">{m.duvar ?? "—"}</td>
                    <td className="py-3 text-gray/80 font-mono">{m.tavan ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* STOK — bloklar master/detail */}
      <div className="mt-8">
        {toplam === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-12 text-center text-xs font-semibold text-gray/50 leading-relaxed">
            Bu projede size tahsis edilmiş herhangi bir stok bulunmuyor. Üretici tanımladığında burada görüntülenecektir.
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
