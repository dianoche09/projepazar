-- 2026-06-30 — Eklenti birimler: otopark/depo bir ANA DAİREYE bağlanır (appurtenance/müştemilat)
-- ana_birim_id NULL = bağımsız birim. Doluysa bu birim (otopark/depo) o daireye eklentidir.
-- Fiyat tek doğru kaynak korunur (DEĞİŞMEZ #2): eklentinin kendi liste_fiyati var; toplam UI'da hesaplanır.
-- Browser SQL Editor'den uygula.

alter table birim add column if not exists ana_birim_id uuid references birim(id) on delete set null;
create index if not exists birim_ana_birim_idx on birim(ana_birim_id);
comment on column birim.ana_birim_id is 'Eklenti (otopark/depo) bu ana daireye bağlı; NULL = bağımsız birim';
