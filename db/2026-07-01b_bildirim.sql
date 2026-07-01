-- 2026-07-01b — Anlık BİLDİRİM (in-app). Opsiyon talep→onay + tahsis + lead akışını kullanıcıya iletir.
-- Insert YALNIZ server action + admin client (service-role) ile — spoofing engeli (RLS insert policy YOK).
-- Kullanıcı yalnız KENDİ bildirimini görür/okur. Browser SQL Editor'den uygula.

create table if not exists bildirim (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  tip        text not null,              -- talep | onay | red | tahsis | lead | sistem
  baslik     text not null,
  govde      text,
  link       text,
  okundu     boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists bildirim_profil_idx on bildirim(profile_id, okundu, created_at desc);

alter table bildirim enable row level security;
drop policy if exists bildirim_self on bildirim;
create policy bildirim_self on bildirim for select using (profile_id = auth.uid());
drop policy if exists bildirim_self_upd on bildirim;
create policy bildirim_self_upd on bildirim for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
