-- ProjePazar — Supabase şema + RLS (MVP)
-- Uygula: supabase migration / MCP apply_migration. RLS her tabloda açık.
-- NOT: WhatsApp serbest-metin yazma YOK (Faz 2). Stok girişi panel/concierge.

-- =========================================================
-- ENUMS
-- =========================================================
create type rol            as enum ('uretici','emlakci','ofis_yetkili','arsa_sahibi','marka_yetkili','admin');
create type birim_durum    as enum ('musait','opsiyonlu','satis_beklemede','satildi','stop','planli','kiralandi');
create type birim_tur      as enum ('daire','ofis','dukkan','villa','depo','otopark');
create type islem_tipi     as enum ('satilik','kiralik','satilik_kiralik','pay_satisi','satisa_kapali');
create type tapu_durum     as enum ('kat_irtifaki','kat_mulkiyeti','arsa_tapusu','kocan','yok');
create type sahiplik       as enum ('muteahhit','arsa');
create type komisyon_tip   as enum ('yuzde','sabit','yok');
create type opsiyon_yontem as enum ('dogrudan','talep_kod');
create type insaat_asama   as enum ('planlama','temel','kaba_insaat','ince_insaat','cevre_duzenleme','tamamlandi');
create type lead_kaynak    as enum ('paylasim','jenerik','kendi_kanali');
create type lead_durum     as enum ('yeni','arandi','gorusme','opsiyon','kazanildi','kaybedildi');
create type tahsis_hedef   as enum ('herkes','ofis','danisman');

-- =========================================================
-- CORE
-- =========================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  rol         rol not null default 'emlakci',
  ad          text,
  telefon     text,
  ofis_id     uuid,
  foto_url    text,
  logo_url    text,
  aktif       boolean default true,
  created_at  timestamptz default now()
);

create table ofis (
  id     uuid primary key default gen_random_uuid(),
  ad     text not null,
  marka  text,
  il     text,
  ilce   text
);
alter table profiles add constraint profiles_ofis_fk foreign key (ofis_id) references ofis(id);

create table uretici (
  id           uuid primary key default gen_random_uuid(),
  ad           text not null,
  vergi_no     text,
  dogrulanmis  boolean default false,
  sahip_id     uuid references profiles(id),
  created_at   timestamptz default now()
);

create table proje (
  id              uuid primary key default gen_random_uuid(),
  uretici_id      uuid not null references uretici(id) on delete cascade,
  ad              text not null,
  ulke            text default 'TR',     -- yurtdışı proje hazırlığı (Faz 2). MVP: 'TR'
  il text, ilce text, mahalle text,
  ada text, parsel text, emsal numeric, taks numeric,
  -- İnşaat & zaman çizelgesi (off-plan için kritik)
  baslama_tarihi  date,                  -- inşaat başlangıcı
  teslim_tarihi   date,                  -- tahmini teslim
  iskan_tarihi    date,                  -- iskan/oturum (alınan veya tahmini)
  insaat_asamasi  insaat_asama default 'planlama',
  ilerleme_yuzde  int default 0,         -- inşaat ilerleme % (basit; fotoğraflı timeline Faz 2)
  etap            text,                  -- çok-etaplı projede etap bilgisi
  lat numeric, lng numeric,
  kunye           jsonb,                 -- ruhsat, yapı denetim, malzeme, donatı, vb.
  opsiyon_yontemi opsiyon_yontem default 'dogrudan',  -- 'talep_kod' = üretici kod verir (Faz 2)
  belge_dogrulandi boolean default false,  -- belge-doğrulanmış proje rozeti (güven protokolü)
  video_url       text,                    -- proje tanıtım videosu
  sorumlu_ad      text, sorumlu_tel text,  -- üretici-tarafı proje sorumlusu iletişim
  public_slug     text unique,             -- login'siz public proje microsite (paylaşım/SEO)
  -- Faz 2 (yurtdışı): nullable, MVP'de boş kalır
  para_birimi     text default 'TRY',    -- TRY / USD / EUR / GBP
  kira_getirisi_pct numeric,             -- tahmini yıllık kira getirisi %
  amortisman_yil  numeric,               -- geri ödeme süresi
  oturum_uygun    boolean default false, -- oturum/vatandaşlık (Golden Visa vb.)
  golden_visa_esik numeric,              -- eşik tutar (yerel para)
  diller          text[],                -- çok-dilli ilan
  son_guncelleme  timestamptz default now(),
  created_at      timestamptz default now()
);

create table blok (
  id         uuid primary key default gen_random_uuid(),
  proje_id   uuid not null references proje(id) on delete cascade,
  ad         text,
  kat_sayisi int
);

