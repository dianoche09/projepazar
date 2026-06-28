import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/* =========================================================
   AYARLAR — profil + üretici firma bilgisi (salt-okunur özet).
   Düzenleme akışları concierge/admin tarafında; burası güven/durum görünümü.
   ========================================================= */

function Satir({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[var(--cizgi)] py-2.5 first:border-t-0">
      <span className="text-[12.5px] text-[var(--ink-faint)]">{etiket}</span>
      <span className="text-[13px] font-medium text-ink">{deger}</span>
    </div>
  );
}

export default async function UreticiAyarlar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, telefon, rol, foto_url, created_at")
    .eq("id", user?.id ?? "")
    .single();

  // Üreticinin firması (sahip_id = oturum). Admin görünümünde olmayabilir → graceful.
  const { data: firma } = await supabase
    .from("uretici")
    .select("ad, vergi_no, dogrulanmis, created_at")
    .eq("sahip_id", user?.id ?? "")
    .maybeSingle();

  const ad = profil?.ad ?? user?.email ?? "—";
  const dogrulanmis = firma?.dogrulanmis ?? false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="belir mb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[27px] font-bold tracking-tight text-ink">Ayarlar</h1>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-[5px] text-[11.5px] font-semibold ${
              dogrulanmis ? "bg-green-soft text-[#1f7d4c]" : "bg-amber-soft text-[#9a6a12]"
            }`}
          >
            <span
              className={`inline-block size-[7px] rounded-full ${dogrulanmis ? "bg-green" : "bg-amber"}`}
              aria-hidden
            />
            {dogrulanmis ? "Doğrulandı" : "Bekliyor"}
          </span>
        </div>
        <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
          Hesap ve firma bilgilerin — güncelleme için platform yöneticinle (concierge) iletişime geç.
        </p>
      </header>

      <div className="belir belir-1 flex flex-col gap-5">
        {/* DOĞRULAMA DURUMU */}
        <section
          className="kart signal-top p-5"
          style={{ ["--_sig" as string]: dogrulanmis ? "var(--color-green)" : "var(--color-amber)" }}
        >
          <div className="flex items-center gap-3">
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
                dogrulanmis ? "bg-green-soft text-green" : "bg-amber-soft text-amber"
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                {dogrulanmis ? <path d="M9 12l2 2 4-4" /> : null}
              </svg>
            </span>
            <div>
              <div className="font-display text-[16px] font-bold text-ink">
                {dogrulanmis ? "Doğrulanmış üretici" : "Doğrulama bekliyor"}
              </div>
              <p className="text-[12px] text-[var(--ink-faint)]">
                {dogrulanmis
                  ? "Firman doğrulandı — projelerin güven rozetiyle paylaşılabilir."
                  : "Firma doğrulaması concierge tarafından tamamlanınca güven rozeti aktif olur."}
              </p>
            </div>
          </div>
        </section>

        {/* PROFİL */}
        <section className="kart p-5">
          <div className="mb-3 flex items-center gap-2">
            <svg width="17" height="17" className="text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
            </svg>
            <h2 className="font-display text-[15px] font-bold text-ink">Profil</h2>
          </div>
          <Satir etiket="Ad / Yetkili" deger={ad} />
          <Satir etiket="E-posta" deger={user?.email ?? "—"} />
          <Satir etiket="Telefon" deger={profil?.telefon ?? "—"} />
          <Satir etiket="Rol" deger={profil?.rol === "admin" ? "Admin (üretici görünümü)" : "Üretici"} />
          <Satir
            etiket="Hesap oluşturma"
            deger={profil?.created_at ? new Date(profil.created_at).toLocaleDateString("tr-TR") : "—"}
          />
        </section>

        {/* FİRMA */}
        <section className="kart p-5">
          <div className="mb-3 flex items-center gap-2">
            <svg width="17" height="17" className="text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21V8l9-5 9 5v13" />
              <path d="M9 21v-6h6v6" />
            </svg>
            <h2 className="font-display text-[15px] font-bold text-ink">Üretici Firması</h2>
          </div>
          {firma ? (
            <>
              <Satir etiket="Firma adı" deger={firma.ad ?? "—"} />
              <Satir etiket="Vergi no" deger={firma.vergi_no ?? "—"} />
              <Satir etiket="Doğrulama" deger={dogrulanmis ? "Doğrulandı" : "Bekliyor"} />
              <Satir
                etiket="Kayıt"
                deger={firma.created_at ? new Date(firma.created_at).toLocaleDateString("tr-TR") : "—"}
              />
            </>
          ) : (
            <p className="py-2 text-[12.5px] text-[var(--ink-faint)]">
              Bu hesaba bağlı üretici firması bulunamadı. Firma tanımı concierge tarafından yapılır.
            </p>
          )}
        </section>

        {/* HIZLI ERİŞİM */}
        <section className="kart p-5">
          <h2 className="mb-3 font-display text-[15px] font-bold text-ink">Hızlı erişim</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/uretici" className="chip h-9 px-3.5 text-[12.5px]">
              Kokpit
            </Link>
            <Link href="/uretici/projeler" className="chip h-9 px-3.5 text-[12.5px]">
              Projeler
            </Link>
            <Link href="/uretici/stok" className="chip h-9 px-3.5 text-[12.5px]">
              Stok
            </Link>
            <Link href="/uretici/raporlar" className="chip h-9 px-3.5 text-[12.5px]">
              Raporlar
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
