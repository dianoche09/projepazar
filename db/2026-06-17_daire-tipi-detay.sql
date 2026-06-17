-- Daire tipine banyo / balkon / otopark detayları. Browser → SQL Editor'den çalıştır.
-- oda zaten var; banyo+balkon adet, otopark serbest metin (ör. "1 kapalı", "açık").
alter table daire_tipi
  add column if not exists banyo   int,
  add column if not exists balkon  int,
  add column if not exists otopark text;
