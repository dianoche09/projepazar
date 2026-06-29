import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { tahsisSil } from "@/app/uretici/actions";
import { TahsisForm } from "./TahsisForm";
import { tahsisEmlakcilari } from "@/lib/tahsis";
import { BinaKesiti } from "@/components/BinaKesiti";
import { SecimDuzenle } from "@/components/SecimDuzenle";
import { ProjeKomutBari } from "@/components/ProjeKomutBari";

function Lejant({ renk, etiket }: { renk: string; etiket: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`size-2.5 rounded-[3px] ${renk}`} /> {etiket}
    </span>
  );
}

export default async function ProjeDetay({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { id } = await params;
  const { hata, mesaj } = await searchParams;
  const supabase = await createClient();

  const { data: proje } = await supabase.from("proje").select("*").eq("id", id).single();
  if (!proje) notFound();

  const { data: bloklar } = await supabase
    .from("blok")
    .select("id, ad, kat_sayisi")
    .eq("proje_id", id)
    .order("ad");

  const { data: tipler } = await supabase
    .from("daire_tipi")
    .select("id, ad, oda, net_m2, taban_fiyat, plan_url")
    .eq("proje_id", id)
    .order("ad");

  const { data: birimler } = await supabase
    .from("birim")
    .select(
      "id, blok_id, tip_id, tur, ana_birim_id, kat, daire_no, durum, liste_fiyati, para_birimi, satilabilir, net_m2, brut_m2, yon, manzara, serefiye, odeme_plani, durum_notu, son_guncelleme",
    )
    .eq("proje_id", id);

  const { data: tahsisler } = await supabase
    .from("tahsis")
    .select("id, hedef_tip, hedef_id, kapsam, komisyon_tip, komisyon_deger, munhasir, kontenjan, fiyat_gorunur")
    .eq("proje_id", id);
  const { data: ofisler } = await supabase.from("ofis").select("id, ad").order("ad");
  const emlakcilar = await tahsisEmlakcilari();
  const { data: belgeler } = await supabase
    .from("proje_belge")
    .select("id, tip, ad, url, dogrulandi")
    .eq("proje_id", id)
    .order("created_at", { ascending: false });
  const kunye = (proje.kunye ?? {}) as Record<string, unknown>;
  const kapak = (belgeler ?? []).find((b) => b.tip === "kapak") ?? null;
  const fotolar = (belgeler ?? []).filter((b) => b.tip === "foto" && b.url);
  const videolar = (belgeler ?? []).filter((b) => b.tip === "video" && b.url);
  const brosurler = (belgeler ?? []).filter((b) => b.tip === "brosur" && b.url);

  // Eklentiler (otopark/depo, ana_birim_id dolu) ana stok sayımına/tahsise girmez — parent dairesiyle gider.
  const anaBirimler = (birimler ?? []).filter((b) => b.ana_birim_id == null);
  const tahsisKatlar = [
    ...new Set(anaBirimler.map((b) => b.kat).filter((k): k is number => k != null)),
  ].sort((a, b) => a - b);
  const blokMap = new Map((bloklar ?? []).map((b) => [b.id, b.ad]));
  const ofisMap = new Map((ofisler ?? []).map((o) => [o.id, o.ad]));
  const emlakciMap = new Map(emlakcilar.map((e) => [e.id, e.ad]));
  const toplam = anaBirimler.length;
  const stats = {
    toplam,
    musait: anaBirimler.filter((b) => b.durum === "musait").length,
    opsiyon: anaBirimler.filter((b) => b.durum === "opsiyonlu" || b.durum === "satis_beklemede").length,
    satildi: anaBirimler.filter((b) => b.durum === "satildi").length,
  };

  return (
    <div className="belir mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <ProjeKomutBari proje={proje} kapakUrl={kapak?.url ?? null} stats={stats} />

      {hata ? (
        <p role="alert" className="mt-4 rounded-xl border border-red/20 bg-red-soft px-4 py-2.5 text-sm font-medium text-red">
          {hata}
        </p>
      ) : null}
      {mesaj ? (
        <p className="mt-4 rounded-xl border border-green/20 bg-green-soft px-4 py-2.5 text-sm font-medium text-teal-d">
          {mesaj}
        </p>
      ) : null}

      {/* Künye · Parsel & İmar — salt-okunur özet (düzenleme: Proje Kurulumu) */}
      <details className="kart mt-6 p-5">
        <summary className="flex cursor-pointer items-center justify-between gap-2">
          <span className="font-display text-base font-semibold text-ink">Künye · Parsel & İmar</span>
          <Link href={`/uretici/proje/${id}/kurulum`} className="text-xs font-medium text-teal-d hover:underline">
            Düzenle →
          </Link>
        </summary>
        <div className="mt-3 grid gap-x-6 text-sm sm:grid-cols-2">
          {([
            ["Ada / Parsel", `${proje.ada ?? "—"} / ${proje.parsel ?? "—"}`],
            ["Emsal (KAKS)", proje.emsal ?? "—"],
            ["TAKS", proje.taks ?? "—"],
            ["İmar durumu", (kunye.imar_durumu as string) ?? "—"],
            ["Arsa alanı", kunye.arsa_alani ? `${kunye.arsa_alani} m²` : "—"],
            ["Toplam inşaat", kunye.toplam_insaat ? `${kunye.toplam_insaat} m²` : "—"],
            ["Yapı ruhsatı", (kunye.ruhsat_tarihi as string) ?? "—"],
            ["Yapı denetim", (kunye.yapi_denetim as string) ?? "—"],
            ["Otopark", (kunye.otopark as string) ?? "—"],
          ] as [string, string | number][]).map(([k, v]) => (
            <div key={k} className="flex justify-between border-t border-hair py-1.5">
              <span className="text-gray">{k}</span>
              <span className="font-medium text-ink">{String(v)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-hair pt-3 text-xs text-gray">
          📎 {belgeler?.length ?? 0} medya/belge ·{" "}
          <Link href={`/uretici/proje/${id}/kurulum`} className="text-teal-d hover:underline">
            Kurulumda yönet (kapak · tanıtım · ruhsat)
          </Link>
        </p>
      </details>

      {/* Tanıtım & Medya — seed/kurulumdan gelen görseller */}
      {fotolar.length > 0 || videolar.length > 0 || brosurler.length > 0 ? (
        <section className="kart mt-5 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Tanıtım & Medya</h2>
            <Link href={`/uretici/proje/${id}/kurulum`} className="text-xs font-medium text-teal-d hover:underline">
              Yönet →
            </Link>
          </div>
          {fotolar.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {fotolar.map((f) => (
                <a key={f.id} href={f.url!} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-xl border border-hair">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url!} alt={f.ad ?? "Görsel"} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </a>
              ))}
            </div>
          ) : null}
          {videolar.length > 0 || brosurler.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {videolar.map((v) => (
                <a key={v.id} href={v.url!} target="_blank" rel="noopener noreferrer" className="btn-ghost h-9 min-h-0 px-3 text-xs">
                  ▶ {v.ad || "Video"}
                </a>
              ))}
              {brosurler.map((b) => (
                <a key={b.id} href={b.url!} target="_blank" rel="noopener noreferrer" className="btn-ghost h-9 min-h-0 px-3 text-xs">
                  Broşür: {b.ad || "PDF"}
                </a>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Birim ızgarası */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          Birim ızgarası <span className="font-mono text-sm text-gray">({toplam})</span>
        </h2>
        <div className="flex flex-wrap gap-3 font-mono text-xs text-gray">
          <Lejant renk="bg-green" etiket="müsait" />
          <Lejant renk="bg-amber" etiket="opsiyon" />
          <Lejant renk="bg-red" etiket="satıldı" />
          <Lejant renk="bg-navy/30" etiket="arsa payı" />
        </div>
      </div>

      <div className="mt-4">
        <SecimDuzenle projeId={id}>
          <BinaKesiti
            bloklar={bloklar ?? []}
            birimler={(birimler ?? []) as never}
            tipler={tipler ?? []}
            mod="uretici"
            projeId={id}
          />
        </SecimDuzenle>
      </div>

      {/* ===== TAHSİS (MOAT) ===== */}
      <section className="mt-12 border-t border-hair pt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Tahsis — dağıtım (MOAT)</h2>
        <p className="mt-1 text-sm text-gray">
          Hangi kapsam kime açık, komisyon ne. Emlakçı yalnız tahsisli + satılabilir birimi görür/satar.
        </p>

        <div className="mt-4 space-y-2">
          {(tahsisler ?? []).map((t) => {
            const bloklarKapsam = ((t.kapsam as { bloklar?: string[] } | null)?.bloklar ?? [])
              .map((bid) => blokMap.get(bid) ?? "?")
              .join(", ");
            return (
              <div key={t.id} className="kart flex flex-wrap items-center gap-3 p-3.5">
                <span className="rozet bg-teal-soft text-teal-d">
                  {t.hedef_tip === "herkes"
                    ? "Herkese açık (yayın)"
                    : t.hedef_tip === "danisman"
                      ? `Danışman: ${emlakciMap.get(t.hedef_id) ?? "?"}`
                      : `Ofis: ${ofisMap.get(t.hedef_id) ?? "?"}`}
                </span>
                <span className="text-sm text-ink-soft">{bloklarKapsam || "tüm proje"}</span>
                <span className="mono text-xs text-[var(--ink-faint)]">
                  {t.komisyon_tip === "yok"
                    ? "komisyon yok"
                    : t.komisyon_tip === "yuzde"
                      ? `%${t.komisyon_deger}`
                      : `${Number(t.komisyon_deger).toLocaleString("tr-TR")}₺`}
                  {t.munhasir ? " · münhasır" : ""}
                  {t.kontenjan ? ` · kont. ${t.kontenjan}` : ""}
                  {!t.fiyat_gorunur ? " · fiyat gizli" : ""}
                </span>
                <form action={tahsisSil} className="ml-auto">
                  <input type="hidden" name="tahsis_id" value={t.id} />
                  <input type="hidden" name="proje_id" value={id} />
                  <button className="rounded-lg border border-hair px-3 py-1.5 text-sm font-medium text-red transition-colors hover:border-red hover:bg-red-soft">
                    Kaldır
                  </button>
                </form>
              </div>
            );
          })}
          {(tahsisler?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray">Henüz tahsis yok — kimse göremez. Aşağıdan ekle.</p>
          ) : null}
        </div>

        <div className="mt-4">
          <TahsisForm
            projeId={id}
            bloklar={bloklar ?? []}
            katlar={tahsisKatlar}
            tipler={tipler ?? []}
            ofisler={ofisler ?? []}
            emlakcilar={emlakcilar}
            birimler={anaBirimler.map((b) => ({
              id: b.id,
              daire_no: b.daire_no,
              blok_id: b.blok_id,
              kat: b.kat,
            }))}
          />
        </div>
      </section>

      <p className="mt-10 rounded-2xl border border-dashed border-hair bg-card/60 px-5 py-4 text-sm text-gray">
        Blok, daire tipi ve birim üretimi{" "}
        <Link href={`/uretici/proje/${id}/kurulum`} className="font-semibold text-teal-d hover:underline">
          Proje Kurulumu
        </Link>{" "}
        ekranında — bir kez yapılır. Burası günlük takip/satış.
      </p>
    </div>
  );
}
