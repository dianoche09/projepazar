"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/uuid";

/** Tek bildirimi okundu işaretle (RLS bildirim_self_upd — yalnız kendi). */
export async function bildirimOku(id: string): Promise<void> {
  if (!UUID_RE.test(id)) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("bildirim").update({ okundu: true }).eq("id", id).eq("profile_id", user.id);
  revalidatePath("/uretici/bildirimler");
  revalidatePath("/havuz/bildirimler");
  revalidatePath("/uretici");
  revalidatePath("/havuz");
}

/** Tüm okunmamışları okundu işaretle. */
export async function bildirimHepsiOku(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("bildirim").update({ okundu: true }).eq("profile_id", user.id).eq("okundu", false);
  revalidatePath("/uretici/bildirimler");
  revalidatePath("/havuz/bildirimler");
  revalidatePath("/uretici");
  revalidatePath("/havuz");
}
