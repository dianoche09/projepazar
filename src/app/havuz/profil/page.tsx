import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/(auth)/login/actions";
import { ROL_ETIKET, type Rol } from "@/lib/roller";
import { HESAP_DURUM_ETIKET, type HesapDurum } from "@/lib/types";

export default async function Profil() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, rol, telefon, ofis_id, durum, onay_tarihi")
    .eq("id", user?.id ?? "")
    .single();
  const { data: ofis } = profil?.ofis_id
    ? await supabase.from("ofis").select("ad, marka, il, ilce").eq("id", profil.ofis_id).single()
    : { data: null };

  const ad = profil?.ad ?? user?.email ?? "Danışman";
  const basHarf = ad.trim().charAt(0).toUpperCase() || "D";
  const onayli = profil?.durum === "aktif";

  const kunye: [string, string][] = [
    ["Rol", profil ? ROL_ETIKET[profil.rol as Rol] : "—"],
    ["Hesap Durumu", profil ? HESAP_DURUM_ETIKET[profil.durum as HesapDurum] : "—"],
    ["E-posta", user?.email ?? "—"],
    ["Telefon", profil?.telefon ?? "—"],
  ];

  return (
    <div className="mx-auto max-w-[720px] text-ink">
      <header className="belir mb-6">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span
            className="rozet"
            style={
              onayli
                ? { background: "rgba(47,179,107,.12)", color: "var(--color-green)" }
                : { background: "rgba(227,161,44,.14)", color: "var(--color-amber)" }
            }
          >
            <span className="freshdot" style={{ background: onayli ? "var(--color-green)" : "var(--color-amber)" }} />
            {onayli ? "Onaylı Danışman" : "Onay bekliyor"}
          </span>
        </div>
        <h1 className="font-display text-[27px] font-bold leading-none tracking-tight text-navy md:text-[31px]">Profil</h1>
        <p className="mt-2 text-[13.5px] text-ink-soft">
          Hesap ve ofis bilgilerin. Bu alan salt-okunurdur — değişiklik için platform yönetimine (concierge) başvur.
        </p>
      </header>

      {/* Kimlik kartı */}
      <div className="kart kart-3d belir belir-1 p-6">
        <div className="flex items-center gap-4">
          <span
            className="font-display grid size-16 flex-none place-items-center rounded-2xl text-[24px] font-bold text-white"
            style={{ background: "linear-gradient(145deg,#13314b,#1e9b8a)" }}
          >
            {basHarf}
          </span>
          <div className="min-w-0">
            <p className="font-display text-[19px] font-bold leading-tight text-ink">{ad}</p>
            <p className="mt-0.5 truncate text-[13px] text-ink-soft">{user?.email}</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 border-t pt-5 sm:grid-cols-2" style={{ borderColor: "var(--cizgi)" }}>
          {kunye.map(([et, deger]) => (
            <div
              key={et}
              className="rounded-xl border px-3.5 py-2.5"
              style={{ borderColor: "var(--cizgi)", background: "var(--color-soft)" }}
            >
              <dt className="mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>
                {et}
              </dt>
              <dd className="mt-1 truncate text-[13.5px] font-semibold text-ink">{deger}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Ofis kartı */}
      <div className="kart kart-3d belir belir-2 mt-4 p-6">
        <div className="mb-4 flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--cizgi)" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M5 21V7l7-4 7 4v14" />
            <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
          </svg>
          <h2 className="font-display text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ink-faint)" }}>
            Bağlı Ofis
          </h2>
        </div>
        {ofis ? (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border px-3.5 py-2.5" style={{ borderColor: "var(--cizgi)", background: "var(--color-soft)" }}>
              <dt className="mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>Ofis</dt>
              <dd className="mt-1 text-[13.5px] font-semibold text-ink">{ofis.ad}</dd>
            </div>
            <div className="rounded-xl border px-3.5 py-2.5" style={{ borderColor: "var(--cizgi)", background: "var(--color-soft)" }}>
              <dt className="mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>Marka</dt>
              <dd className="mt-1 text-[13.5px] font-semibold text-ink">{ofis.marka ?? "—"}</dd>
            </div>
            <div className="rounded-xl border px-3.5 py-2.5 sm:col-span-2" style={{ borderColor: "var(--cizgi)", background: "var(--color-soft)" }}>
              <dt className="mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>Konum</dt>
              <dd className="mt-1 text-[13.5px] font-semibold text-ink">
                {[ofis.il, ofis.ilce].filter(Boolean).join(" · ") || "—"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-[13px] text-ink-soft">
            Bağımsız danışman olarak çalışıyorsun — herhangi bir ofise bağlı değilsin.
          </p>
        )}
      </div>

      <form action={cikisYap} className="belir belir-3 mt-4">
        <button className="btn-ghost w-full" style={{ minHeight: 48 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Çıkış yap
        </button>
      </form>
    </div>
  );
}
