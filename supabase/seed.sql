-- ProjePazar — Seed (MVP demo verisi)
-- NOT: Gerçek stok değil; test/demo. Tüm auth kullanıcıları parola: ProjePazar123!
-- RLS testini mümkün kılar: A Blok herkese açık, B Blok yalnız Demo ofisine tahsisli.

create extension if not exists pgcrypto;

-- =========================================================
-- AUTH KULLANICILARI (handle_new_user trigger profiles'ı otomatik oluşturur)
-- =========================================================
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111111','authenticated','authenticated','uretici@projepazar.test',crypt('ProjePazar123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"ad":"Demo Üretici Sahibi"}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222222','authenticated','authenticated','emlakci1@projepazar.test',crypt('ProjePazar123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"ad":"Emlakçı Bir"}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','33333333-3333-3333-3333-333333333333','authenticated','authenticated','emlakci2@projepazar.test',crypt('ProjePazar123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"ad":"Emlakçı İki"}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','44444444-4444-4444-4444-444444444444','authenticated','authenticated','emlakci3@projepazar.test',crypt('ProjePazar123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"ad":"Emlakçı Üç (ofissiz)"}',now(),now(),'','','','')
on conflict (id) do nothing;

-- E-posta ile giriş için identities (bazı Supabase sürümleri zorunlu)
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
select u.id::text, u.id, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', now(), now(), now()
from auth.users u
where u.id in (
  '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444'
)
on conflict do nothing;

-- =========================================================
-- OFİS + PROFİL ROLLERİ
-- =========================================================
insert into ofis (id, ad, marka, il, ilce) values
  ('55555555-5555-5555-5555-555555555555','Demo Gayrimenkul','Bağımsız','Ankara','Çankaya')
on conflict (id) do nothing;

-- profiles trigger ile oluştu (rol default 'emlakci'); rol/ofis/telefon güncelle
update profiles set rol='uretici', telefon='+905550000001' where id='11111111-1111-1111-1111-111111111111';
update profiles set rol='emlakci', ofis_id='55555555-5555-5555-5555-555555555555', telefon='+905550000002' where id='22222222-2222-2222-2222-222222222222';
update profiles set rol='emlakci', ofis_id='55555555-5555-5555-5555-555555555555', telefon='+905550000003' where id='33333333-3333-3333-3333-333333333333';
update profiles set rol='emlakci', telefon='+905550000004' where id='44444444-4444-4444-4444-444444444444';

-- =========================================================
-- ÜRETİCİ + PROJE (künye + zaman çizelgesi)
-- =========================================================
insert into uretici (id, ad, vergi_no, dogrulanmis, sahip_id) values
  ('66666666-6666-6666-6666-666666666666','Demo İnşaat A.Ş.','1234567890',true,'11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

insert into proje (id, uretici_id, ad, ulke, il, ilce, mahalle, ada, parsel, emsal, taks,
  baslama_tarihi, teslim_tarihi, iskan_tarihi, insaat_asamasi, ilerleme_yuzde, etap,
  belge_dogrulandi, sorumlu_ad, sorumlu_tel, public_slug, para_birimi)
values
  ('77777777-7777-7777-7777-777777777777','66666666-6666-6666-6666-666666666666',
   'Çankaya Vadi Konakları','TR','Ankara','Çankaya','Kızılırmak','12345','6',2.5,0.3,
   '2025-03-01','2027-06-30','2027-09-30','kaba_insaat',45,'1. Etap',
   true,'Proje Müdürü','+905550000010','cankaya-vadi-konaklari','TRY')
on conflict (id) do nothing;

-- =========================================================
-- BLOK + DAİRE TİPİ
-- =========================================================
insert into blok (id, proje_id, ad, kat_sayisi) values
  ('88888888-8888-8888-8888-888888888888','77777777-7777-7777-7777-777777777777','A Blok',10),
  ('99999999-9999-9999-9999-999999999999','77777777-7777-7777-7777-777777777777','B Blok',10)
on conflict (id) do nothing;

insert into daire_tipi (id, proje_id, ad, oda, net_m2, brut_m2, taban_fiyat, para_birimi) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','77777777-7777-7777-7777-777777777777','2+1 Standart','2+1',85,110,2800000,'TRY'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','77777777-7777-7777-7777-777777777777','3+1 Geniş','3+1',125,155,4200000,'TRY')
on conflict (id) do nothing;

