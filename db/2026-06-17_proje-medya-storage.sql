-- Proje tanıtım medyası (kapak foto, galeri, tanıtım videosu, broşür/katalog) + resmi belgeler
-- için Supabase Storage bucket. Browser Dashboard → SQL Editor'den çalıştır.
--
-- DEĞİŞMEZ #1: yazma YALNIZ service-role (server action `medyaYukle`). Bucket public READ
-- (pazarlama görselleri servis edilir); storage.objects üzerinde client write policy YOK,
-- dolayısıyla anon/authenticated yazamaz — yalnız server tarafı service-role yazar/siler.

insert into storage.buckets (id, name, public, file_size_limit)
values ('proje-medya', 'proje-medya', true, 52428800)  -- 50 MB
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;
