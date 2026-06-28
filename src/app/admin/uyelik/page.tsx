import { createClient } from "@/lib/supabase/server";
import { type AbonelikPaketi } from "@/lib/types";
import { PaketYonetimi } from "@/components/PaketYonetimi";
import { GeriLink, SayfaBaslik } from "../_ortak";

export default async function UyelikSayfasi() {
  const supabase = await createClient();
  const { data: paketler } = await supabase.from("abonelik_paketi").select("*").order("siralama");
  const liste = (paketler ?? []) as AbonelikPaketi[];
  const aktifSay = liste.filter((p) => p.aktif).length;

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6 sm:px-6">
      <GeriLink href="/admin" etiket="Genel Bakış" />

      <SayfaBaslik
        baslik="Üyelik Paketleri"
        altEtiket={
          <>
            <span className="font-medium">{liste.length} paket · {aktifSay} aktif</span>
            <span className="text-hair">·</span>
            <span className="mono text-xs text-gray">tip · fiyat · kota %100 admin-kontrollü</span>
          </>
        }
        sag={<span className="rozet mono bg-navy/10 text-navy">{aktifSay} aktif paket</span>}
      />

      <p className="text-sm text-ink-soft">
        Tip, fiyat ve kotalar tamamen burada tanımlanır — ofis, üretici, emlakçı. Sabit/varsayılan fiyat yok.
      </p>

      <div className="belir belir-1">
        <PaketYonetimi paketler={liste} />
      </div>
    </div>
  );
}
