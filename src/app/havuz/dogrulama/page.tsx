import { createClient } from "@/lib/supabase/server";
import { belgeYukle } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

const TIP_AD: Record<string, string> = {
  mesleki_yeterlilik: "Mesleki Yeterlilik / Taşınmaz Ticareti Yetki Belgesi",
  vergi_levhasi: "Vergi Levhası",
};
const DURUM_META: Record<string, { sinif: string; baslik: string; metin: string }> = {
  yok: { sinif: "border-amber/30 bg-amber-soft text-[#9a6a12]", baslik: "Hesabın doğrulanmadı", metin: "Belgelerini yükle. Doğrulanana kadar yalnız demo projeyi görürsün; tahsisli projelerin detayına giremezsin." },
  beklemede: { sinif: "border-teal/30 bg-teal-soft text-teal-d", baslik: "Belgelerin incelemede", metin: "Belgelerin alındı, ekibimiz doğruluyor. Onaylanınca tüm tahsisli projelere erişimin açılır." },
  dogrulandi: { sinif: "border-green/30 bg-green-soft text-[#1f7d4c]", baslik: "Doğrulandın ✓", metin: "Tüm tahsisli projelere erişimin açık. Teşekkürler." },
  red: { sinif: "border-red/30 bg-red-soft text-red", baslik: "Belgeler reddedildi", metin: "Belgeler doğrulanamadı. Lütfen geçerli, okunaklı belgeleri tekrar yükle." },
};
const inp = "w-full rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white";

export default async function Dogrulama({ searchParams }: { searchParams: Promise<{ hata?: string; mesaj?: string }> }) {
  const { hata, mesaj } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profil }, { data: belgeler }] = await Promise.all([
    supabase.from("profiles").select("belge_durumu").eq("id", user?.id ?? "").single(),
    supabase.from("kullanici_belge").select("id, tip, durum, created_at").eq("profile_id", user?.id ?? "").order("created_at", { ascending: false }),
  ]);
  const durum = (profil?.belge_durumu as string) ?? "yok";
  const meta = DURUM_META[durum] ?? DURUM_META.yok;
  const liste = (belgeler ?? []) as { id: string; tip: string; durum: string; created_at: string }[];

  return (
    <div className="mx-auto max-w-[820px] text-ink">
      <header className="belir mb-5">
        <h1 className="font-display text-[27px] font-bold tracking-tight text-navy">Hesap Doğrulama</h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          Güven protokolü — yetkili danışman olduğunu belgeleyince tahsisli projelere erişimin açılır.
        </p>
      </header>

      {hata ? <p role="alert" className="mb-4 rounded-xl border border-red/20 bg-red-soft px-4 py-2.5 text-sm font-medium text-red">{hata}</p> : null}
      {mesaj ? <p className="mb-4 rounded-xl border border-green/20 bg-green-soft px-4 py-2.5 text-sm font-medium text-teal-d">{mesaj}</p> : null}

      {/* DURUM */}
      <div className={`belir belir-1 rounded-2xl border p-5 ${meta.sinif}`}>
        <p className="font-display text-[15px] font-bold">{meta.baslik}</p>
        <p className="mt-1 text-[13px] opacity-90">{meta.metin}</p>
      </div>

      {/* YÜKLEME */}
      {durum !== "dogrulandi" ? (
        <form action={belgeYukle} className="belir belir-2 mt-5 space-y-4 rounded-2xl border border-hair bg-card p-5 shadow-card">
          <p className="text-[13px] font-semibold text-ink">Belge yükle</p>
          {(["mesleki_yeterlilik", "vergi_levhasi"] as const).map((t) => (
            <div key={t}>
              <label className="text-xs font-medium text-gray">{TIP_AD[t]}</label>
              <input type="file" name={t} accept="image/*,.pdf" className={`${inp} mt-1`} />
            </div>
          ))}
          <p className="text-[11px] text-gray">PDF veya görsel · maks 8MB. Belgelerin gizli tutulur (özel depolama + KVKK).</p>
          <SubmitButton>Belgeleri Yükle</SubmitButton>
        </form>
      ) : null}

      {/* YÜKLENENLER */}
      {liste.length > 0 ? (
        <div className="belir belir-3 mt-5 rounded-2xl border border-hair bg-card p-5 shadow-card">
          <p className="text-[13px] font-semibold text-ink">Yüklediğin belgeler</p>
          <ul className="mt-2 divide-y divide-hair">
            {liste.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2 text-[12.5px]">
                <span className="text-ink">{TIP_AD[b.tip] ?? b.tip}</span>
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                  b.durum === "dogrulandi" ? "bg-green-soft text-[#1f7d4c]" : b.durum === "red" ? "bg-red-soft text-red" : "bg-teal-soft text-teal-d"
                }`}>
                  {b.durum === "dogrulandi" ? "Onaylı" : b.durum === "red" ? "Reddedildi" : "İncelemede"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
