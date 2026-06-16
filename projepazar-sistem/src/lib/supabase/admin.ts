import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — YALNIZ server (server action / cron). DEĞİŞMEZ #1: asla client'a sızmaz.
 * SUPABASE_SERVICE_ROLE_KEY NEXT_PUBLIC değildir → client bundle'a girmez.
 * auth.admin.* (createUser / deleteUser / resetPassword) ve RLS-bypass yazma için.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY tanımlı değil (server env).");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
