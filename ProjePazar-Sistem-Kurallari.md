# ProjePazar — SİSTEM KURALLARI (DEĞİŞMEZ YAPI TAŞI)

> Bu dosya, tüm proje dokümanlarının (35 sayfalık Ürün Analizi docx · Devir Dokümanı · Ekranlar.html · Marka Panosu · Özet-Brief · Rakip Analizleri · Yurtdışı Raporu · Tasarım Ruhu) damıtılmış, **bağlayıcı** özüdür.
>
> **KURAL:** Bundan sonraki HER geliştirme bu yapıyı **bozmadan, farklı yöne sapmadan** yapılır. Bir özellik/karar bu dosyayla çelişiyorsa **YAPILMAZ** — önce burada güncellenir, sonra inşa edilir. Yeni özellik talebinde önce "bu hangi role/panele/değişmeze ait, kapsam disiplini testini geçiyor mu?" sorulur.

---

## 0. Ürün özü (asla değişmez)
**Çok-müteahhitli, üretici-kontrollü, canlı bir konut stoğu dağıtım ağı.** Üretici stoğunu/fiyatını/dağıtımını/lead'ini tek noktadan yönetir (Üretici Kokpiti = arz rampası); emlakçı yalnız kendine **tahsisli** projeleri tek canlı havuzdan görür, tek tıkla paylaşır, lead toplar. Ortada **tek doğru kaynak** durur.

