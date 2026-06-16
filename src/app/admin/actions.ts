"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Üretici doğrulama / güven rozeti (admin yetkisi — RLS is_admin owner). */
export async function ureticiDogrula(formData: FormData) {
  const supabase = await createClient();
  const uretici_id = String(formData.get("uretici_id"));
  const dogrula = formData.get("dogrula") === "true";

  await supabase.from("uretici").update({ dogrulanmis: dogrula }).eq("id", uretici_id);
  revalidatePath("/admin");
}
