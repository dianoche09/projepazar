# ProjePazar — Geliştirme Devir Dokümanı (Handoff)
**Sürüm:** Build v1 · Strateji dokümanı v6'ya dayanır · 13 Haziran 2026
**Amaç:** Bu dosyayı doğrudan IDE'ye (Cursor / Windsurf + Claude Code) ver. Tek başına yeterlidir; ürünün ne olduğu, MVP kapsamı, mimari, veri modeli (SQL + RLS), akışlar, ekranlar, marka, env değişkenleri ve PR-PR build sırası burada.

> **Nasıl kullanılır:** Repo köküne bu dosyayı, `CLAUDE.md`'yi, `supabase-schema.sql`'i ve `.env.example`'ı koy. Claude Code'a ilk prompt: *"CLAUDE.md ve ProjePazar-Devir-Dokumani.md'yi oku. Bölüm 16'daki PR-1'i uygula."* Sonra sırayla ilerle.

---

## 0. Özet (1 paragraf)
ProjePazar, çok-müteahhitli, üretici-kontrollü, **canlı bir konut stoğu dağıtım ağıdır**. Üretici (müteahhit) stoğunu/fiyatını/dağıtımını tek noktadan yönetir; emlakçı yalnız kendisine **tahsis edilmiş** projeleri tek canlı havuzdan görür, tek tıkla paylaşır ve lead toplar. Tek bir doğru kaynak ortada durur; bir değişiklik tüm yetkili emlakçılara anında yansır. Konum: **"en hızlı satış yapılan ağ" / gayrimenkulün güven protokolü** — tekil CRM değil, açık pazaryeri (Topli) değil, broker değil. Saf altyapı, komisyona dokunmaz.

**Değişmez çekirdek (asla bozma):** tek doğru kaynak · üretici kontrolü (granüler tahsis) · opsiyon kilidi ile çift-satış engeli · görünür tazelik · RLS ile veri izolasyonu.

---

## 1. Roller
| Rol | Kim | MVP'de |
|---|---|---|
| `uretici` | Müteahhit (Ü1 kurumsal / Ü2 geleneksel) | ✅ proje/stok/tahsis/onay |
| `emlakci` | Danışman (E1 pro / E2 geleneksel) | ✅ havuz/paylaşım/opsiyon/lead |
| `ofis_yetkili` | Emlak ofisi / franchise broker | ✅ (ekip görünürlüğü basit) |
| `arsa_sahibi` | Kat karşılığı arsa sahibi | ⛔ Faz 2 (salt-okunur) — MVP'de yok |
| `marka_yetkili` | Remax/C21 marka | ⛔ Faz 2 |
| `admin` | Biz (doğrulama, concierge) | ✅ minimal |

İlk gelir: **ofis/franchise abonelik** (SaaS). Emlakçı freemium. Müteahhit MVP'de ücretsiz (concierge ile içeri al).

> **Yurtdışı proje (Faz 2):** "üretici" rolünü yabancı geliştirici **veya** onun **TR master acentesi** üstlenir; tahsis→emlakçı modeli aynen çalışır. Veri modeli baştan ülke/döviz/getiri alanlarına hazır (Bölüm 4, 12). Detay: `ProjePazar-Yurtdisi-Proje-Pazari-Raporu.md`.

---

## 2. MVP KAPSAMI (kilitli — Bölüm 29 / v6)
Hedef: 6–8 haftada sahaya çıkacak çekirdek. Tek metrik: **ortalama stok güncelleme yaşı (tazelik)** + **platform üzerinden gelen lead/satış**.

