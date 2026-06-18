-- Mahal Listesi — proje teslim standardı (her mahal için zemin/duvar/tavan kaplaması).
-- Browser → SQL Editor'den çalıştır. Idempotent: tekrar çalıştırılabilir.
-- RLS: üretici kendi projesini yönetir; tahsisli emlakçı okur.
create table if not exists mahal (
  id         uuid primary key default gen_random_uuid(),
  proje_id   uuid not null references proje(id) on delete cascade,
  mahal      text not null,        -- "Salon", "Mutfak", "Banyo", "Yatak Odası 1"...
  zemin      text,
  duvar      text,
  tavan      text,
  aciklama   text,
  sira       int default 0,
  created_at timestamptz default now()
);

alter table mahal enable row level security;

-- Politikaları güvenle (drop varsa + yeniden) kur — CREATE POLICY IF NOT EXISTS yok
drop policy if exists mahal_owner on mahal;
drop policy if exists mahal_read on mahal;

create policy mahal_owner on mahal for all using (
  is_admin() or exists (
    select 1 from proje p join uretici u on u.id = p.uretici_id
    where p.id = mahal.proje_id and u.sahip_id = auth.uid()
  )
);
create policy mahal_read on mahal for select using (emlakci_proje_tahsisli(mahal.proje_id));
