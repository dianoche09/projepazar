-- ProjePazar — Opsiyon → birim durum senkronu (çift-satış kalkanı; DEĞİŞMEZ #3)
-- Emlakçı birim'i doğrudan yazamaz (RLS). Opsiyon değişince birim.durum trigger ile senkron.
-- Idempotent. Browser SQL Editor veya supabase db push ile uygula.

create or replace function opsiyon_birim_senkron() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'DELETE' then
    -- Aktif başka opsiyon yoksa birim tekrar müsait
    if not exists (
      select 1 from opsiyon
      where birim_id = OLD.birim_id and durum in ('opsiyonlu','satis_beklemede') and id <> OLD.id
    ) then
      update birim set durum = 'musait', son_guncelleme = now()
      where id = OLD.birim_id and durum in ('opsiyonlu','satis_beklemede');
    end if;
    return OLD;
  end if;
  -- INSERT / UPDATE: opsiyon durumu birim'e yansır (tek doğru kaynak)
  if NEW.durum in ('opsiyonlu','satis_beklemede','satildi') then
    update birim set durum = NEW.durum, son_guncelleme = now() where id = NEW.birim_id;
  end if;
  return NEW;
end; $$;

drop trigger if exists opsiyon_birim_trg on opsiyon;
create trigger opsiyon_birim_trg
  after insert or update or delete on opsiyon
  for each row execute function opsiyon_birim_senkron();

-- Emlakçı kendi opsiyonunu bırakabilir (delete) → birim müsait (trigger)
drop policy if exists opsiyon_delete on opsiyon;
create policy opsiyon_delete on opsiyon for delete using (satici_id = auth.uid() or is_admin());
