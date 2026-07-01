import { createClient } from "@/lib/supabase/server";
import { BildirimListe, type Bildirim } from "@/components/BildirimListe";

export default async function HavuzBildirimler() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bildirim")
    .select("id, tip, baslik, govde, link, okundu, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return <BildirimListe bildirimler={(data ?? []) as Bildirim[]} />;
}
