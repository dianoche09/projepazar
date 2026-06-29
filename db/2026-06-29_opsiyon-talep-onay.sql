-- 2026-06-29 — Opsiyon TALEP→ONAY akışı + mahal marka
-- DEĞİŞMEZ #3 korunur: çift-satış kalkanı (opsiyon_tek_aktif unique index) + opsiyon_birim_senkron trigger AYNI.
-- Yeni kural: emlakçı DOĞRUDAN opsiyon ALAMAZ. Tahsisli+müsait birime "opsiyon talebi" (beklemede) açar.
--   Müteahhit onaylar → opsiyon oluşur (kilit), birim opsiyonlu olur, aynı birimdeki diğer talepler reddedilir.
-- Browser SQL Editor'den uygula (MCP/terminal yetkisiz).

-- 1) Mahal listesine MARKA kolonu (ör. "Vitra", "Bosch")
alter table mahal add column if not exists marka text;

-- 2) opsiyon_talep: talep→onay alanları (kod akışı opsiyonel kalır; durum: beklemede|onaylandi|reddedildi)
alter table opsiyon_talep add column if not exists not_emlakci text;
alter table opsiyon_talep add column if not exists karar_veren_id uuid references profiles(id);
alter table opsiyon_talep add column if not exists karar_at timestamptz;
alter table opsiyon_talep add column if not exists opsiyon_id uuid references opsiyon(id) on delete set null;

-- 3) Emlakçı DOĞRUDAN opsiyon insert EDEMESİN → yalnız admin (onay, SECURITY DEFINER fonksiyonla yazar)
drop policy if exists opsiyon_insert on opsiyon;
create policy opsiyon_insert on opsiyon for insert with check (is_admin());

-- 4) opsiyon_talep insert: emlakçı yalnız GÖREBİLDİĞİ (tahsisli) + müsait + satılabilir birime talep açar
drop policy if exists opsiyon_talep_insert on opsiyon_talep;
create policy opsiyon_talep_insert on opsiyon_talep for insert with check (
  talep_eden_id = auth.uid()
  and exists (
    select 1 from birim b
    where b.id = opsiyon_talep.birim_id
      and b.satilabilir = true and b.durum = 'musait'
      and emlakci_birim_gorebilir(b.proje_id, b.blok_id, b.tip_id, b.kat, b.tur::text)
  )
);

-- 5) Emlakçı kendi BEKLEYEN talebini geri çekebilsin
drop policy if exists opsiyon_talep_delete on opsiyon_talep;
create policy opsiyon_talep_delete on opsiyon_talep for delete using (
  (talep_eden_id = auth.uid() and durum = 'beklemede') or is_admin()
);

-- 6) ONAY fonksiyonu (müteahhit) — SECURITY DEFINER + kendi yetki kontrolü
create or replace function opsiyon_talep_onayla(p_talep uuid, p_gun int default 7)
  returns uuid language plpgsql security definer set search_path = public as $$
declare v_birim uuid; v_emlakci uuid; v_ops uuid; v_sahip uuid;
begin
  select t.birim_id, t.talep_eden_id into v_birim, v_emlakci
    from opsiyon_talep t where t.id = p_talep and t.durum = 'beklemede';
  if v_birim is null then raise exception 'Talep bulunamadı veya beklemede değil'; end if;
  select u.sahip_id into v_sahip
    from birim b join proje p on p.id = b.proje_id join uretici u on u.id = p.uretici_id
    where b.id = v_birim;
  if not (is_admin() or v_sahip = auth.uid()) then raise exception 'Yetki yok'; end if;
  if exists (select 1 from birim b where b.id = v_birim and b.durum <> 'musait') then
    raise exception 'Birim artık müsait değil';
  end if;
  insert into opsiyon (birim_id, satici_id, yontem, durum, kilit_bitis)
    values (v_birim, v_emlakci, 'talep_kod', 'opsiyonlu', now() + (p_gun || ' days')::interval)
    returning id into v_ops;
  update opsiyon_talep set durum = 'onaylandi', karar_veren_id = auth.uid(), karar_at = now(), opsiyon_id = v_ops
    where id = p_talep;
  update opsiyon_talep set durum = 'reddedildi', karar_veren_id = auth.uid(), karar_at = now()
    where birim_id = v_birim and durum = 'beklemede' and id <> p_talep;
  return v_ops;
end $$;

-- 7) RED fonksiyonu (müteahhit)
create or replace function opsiyon_talep_reddet(p_talep uuid)
  returns void language plpgsql security definer set search_path = public as $$
declare v_birim uuid; v_sahip uuid;
begin
  select t.birim_id into v_birim from opsiyon_talep t where t.id = p_talep and t.durum = 'beklemede';
  if v_birim is null then raise exception 'Talep bulunamadı'; end if;
  select u.sahip_id into v_sahip
    from birim b join proje p on p.id = b.proje_id join uretici u on u.id = p.uretici_id
    where b.id = v_birim;
  if not (is_admin() or v_sahip = auth.uid()) then raise exception 'Yetki yok'; end if;
  update opsiyon_talep set durum = 'reddedildi', karar_veren_id = auth.uid(), karar_at = now() where id = p_talep;
end $$;

grant execute on function opsiyon_talep_onayla(uuid, int) to authenticated;
grant execute on function opsiyon_talep_reddet(uuid) to authenticated;