-- =========================================================
-- BİRİMLER (40 = 2 blok × 10 kat × 2 daire)
-- Fiyat: taban_fiyat × (1 + (kat-1)×%2) kat şerefiyesi
-- Durum çeşitliliği (UI sinyali): satıldı/opsiyon/müsait
-- 1. kat 1. daire = arsa payı (satilabilir=false, sahiplik='arsa')
-- =========================================================
insert into birim (proje_id, blok_id, tip_id, tur, islem_tipi, satilabilir, tapu_durumu,
  kat, daire_no, durum, liste_fiyati, para_birimi, net_m2, brut_m2, sahiplik, son_guncelleme)
select
  '77777777-7777-7777-7777-777777777777',
  b.blok_id,
  case when d.daire_idx = 1 then 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
       else 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid end,
  'daire'::birim_tur,
  'satilik'::islem_tipi,
  case when k.kat = 1 and d.daire_idx = 1 then false else true end,
  'kat_irtifaki'::tapu_durum,
  k.kat,
  b.blok_kod || lpad(k.kat::text, 2, '0') || (case when d.daire_idx = 1 then '01' else '02' end),
  (case
    when k.kat = 1 and d.daire_idx = 1 then 'musait'
    when k.kat <= 2 then 'satildi'
    when k.kat = 3 then 'opsiyonlu'
    else 'musait'
  end)::birim_durum,
  round((case when d.daire_idx = 1 then 2800000 else 4200000 end) * (1 + (k.kat - 1) * 0.02)),
  'TRY',
  case when d.daire_idx = 1 then 85 else 125 end,
  case when d.daire_idx = 1 then 110 else 155 end,
  (case when k.kat = 1 and d.daire_idx = 1 then 'arsa' else 'muteahhit' end)::sahiplik,
  now()
from (values
  ('88888888-8888-8888-8888-888888888888'::uuid, 'A'),
  ('99999999-9999-9999-9999-999999999999'::uuid, 'B')
) as b(blok_id, blok_kod)
cross join generate_series(1, 10) as k(kat)
cross join generate_series(1, 2) as d(daire_idx);

-- =========================================================
-- TAHSİS (görünürlük = tahsis — DEĞİŞMEZ #1)
-- A Blok → herkese açık | B Blok → yalnız Demo Gayrimenkul ofisine
-- RLS testi: emlakci3 (ofissiz) yalnız A Blok görür; emlakci1/2 (ofiste) A+B görür.
-- =========================================================
insert into tahsis (proje_id, kapsam, hedef_tip, hedef_id, komisyon_tip, komisyon_deger) values
  ('77777777-7777-7777-7777-777777777777',
   '{"bloklar":["88888888-8888-8888-8888-888888888888"]}'::jsonb,
   'herkes', null, 'yuzde', 2),
  ('77777777-7777-7777-7777-777777777777',
   '{"bloklar":["99999999-9999-9999-9999-999999999999"]}'::jsonb,
   'ofis', '55555555-5555-5555-5555-555555555555', 'yuzde', 3);

-- =========================================================
-- ADMIN (concierge / doğrulama — DEĞİŞMEZ: minimal admin)
-- =========================================================
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000001','authenticated','authenticated','admin@projepazar.test',crypt('ProjePazar123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"ad":"ProjePazar Admin"}',now(),now(),'','','','')
on conflict (id) do nothing;

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
select u.id::text, u.id, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', now(), now(), now()
from auth.users u where u.id = 'a0000000-0000-0000-0000-000000000001'
on conflict do nothing;

update profiles set rol='admin', ad='ProjePazar Admin' where id='a0000000-0000-0000-0000-000000000001';

-- =========================================================
-- ABONELİK PAKETLERİ (gelir modeli ① — ofis SaaS kademeleri) + Demo ofis denemesi
-- =========================================================
insert into abonelik_paketi (id, ad, hedef, fiyat_aylik, para_birimi, kota_proje, kota_koltuk, kota_ai, gelismis_rapor, siralama) values
  ('c0000000-0000-0000-0000-000000000001','Başlangıç','ofis',1500,'TRY',null,3,10,false,1),
  ('c0000000-0000-0000-0000-000000000002','Profesyonel','ofis',3500,'TRY',null,10,50,true,2),
  ('c0000000-0000-0000-0000-000000000003','Kurumsal','ofis',7500,'TRY',null,null,200,true,3)
on conflict (id) do nothing;

insert into abonelik (ofis_id, paket_id, durum, baslangic)
select '55555555-5555-5555-5555-555555555555','c0000000-0000-0000-0000-000000000002','deneme',current_date
where not exists (
  select 1 from abonelik
  where ofis_id = '55555555-5555-5555-5555-555555555555' and durum in ('deneme','aktif')
);
