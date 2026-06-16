-- ProjePazar — Abonelik / Gelir katmanı (Admin = platform işletmecisi; gelir modeli ①/②)
-- Idempotent: tekrar çalıştırılabilir. Browser SQL Editor veya supabase db push ile uygula.

-- Paket = ofis/franchise SaaS kademeleri (ANA GELİR). Üretici (②) için de kullanılır.
create table if not exists abonelik_paketi (
  id             uuid primary key default gen_random_uuid(),
  ad             text not null,
  hedef          text not null default 'ofis',  -- 'ofis' | 'uretici'
  fiyat_aylik    numeric not null default 0,
  para_birimi    text not null default 'TRY',
  kota_proje     int,
  kota_koltuk    int,
  kota_ai        int,
  gelismis_rapor boolean default false,
  aktif          boolean default true,
  siralama       int default 0,
  created_at     timestamptz default now()
);

-- Atanan abonelik: ofis VEYA üretici → paket. Tek aktif abonelik/abone.
create table if not exists abonelik (
  id            uuid primary key default gen_random_uuid(),
  ofis_id       uuid references ofis(id) on delete cascade,
  uretici_id    uuid references uretici(id) on delete cascade,
  paket_id      uuid not null references abonelik_paketi(id),
  durum         text not null default 'deneme',
  baslangic     date default current_date,
  bitis         date,
  kota_proje_override  int,
  kota_koltuk_override int,
  not_admin     text,
  created_at    timestamptz default now(),
  constraint abonelik_tek_abone check (
    (ofis_id is not null)::int + (uretici_id is not null)::int = 1
  )
);
create unique index if not exists abonelik_ofis_aktif on abonelik (ofis_id)
  where durum in ('deneme','aktif') and ofis_id is not null;
create unique index if not exists abonelik_uretici_aktif on abonelik (uretici_id)
  where durum in ('deneme','aktif') and uretici_id is not null;

alter table abonelik_paketi enable row level security;
alter table abonelik        enable row level security;

drop policy if exists paket_read  on abonelik_paketi;
drop policy if exists paket_admin on abonelik_paketi;
create policy paket_read  on abonelik_paketi for select using (true);
create policy paket_admin on abonelik_paketi for all using (is_admin()) with check (is_admin());

drop policy if exists abonelik_admin on abonelik;
drop policy if exists abonelik_self  on abonelik;
create policy abonelik_admin on abonelik for all using (is_admin()) with check (is_admin());
create policy abonelik_self on abonelik for select using (
  ofis_id = current_ofis()
  or exists (select 1 from uretici u where u.id = abonelik.uretici_id and u.sahip_id = auth.uid())
);

-- Önceki bekleyen: birim durum notu (idempotent garanti)
alter table birim add column if not exists durum_notu text;

-- NOT: Üyelik paketleri (tip/fiyat/kota) admin panelinden tanımlanır — hardcode fiyat YOK.