### ✅ MVP İÇİNDE
1. **Üretici: stok kurma** — proje + blok + birim. Generator (tip şablonu + kat şablonu → birimler) **ve** Excel import. Her kat ayrı planlanabilir (eşit olmayan kat dizimi). Üretici her birimi tek tek tanımlar: **segment/tür** (daire/ofis/dükkan/villa/depo/otopark), **işlem tipi** (satılık/kiralık/satılık+kiralık/pay satışı/satışa kapalı), **satılabilir mi** (false = arsa sahibi payı / mal sahibi → üretici satamaz; kalıcı ayrım), **satışa açılış tarihi** (planlı/kademeli açılım — cron açar), **tapu durumu** (kat irtifakı/mülkiyeti/arsa/koçan).
2. **Granüler tahsis (basit):** "herkese açık" VEYA "yalnız şu ofis(ler)e açık" + kapsam (blok/kat/tip/**tür**). Görünürlük RLS ile. Ticari/ofis farklı emlakçıya tahsis edilebilir. **Komisyon görünürlüğü:** üretici tahsiste % veya sabit TL komisyon tanımlar; emlakçı **kendi kazancını** görür (başkasınınkini görmez).
3. **Emlakçı Havuzu:** RLS-filtreli proje listesi + filtre (il/ilçe/tip/durum) + proje detay (künye, kat planı, birim ızgarası, daire detay).
4. **Opsiyon kilidi + 2 kademeli onay:** durum makinesi (müsait→opsiyonlu→satış_beklemede→satıldı), cron ile zaman aşımı. **Pazarlama çekirdeği: "çift satış olmaz."**
5. **Paylaşım (deep-link):** emlakçı "Projeyi Seç → WhatsApp'ta Paylaş" (2 dokunuş). Markalı görsel + kişiye özel landing linki. **Sıfır Cloud API maliyeti** (emlakçının kendi telefonundan deep-link).
6. **Lead Engine V0.1 (ZORUNLU çarpan):** landing'de "Bu projeyle ilgileniyorum, danışman beni arasın" formu → linki paylaşan emlakçıya **Sıcak Lead** düşer. Jenerik dış lead'ler aktif/taze emlakçılara sıra ile dağıtılır.
7. **Lead Protection ("ilk bayrağı ben diktim"):** paylaşımda müşteri telefonu (normalize) paylaşan emlakçıya eşlenir; müteahhit numarayı girince "bu lead'i X getirdi" çıkar.
8. **Tazelik Sigortası:** N gün (örn. 15) hareketsiz projede cron → müteahhite **butonlu** WhatsApp teyidi ("hâlâ X TL mi? Evet/Hayır"); cevapsızsa emlakçı ekranında yeşil rozet **sarıya** döner.
9. **Fiyat Sapma Alarmı (on-platform, lite):** platformda tek fiyat zaten sapmayı engeller; emlakçı farklı fiyat girmeye çalışırsa engellenir/uyarılır. (Off-platform Sahibinden taraması ⛔ Faz 2.)
10. **PWA:** mobil-önce, kurulabilir, çevrimdışı son-senkron rozeti. Basit Mod (3 buton): Bul → WhatsApp Paylaş → Ara.
11. **Concierge/Admin:** müteahhit stoğunu bizim girmemiz için minimal admin.
12. **Proje zaman çizelgesi & künye:** inşaat başlama/tahmini teslim/**iskan tarihi** + inşaat aşaması + ilerleme % + etap; proje detayda görünür (off-plan yatırımcısı için kritik).
13. **Belge-doğrulanmış proje rozeti:** üretici proje belgelerini (ruhsat/iskan/yapı denetim) yükler; admin/concierge doğrular → "belgeli proje" rozeti (güven protokolü; EDAP'tan öğrenildi). *Satış sonrası alıcı evrak yönetimi = Faz 2.*
14. **Public proje microsite:** her projeye login'siz tek URL (galeri, kat planı, künye, harita, zaman çizelgesi). Emlakçı tek link atar; SEO + paylaşım. (`public_slug`)
15. **Proje detay kartları:** kira getirisi, tanıtım videosu, **proje sorumlusu iletişim** (üretici muhatabı).
16. **Otomatik eşleştirme-bildirimi:** yeni/uygun (tahsisli) proje → bölge/bütçe ile ilgili emlakçıya bildirim (Lead Engine'i besler).
17. **Opsiyon audit log:** opsiyon/iptal/onay olayları `events`'e yazılır (güven + denetim).
18. **Ücretsiz hesaplama araçları (ayrı SEO mikro-sitesi):** tapu harcı, değer artış vergisi, kira getirisi, KAKS/TAKS, kira artışı, altın&döviz. *Çekirdek uygulama değil; funnel/SEO katmanı — kapsam şişirmesin.*

> **Disiplin:** Yukarıdakiler çekirdeği (canlı stok + üretici-kontrolü + güven protokolü + dağıtım) güçlendirdiği için MVP'de. Aşağıdaki Faz 2 ve "Ne Yapmayız" sınırlarına sadık kal.

### ⛔ MVP DIŞI (Faz 2+) — başlamadan netleştir, kod yazma
- **WhatsApp serbest-metin → AI parse → stoğa yazma (AI-1).** Yüksek risk (yanlış parse = yanlış stok = güveni yıkar), WABA/Cloud API operasyonu. **MVP'de müteahhit fiyatı panelden veya concierge ile günceller.** Sadece **butonlu teyit** (Tazelik Sigortası) Cloud API kullanır.
- Paylaşım Stüdyosu (gelişmiş markalı/landing premium), AI içerik üretimi (gelişmiş).
- Detaylı ödeme planı motoru (döviz/senet/tahsilat) → MVP'de ödeme planı text/PDF eki.
- Arsa sahibi paneli, kat karşılığı detaylı pay-raporu.
- Fiyat/talep zekası, killer paneller (satış hızı, emlakçı skoru, tahsilat radar, satılabilirlik skoru), off-platform sapma tarama.
- Finansal katman / Bloomberg vizyonu.

---

## 3. Teknoloji & Mimari
- **Frontend:** Next.js (App Router, TypeScript) + Tailwind. **PWA** (next-pwa veya manuel manifest + service worker). Mobil-önce.
- **Backend/DB:** Supabase — PostgreSQL + Auth + Realtime + Storage. **Row Level Security (RLS) her tabloda açık.** Multi-tenant (uretici_id ile izolasyon).
- **Hosting:** Vercel — API routes (serverless) + Cron (tazelik/opsiyon zaman aşımı).
- **AI:** Claude API (Faz 2'de parse/içerik; MVP'de sadece basit metin üretimi opsiyonel).
- **Mesajlaşma — HİBRİT (maliyet sigortası):**
  - **Giden paylaşım = deep-link** (`https://wa.me/?text=...` / `whatsapp://send?text=...`), emlakçının telefonundan, **ücretsiz**.
  - **Cloud API + onaylı şablon = yalnız** müteahhit kritik teyitleri (Tazelik Sigortası butonlu Evet/Hayır). Maliyet abonelikte absorbe.
- **Realtime:** "nice to have." Gayrimenkul temposu saat/gün → milisaniye senkron gerekmez; sayfa açılışında fetch + Supabase Realtime opsiyonel. Çift-satış DB seviyesinde kilit (aşağıda).

### Önerilen klasör yapısı
```
/app
  /(auth)/login
  /uretici/...        # kokpit: proje, stok, tahsis, onay, lead
  /havuz/...          # emlakçı havuz + proje detay
  /p/[emlakci]/[birim]/[token]/  # imzalı paylaşım landing + lead form
  /api/
    /cron/freshness   # tazelik sigortası
    /cron/option-expiry
    /webhooks/whatsapp # Faz 2 (şimdilik boş/stub)
    /lead             # lead capture
/lib/supabase         # client + server + types
/lib/rls              # policy yardımcıları
/components           # ui (Berrak Güven tasarım sistemi)
/db/supabase-schema.sql
```

---

## 4. Veri Modeli (özet)
```
profiles(rol) ─┬─ uretici ── proje ── blok ── birim
               │                         └─ daire_tipi (plan_url)
               ├─ ofis ── (emlakci profilleri)
TAHSIS: (proje, kapsam jsonb) × hedef(ofis/danışman) × şart
OPSIYON: birim × satici × durum × kilit_bitis
LEAD: proje/birim × kaynak × telefon × atanan × ilk_paylasan
EVENTS: paylaşım/görüntüleme/lead/satış izleri
```
Tam şema + RLS: **Bölüm 12** ve `supabase-schema.sql`.

**Birim alanları:** blok, kat, daire_no, **tur** (segment), **islem_tipi**, **satilabilir** (arsa payı = false), **satisa_acilis** (planlı açılış), **tapu_durumu**, tip_id, durum, liste_fiyati, **kira_bedeli/kira_sartlari** (kiralık/ticari), para_birimi, serefiye, yon, manzara, net_m2, brut_m2, sahiplik(arsa/muteahhit — kat karşılığı etiketi), son_guncelleme.

**Tahsis alanları:** kapsam(blok/kat/tip/**tur**), hedef, münhasır, kontenjan, fiyat_gorunur, **komisyon_tip(yuzde/sabit/yok) + komisyon_deger**. **Opsiyon yöntemi** (proje): `dogrudan` (MVP) veya `talep_kod` (üretici kod verir → emlakçı girer → süreli opsiyon; Faz 2).

> **Satılabilir / satılamaz ayrımı (kat karşılığı):** `sahiplik='arsa'` + `satilabilir=false` → arsa sahibi payı; havuzda görünebilir ama üretici satışına **kapalı** (kalıcı). Bu, geçici `islem_tipi='satisa_kapali'` veya `satisa_acilis` (planlı açılım) ile **karıştırılmamalı**. Üç durum nettir: (a) satılabilir, (b) henüz açılmadı (planlı), (c) kalıcı satılamaz (arsa payı/mal sahibi).

**Birim türü:** daire / ofis / dukkan / villa / depo / otopark (enum). Eşit olmayan kat → birim, blok+kat alanlarıyla serbest; ızgara veriden çizilir.

**Proje alanları (künye + zaman çizelgesi):** ad, ülke/il/ilçe/mahalle, ada/parsel, emsal/TAKS, ruhsat/yapı denetim/iskan durumu (kunye), **inşaat zaman çizelgesi** — `baslama_tarihi`, `teslim_tarihi` (tahmini), `iskan_tarihi`, `insaat_asamasi` (planlama→temel→kaba→ince→çevre→tamamlandı), `ilerleme_yuzde`, `etap` (çok-etaplı projede). Off-plan'da yatırımcının ilk sorusu "ne zaman teslim/iskan?" — bu alanlar MVP'de. (Fotoğraflı inşaat timeline / buyer portal Faz 2.)

**Yurtdışı proje hazırlığı (yapı baştan hazır, dolum Faz 2):** `proje.ulke` (default `'TR'`), çok-para birimi (`para_birimi`: TRY/USD/EUR/GBP — alanlar var), ve yatırım alanları: `kira_getirisi_pct`, `amortisman_yil`, `oturum_uygun` (Golden Visa vb.), `golden_visa_esik`, çok-dilli ilan (`diller text[]`). Coğrafya hiyerarşisi ülke seviyesine kadar ölçeklenebilir (Ülke › Şehir/Bölge › …). Bu alanlar nullable; MVP'de boş kalır, Faz 2'de doldurulur. Pazar gerekçesi: `ProjePazar-Yurtdisi-Proje-Pazari-Raporu.md`.

---

## 5. Çekirdek Akışlar (MVP)

**5.1 Stok kurma:** Üretici proje açar → blok/kat tanımlar → daire_tipi tanımlar (plan görseli Storage'a) → birimleri generator (tip×kat kuralı) veya Excel import ile üretir. Her birim tek kayıt; `son_guncelleme=now()`.

**5.2 Tahsis & görünürlük:** Üretici tahsis kuralı kurar (kapsam + hedef). Emlakçı havuz sorgusu **RLS** ile yalnız tahsisli birimleri döner; tahsis edilmeyen birim hiç görünmez.

**5.3 Paylaşım + Lead Protection:** Emlakçı projeyi seçer → sistem imzalı landing linki üretir (`/p/{emlakci}/{birim}/{token}`) → deep-link ile WhatsApp'tan gönderir. Landing'de lead formu; form telefonu **normalize edilip** `ilk_paylasan_profile_id`'ye eşlenir. `events`'e paylaşım/görüntüleme/lead yazılır.

**5.4 Opsiyon → satış:** Emlakçı "Opsiyon Al" → birim `opsiyonlu`, `kilit_bitis=now()+48h`, **DB-seviyesinde tek opsiyon** (unique partial index). "Sattım" → `satis_beklemede` → üretici onay → `satildi`. Süre dolarsa cron → `musait`.

**5.5 Lead Engine V0.1:** Landing formu (paylaşan varsa o emlakçıya), jenerik dış lead → aktif/taze emlakçı sırasına round-robin. Lead müteahhit ve ilgili emlakçı panelinde "Sıcak Lead".

**5.6 Tazelik Sigortası:** Cron her gün son_guncelleme > N gün projeleri tarar → müteahhite Cloud API butonlu şablon ("hâlâ X TL mi? Evet/Hayır"). Evet → son_guncelleme yenilenir. Cevapsız → birim/proje `tazelik=stale` → emlakçı UI rozet sarı.

**5.7 Fiyat Sapma (lite):** Fiyat tek kaynak (birim.liste_fiyati). Emlakçı fiyatı değiştiremez (RLS/UI). Paylaşımda fiyat her zaman canlı değerden basılır → sapma imkânsız.

---

## 6. Opsiyon Durum Makinesi
```
musait ──(emlakçı opsiyon alır; DB lock)──▶ opsiyonlu
opsiyonlu ──("sattım")──▶ satis_beklemede
satis_beklemede ──(üretici ONAY)──▶ satildi
satis_beklemede ──(üretici RED)──▶ musait
opsiyonlu ──(kilit_bitis geçti; cron)──▶ musait
musait ◀──(üretici aç)── stop ──(üretici durdur)──▶  (musait↔stop)
```
**Çift-satış kalkanı:** `birim` üzerinde aktif opsiyon için **unique partial index** (`WHERE durum IN ('opsiyonlu','satis_beklemede')`). İkinci opsiyon INSERT'i DB hatası alır → uygulama "başka emlakçı opsiyonladı" der.

**Opsiyon ön-koşulu (DB-kalkan):** Opsiyon yalnız `satilabilir=true` ve `durum='musait'` birime alınabilir (`opsiyon_insert` with-check). Satılamaz (arsa payı), `planli` veya zaten opsiyonlu/satılmış birime opsiyon DB seviyesinde reddedilir — çift-satış kalkanıyla aynı disiplin (uygulama katmanına güvenme).

> **Kiralık & komisyon (MVP kapsamı netliği):** MVP'de kiralık birimler **listelenir/paylaşılır** (`islem_tipi`, `kira_bedeli`, `kira_sartlari`); ancak opsiyon→satış durum makinesi **satılık** birimlere özgüdür. Detaylı kira yönetimi (sözleşme/depozito/tahsilat/artış) **Faz 2** (Bölüm 15). **Komisyon görünürlüğü MVP'de var:** üretici tahsiste %/sabit/yok tanımlar; emlakçı yalnız **kendi** kazancını görür (basit gösterim, hesaplama motoru değil).

---

## 7. Ekran/Sayfa Envanteri (MVP)
Mockup referansı: `ProjePazar-Ekranlar.html` (Berrak Güven tasarımıyla). Sayfalar:
| Route | Rol | İçerik |
|---|---|---|
| `/uretici` (Kokpit) | uretici | KPI (taze stok, satış hızı, açık lead), stok durumu, son lead'ler, tazelik uyarısı |
| `/uretici/proje/[id]` | uretici | proje künye + birim ızgarası (durum düzenle), tahsis |
| `/uretici/tahsis/[id]` | uretici | açık / ofis-listesi + kapsam (blok/kat/tip) |
| `/havuz` | emlakci | RLS-filtreli proje kartları + filtre (il/ilçe/tip/durum) |
| `/havuz/proje/[id]` | emlakci | künye, galeri, kat planı, **birim ızgarası → daire modalı**, "Paylaş" |
| `/p/[emlakci]/[birim]/[token]` | herkes | markalı landing + **lead formu** (Lead Engine V0.1) |
| `/m` (Basit Mod / PWA) | emlakci | 3 buton: Bul → WhatsApp Paylaş → Ara; çevrimdışı rozet |
| `/admin` | admin | concierge stok girişi, üretici doğrulama |

Daire detay (modal): plan görseli, m²/yön/manzara, **şerefiye kırılımı**, ödeme planı (text/PDF), durum + Opsiyon Al/Sattım/Paylaş, iz.

---

## 8. Marka / Tasarım Sistemi (Berrak Güven)
Referans: `ProjePazar-Marka-Panosu.pdf` + `ProjePazar-Tasarim-Ruhu.md`.
```css
:root{
  --ink:#0F2638; --navy:#13314B; --teal:#1E9B8A;
  --green:#2FB36B;  /* müsait/canlı */
  --amber:#E3A12C;  /* opsiyon */
  --red:#D15A4E;    /* satıldı */
  --paper:#F4F2EE; --card:#FFFFFF; --gray:#5E6B78; --hair:#E6EBEF;
}
```
- Fontlar: Bricolage Grotesque (başlık), Instrument Sans (arayüz/metin), Geist Mono (veri/fiyat/işaret) — Google Fonts.
- İmza öğeler: birim-ızgara logosu (3×3, biri yeşil), **tazelik damgası** "● 2 saat önce" (nabız), yeşil/amber/kırmızı sinyal sistemi her yerde.
- Mobil-önce, bol beyaz alan, sıcak kırık-beyaz zemin.

---

## 9. Yetki Matrisi (RLS özeti)
| Tablo | uretici | emlakci | ofis_yetkili | admin |
|---|---|---|---|---|
| birim SELECT | kendi projesi | **yalnız tahsisli** | ofisine tahsisli | hepsi |
| birim INSERT/UPDATE | kendi projesi | ✕ | ✕ | hepsi |
| opsiyon INSERT | — | tahsisli birime | — | hepsi |
| opsiyon onay (UPDATE→satildi) | kendi birimi | ✕ | ✕ | hepsi |
| tahsis | kendi projesi | ✕ | ✕ | hepsi |
| lead SELECT | kendi projesi | atanan/ilk_paylasan = kendi | ofis ekibi | hepsi |

---

## 10. Çevre Değişkenleri (`.env.example`)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # sadece server/cron
# App
NEXT_PUBLIC_APP_URL=https://app.projepazar.com
LEAD_SHARE_SECRET=                  # imzalı link token üretimi
# WhatsApp (Faz 2 / sadece teyit şablonu)
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_TEMPLATE_FRESHNESS=stok_teyit
# Claude (Faz 2)
ANTHROPIC_API_KEY=
# Cron
CRON_SECRET=
```

