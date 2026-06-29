-- 2026-06-29b — Opsiyon talep SAĞLAMLIK (review bulguları): bekleyen-talep tekilliği + onay race kilidi
-- Browser SQL Editor'den uygula. DEĞİŞMEZ #3 korunur.

-- 1) Aynı emlakçı aynı birime TEK bekleyen talep (TOCTOU dup-talep önler; app-katmanı dup-check'i destekler)
create unique index if not exists opsiyon_talep_bekleyen_tek
  on opsiyon_talep (talep_eden_id, birim_id) where durum = 'beklemede';

-- 2) Onay fonksiyonu: talep satırını FOR UPDATE ile kilitle (eş-zamanlı çift onay → ikinci çağrı bekler/temiz hata)
create or replace function opsiyon_talep_onayla(p_talep uuid, p_gun int default 7)
  returns uuid language plpgsql security definer set search_path = public as $$
declare v_birim uuid; v_emlakci uuid; v_ops uuid; v_sahip uuid;
begin
  select t.birim_id, t.talep_eden_id into v_birim, v_emlakci
    from opsiyon_talep t where t.id = p_talep and t.durum = 'beklemede'
    for update;
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
