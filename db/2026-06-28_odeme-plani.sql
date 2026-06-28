-- Ödeme planı: yapılandırılmış / çok-aşamalı (Connject paritesi). Idempotent — tekrar çalıştırılabilir.
-- Browser → Supabase Dashboard → SQL Editor'den çalıştır (bu projede MCP/CLI migration çalışmıyor).
-- Şema: { pesinat_pct, taksit_sayisi, ara_odemeler:[{ay,pct}], vade_farki_pct, para_birimi }
-- Aylık taksit UI'da hesaplanır (saklanmaz): (liste_fiyati * (1 - pesinat_pct/100 - Σara_pct/100)) / taksit_sayisi.
-- Eski odeme_plani_url (text/PDF link) duruyor; yeni gösterim odeme_plani jsonb'den.
alter table birim add column if not exists odeme_plani jsonb;