---

## 11. CLAUDE.md (repo kuralları — ayrı dosya olarak da verildi)
Özet kurallar (tamamı `CLAUDE.md`'de):
- **RLS-önce:** her tabloya RLS yaz; client'tan service-role kullanma. Görünürlük = tahsis.
- **Tek doğru kaynak:** fiyat/durum yalnız `birim`'de; hiçbir yerde kopyalama.
- **Çift-satış:** opsiyon her zaman DB unique index'e dayansın; uygulama katmanına güvenme.
- **WhatsApp MVP:** sadece deep-link (giden) + butonlu teyit şablonu. **Serbest-metin AI parse YAZMA — Faz 2.**
- **Tazelik:** her yazışta `son_guncelleme=now()`; UI'da "X önce" + stale rozet.
- **Mobil-önce + PWA:** her ekran telefonda çalışmalı; offline graceful.
- **Para birimi/KDV:** fiyatlar para_birimi ile; MVP'de TL, USD-endeksli alan dursun (hesaplama Faz 2).
- TypeScript strict, server actions/route handlers tip güvenli, Zod ile input doğrulama.

---

## 12. Veritabanı Şeması + RLS (özet — tamı `supabase-schema.sql`)
```sql
-- ENUMS
create type rol as enum ('uretici','emlakci','ofis_yetkili','arsa_sahibi','marka_yetkili','admin');
create type birim_durum as enum ('musait','opsiyonlu','satis_beklemede','satildi','stop','planli','kiralandi');
create type birim_tur as enum ('daire','ofis','dukkan','villa','depo','otopark');
create type islem_tipi as enum ('satilik','kiralik','satilik_kiralik','pay_satisi','satisa_kapali');
create type tapu_durum as enum ('kat_irtifaki','kat_mulkiyeti','arsa_tapusu','kocan','yok');
create type komisyon_tip as enum ('yuzde','sabit','yok');
create type opsiyon_yontem as enum ('dogrudan','talep_kod');
create type insaat_asama as enum ('planlama','temel','kaba_insaat','ince_insaat','cevre_duzenleme','tamamlandi');
create type sahiplik as enum ('muteahhit','arsa');
create type lead_kaynak as enum ('paylasim','jenerik','kendi_kanali');
create type lead_durum as enum ('yeni','arandi','gorusme','opsiyon','kazanildi','kaybedildi');
create type tahsis_hedef as enum ('herkes','ofis','danisman');

-- CORE
create table profiles ( id uuid primary key references auth.users, rol rol not null default 'emlakci',
  ad text, telefon text, ofis_id uuid, foto_url text, logo_url text, aktif boolean default true,
  created_at timestamptz default now());
create table uretici ( id uuid primary key default gen_random_uuid(), ad text not null, vergi_no text,
  dogrulanmis boolean default false, sahip_id uuid references profiles, created_at timestamptz default now());
create table ofis ( id uuid primary key default gen_random_uuid(), ad text, marka text, il text, ilce text);
create table proje ( id uuid primary key default gen_random_uuid(), uretici_id uuid not null references uretici,
  ad text not null, ulke text default 'TR', il text, ilce text, mahalle text, ada text, parsel text,
  emsal numeric, taks numeric,
  baslama_tarihi date, teslim_tarihi date, iskan_tarihi date,
  insaat_asamasi insaat_asama default 'planlama', ilerleme_yuzde int default 0, etap text,
  belge_dogrulandi boolean default false, video_url text, sorumlu_ad text, sorumlu_tel text,
  public_slug text unique,            -- login'siz public proje microsite
  lat numeric, lng numeric, kunye jsonb,
  -- ayrıca tablo: proje_belge (ruhsat/iskan/yapı denetim + dogrulandi) — belge rozeti
  -- Faz 2 (yurtdışı): nullable, MVP'de boş
  para_birimi text default 'TRY', kira_getirisi_pct numeric, amortisman_yil numeric,
  oturum_uygun boolean default false, golden_visa_esik numeric, diller text[],
  son_guncelleme timestamptz default now(), created_at timestamptz default now());
create table blok ( id uuid primary key default gen_random_uuid(), proje_id uuid not null references proje,
  ad text, kat_sayisi int);
create table daire_tipi ( id uuid primary key default gen_random_uuid(), proje_id uuid not null references proje,
  ad text, oda text, net_m2 numeric, brut_m2 numeric, plan_url text, taban_fiyat numeric, para_birimi text default 'TRY');
create table birim ( id uuid primary key default gen_random_uuid(), proje_id uuid not null references proje,
  blok_id uuid references blok, tip_id uuid references daire_tipi, tur birim_tur default 'daire',
  islem_tipi islem_tipi default 'satilik', satilabilir boolean default true,
  satisa_acilis timestamptz, tapu_durumu tapu_durum default 'kat_irtifaki',
  kat int, daire_no text, durum birim_durum not null default 'musait',
  liste_fiyati numeric, kira_bedeli numeric, kira_sartlari jsonb,
  para_birimi text default 'TRY', usd_endeksli boolean default false,
  serefiye jsonb, yon text, manzara text, net_m2 numeric, brut_m2 numeric,
  sahiplik sahiplik default 'muteahhit', odeme_plani_url text,
  son_guncelleme timestamptz default now(), created_at timestamptz default now());
-- tahsis'e: komisyon_tip komisyon_tip default 'yuzde', komisyon_deger numeric (emlakçı kazancı)
-- proje'ye: opsiyon_yontemi ('dogrudan'|'talep_kod'). Faz 2 tabloları: fiyat_kurali, opsiyon_talep.

-- TAHSIS / OPSIYON / LEAD / EVENTS
create table tahsis ( id uuid primary key default gen_random_uuid(), proje_id uuid not null references proje,
  kapsam jsonb,                       -- {bloklar:[],katlar:[],tipler:[]} boş=tüm proje
  hedef_tip tahsis_hedef not null, hedef_id uuid,  -- herkes ise null
  munhasir boolean default false, kontenjan int, fiyat_gorunur boolean default true,
  baslangic timestamptz default now(), bitis timestamptz);
create table opsiyon ( id uuid primary key default gen_random_uuid(), birim_id uuid not null references birim,
  satici_id uuid not null references profiles, durum birim_durum not null default 'opsiyonlu',
  kilit_bitis timestamptz, created_at timestamptz default now());
-- ÇİFT SATIŞ KALKANI:
create unique index opsiyon_tek_aktif on opsiyon (birim_id) where durum in ('opsiyonlu','satis_beklemede');

create table lead ( id uuid primary key default gen_random_uuid(), proje_id uuid references proje,
  birim_id uuid references birim, kaynak lead_kaynak not null,
  ad text, telefon text, telefon_norm text,           -- Lead Protection eşleşmesi
  durum lead_durum default 'yeni', atanan_id uuid references profiles,
  ilk_paylasan_id uuid references profiles, kvkk_riza boolean default false, created_at timestamptz default now());
create table events ( id bigint generated always as identity primary key, tip text not null,
  profile_id uuid, proje_id uuid, birim_id uuid, payload jsonb, created_at timestamptz default now());

-- RLS ÖRNEK (birim görünürlüğü = tahsis)
alter table birim enable row level security;
create policy birim_uretici on birim for all using (
  exists (select 1 from proje p join uretici u on u.id=p.uretici_id
          where p.id=birim.proje_id and u.sahip_id=auth.uid()));
create policy birim_emlakci_select on birim for select using (
  exists (
    select 1 from tahsis t where t.proje_id=birim.proje_id
    and (t.hedef_tip='herkes'
      or (t.hedef_tip='danisman' and t.hedef_id=auth.uid())
      or (t.hedef_tip='ofis' and t.hedef_id=(select ofis_id from profiles where id=auth.uid())))
    -- kapsam jsonb filtresi (blok/kat/tip) uygulama+policy ile detaylandırılır
  ));
```
> Tam, çalışır şema + tüm politikalar `supabase-schema.sql` dosyasında. Claude Code bunu `db/` altına koyup Supabase migration olarak uygulamalı (`apply_migration`).

---

## 13. Kabul Kriterleri (Definition of Done — MVP)
- Emlakçı **yalnız** tahsisli birimleri görür (RLS testi: tahsissiz birim hiç dönmez).
- Aynı birime iki opsiyon → ikincisi DB hatası alır (çift-satış kalkanı testi).
- Üretici fiyatı değiştirince emlakçı havuzunda yeni fiyat + "az önce" damgası görünür.
- Paylaşım linkinden gelen lead, paylaşan emlakçıya **Sıcak Lead** olarak düşer.
- 15 gün hareketsiz proje → müteahhite teyit gider, cevapsızsa rozet sarıya döner.
- Tüm ekranlar mobilde çalışır; PWA kurulabilir + çevrimdışı açılır.

---

## 14. Riskler & Dikkat
- **Yanlış stok = ölümcül.** MVP'de stok girişi panel/concierge ile; AI serbest-metin yazma yok.
- **KVKK:** lead/telefon kişisel veri → açık rıza + aydınlatma metni landing formunda; veri saklama politikası; sözleşmede veri sorumlusu/işleyen netliği.
- **WhatsApp maliyet/policy:** sadece onaylı şablon + deep-link; spam'den kaçın. Hibrit tasarıma sadık kal.
- **Cold start:** Closed Deal Club (3 müteahhit + 15–20 broker, %100 exclusive). Önce arz (concierge), sonra davetli talep.
- **Rekabet gerçeği (Türkiye'de ilk değiliz):** Tapuva (İstanbul, model birebir), EDAP (Ankara, belge-merkezli), Topli (açık pazaryeri); global tarafta DomusHub (Türkçe dahil, olgun). Fark = üretici-kontrolü + WhatsApp/concierge ile küçük müteahhit (Ü2) + güven protokolü + Ankara saha derinliği. Detay: `ProjePazar-Rakip-Ogrenimler-Alinacaklar.md`.

---

## 15. Faz 2+ (sonraya bırakılan — kod yazma)
WhatsApp serbest-metin AI parse (AI-1) · Paylaşım Stüdyosu premium · ödeme planı motoru · arsa sahibi paneli + truva-atı pay bildirimi · kat karşılığı pay-raporu · **dinamik/otomatik fiyatlama** (tarih/satış-adedi/doluluk + **kat katsayısı + fiyat geçmişi**, `fiyat_kurali`) · **opsiyon talep + kod** (`talep_kod`) · **ticari pay satışı & detaylı kira** · fiyat/talep zekası + killer paneller · off-platform sapma tarama · marka konsolu · finansal katman · **yurtdışı projeler** (bkz. `ProjePazar-Yurtdisi-Proje-Pazari-Raporu.md`).

**Rakiplerden öğrenilen Faz 2 adayları (disiplinle):** Interactive Offer-by-link + görüntülenme analitiği · AI Satış Koçu (itiraz cevapları) · **buyer portal + fotoğraflı inşaat takibi** · EOI/ön-talep yönetimi · smart booking (in-app KYC + auto-sözleşme/fatura) · online kapora → anında kilit · Kanban satış hattı + ajan leaderboard · CRM/PMS çift-yönlü entegrasyon · satış sonrası alıcı evrak yönetimi · 3D/sanal tur (üretici **yükler**; biz motorunu yapmayız).

### ⛔ NE YAPMAYIZ (kapsam dışı — bizi planımızdan çıkarır)
Her özellikte test: *"canlı stok + üretici-kontrolü + güven + dağıtımı mı güçlendiriyor, yoksa beni Sales OS/CRM/3D stüdyo mu yapıyor?"* Aşağıdakiler kategori dışıdır:
- **3D/sanal tur / immersive stüdyo motoru** (Relata/Flatter/UnitAtlas işi) — üretici render/video yükler; biz stüdyo kurmayız.
- **Tam CRM / muhasebe / ERP / post-sales evrak ERP** (Nexprop/Novo) — entegre et, yapma.
- **Online ödeme/escrow + otomatik sözleşme üretimi motoru** — "sözleşmeye taraf olmayız" ilkesini bozar; en fazla fatura özeti.
- **Fuar/phygital etkinlik araçları** (Relata Exhibitly) — alakasız.

---

## 16. BUILD SIRASI (PR-PR — Claude Code için)
> Her PR'ı ayrı çalıştır; kabul kriterini doğrula; sonra ilerle.

> **MVP madde eşlemesi:** Her PR, Bölüm 2'deki MVP maddelerini kapsar (parantezde MVP-N). Çekirdek = stok+tahsis+opsiyon+paylaşım+lead+tazelik.

- **PR-1 — Scaffold:** Next.js (App Router, TS strict) + Tailwind + Supabase client (browser+server) + Auth (e-posta/parola) + PWA manifest/service worker (serwist) + Berrak Güven tasarım tokenları (Bölüm 8).
- **PR-2 — Şema & RLS:** `supabase-schema.sql`'i migration olarak uygula; enumlar, tüm tablolar (`proje_belge` dahil), çift-satış unique index, RLS politikaları (blok/daire_tipi owner + `handle_new_user` signup trigger dahil). Seed: 1 ofis + 1 üretici + 1 proje + ~40 birim + 3 emlakçı.
- **PR-3 — Üretici stok + proje künye/zaman çizelgesi (MVP-1,12,13a):** proje/blok/daire_tipi/birim CRUD; proje künye + inşaat zaman çizelgesi (başlama/teslim/iskan/aşama/ilerleme/etap); belge yükleme (ruhsat/iskan → `proje_belge`); generator (tip×kat) + Excel import; birim ızgarası (durum düzenle) + toplu birim güncelleme; plan/görsel Storage upload.
- **PR-4 — Tahsis + komisyon (MVP-2):** açık / ofis-listesi + kapsam (blok/kat/tip/tür); komisyon (yüzde/sabit) tanımı; RLS ile uçtan uca görünürlük testi (kabul: tahsissiz birim dönmez).
- **PR-5 — Emlakçı havuz + proje detay kartları (MVP-3,15):** RLS-filtreli liste + filtre + proje detay + daire modalı (salt-okunur fiyat); kira getirisi/video/proje sorumlusu kartları; emlakçı kendi komisyonunu görür.
- **PR-6 — Opsiyon makinesi + audit log (MVP-4,17):** Opsiyon Al (DB lock; yalnız `satilabilir=true`+`musait`) + Sattım + üretici onay; opsiyon/iptal/onay olayları `events`'e; `/api/cron/option-expiry` + `/api/cron/stok-acilis` (`satisa_acilis` geçen `planli` → `musait`).
- **PR-7 — Paylaşım + Lead Protection + public microsite (MVP-5,7,14):** imzalı landing `/p/...` + deep-link WhatsApp + markalı görsel + telefon normalize eşleşme + events log; login'siz public proje microsite (`public_slug`: galeri/kat planı/künye/harita/zaman çizelgesi).
- **PR-8 — Lead Engine V0.1 + eşleştirme bildirimi (MVP-6,16):** landing lead formu (KVKK rıza) → sıcak lead paylaşana; jenerik → round-robin dağıtım; üretici/emlakçı lead inbox; yeni/uygun (tahsisli) proje → bölge/bütçe ile ilgili emlakçıya bildirim.
- **PR-9 — Tazelik + Fiyat Sapma (MVP-8,9):** `/api/cron/freshness` + butonlu WhatsApp teyit şablonu + stale rozet; on-platform fiyat kilidi.
- **PR-10 — Admin/Concierge + belge doğrulama rozeti (MVP-11,13b):** minimal admin: concierge stok girişi, üretici doğrulama, proje belgelerini doğrula → "belgeli proje" rozeti (`belge_dogrulandi`).
- **PR-11 — PWA/Saha cilası + deploy (MVP-10):** Basit Mod (3 buton: Bul→Paylaş→Ara), çevrimdışı rozet, mobil son rötuşlar; Vercel deploy.
- **PR-12 — (paralel, çekirdek-dışı) Hesaplama araçları (MVP-18):** ayrı SEO mikro-sitesi (tapu harcı, değer artış vergisi, kira getirisi, KAKS/TAKS, kira artışı, altın&döviz). Ana uygulamadan bağımsız.

> **Kapsam/süre uyarısı:** MVP 11→18 madde oldu; 12 PR, 6-8 haftaya yoğun. Süre sıkışırsa ertelenebilir adaylar: **MVP-14 (public microsite)**, **MVP-16 (eşleştirme bildirimi)**, **MVP-18 (hesaplama araçları)** — çekirdek (stok+tahsis+opsiyon+paylaşım+lead+tazelik) her hâlükârda korunur.

---

## 17. İlk Claude Code Prompt'u (kopyala-yapıştır)
```
Bu repodaki CLAUDE.md ve ProjePazar-Devir-Dokumani.md dosyalarını oku.
Ürün: çok-müteahhitli canlı stok dağıtım ağı (Next.js + Supabase RLS + Vercel, PWA).
Bölüm 2'deki MVP kapsamına SADIK kal; Bölüm 15'teki Faz 2 işlerini YAPMA.
Şimdi Bölüm 16 / PR-1'i uygula: Next.js App Router + Tailwind + Supabase auth + PWA + 
Berrak Güven tasarım tokenları. Bittiğinde kabul kriterini ve sonraki PR'ı söyle.
```

---
*ProjePazar · projepazar.com · Berrak Güven · Devir Dokümanı (Build v1)*
