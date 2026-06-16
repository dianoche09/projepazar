import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROL_ETIKET, type Rol } from "@/lib/roller";
import { HESAP_DURUM_ETIKET, HESAP_DURUM_ROZET, zamanOnce, type HesapDurum } from "@/lib/types";
import { parolaSifirla, hesapDurumDegistir } from "../../actions";

const DURUMLAR: HesapDurum[] = ["aktif", "pasif", "askida", "arsivli"];

function Satir({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="flex justify-between gap-4 border-t border-hair py-2 first:border-t-0">
      <span className="text-sm text-gray">{etiket}</span>
      <span className="text-sm font-medium text-ink">{deger}</span>
    </div>
  );
}

export default async function KullaniciDetay({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hata?: string; mesaj?: string }>;
}) {
  const { id } = await params;
  const { hata, mesaj } = await searchParams;
  const supabase = await createClient();
  const { data: k } = await supabase
    .from("profiles")
    .select("id, ad, rol, durum, ofis_id, telefon, son_giris, talep_rol, created_at")
    .eq("id", id)
    .single();
  if (!k) notFound();
  const { data: ofis } = k.ofis_id
    ? await supabase.from("ofis").select("ad").eq("id", k.ofis_id).single()
    : { data: null };

  const durum = k.durum as HesapDurum;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin/kullanicilar" className="text-sm font-medium text-teal hover:underline">
        ← Kullanıcılar
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">{k.ad ?? "—"}</h1>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${HESAP_DURUM_ROZET[durum]}`}>
          {HESAP_DURUM_ETIKET[durum]}
        </span>
      </div>

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

      <section className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <h2 className="font-display text-base font-semibold text-ink">Profil</h2>
        <div className="mt-2">
          <Satir etiket="Rol" deger={ROL_ETIKET[k.rol as Rol]} />
          <Satir etiket="Telefon" deger={k.telefon ?? "—"} />
          <Satir etiket="Ofis" deger={ofis?.ad ?? "—"} />
          <Satir etiket="Talep edilen rol" deger={k.talep_rol ? ROL_ETIKET[k.talep_rol as Rol] : "—"} />
          <Satir etiket="Son giriş" deger={k.son_giris ? zamanOnce(k.son_giris) : "hiç"} />
          <Satir etiket="Kayıt" deger={zamanOnce(k.created_at)} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <h2 className="font-display text-base font-semibold text-ink">Güvenlik</h2>
        <p className="mt-1 text-xs text-gray">Yeni geçici parola ata (service-role). Kullanıcıya ilet.</p>
        <form action={parolaSifirla} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="kullanici_id" value={k.id} />
          <input
            name="parola"
            type="text"
            required
            minLength={8}
            placeholder="Yeni parola (min 8)"
            className="flex-1 rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal"
          />
          <button className="rounded-lg border border-hair px-3 py-2 text-sm font-medium text-navy transition-colors hover:border-teal">
            Parolayı sıfırla
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-hair bg-card p-5">
        <h2 className="font-display text-base font-semibold text-ink">Hesap durumu</h2>
        <p className="mt-1 text-xs text-gray">Aktifleştir, pasifleştir, askıya al veya arşivle.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DURUMLAR.map((d) => (
            <form key={d} action={hesapDurumDegistir}>
              <input type="hidden" name="kullanici_id" value={k.id} />
              <input type="hidden" name="durum" value={d} />
              <button
                disabled={d === durum}
                className={`rounded-lg border border-hair px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
                  d === "arsivli" || d === "askida" ? "text-red hover:border-red" : "text-navy hover:border-teal"
                }`}
              >
                {HESAP_DURUM_ETIKET[d]}
              </button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