create table daire_tipi (
  id          uuid primary key default gen_random_uuid(),
  proje_id    uuid not null references proje(id) on delete cascade,
  ad          text,                       -- "3+1 Standart"
  oda         text,
  net_m2 numeric, brut_m2 numeric,
  plan_url    text,                       -- kat/daire planı görseli (Storage)
  taban_fiyat numeric,
  para_birimi text default 'TRY'
);

create table birim (
  id             uuid primary key default gen_random_uuid(),
  proje_id       uuid not null references proje(id) on delete cascade,
  blok_id        uuid references blok(id),
  tip_id         uuid references daire_tipi(id),
  tur            birim_tur default 'daire',        -- daire/ofis/dukkan/villa/depo/otopark
  islem_tipi     islem_tipi default 'satilik',     -- satılık / kiralık / satilik_kiralik / pay_satisi / satışa kapalı
  satilabilir    boolean default true,             -- false = üretici SATAMAZ (arsa sahibi payı / mal sahibi). KALICI ayrım.
  satisa_acilis  timestamptz,                      -- planlı açılış tarihi; o ana kadar durum='planli'; cron açar
  tapu_durumu    tapu_durum default 'kat_irtifaki',-- KKTC için 'kocan' (Türk koçanı) vb.
  kat            int,
  daire_no       text,
  durum          birim_durum not null default 'musait',
  liste_fiyati   numeric,
  kira_bedeli    numeric,                           -- kiralık / ticari için
  kira_sartlari  jsonb,                             -- süre, depozito, artış oranı vb.
  para_birimi    text default 'TRY',
  usd_endeksli   boolean default false,
  serefiye       jsonb,                    -- {kat:6, manzara:2}
  yon text, manzara text,
  net_m2 numeric, brut_m2 numeric,
  sahiplik       sahiplik default 'muteahhit',   -- kat karşılığı etiketi (basit)
  odeme_plani_url text,                     -- MVP: text/PDF eki
  son_guncelleme timestamptz default now(),
  stale          boolean default false,     -- Tazelik Sigortası
  created_at     timestamptz default now()
);
create index birim_proje_idx on birim(proje_id);
create index birim_durum_idx on birim(durum);

-- =========================================================
-- TAHSIS / OPSIYON / LEAD / EVENTS
-- =========================================================
create table tahsis (
  id            uuid primary key default gen_random_uuid(),
  proje_id      uuid not null references proje(id) on delete cascade,
  kapsam        jsonb default '{}'::jsonb,   -- {bloklar:[],katlar:[],tipler:[],turler:[]} boş=tüm proje
  hedef_tip     tahsis_hedef not null,
  hedef_id      uuid,                        -- 'herkes' ise null; ofis_id veya profiles.id
  munhasir      boolean default false,
  kontenjan     int,
  fiyat_gorunur boolean default true,
  komisyon_tip  komisyon_tip default 'yuzde',-- emlakçı kazancı: yüzde / sabit TL / yok
  komisyon_deger numeric,                     -- %2 ise 2; sabit ise TL tutarı
  baslangic     timestamptz default now(),
  bitis         timestamptz
);
create index tahsis_proje_idx on tahsis(proje_id);

create table opsiyon (
  id          uuid primary key default gen_random_uuid(),
  birim_id    uuid not null references birim(id) on delete cascade,
  satici_id   uuid not null references profiles(id),
  yontem      opsiyon_yontem default 'dogrudan',  -- talep_kod ise opsiyon_talep üzerinden
  durum       birim_durum not null default 'opsiyonlu',
  kilit_bitis timestamptz,
  created_at  timestamptz default now()
);
-- ÇİFT SATIŞ KALKANI: bir birimde aynı anda tek aktif opsiyon
create unique index opsiyon_tek_aktif on opsiyon (birim_id)
  where durum in ('opsiyonlu','satis_beklemede');

create table lead (
  id              uuid primary key default gen_random_uuid(),
  proje_id        uuid references proje(id),
  birim_id        uuid references birim(id),
  kaynak          lead_kaynak not null,
  ad text, telefon text,
  telefon_norm    text,                      -- Lead Protection eşleşmesi (normalize)
  durum           lead_durum default 'yeni',
  atanan_id       uuid references profiles(id),
  ilk_paylasan_id uuid references profiles(id),
  kvkk_riza       boolean default false,
  created_at      timestamptz default now()
);
create index lead_telnorm_idx on lead(telefon_norm);

create table events (
  id         bigint generated always as identity primary key,
  tip        text not null,               -- 'paylasim'|'goruntuleme'|'lead'|'satis'|'opsiyon'
  profile_id uuid,
  proje_id   uuid,
  birim_id   uuid,
  payload    jsonb,
  created_at timestamptz default now()
);
create index events_birim_idx on events(birim_id);

