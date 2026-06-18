import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16: "middleware" → "proxy" file convention.
// Her istekte Supabase oturumunu tazeler, korumalı rotaları /login'e yönlendirir.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Şunlar HARİÇ tüm rotalar:
     * - api: API rotaları kendi auth'unu yönetir (cron = CRON_SECRET, lead = public). Middleware
     *   /login'e yönlendirmesin → yoksa /api/cron 307 olur, hiç çalışmaz.
     * - statik/PWA: _next/static, _next/image, favicon, sw.js, manifest, ikon/görsel uzantıları.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
