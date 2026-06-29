-- 2026-06-29d — Tahsis DAİRE-BAZLI kapsam (kapsam.birimler) + çoklu-alıcı (çoklu-alıcı = form/action, şema yok)
-- ÖNCE 2026-06-29c (KYC gate) uygulanmış olmalı — bu fonksiyon belge_durumu/demo'yu da içerir.
-- kapsam.birimler doluysa emlakçı YALNIZ o birim id'lerini görür. Browser SQL Editor'den uygula.

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
          and (coalesce(jsonb_array_length(t.kapsam->'birimler'),0) = 0
               or p_birim_id::text in (select jsonb_array_elements_text(t.kapsam->'birimler')))
      )
    )
$$;

-- birim SELECT policy: birim.id'yi de fonksiyona geçir (daire-bazlı kapsam çalışsın)
drop policy if exists birim_emlakci_select on birim;
create policy birim_emlakci_select on birim for select using (
  emlakci_birim_gorebilir(birim.id, birim.proje_id, birim.blok_id, birim.tip_id, birim.kat, birim.tur::text)
);