-- =========================================================
-- YARDIMCI: emlakçının ofis'i
-- =========================================================
-- security definer = profiles RLS bypass (yoksa is_admin ↔ profiles_self sonsuz döngü)
create or replace function current_ofis() returns uuid
  language sql stable security definer set search_path = public as $$
  select ofis_id from profiles where id = auth.uid()
$$;
create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and rol = 'admin')
$$;

-- Emlakçı görünürlüğü: security definer (tahsis RLS bypass → proje↔tahsis döngüsü kırılır)
create or replace function emlakci_proje_tahsisli(p_proje_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from tahsis t
    where t.proje_id = p_proje_id
      and (t.bitis is null or t.bitis > now())
      and (t.hedef_tip = 'herkes'
        or (t.hedef_tip = 'danisman' and t.hedef_id = auth.uid())
        or (t.hedef_tip = 'ofis' and t.hedef_id = current_ofis()))
  )
$$;
create or replace function emlakci_birim_gorebilir(
  p_proje_id uuid, p_blok_id uuid, p_tip_id uuid, p_kat int, p_tur text
) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists(
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
  )
$$;

-- Yeni auth kullanıcısı için otomatik profile (signup). security definer = RLS bypass.
-- Bu olmadan kayıt sonrası profiles satırı oluşmaz → auth akışı kırık.
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, ad)
  values (new.id, new.raw_user_meta_data->>'ad')
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =========================================================
-- RLS
-- =========================================================
alter table profiles   enable row level security;
alter table uretici    enable row level security;
alter table ofis       enable row level security;
alter table proje      enable row level security;
alter table blok       enable row level security;
alter table daire_tipi enable row level security;
alter table birim      enable row level security;
alter table tahsis     enable row level security;
alter table opsiyon    enable row level security;
alter table lead       enable row level security;
alter table events     enable row level security;

-- profiles: herkes kendini görür/günceller; admin hepsi
create policy profiles_self on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_self_upd on profiles for update using (id = auth.uid());

-- uretici/proje/blok/tip/birim: üretici sahibi tam yetki
create policy uretici_owner on uretici for all
  using (sahip_id = auth.uid() or is_admin());

create policy proje_owner on proje for all using (
  is_admin() or exists (select 1 from uretici u where u.id = proje.uretici_id and u.sahip_id = auth.uid()));

create policy birim_owner on birim for all using (
  is_admin() or exists (select 1 from proje p join uretici u on u.id=p.uretici_id
                        where p.id = birim.proje_id and u.sahip_id = auth.uid()));

-- blok: üretici sahibi tam yetki (RLS açık olduğundan policy ŞART; yoksa tablo tamamen kilitli)
create policy blok_owner on blok for all using (
  is_admin() or exists (select 1 from proje p join uretici u on u.id=p.uretici_id
                        where p.id = blok.proje_id and u.sahip_id = auth.uid()));

-- daire_tipi: üretici sahibi tam yetki (INSERT/UPDATE — generator/CRUD için ŞART)
create policy daire_tipi_owner on daire_tipi for all using (
  is_admin() or exists (select 1 from proje p join uretici u on u.id=p.uretici_id
                        where p.id = daire_tipi.proje_id and u.sahip_id = auth.uid()));

-- birim: emlakçı YALNIZ tahsisli birimleri görür (SELECT)
create policy birim_emlakci_select on birim for select using (
  emlakci_birim_gorebilir(birim.proje_id, birim.blok_id, birim.tip_id, birim.kat, birim.tur::text)
);

-- proje/blok/daire_tipi: emlakçı, en az bir tahsisli projeyse görebilir (özet)
create policy proje_emlakci_select on proje for select using (emlakci_proje_tahsisli(proje.id));
create policy daire_tipi_select on daire_tipi for select using (emlakci_proje_tahsisli(daire_tipi.proje_id));
create policy blok_emlakci_select on blok for select using (emlakci_proje_tahsisli(blok.proje_id));

-- tahsis: yalnız proje sahibi üretici
create policy tahsis_owner on tahsis for all using (
  is_admin() or exists (select 1 from proje p join uretici u on u.id=p.uretici_id
                        where p.id = tahsis.proje_id and u.sahip_id = auth.uid()));

