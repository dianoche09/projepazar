-- Realtime: birim değişimlerini emlakçıya CANLI yansıt. Browser → SQL Editor'den çalıştır.
-- postgres_changes RLS uygular → emlakçı yalnız TAHSİSLİ birimlerin değişimini alır (DEĞİŞMEZ #1).
-- DELETE için PK (id) replica identity'de zaten var; UPDATE/INSERT full row taşır.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'birim'
  ) then
    alter publication supabase_realtime add table birim;
  end if;
end $$;