- **Çekirdek değer:** "Bu daire hâlâ satılık mı, fiyatı ne?" sorusuna her an %100 doğru cevap.
- **Kazandıran konum:** "en hızlı satış yapılan ağ" / gayrimenkulün **güven protokolü** (sadece "tek doğru bilgi" giriş kapısıdır).
- **Ne DEĞİLİZ:** tekil CRM (Novo/Yapısoft) değil · açık pazaryeri (Topli/Tapuva) değil · ilan portalı (Sahibinden) değil · 3D stüdyo (Relata) değil · broker değil. **Saf satış altyapısı — komisyona dokunmaz, sözleşmeye taraf olmaz.**
- **Asıl moat:** üretici kontrolü (granüler tahsis) + veri yerçekimi (events Faz-1'den birikir).

---

## 1. ROLLER ve PANELLERİ (DEĞİŞMEZ — docx Bölüm 15)
Her rol **AYRI** panel/yüzey görür. Bir rolün ekranı başka role gösterilmez.

| Rol kodu | Kim | Panel / Yüzey | Dijital olgunluk |
|---|---|---|---|
| `uretici` (Ü1) | Kurumsal müteahhit | **Müteahhit Konsolu** (proje/stok/tahsis/fiyat/durum/onay/lead/performans) | Yüksek (PRO) |
| `uretici` (Ü2) | Geleneksel müteahhit | **WhatsApp + Concierge** (mesajla giriş; admin/biz kurarız) | Düşük (SIMPLE) |
| `emlakci` (E1) | Profesyonel danışman | **Emlakçı Havuzu** (filtre/paylaş/opsiyon/içerik/lead) | Yüksek (PRO) |
| `emlakci` (E2) | Geleneksel danışman | **Basit Mobil** (3 buton: Bul→WhatsApp Paylaş→Ara) | Çok düşük (SIMPLE) |
| `ofis_yetkili` (O) | Emlak ofisi / franchise | **Ofis Konsolu** (iç dağıtım, ekip performansı) — **abonelik sahibi (ana gelir)** | Orta |
| `marka_yetkili` (M) | Remax/C21 marka | **Marka Konsolu** (şubelere dağıtım, kurumsal görünüm) | Yüksek (Faz 2) |
| `arsa_sahibi` | Kat karşılığı arsa sahibi | **Salt-okunur** (yalnız kendi paylarının durumu) + WhatsApp pay bildirimi (Faz 2) | — |
| `admin` | **BİZ (platform işletmecisi)** | **Admin Paneli** (aşağıda Bölüm 2) | — |

**KRİTİK AYRIM:** `admin` ASLA bir üretici değildir. Üretici/ofis/emlakçı = **müşteri**. Admin = platformu işleten **biz**. Şu ana kadar admin'in üretici ekranını görmesi yanlıştı; düzeltilecek.

---

## 2. ADMIN = Platform İşletmecisi (BİZ) — KAPSAMLI panel
Admin minimal değildir; platformun yönetim katmanıdır (gelir modeli Bölüm 19 + roller Bölüm 15 + güven Bölüm 18/27 birleşimi):

1. **Üyelik & Abonelik yönetimi** — ofis/franchise SaaS paketleri ve kademeleri (ANA GELİR). Değer-odaklı esnek paketler (proje sayısı, AI içerik limiti, gelişmiş rapor — docx 28.6).
2. **Hesap tanımlama + kapasite/kota** — üretici/ofis/emlakçı hesabı açma, kapasite/kota atama (kaç proje, kaç koltuk, AI/rapor limiti), aktif/pasif yönetimi.
3. **Doğrulama → güven rozeti** — üretici vergi no/ruhsat/yapı denetim teyidi → "doğrulanmış üretici/proje" rozeti (sahte ilan riski, docx Bölüm 18).
4. **Concierge** — Ü2 (geleneksel müteahhit) için stok girişi/güncelleme (panel öğrenmeyen üretici adına).
5. **Denetim** — events iz zinciri, düşük-güven WhatsApp parse logları, KVKK (rıza/saklama), kullanım izleme.
6. **Gelir & ödeme takibi** — abonelik gelirleri, ödeme durumu, MRR/churn (Faz ilerledikçe).

---

## 3. GELİR MODELİ (DEĞİŞMEZ ilke + fazlı kademe — docx Bölüm 19; 2026-06-18 güncellendi)
İlke: **komisyona dokunmadan** yazılım/erişim/veriden gelir. (**KOMİSYON YOK = değişmez.**)

**ERKEN AŞAMA (MVP / şu an):**
- **Ana gelir = MÜTEAHHİT ANLAŞMASI.** Müteahhitle birebir anlaşma ile para alınır (manuel/B2B deal; sabit SaaS paketi şart değil).
- **Emlakçı = BEDAVA (basic).** Temel erişim ücretsiz → benimseme kaldıracı.

**SONRAKİ AŞAMA (değer kanıtlanınca — "o zaman bakarız"):**
- **Emlakçı premium** — emlakçıya özel hizmetler (Paylaşım Stüdyosu / içerik vb.).
- **Ofis / Franchise abonelik (SaaS)** — bütçe sahibi + ekip yönetimi + havuz erişimi.
- **İşlem ücreti** — satış-başı küçük pay (opsiyonel, iz zinciri olgunlaşınca).

> Not: `abonelik_paketi` / `abonelik` şema tabloları **sonraki-faz iskeleti** olarak durur; erken aşamada müteahhit anlaşması Admin'de manuel yönetilir.

---

## 4. ALTI TEKNİK DEĞİŞMEZ (asla bozma)
1. **RLS-önce.** Her tabloda RLS açık. Görünürlük = `tahsis`. Client'tan service-role YOK (yalnız server/cron). Emlakçı yalnız tahsisli birimi görür.
2. **Tek doğru kaynak.** Fiyat/durum yalnız `birim`'de. Kopyalama yok; paylaşımda fiyat canlı değerden basılır.
3. **Çift-satış kalkanı DB'de.** Aktif opsiyon için unique partial index + opsiyon ön-koşulu (satilabilir+musait). Uygulama katmanına güvenme.
4. **WhatsApp hibrit.** MVP = giden **deep-link** (ücretsiz, emlakçı telefonundan) + butonlu **teyit şablonu** (Cloud API, yalnız müteahhit teyidi). **Serbest-metin AI parse ile stoğa YAZMA = Faz 2** (yanlış parse = yanlış stok = ölümcül).
5. **Tazelik görünür.** Her yazışta `son_guncelleme=now()`. UI'da "X önce" + N günden eski → stale (yeşil rozet sarıya). Tazelik Sigortası cron.
6. **Mobil-önce + PWA.** Her ekran telefonda çalışır, çevrimdışı graceful, kurulabilir.

---

## 5. BEŞ KAÇINILMAZLIK KALDIRACI (docx Bölüm 25.2 — "sistemden vazgeçilmez ol")
1. **Özel Stok** — "bu daireler yalnız platformda" → emlakçı girmek zorunda.
2. **Lead Takibi + Kim-Getirdi GÖRÜNÜRLÜĞÜ** (2026-06-18 — Lead Engine kaldırıldı) — danışman müşteri adayını platformda kaydeder/takip eder. Müteahhit ad/telefon **SORGULAYINCA** o müşterinin İLK kimin lead'i olarak kaydedildiğini görür (danışman atlanırsa şeffaflık). Platform sahiplik **garanti etmez**, arbitraj yapmaz, talep **üretmez/lead dağıtmaz**; çözüm taraflar arasıdır.
3. **Fiyat/Talep Zekası** (AI-4, Faz 2) — veri → güç.
4. **Paylaşım = Kazanç** — getiren kazanır + ilk-paylaşan 48s avantajı → viral, bilgi-saklama kırılır.
5. **Lock-in** — satış geçmişi + müşteri + performans + tahsilat burada → çıkarsa kaybeder. *"Üretici sistemden çıkamaz hâle gelirse bu iş unicorn olur."*

---

## 6. GÜVEN PROTOKOLÜ — somut mekanizmalar (docx Bölüm 27)
- **Kim-Getirdi GÖRÜNÜRLÜĞÜ (garanti DEĞİL — 2026-06-18):** danışman müşteri adayını kaydeder (telefon normalize). Müteahhit ad/telefon **SORGULADIĞINDA** o müşterinin İLK kimin lead'i olarak kaydedildiğini görür — danışman atlanırsa şeffaflık. **Tüm danışmanların lead'i müteahhide iletilmez; yalnız SORGU sonucu gösterilir.** Platform sahiplik garanti etmez, arbitraj yapmaz; çözüm taraflar arasıdır.
- **Tazelik Sigortası (Stale-Data Fuse):** 15 gün hareketsiz proje → müteahhite butonlu WhatsApp teyit; cevapsızsa "Canlı" rozeti sarıya döner.
- **Syndication (fiyat/içerik senkron):** müteahhit %10 zam → tüm emlakçı PWA'sı saniyeler içinde güncellenir, eski fiyata kırmızı çizgi. Emlakçı yalnız onaylı/markalı materyal paylaşır.
- **Arsa sahibi:** salt-okunur kendi payları + (Faz 2) pay bildirimi (viral kaldıraç, Bölüm 28.1).
- **Kim-getirdi iz zinciri:** her paylaşım/görüntüleme/lead/satış `events`'e. Komisyon Faz 2 ama iz Faz 1'den (geçmişe dönük üretilemez).

---

## 7. EKRAN / PANEL ENVANTERİ (tasarım: Ekranlar.html — buna uyulacak)
1. **Emlakçı Havuzu** — sol filtre (Ülke›İl›İlçe›Mahalle hiyerarşi + Daire Tipi + Birim Türü + Durum&Teslim). Proje kartı: render görsel, **✓ Doğrulanmış** rozeti, **tazelik damgası** (nabız), tip çipleri (mini plan), durum dağılımı (müsait/opsiyon/satıldı), fiyat aralığı + KDV/USD-endeksli, **İncele / WhatsApp Paylaş**.
2. **Proje Detay** — hero galeri + sanal tur + broşür; **Künye** (ada/parsel, imar E:KAKS, TAKS, arsa/inşaat m², yapı ruhsatı, yapı denetim, iskan, **kat karşılığı pay etiketi**); **Konum & Çevre** (harita + POI mesafeleri); **Malzeme & Kalite** (marka marka: Schüco/Schindler/Bosch/VitrA...); **Sosyal Donatılar**; **Vaziyet Planı** (blok seç); **Birim Dizimi — EŞİT OLMAYAN KAT** (zemin ticari/dükkan/ofis, ara kat 4 daire, üst kat dubleks); **Daire Tipleri** kataloğu; **inşaat zaman çizelgesi**.
3. **Daire Detay (MODAL — tıklanınca, merkezi)** — kat planı + daire planı; net/brüt m², yön/cephe, manzara, oda/banyo, balkon/teras, otopark/depo; **ŞEREFİYE KIRILIMI** (taban fiyat + kat şerefiyesi % + manzara şerefiyesi % → liste fiyatı); **ödeme planı** (%peşin/ay/teslim, KDV, USD-endeks); durum + **Opsiyon Al·48s / Sattım / Paylaş**; **iz** (görüntülenme, güncellik). *Durum menüsü modal içinde, scroll yaratmaz; duruma göre not.*
4. **Tahsis (MOAT)** — Herkese açık / **Yalnız seçili ofisler** (ofis listesi: münhasır/kontenjan/standart) × **Kapsam** (Bloklar/Katlar/Tipler) × **Şartlar** (fiyat görünürlüğü/münhasırlık/kontenjan).
5. **Üretici Kokpiti** — KPI (taze stok, satış hızı, açık lead), stok durumu çubuğu, son lead'ler (kendi-kanalı/ağ), tazelik uyarısı; **kendi satışı + emlakçı ağı satışı tek durum makinesinde**.
6. **Admin Paneli** — Bölüm 2.
7. **SIMPLE yüzeyler** — PWA saha (çevrimdışı son-senkron, kurulabilir), Basit 3-buton mobil (E2), WhatsApp teyit-merkezli (liste→buton onay).

---

## 8. TASARIM SİSTEMİ — Berrak Güven (DEĞİŞMEZ — Marka Panosu)
**Renkler:** ink `#0F2638` · navy `#13314B` · teal `#1E9B8A` · **müsait/yeşil `#2FB36B`** · **opsiyon/amber `#E3A12C`** · **satıldı/kırmızı `#D15A4E`** · kağıt `#F4F2EE` · card `#FFFFFF` · gri `#5E6B78` · hairline `#E6EBEF`/`#DCE3E8`.
**Fontlar:** Bricolage Grotesque (başlık/wordmark) · Instrument Sans (arayüz/metin) · Geist Mono (veri/fiyat/işaret).
**İmza:** 3×3 ızgara logosu (sinyal renkleri) · **tazelik damgası "● 2 saat önce" (nabız animasyonu)** · yeşil/amber/kırmızı sinyal sistemi her yerde · sıcak kırık-beyaz zemin, bol beyaz alan.
**5 ilke:** (1) Tek doğru bilgi — tasarım hiçbir şeyi gizlemez. (2) Sinyal > gürültü. (3) İki yüz, tek ruh (SIMPLE+PRO). (4) Tazelik görünür. (5) Izgara dürüsttür.

---

## 9. İKİ-MOD İLKESİ (DEĞİŞMEZ — docx Bölüm 15)
**SIMPLE MODE = VARSAYILAN** (Ü2/E2 dijitalleşmemiş: WhatsApp + birkaç buton, karmaşık güç arka planda). **PRO MODE** (Ü1/E1: tahsis paneli, toplu işlem, analitik). Aynı motor, iki yüz. **"Ü2 ve E2'yi tutan ürün Ü1/E1'i zaten tutar; tersi değil."**

---

## 10. KAPSAM DİSİPLİNİ (DEĞİŞMEZ test)
Her özellik tek testten geçer: **"canlı stok + üretici-kontrolü + güven protokolü + dağıtımı mı güçlendiriyor; yoksa beni Sales OS / CRM / ERP / 3D stüdyo mu yapıyor?"**

**NE YAPMAYIZ (entegre et, yapma):** 3D/immersive stüdyo motoru · tam CRM/muhasebe/ERP/şantiye · online ödeme/escrow + otomatik sözleşme üretimi · fuar/phygital araçları · ilan portalı (B2C açık ilan).

**MVP ÇEKİRDEĞİ (tut):** stok+fiyat (tek doğru) · granüler tahsis (açık / ofis-listesi) · opsiyon kilidi + 2 kademeli onay · WhatsApp paylaşım 2-dokunuş · **Lead Engine V0.1** (ZORUNLU çarpan) · Lead Protection (temel) · Tazelik Sigortası · Fiyat Sapma Alarmı (on-platform) · arsa sahibi salt-okunur · proje zaman çizelgesi/iskan · belge-doğrulanmış proje rozeti · public proje microsite · PWA/Basit Mod · minimal-DEĞİL kapsamlı Admin.

**FAZ 2+:** WhatsApp serbest-metin AI parse · Paylaşım Stüdyosu premium · ödeme planı motoru (döviz/senet) · dinamik fiyat (kat katsayısı/fiyat geçmişi) · opsiyon talep+kod · arsa sahibi paneli+pay bildirimi · kat karşılığı pay-raporu · fiyat/talep zekası + killer paneller (fiyat sapma off-platform, emlakçı skoru, tahsilat radar, satılabilirlik skoru) · marka konsolu · yurtdışı projeler (ülke/döviz/getiri/oturum/çok-dil) · finansal katman (Bloomberg vizyonu).

---

## 11. ÜRÜN TANIM DERİNLİĞİ (docx Bölüm 30 — DEĞİŞMEZ)
- **Segment/tür:** daire · ofis · dükkan · villa · depo · otopark (tahsis kapsamına "tür" filtresi; ticari farklı emlakçıya tahsis edilebilir).
- **İşlem tipi:** satılık · kiralık · satılık+kiralık · pay satışı (ticari) · satışa kapalı.
- **Üç net satış durumu:** (a) **satılabilir**; (b) **planlı** (satışa-açılış tarihi gelince cron açar); (c) **kalıcı satılamaz** (arsa sahibi payı, `sahiplik='arsa'` + `satilabilir=false` — havuzda görünür, satışa kapalı). Bunlar BİRBİRİNE KARIŞTIRILMAZ.
- **Tapu durumu:** kat irtifakı/kat mülkiyeti/arsa tapusu/koçan (KKTC Türk koçanı).
- **Komisyon görünürlüğü:** üretici tahsiste %/sabit tanımlar; emlakçı kendi kazancını görür, başkasınınkini görmez (RLS).
- **Opsiyon yöntemi:** doğrudan (MVP) / talep+kod (Faz 2, proje bazında).
- **İlke:** Her şey üreticide tanımlanır; emlakçı yalnız kendine tahsisli + satılabilir + komisyonu görünür birimi satar.

---

## 12. STACK & MİMARİ (DEĞİŞMEZ)
Next.js (App Router, TS strict) + Tailwind v4 + **Supabase** (PostgreSQL + Auth + Realtime + Storage + **RLS**) + **Vercel** (serverless + cron) + **PWA** (mobil-önce). AI = Claude API (Faz 2 parse/içerik). WhatsApp Cloud API (hibrit). Multi-tenant baştan (uretici_id izolasyonu). Gerçek-zaman "nice to have" (cron + DB kilidi yeterli). Para: `para_birimi` ile (MVP TRY; usd_endeksli alan dursun, hesaplama Faz 2).

---
*ProjePazar · Berrak Güven · Sistem Kuralları — tüm dokümanların bağlayıcı özü. Değiştirmeden önce dokümanlarla doğrula.*
