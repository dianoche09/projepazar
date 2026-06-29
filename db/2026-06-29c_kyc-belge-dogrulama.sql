-- 2026-06-29c — KYC / Belge Doğrulama GATE (mesleki yeterlilik + vergi levhası)
-- Emlakçı doğrulanana kadar YALNIZ demo proje görür. Browser SQL Editor'den uygula.
-- DEĞİŞMEZ #1 (RLS-önce) korunur: görünürlük = tahsis + belge_durumu.

-- 1) profiles.belge_durumu (yok|beklemede|dogrulandi|red) + proje.demo
alter table profiles add column if not exists belge_durumu text not null default 'yok';
alter table proje add column if not exists demo boolean not null default false;

-- GÜVENLİK: emlakçı kendini 'dogrulandi' YAPAMAZ (profiles_self_upd RLS satırı güncellemeye izin verir;
-- bu trigger yalnız admin'in 'dogrulandi' set etmesine izin verir → gate bypass engeli).
create or replace function belge_durumu_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if NEW.belge_durumu = 'dogrulandi' and OLD.belge_durumu is distinct from 'dogrulandi' and not is_admin() then
    NEW.belge_durumu := OLD.belge_durumu;
  end if;
  return NEW;
end $$;
drop trigger if exists profiles_belge_guard on profiles;
create trigger profiles_belge_guard before update on profiles
  for each row execute function belge_durumu_guard();

-- GRANDFATHER: mevcut aktif emlakçılar doğrulanmış sayılır (demo/canlı erişim bozulmasın)
update profiles set belge_durumu = 'dogrulandi' where rol = 'emlakci' and durum = 'aktif';
-- Bir demo proje (doğrulanmamış emlakçı bunu görebilir — vitrin)
update proje set demo = true where id = '77777777-7777-7777-7777-777777777777';

-- 2) Belge tablosu (mesleki_yeterlilik | vergi_levhasi)
create table if not exists kullanici_belge (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  tip        text not null,                 -- mesleki_yeterlilik | vergi_levhasi
  url        text not null,
  ai_sonuc   jsonb,                          -- {tip, ad, vergi_no, gecerli, skor, ozet}
  durum      text not null default 'beklemede', -- beklemede | dogrulandi | red
  created_at timestamptz default now()
);
alter table kullanici_belge enable row level security;
drop policy if exists kullanici_belge_self on kullanici_belge;
create policy kullanici_belge_self on kullanici_belge for all
  using (profile_id = auth.uid() or is_admin())
  with check (profile_id = auth.uid() or is_admin());

-- 3) Private storage bucket (KYC belgeleri hassas → public=false; path = {profile_id}/dosya)
insert into storage.buckets (id, name, public) values ('kyc-belge', 'kyc-belge', false)
  on conflict (id) do nothing;
drop policy if exists "kyc yukle" on storage.objects;
drop policy if exists "kyc oku" on storage.objects;
drop policy if exists "kyc sil" on storage.objects;
create policy "kyc yukle" on storage.objects for insert to authenticated
  with check (bucket_id = 'kyc-belge' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kyc oku" on storage.objects for select to authenticated
  using (bucket_id = 'kyc-belge' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));
create policy "kyc sil" on storage.objects for delete to authenticated
  using (bucket_id = 'kyc-belge' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- 4) GATE: emlakçı görünürlük fonksiyonları — demo proje herkese; canlı proje yalnız DOĞRULANMIŞ + tahsisli
create or replace function emlakci_proje_tahsisli(p_proje_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select
    coalesce((select demo from proje where id = p_proje_id), false)
    or (
      (select belge_durumu from profiles where id = auth.uid()) = 'dogrulandi'
      and exists(
        select 1 from tahsis t
        where t.proje_id = p_proje_id
          and (t.bitis is null or t.bitis > now())
          and (t.hedef_tip = 'herkes'
            or (t.hedef_tip = 'danisman' and t.hedef_id = auth.uid())
            or (t.hedef_tip = 'ofis' and t.hedef_id = current_ofis()))
      )
    )
$$;

create or replace function emlakci_birim_gorebilir(
  p_proje_id uuid, p_blok_id uuid, p_tip_id uuid, p_kat int, p_tur text
) returns boolean
  language sql stable security definer set search_path = public as $$
  select
    coalesce((select demo from proje where id = p_proje_id), false)
    or (
      (select belge_durumu from profiles where id = auth.uid()) = 'dogrulandi'
      and exists(
        select 1 from tahsis t
        where t.proje_id = p_proje_id
          and (t.bitis is null or t.bitis > now())
          and (t.hedef_tip = 'herkes'
            or (t.hedef_tip = 'danisman' and t.hedef_id = auth.uid())
            or (t.hedef_tip = 'ofis' and t.hedef_id = current_ofis()))
          and (coalesce(jsonb_array_length(t.kapsam->'bloklar'),0) = 0
               or p_blok_id::text in (select jsonb_array_elements_text(t.kapsam->'bloklar')))
          and (coalesce(jsonb_array_length(t.kapsam->'tipler'),0) = 0
               or p_tip_id::text in (select jsonb_array_elements_text(t.kapsam->'tipler')))
          and (coalesce(jsonb_array_length(t.kapsam->'katlar'),0) = 0
               or p_kat::text in (select jsonb_array_elements_text(t.kapsam->'katlar')))
          and (coalesce(jsonb_array_length(t.kapsam->'turler'),0) = 0
               or p_tur in (select jsonb_array_elements_text(t.kapsam->'turler')))
      )
    )
$$;
