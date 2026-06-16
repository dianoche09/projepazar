"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// MVP: kod kuralı — input doğrulama Zod ile (CLAUDE.md)
const girisSemasi = z.object({
  email: z.string().email("Geçerli bir e-posta gir"),
  password: z.string().min(6, "Parola en az 6 karakter olmalı"),
});

function pars(formData: FormData) {
  return girisSemasi.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function girisYap(formData: FormData) {
  const sonuc = pars(formData);
  if (!sonuc.success) {
    redirect(`/login?hata=${encodeURIComponent(sonuc.error.issues[0].message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(sonuc.data);
  if (error) {
    redirect(`/login?hata=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function kayitOl(formData: FormData) {
  const sonuc = pars(formData);
  if (!sonuc.success) {
    redirect(`/login?hata=${encodeURIComponent(sonuc.error.issues[0].message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(sonuc.data);
  if (error) {
    redirect(`/login?hata=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/login?mesaj=" +
      encodeURIComponent("Onay e-postası gönderildi, gelen kutunu kontrol et."),
  );
}

export async function cikisYap() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
