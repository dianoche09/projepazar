import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTelefon } from "@/lib/telefon";
import { zamanOnce } from "@/lib/types";

const LEAD_DURUM_ETIKET: Record<string, string> = {
  yeni: "Yeni",
  arandi: "Arandı",
  gorusme: "Görüşme",
  opsiyon: "Opsiyon",
  kazanildi: "Kazanıldı",
  kaybedildi: "Kaybedildi",
};

type Sonuc = {
  id: string;
  ad: string | null;
  telefon: string | null;
  durum: string;
  created_at: string;
  proje_ad: string | null;
  daire_no: string | null;
  emlakci_ad: string | null;
  emlakci_tel: string | null;
};

export default async function LeadSorgu({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const sorgu = (q ?? "").trim();

  const supabase = await createClient();
  // Müteahhitin KENDİ projeleri (RLS proje_owner) — sorgu YALNIZ bu kapsamda (kapalı-devre).
  const { data: projeler } = await supabase.from("proje").select("id, ad");
  const projeIds = (projeler ?? []).map((p) => p.id);
  const projeAdMap = new Map((projeler ?? []).map((p) => [p.id, p.ad as string]));

  let sonuclar: Sonuc[] = [];
  let arandi = false;

  if (sorgu && projeIds.length > 0) {
    arandi = true;
    const admin = createAdminClient();
    const digits = sorgu.replace(/\D/g, "");
    const telefonAramasi = digits.length >= 7;

    let q1 = admin
      .from("lead")
      .select("id, ad, telefon, durum, created_at, proje_id, birim_id, ilk_paylasan_id")
      .in("proje_id", projeIds)
      .order("created_at", { ascending: false })
      .limit(50);
    q1 = telefonAramasi
      ? q1.eq("telefon_norm", normalizeTelefon(sorgu))
      : q1.ilike("ad", `%${sorgu}%`);
    const { data: leads } = await q1;

    const emlakciIds = [
      ...new Set((leads ?? []).map((l) => l.ilk_paylasan_id).filter(Boolean)),
    ] as string[];
    const birimIds = [
      ...new Set((leads ?? []).map((l) => l.birim_id).filter(Boolean)),
    ] as string[];

    const emlakcilar = emlakciIds.length
      ? (await admin.from("profiles").select("id, ad, telefon").in("id", emlakciIds)).data ?? []
      : [];
    const birimler = birimIds.length
      ? (await admin.from("birim").select("id, daire_no").in("id", birimIds)).data ?? []
      : [];
    const emlakciMap = new Map(emlakcilar.map((e) => [e.id, e]));
    const birimMap = new Map(birimler.map((b) => [b.id, b.daire_no as string | null]));

    sonuclar = (leads ?? []).map((l) => {
      const e = l.ilk_paylasan_id ? emlakciMap.get(l.ilk_paylasan_id) : null;
      return {
        id: l.id,
        ad: l.ad,
        telefon: l.telefon,
        durum: l.durum,
        created_at: l.created_at,
        proje_ad: projeAdMap.get(l.proje_id as string) ?? null,
        daire_no: l.birim_id ? birimMap.get(l.birim_id) ?? null : null,
        emlakci_ad: e?.ad ?? null,
        emlakci_tel: e?.telefon ?? null,
      };
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Müşteri sorgula</h1>
        <p className="mt-1 text-sm text-gray">
          Bir müşteri sana doğrudan geldiyse ad veya telefonla sorgula: bu kişi ağda{" "}
          <b>ilk kimin lead&apos;i</b> olarak kaydedilmiş, gör. Sahiplik garantisi değildir; yalnız
          şeffaflık — gerisi seninle danışman arasındadır.
        </p>
      </div>

      <form method="GET" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={sorgu}
          placeholder="Ad Soyad veya telefon (05xx…)"
          className="min-w-0 flex-1 rounded-xl border border-hair bg-card px-4 py-3 text-sm text-ink outline-none focus:border-teal"
        />
        <button
          type="submit"
          className="btn rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink"
        >
          Sorgula
        </button>
      </form>

      {arandi ? (
        sonuclar.length > 0 ? (
          <div className="space-y-2.5">
            {sonuclar.map((s) => (
              <div key={s.id} className="rounded-2xl border border-hair bg-card p-4 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{s.ad ?? "—"}</p>
                    <p className="font-mono text-sm text-gray">{s.telefon ?? "—"}</p>
                    <p className="mt-1 text-xs text-gray">
                      {s.proje_ad ?? "—"}
                      {s.daire_no ? ` · Daire ${s.daire_no}` : ""} · {zamanOnce(s.created_at)}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-teal-d">
                    {LEAD_DURUM_ETIKET[s.durum] ?? s.durum}
                  </span>
                </div>
                <div className="mt-3 rounded-xl border border-hair p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-gray">İlk kaydeden danışman</p>
                  <p className="mt-0.5 font-medium text-ink">{s.emlakci_ad ?? "—"}</p>
                  {s.emlakci_tel ? <p className="font-mono text-xs text-gray">{s.emlakci_tel}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-hair bg-card/50 p-8 text-center">
            <p className="text-sm text-gray">
              Bu sorguya uygun, senin projelerinde kayıtlı bir lead yok. (Bu müşteriyi ağda hiçbir
              danışman henüz kaydetmemiş olabilir.)
            </p>
          </div>
        )
      ) : (
        <p className="text-sm text-gray">Sorgulamak için ad veya telefon gir.</p>
      )}

      <Link href="/uretici" className="inline-block text-sm font-semibold text-teal-d hover:underline">
        ← Kokpit
      </Link>
    </div>
  );
}
