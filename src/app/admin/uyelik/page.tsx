import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { type AbonelikPaketi } from "@/lib/types";
import { PaketYonetimi } from "@/components/PaketYonetimi";

export default async function UyelikSayfasi() {
  const supabase = await createClient();
  const { data: paketler } = await supabase.from("abonelik_paketi").select("*").order("siralama");

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-sm font-medium text-teal hover:underline">
        ← Yönetim
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Üyelik paketleri & fiyatlandırma</h1>
      <p className="mt-1 text-sm text-gray">
        Tip, fiyat ve kotalar tamamen burada tanımlanır — ofis, üretici, emlakçı. Sabit/varsayılan fiyat yok.
      </p>
      <div className="mt-6">
        <PaketYonetimi paketler={(paketler ?? []) as AbonelikPaketi[]} />
      </div>
    </div>
  );
}
