import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Login'siz erişilebilen rotalar (paylaşım landing'i ve public microsite Faz/PR-7'de). */
function herkeseAcik(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/kayit") || // self-registration
    pathname.startsWith("/p/") || // imzalı paylaşım landing
    pathname.startsWith("/proje/") || // public proje microsite (PR-7)
    pathname.startsWith("/kvkk-aydinlatma") || // KVKK aydınlatma (lead formundan, anonim erişim)
    pathname.startsWith("/kullanim-kosullari") || // hukuki sayfa (public)
    pathname.startsWith("/gizlilik") || // hukuki sayfa (public)
    pathname.startsWith("/tasarim") || // tasarım yönü örnekleri (geçici showcase)
    pathname.startsWith("/anasayfa_mockup") // interaktif anasayfa prototipi
  );
}

/**
 * Her istekte Supabase oturumunu tazeler ve korumalı rotaları /login'e yönlendirir.
 * @supabase/ssr deseni: cookie'leri request+response arasında senkron tut.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() oturumu doğrular (getSession'a güvenme — token'ı server'da doğrular)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (!user && !herkeseAcik(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Pasif / onay bekleyen kullanıcı panellere giremez → bekleme ekranı
  if (user && !herkeseAcik(pathname) && pathname !== "/hesap-bekliyor") {
    const { data: profil } = await supabase
      .from("profiles")
      .select("durum")
      .eq("id", user.id)
      .single();
    if (profil && profil.durum !== "aktif") {
      const url = request.nextUrl.clone();
      url.pathname = "/hesap-bekliyor";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
