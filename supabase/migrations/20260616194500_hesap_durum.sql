-- ProjePazar — Hesap yaşam döngüsü (kayıt → onay kuyruğu → aktif → arşiv)
-- Idempotent. Browser SQL Editor veya supabase db push ile uygula.

-- Hesap durumu
do $$ begin
  create type hesap_durum as enum ('onay_bekliyor','aktif','pasif','askida','arsivli');
exception when duplicate_object then null; end $$;

-- profiles: durum + denetim/iz alanları
alter table profiles add column if not exists durum        hesap_durum;
alter table profiles add column if not exists son_giris    timestamptz;
alter table profiles add column if not exists onaylayan_id uuid references profiles(id);
alter table profiles add column if not exists onay_tarihi  timestamptz;
alter table profiles add column if not exists talep_rol    rol;
alter table profiles add column if not exists kayit_meta   jsonb;

-- Mevcut kullanıcılar AKTİF (yeni kolon onları kilitlememeli); yeni kayıtlar onay bekler
update profiles set durum = 'aktif' where durum is null;
alter table profiles alter column durum set default 'onay_bekliyor';
alter table profiles alter column durum set not null;

-- Kayıt metadata'sını işle, hesabı onay kuyruğuna düşür (rol admin tarafından onayda atanır)
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, ad, telefon, durum, talep_rol, kayit_meta)
  values (
    new.id,
    new.raw_user_meta_data->>'ad',
    new.raw_user_meta_data->>'telefon',
    'onay_bekliyor',
    (case when new.raw_user_meta_data->>'talep_rol' in ('uretici','emlakci','ofis_yetkili')
          then (new.raw_user_meta_data->>'talep_rol')::rol else null end),
    new.raw_user_meta_data->'kayit_meta'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- Admin: tüm profilleri yönetebilir (onay/rol/ofis/durum güncelleme)
drop policy if exists profiles_admin on profiles;
create policy profiles_admin on profiles for all using (is_admin()) with check (is_admin());
