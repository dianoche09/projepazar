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
     * Statik dosyalar ve PWA varlıkları hariç tüm rotalar:
     * _next/static, _next/image, favicon, sw.js, manifest, ikon/görsel uzantıları.
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
