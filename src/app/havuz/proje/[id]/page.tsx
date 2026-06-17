import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ASAMA_ETIKET, zamanOnce, type InsaatAsama } from "@/lib/types";
import { CanliIzgara } from "@/components/CanliIzgara";
import { generateShareToken } from "@/lib/sharing";

function trTarih(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { year: "numeric", month: "short" });
}

function Lejant({ renk, etiket }: { renk: string; etiket: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`size-2.5 rounded-[3px] ${renk}`} /> {etiket}
    </span>
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
  const { data: { user } } = await supabase.auth.getUser();
  const emlakciId = user?.id ?? "";

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3535";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const appUrl = `${protocol}://${host}`;

  // RLS: proje_emlakci_select → tahsisli değilse satır gelmez
  const { data: proje } = await supabase.from("proje").select("*").eq("id", id).single();
  if (!proje) notFound();

  const [{ data: bloklar }, { data: tipler }, { data: birimler }] = await Promise.all([
    supabase.from("blok").select("id, ad, kat_sayisi").eq("proje_id", id).order("ad"),
    supabase.from("daire_tipi").select("id, ad, oda, net_m2, taban_fiyat, plan_url").eq("proje_id", id).order("ad"),
    supabase
      .from("birim")
      .select(
        "id, blok_id, tip_id, kat, daire_no, durum, liste_fiyati, para_birimi, satilabilir, net_m2, brut_m2, yon, manzara, serefiye, durum_notu, son_guncelleme",
      )
      .eq("proje_id", id),
  ]);

  const toplam = birimler?.length ?? 0;
  // Paylaşım URL'leri server'da üretilir (HMAC secret client'a sızmaz — DEĞİŞMEZ #1)
  const shareUrlMap = Object.fromEntries(
    (birimler ?? []).map((b) => [
      b.id,
      `${appUrl}/p/${emlakciId}/${b.id}/${generateShareToken(emlakciId, b.id)}`,
    ]),
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/havuz" className="text-sm font-medium text-teal hover:underline">
        ← Havuz
      </Link>

      {hata ? (
        <p role="alert" className="mt-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">
          {hata}
        </p>
      ) : null}
      {mesaj ? (
        <p className="mt-4 rounded-lg border border-green/30 bg-green/10 px-3 py-2 text-sm text-ink">
          {mesaj}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{proje.ad}</h1>
          <p className="mt-1 text-sm text-gray">
            {[proje.mahalle, proje.ilce, proje.il].filter(Boolean).join(", ") || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {proje.belge_dogrulandi ? (
            <span className="rounded-full bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal">✓ Doğrulanmış</span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-card px-3 py-1 font-mono text-xs text-gray">
            <span className="size-1.5 rounded-full bg-green" /> {zamanOnce(proje.son_guncelleme)}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">
            İnşaat: {ASAMA_ETIKET[proje.insaat_asamasi as InsaatAsama]}
            {proje.etap ? ` · ${proje.etap}` : ""}
          </span>
          <span className="font-mono text-sm text-teal">%{proje.ilerleme_yuzde}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-hair">
          <div className="h-full bg-teal" style={{ width: `${proje.ilerleme_yuzde}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray">Başlama</p>
            <p className="font-mono text-ink">{trTarih(proje.baslama_tarihi)}</p>
          </div>
          <div>
            <p className="text-xs text-gray">Teslim</p>
            <p className="font-mono text-ink">{trTarih(proje.teslim_tarihi)}</p>
          </div>
          <div>
            <p className="text-xs text-gray">İskan</p>
            <p className="font-mono text-ink">{trTarih(proje.iskan_tarihi)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          Sana tahsisli birimler <span className="font-mono text-sm text-gray">({toplam})</span>
        </h2>
        <div className="flex flex-wrap gap-3 font-mono text-xs text-gray">
          <Lejant renk="bg-green" etiket="müsait" />
          <Lejant renk="bg-amber" etiket="opsiyon" />
          <Lejant renk="bg-red" etiket="satıldı" />
        </div>
      </div>

      <div className="mt-4">
        {toplam === 0 ? (
          <p className="text-sm text-gray">Bu projede sana tahsisli birim yok.</p>
        ) : (
          <CanliIzgara
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
