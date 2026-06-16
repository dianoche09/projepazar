"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Self-registration — rol seçimli. Kayıt 'onay_bekliyor' başlar (handle_new_user trigger).
const kayitSemasi = z.object({
  email: z.string().email("Geçerli bir e-posta gir"),
  password: z.string().min(6, "Parola en az 6 karakter olmalı"),
  ad: z.string().trim().min(2, "Ad-soyad gir"),
  telefon: z.string().trim().max(20).optional(),
  talep_rol: z.enum(["uretici", "emlakci", "ofis_yetkili"], { message: "Hesap türü seç" }),
  vergi_no: z.string().trim().max(20).optional(),
  ofis_adi: z.string().trim().max(100).optional(),
});

export async function kayitOl(formData: FormData) {
  const sonuc = kayitSemasi.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    ad: formData.get("ad"),
    telefon: (formData.get("telefon") as string) || undefined,
    talep_rol: formData.get("talep_rol"),
    vergi_no: (formData.get("vergi_no") as string) || undefined,
    ofis_adi: (formData.get("ofis_adi") as string) || undefined,
  });
  if (!sonuc.success) {
    redirect(`/kayit?hata=${encodeURIComponent(sonuc.error.issues[0].message)}`);
  }
  const { email, password, ad, telefon, talep_rol, vergi_no, ofis_adi } = sonuc.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        ad,
        telefon: telefon ?? null,
        talep_rol,
        kayit_meta: { vergi_no: vergi_no ?? null, ofis_adi: ofis_adi ?? null },
      },
    },
  });
  if (error) {
    redirect(`/kayit?hata=${encodeURIComponent(error.message)}`);
  }

  // E-posta onayı kapalı (test) → oturum açık; hesap onay_bekliyor → bekleme ekranı
  redirect("/hesap-bekliyor");
}
