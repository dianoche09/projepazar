-- 2026-07-01 — Emlakçı KATEGORİZASYONU (marka/şehir/uzmanlık) + SEGMENT tahsis
-- Müteahhit "RE/MAX olanlar" / "Ankara emlakçıları" gibi CANLI segmentlere tahsis eder (snapshot DEĞİL →
-- o segmente sonradan katılan danışman da otomatik görür). enum değişmeden: hedef_tip='herkes' + hedef_filtre.
-- Browser SQL Editor'den uygula.

-- 1) Kategori alanları — ofis taşıyıcı + profiles denormalize (filtre/RLS tek tabloda)
alter table ofis     add column if not exists marka text;
alter table ofis     add column if not exists il    text;
alter table ofis     add column if not exists ilce  text;
alter table profiles add column if not exists marka    text;   -- RE/MAX, Century 21, Turyap, Bağımsız...
alter table profiles add column if not exists il       text;   -- Ankara, İstanbul...
alter table profiles add column if not exists ilce     text;
alter table profiles add column if not exists uzmanlik text;   -- konut | ticari | arsa | proje
create index if not exists profiles_emlakci_kategori_idx on profiles(il, marka) where rol = 'emlakci';

-- 2) Segment tahsis: hedef_filtre (boş boyut = o boyutta sınırsız). filtre null = TÜM ağ.
alter table tahsis add column if not exists hedef_filtre jsonb;  -- {marka, il, ilce, uzmanlik}

-- 3) current_* yardımcıları (RLS: auth.uid() kategorisi)
create or replace function current_marka() returns text language sql stable security definer set search_path=public as $$ select marka from profiles where id = auth.uid() $$;
create or replace function current_il()    returns text language sql stable security definer set search_path=public as $$ select il    from profiles where id = auth.uid() $$;
create or replace function current_ilce()  returns text language sql stable security definer set search_path=public as $$ select ilce  from profiles where id = auth.uid() $$;
create or replace function current_uzmanlik() returns text language sql stable security definer set search_path=public as $$ select uzmanlik from profiles where id = auth.uid() $$;

-- 4) RLS — 'herkes' kolu artık hedef_filtre ile süzülür (segment). KYC gate + daire-kapsam korunur.
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
          and (
            (t.hedef_tip = 'herkes'
              and (t.hedef_filtre->>'marka'    is null or current_marka()    = t.hedef_filtre->>'marka')
              and (t.hedef_filtre->>'il'       is null or current_il()       = t.hedef_filtre->>'il')
              and (t.hedef_filtre->>'ilce'     is null or current_ilce()     = t.hedef_filtre->>'ilce')
              and (t.hedef_filtre->>'uzmanlik' is null or current_uzmanlik() = t.hedef_filtre->>'uzmanlik'))
            or (t.hedef_tip = 'danisman' and t.hedef_id = auth.uid())
            or (t.hedef_tip = 'ofis' and t.hedef_id = current_ofis())
          )
      )
    )
$$;

create or replace function emlakci_birim_gorebilir(
  p_birim_id uuid, p_proje_id uuid, p_blok_id uuid, p_tip_id uuid, p_kat int, p_tur text
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
          and (
            (t.hedef_tip = 'herkes'
              and (t.hedef_filtre->>'marka'    is null or current_marka()    = t.hedef_filtre->>'marka')
              and (t.hedef_filtre->>'il'       is null or current_il()       = t.hedef_filtre->>'il')
              and (t.hedef_filtre->>'ilce'     is null or current_ilce()     = t.hedef_filtre->>'ilce')
              and (t.hedef_filtre->>'uzmanlik' is null or current_uzmanlik() = t.hedef_filtre->>'uzmanlik'))
            or (t.hedef_tip = 'danisman' and t.hedef_id = auth.uid())
            or (t.hedef_tip = 'ofis' and t.hedef_id = current_ofis())
          )
          and (coalesce(jsonb_array_length(t.kapsam->'bloklar'),0) = 0 or p_blok_id::text in (select jsonb_array_elements_text(t.kapsam->'bloklar')))
          and (coalesce(jsonb_array_length(t.kapsam->'tipler'),0) = 0 or p_tip_id::text in (select jsonb_array_elements_text(t.kapsam->'tipler')))
          and (coalesce(jsonb_array_length(t.kapsam->'katlar'),0) = 0 or p_kat::text in (select jsonb_array_elements_text(t.kapsam->'katlar')))
          and (coalesce(jsonb_array_length(t.kapsam->'turler'),0) = 0 or p_tur in (select jsonb_array_elements_text(t.kapsam->'turler')))
          and (coalesce(jsonb_array_length(t.kapsam->'birimler'),0) = 0 or p_birim_id::text in (select jsonb_array_elements_text(t.kapsam->'birimler')))
      )
    )
$$;

-- 5) Demo backfill — test için kategorize et (3 emlakçı: farklı marka/şehir)
update ofis set marka='RE/MAX', il='Ankara', ilce='Çankaya' where id='55555555-5555-5555-5555-555555555555';
update profiles set marka='RE/MAX',     il='Ankara',   ilce='Çankaya',  uzmanlik='konut'  where id='22222222-2222-2222-2222-222222222222';
update profiles set marka='Century 21', il='İstanbul', ilce='Kadıköy',  uzmanlik='konut'  where id='33333333-3333-3333-3333-333333333333';
update profiles set marka='Bağımsız',   il='Ankara',   ilce='Keçiören', uzmanlik='ticari' where id='44444444-4444-4444-4444-444444444444';
