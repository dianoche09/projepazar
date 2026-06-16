import { createBrowserClient } from "@supabase/ssr";

/**
 * Tarayıcı (Client Component) Supabase istemcisi.
 * Yalnız anon key kullanır — RLS görünürlüğü tahsis ile sınırlıdır (DEĞİŞMEZ #1).
 * Service-role ASLA client'ta kullanılmaz.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
