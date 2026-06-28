import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { zamanOnce } from "@/lib/types";

const PARA_SIMGE: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€", GBP: "£", AED: "AED" };
const fmt = (n: number) => n.toLocaleString("tr-TR");

type EventRow = {
  id: number;
  proje_id: string | null;
  birim_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export default async function Paylastiklarim() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS events_select → profile_id = auth.uid() (kendi paylaşım izlerin)
  const { data: olaylar } = await supabase
    .from("events")
    .select("id, proje_id, birim_id, payload, created_at")
    .eq("tip", "paylasim")
    .eq("profile_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(100);

  const liste = (olaylar ?? []) as EventRow[];

  // Proje/birim adlarını toplu çöz (RLS tahsisli — yetkisiz satır gelmez)
  const projeIdler = [...new Set(liste.map((e) => e.proje_id).filter(Boolean))] as string[];
  const birimIdler = [...new Set(liste.map((e) => e.birim_id).filter(Boolean))] as string[];

  const [{ data: projeler }, { data: birimler }] = await Promise.all([
    projeIdler.length
      ? supabase.from("proje").select("id, ad, il, ilce").in("id", projeIdler)
      : Promise.resolve({ data: [] as { id: string; ad: string; il: string | null; ilce: string | null }[] }),
    birimIdler.length
      ? supabase.from("birim").select("id, daire_no, liste_fiyati, para_birimi").in("id", birimIdler)
      : Promise.resolve({ data: [] as { id: string; daire_no: string | null; liste_fiyati: number | null; para_birimi: string | null }[] }),
  ]);

  const projeMap = new Map((projeler ?? []).map((p) => [p.id, p]));
  const birimMap = new Map((birimler ?? []).map((b) => [b.id, b]));

  const toplam = liste.length;
  const projeSayi = new Set(liste.map((e) => e.proje_id).filter(Boolean)).size;

  return (
    <div className="mx-auto max-w-[920px] text-ink">
      <header className="belir mb-6">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span className="rozet" style={{ background: "rgba(30,155,138,.12)", color: "var(--color-teal)" }}>
            <span className="freshdot" style={{ background: "var(--color-teal)" }} />
            Paylaşım izi
          </span>
        </div>
        <h1 className="font-display text-[27px] font-bold leading-none tracking-tight text-navy md:text-[31px]">
          Paylaştıklarım
        </h1>
        <p className="mt-2 max-w-[560px] text-[13.5px] text-ink-soft">
          WhatsApp ve link ile paylaştığın birimlerin izi. Fiyat paylaşım anında canlı değerden basılır — sonradan değişirse senin görünümün de güncel kalır.
        </p>
      </header>

      {/* KPI */}
      <div className="belir belir-1 mb-6 grid grid-cols-2 gap-3.5">
        <div className="kart kart-3d p-4">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">Toplam Paylaşım</span>
          <div className="mono mt-3 text-[30px] font-semibold leading-none text-navy">{toplam}</div>
        </div>
        <div className="kart kart-3d p-4">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">Farklı Proje</span>
          <div className="mono mt-3 text-[30px] font-semibold leading-none text-teal">{projeSayi}</div>
        </div>
      </div>

      {toplam === 0 ? (
        <div className="kart belir belir-2 p-14 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl" style={{ background: "rgba(30,155,138,.08)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
          </div>
          <p className="text-[14px] font-bold text-ink">Henüz paylaşım yok</p>
          <p className="mx-auto mt-1.5 max-w-[400px] text-[13px] leading-relaxed text-ink-soft">
            Bir projeyi veya daireyi WhatsApp&apos;tan paylaştığında izi burada birikir. Havuzdan başla, müşterine birebir paylaş.
          </p>
          <Link href="/havuz" className="btn-action mt-5 inline-flex">
            Havuza Git
          </Link>
        </div>
      ) : (
        <div className="belir belir-2 space-y-3">
          {liste.map((e, i) => {
            const proje = e.proje_id ? projeMap.get(e.proje_id) : null;
            const birim = e.birim_id ? birimMap.get(e.birim_id) : null;
            const ps = PARA_SIMGE[birim?.para_birimi ?? "TRY"] ?? "₺";
            const ic = (
              <article
                key={e.id}
                style={{ animationDelay: `${Math.min(i, 8) * 0.04}s`, ["--_sig" as string]: "var(--color-teal)" }}
                className="kart kart-3d signal-top belir p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-[15px] font-bold leading-tight text-ink">
                      {proje?.ad ?? "Proje (erişim dışı)"}
                      {birim?.daire_no ? <span className="ml-1.5 text-[13px] font-semibold text-teal">· Daire {birim.daire_no}</span> : null}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-soft">
                      {[proje?.il, proje?.ilce].filter(Boolean).join(" · ") || "—"} · {zamanOnce(e.created_at)}
                    </p>
                  </div>
                  {birim?.liste_fiyati != null ? (
                    <span className="mono flex-none text-[14px] font-semibold text-navy">{fmt(Number(birim.liste_fiyati))} {ps}</span>
                  ) : null}
                </div>
              </article>
            );
            return proje ? (
              <Link key={e.id} href={`/havuz/proje/${proje.id}`} className="block">
                {ic}
              </Link>
            ) : (
              <div key={e.id}>{ic}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