-- opsiyon: emlakçı tahsisli birime opsiyon alır; kendi opsiyonunu görür; üretici onay (update)
-- DB-KALKAN: yalnız satılabilir + müsait birime opsiyon (satilamaz/arsa payı/planlı birime opsiyon DB'de engellenir;
-- çift-satış unique index'iyle aynı disiplin — uygulama katmanına güvenme)
create policy opsiyon_insert on opsiyon for insert with check (
  satici_id = auth.uid()
  and exists (
    select 1 from birim b
    where b.id = opsiyon.birim_id
      and b.satilabilir = true
      and b.durum = 'musait'
  )
);
create policy opsiyon_select on opsiyon for select using (
  satici_id = auth.uid() or is_admin()
  or exists (select 1 from birim b join proje p on p.id=b.proje_id join uretici u on u.id=p.uretici_id
             where b.id = opsiyon.birim_id and u.sahip_id = auth.uid()));
create policy opsiyon_update on opsiyon for update using (
  is_admin()
  or exists (select 1 from birim b join proje p on p.id=b.proje_id join uretici u on u.id=p.uretici_id
             where b.id = opsiyon.birim_id and u.sahip_id = auth.uid()));

-- lead: paylaşan/atanan emlakçı + proje sahibi üretici görür
create policy lead_select on lead for select using (
  is_admin() or atanan_id = auth.uid() or ilk_paylasan_id = auth.uid()
  or exists (select 1 from proje p join uretici u on u.id=p.uretici_id
             where p.id = lead.proje_id and u.sahip_id = auth.uid()));
create policy lead_insert on lead for insert with check (true);  -- landing formu (anon); server normalize eder

-- events: yazma server-side; okuma admin/üretici/ilgili
create policy events_select on events for select using (
  is_admin() or profile_id = auth.uid()
  or exists (select 1 from proje p join uretici u on u.id=p.uretici_id
             where p.id = events.proje_id and u.sahip_id = auth.uid()));

-- ofis: okuma serbest (liste), yazma admin
create policy ofis_read on ofis for select using (true);

-- Proje belgeleri (ruhsat/iskan/yapı denetim) — belge-doğrulama + güven (MVP)
create table proje_belge (
  id         uuid primary key default gen_random_uuid(),
  proje_id   uuid not null references proje(id) on delete cascade,
  tip        text,                 -- ruhsat | iskan | yapi_denetim | otopark | diger
  ad text, url text,
  dogrulandi boolean default false, -- admin/concierge doğruladı
  created_at timestamptz default now()
);
alter table proje_belge enable row level security;
create policy proje_belge_owner on proje_belge for all using (
  is_admin() or exists (select 1 from proje p join uretici u on u.id=p.uretici_id
                        where p.id=proje_belge.proje_id and u.sahip_id=auth.uid()));
create policy proje_belge_read on proje_belge for select using (emlakci_proje_tahsisli(proje_belge.proje_id));
-- (Satış sonrası ALICI evrak yönetimi = Faz 2)

-- =========================================================
-- FAZ 2 TABLOLARI (yapı hazır; iş mantığı Faz 2'de)
-- =========================================================
-- Dinamik / otomatik fiyatlama kuralları (tarih / satış adedi / doluluk tetikli)
create table fiyat_kurali (
  id           uuid primary key default gen_random_uuid(),
  proje_id     uuid not null references proje(id) on delete cascade,
  kapsam       jsonb default '{}'::jsonb,        -- hangi birimler (blok/kat/tip/tur)
  tetik        text not null,                    -- 'tarih' | 'satis_adedi' | 'doluluk_yuzde'
  tetik_deger  numeric,                          -- tarih (epoch) / adet / %
  aksiyon      text not null,                    -- 'yuzde_zam' | 'sabit_zam' | 'yeni_fiyat'
  aksiyon_deger numeric,
  aktif        boolean default true,
  son_calisma  timestamptz,
  created_at   timestamptz default now()
);
-- Opsiyon talep + kod mekanizması (üretici onaylı opsiyon)
create table opsiyon_talep (
  id          uuid primary key default gen_random_uuid(),
  birim_id    uuid not null references birim(id) on delete cascade,
  talep_eden_id uuid not null references profiles(id),
  durum       text default 'beklemede',          -- beklemede | kod_verildi | kullanildi | reddedildi
  kod         text,                              -- üreticinin verdiği kod; emlakçı girer
  kod_son     timestamptz,                       -- kodun geçerlilik bitişi
  created_at  timestamptz default now()
);
alter table fiyat_kurali  enable row level security;
alter table opsiyon_talep enable row level security;
create policy fiyat_kurali_owner on fiyat_kurali for all using (
  is_admin() or exists (select 1 from proje p join uretici u on u.id=p.uretici_id
                        where p.id = fiyat_kurali.proje_id and u.sahip_id = auth.uid()));
create policy opsiyon_talep_select on opsiyon_talep for select using (
  talep_eden_id = auth.uid() or is_admin()
  or exists (select 1 from birim b join proje p on p.id=b.proje_id join uretici u on u.id=p.uretici_id
             where b.id = opsiyon_talep.birim_id and u.sahip_id = auth.uid()));
create policy opsiyon_talep_insert on opsiyon_talep for insert with check (talep_eden_id = auth.uid());
