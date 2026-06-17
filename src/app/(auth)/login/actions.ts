"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { panelYolu } from "@/lib/roller";

// MVP: kod kuralı — input doğrulama Zod ile (CLAUDE.md)
const girisSemasi = z.object({
  email: z.string().email("Geçerli bir e-posta gir"),
  password: z.string().min(6, "Parola en az 6 karakter olmalı"),
});

export async function girisYap(formData: FormData) {
  const sonuc = girisSemasi.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!sonuc.success) {
    redirect(`/login?hata=${encodeURIComponent(sonuc.error.issues[0].message)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(sonuc.data);
  if (error || !data.user) {
    redirect(`/login?hata=${encodeURIComponent(error?.message ?? "Giriş başarısız")}`);
  }

  // Son giriş izi + hesap durumu: pasif/onay-bekleyen kullanıcı panele giremez
  await supabase
    .from("profiles")
    .update({ son_giris: new Date().toISOString() })
    .eq("id", data.user.id);
  const { data: profil } = await supabase
    .from("profiles")
    .select("durum, rol")
    .eq("id", data.user.id)
    .single();

  revalidatePath("/", "layout");
  if (profil && profil.durum !== "aktif") redirect("/hesap-bekliyor");
  // Kim girerse doğrudan kendi kokpitine — ara adım yok
  redirect(panelYolu(profil?.rol));
}

export async function cikisYap() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
