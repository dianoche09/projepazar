import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Sunucu (Server Component / Route Handler / Server Action) Supabase istemcisi.
 * anon key + kullanıcı oturumu (cookie) ile çalışır; RLS uygulanır.
 * service-role yalnız ayrı, açıkça server-only yardımcılarda kullanılır (cron vb.) — burada değil.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component'ten çağrıldı: oturum tazeleme middleware'de yapılır.
          }
        },
      },
    },
  );
}
