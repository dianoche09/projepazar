# 8 Oyuncu Analizi — Almamız Gerekenler
### ProjePazar · rakip/referans sentezi ve aksiyon listesi · 13 Haziran 2026
İncelenen 8: **Tapuva (TR/İstanbul), EDAP (TR/Ankara), DomusHub, Kords (MENA), Nexprop (IN/UAE), Relata (IN), Flatter (HU), UnitAtlas.** Sayfaları gezildi; DomusHub/EDAP/Tapuva'da ürün ekranları (landing içi mockup + ekran görselleri) incelendi.

---

## 1. En kritik gerçek (önce bunu oku)
**Türkiye'de "ilk" değiliz.** Bizim modelimize çok yakın iki yerli oyuncu zaten sahada:
- **Tapuva (İstanbul):** neredeyse birebir bizim pitch — "geliştirici markaları ↔ emlakçı tek B2B platform," kart üstünde **komisyon %**, **AI Satış Koçu**, akıllı eşleşme, ücretsiz hesaplama araçları. Model: **sıfır üyelik ücreti / başarıdan kazanç** (Topli'ye yakın). Erken aşama (20+ ilan, 100+ emlakçı, 15+ marka).
- **EDAP (Ankara):** **belge-doğrulama merkezli** — yalnız "belgeli/onaylı projeler", fiyat listeleri, **evrak yönetimi** (üyelik için kimlik-belge + satış sonrası evrak takibi). Aracı/danışmanlık modeli, üyelik kademeli (**₺0 / ₺10.000 / ₺15.000 ay**). **Ankara'da** → bizim cold-start sahasıyla doğrudan çakışır.
- (+ Topli açık pazaryeri.)

Global tarafta kategori olgun: **DomusHub** (off-plan Sales OS, Türkiye dahil 6 ülke, Türkçe, $250–500/ay) bizim eklediğimiz özelliklerin çoğunu zaten shipliyor.

**Sonuç:** Farkımız "fikir" değil; **üretici-kontrolü (granüler tahsis) + WhatsApp/concierge ile küçük müteahhit (Ü2) + güven protokolü (Lead Protection/Tazelik Sigortası/kat karşılığı) + Ankara saha derinliği + saf altyapı**. Ama aşağıdaki olgun özellikleri **hızla benimsemeliyiz**.

---

## 1.5 Kapsam Disiplini Filtresi (önce bu)
Bu liste bir "alışveriş sepeti" değil. Her madde tek testten geçer: **"canlı stok + üretici-kontrolü + güven protokolü + dağıtımı mı güçlendiriyor, yoksa beni Sales OS / CRM / 3D stüdyoya mı çeviriyor?"**
- **✅ AL (MVP):** belge-doğrulanmış proje rozeti + proje belgeleri, public proje microsite, otomatik eşleştirme-bildirimi, proje zaman çizelgesi (iskan/teslim/aşama), proje detay kartları (kira getirisi/video/sorumlu), toplu birim güncelleme, opsiyon audit log, komisyon görünürlüğü. **Çekirdek-dışı ama ucuz:** ücretsiz hesaplama araçları → ayrı SEO mikrosite (uygulama kapsamını şişirmez).
- **⏸ ERTELE (Faz 2):** interactive offer + analitik, AI satış koçu, buyer portal + inşaat takibi, EOI, smart booking (KYC+sözleşme), online kapora, dinamik fiyat (kat katsayısı), Kanban+leaderboard, CRM entegrasyonu.
- **⛔ ALMA (kategori dışı):** 3D/immersive stüdyo motoru, tam CRM/ERP, online ödeme/escrow + otomatik sözleşme üretimi, fuar araçları. (Üretici render/video yükler; biz motorunu yapmayız.)

Aşağıdaki tablolarda her madde bu etiketlerle okunmalı.

## 2. A) BİZİM PLANLAMADIĞIMIZ — almamız gerekenler
| Ne | Kaynak | Neden değerli | Faz |
|---|---|---|---|
| **Ücretsiz hesaplama araçları** (tapu harcı, değer artış vergisi, kira getirisi, KAKS/TAKS, kira artışı, altın&döviz) | Tapuva | SEO + funnel girişi + emlakçıya günlük fayda; ucuz, yüksek geri dönüş | **MVP** |
| **Belge-doğrulanmış proje rozeti + proje belgeleri** (ruhsat/iskan); üyelikte kimlik-belge doğrulama | EDAP | "Güven protokolü"nü görünür kılar; sahte ilanı keser; üretici güveni | **MVP** |
| **Public, login'siz proje microsite (tek URL):** galeri/3D/masterplan/ödeme planı/harita/inşaat güncellemesi | DomusHub | Paylaşım + SEO + pazarlama; emlakçı tek link atar | **MVP-lite** |
| **Proje detayda: kira getirisi kartı + proje videosu + "proje sorumlusu" iletişim** | EDAP | Yatırımcı dili; üretici-tarafı muhatap netliği | **MVP-lite** |
| **Otomatik eşleştirme-bildirimi:** yeni/uygun proje → bölge/bütçe ile doğru emlakçıya anında bildirim | Tapuva, Kords | "Müşteri/portföy geliyor" hissi; Lead Engine'i besler | **MVP-lite** |
| **Reusable "Layout" ile toplu birim güncelleme** (aynı birimleri toplu fiyat/özellik) | DomusHub | Büyük projede operasyon; generator'ın devamı | **MVP-lite** |
| **Interactive Offer-by-link + görüntülenme analitiği** (kişiye özel teklif, birim karşılaştırma, "açıldı mı/ne zaman/kaç kez iletildi") | DomusHub, Relata | Paylaşım Stüdyosu'nu "teklif + iz" seviyesine çıkarır | Faz 2 |
| **AI Satış Koçu — itiraz cevapları** (sahada emlakçıya itiraz-cevap + satış metni) | Tapuva | Sahadaki emlakçıyı güçlendirir; benimsemeyi artırır | Faz 2 (AI) |
| **Buyer Portal + inşaat ilerleme zaman çizelgesi (fotoğraflı)** | DomusHub, Relata | Uzak/yabancı yatırımcıyı sakinleştirir; yurtdışı ekseniyle örtüşür | Faz 2 |
| **EOI / ön-talep (pre-launch) yönetimi** (lansman öncesi ilgi/ön-rezervasyon) | Relata, Kords | "Satışa açılış tarihi/planlı" ile birleşir; off-plan lansman | Faz 2 |
| **Smart Booking: in-app KYC + auto-sözleşme/fatura** | Relata, DomusHub | Kapora→KYC→sözleşme tek akış; -80% evrak süresi | Faz 2 |
| **Online kapora ödemesi → anında kilit** | DomusHub | Opsiyonu pekiştirir; çift-satış riskini sıfırlar | Faz 2 |
| **Kanban satış hattı + ajan leaderboard + direkt/broker payı** | DomusHub, Nexprop | Üretici/ofis görünürlüğü | Faz 2 |
| **3D/sanal tur + immersive galeri** (üretici yükler) | Relata, Flatter, UnitAtlas, Nexprop | Görsel deneyim; dönüşüm | Faz 2 |
| **Geniş CRM/PMS çift-yönlü entegrasyon** (HubSpot/Salesforce/amoCRM/Bitrix/Pipedrive) | DomusHub | Ü1 için "replace etme, yanına otur" | Faz 2 |

---

## 3. B) BİZİM PLANLADIĞIMIZ — ama onlar daha iyi düşünmüş (yaklaşımı al)
| Konu | Bizim hâli | Daha iyi hâli (al) | Kaynak |
|---|---|---|---|
| **Komisyon** | tahsiste % / sabit | **base + eşik kuralı** (satış adedi/tutar), proje+rol bazında, **deal override**, + ajan **hakediş defteri (kazanılan vs ödenen)** | DomusHub |
| **Opsiyon / çift-satış** | DB kilidi + cron | + **booking timer countdown** + **iptal/audit log** + **online kapora ile kilit** | DomusHub |
| **Dinamik fiyat** | fiyat_kurali (tarih/adet/doluluk) | + **kat katsayısı (floor coefficient)** + **kriter-bazlı toplu fiyat** + **fiyat geçmişi (m² grafiği)** + geçici kampanya | DomusHub |
| **Paylaşım** | markalı görsel + landing | + **Interactive Offer (karşılaştırma + analitik)** + **public microsite** | DomusHub, Relata |
| **Onboarding** | "concierge" (soyut) | **net SLA'lı adımlar**: İçerik 1hf → Kurulum 2g → Entegrasyon 2hf → Lansman 3-5g (Relata "10 günde teslim") | DomusHub, Relata |
| **Para dili / pazarlama** | metinsel | **somut ROI + "Excel vs Biz" karşılaştırma tablosu** (-80% evrak, +25% booking, "8 reason leaving profit") | DomusHub |
| **Güven/doğrulama** | "doğrulanmış rozet" (hafif) | **belge-doğrulamayı güven protokolünün görünür merkezine** koy | EDAP |
| **Eşleştirme** | Lead Engine dağıtım | **tahsis + bölge/bütçe ile otomatik bildirim** olarak netleştir | Tapuva, Kords |

---

## 4. Ekran/UX dersleri (gezilen sayfalardan)
- **EDAP proje-detay ekranı:** kira getirisi + belgeler + proje videosu + sosyal alan ikonları + harita + **proje sorumlusu iletişim** → bizim daire/proje detayına bu kartları ekle.
- **DomusHub kokpit/dashboard:** poligon masterplan, **booking timer geri sayım**, stage payment görseli, **price constructor (toplu + fiyat geçmişi)**, **interactive offer page-builder + analytics**, commission-rules ekranı, dashboard (gelir / envanter donut / satış hızı / top agents / direkt-broker payı) → üretici kokpiti için olgun referans.
- **Tapuva:** kart üstünde **komisyon %**, "öne çıkan projeler", AI Satış Koçu kartı, akıllı eşleşme bildirimleri → havuz kartı tasarımımıza işle.

---

## 5. Konum & tehdit güncellemesi
- **Yakın tehditler Türkiye'de:** Tapuva (İstanbul, model birebir, ücretsiz/komisyon), EDAP (**Ankara**, belge-merkezli, pahalı, danışmanlık hissi). İkisi de **erken ve yüzeysel** (az ilan/derinlik). 
- **Bizim kazanma yolumuz değişmedi ama acil:** hız + derinlik. Üretici-kontrolü (granüler tahsis), **WhatsApp/concierge ile Ü2**, güven protokolü (Lead Protection + Tazelik Sigortası + **kat karşılığı/arsa payı**), Ankara'da derin saha. EDAP belge açısını tutuyor → bizim **belge-doğrulama + güven protokolü** ile onu geçmemiz lazım. Tapuva model olarak aynı → bizim **kontrol + WhatsApp + saha** ile ayrışmamız lazım.
- Konum cümlesi (sabit): *"Türkiye'nin çok-müteahhitli, üretici-kontrollü, WhatsApp-önce canlı dağıtım ağı — gayrimenkulün güven protokolü."* (DomusHub gibi "geliştirici Sales OS" değil.)

---

## 6. Öneri — kapsam kararı
**MVP'ye çek (ucuz + yüksek değer):** ücretsiz hesaplama araçları (SEO), belge-doğrulanmış proje rozeti + proje belgeleri, public proje microsite (basit), proje detayda kira getirisi/video/proje sorumlusu, toplu birim güncelleme, otomatik eşleştirme-bildirimi, komisyonu eşik+hakediş defterine genişletme, opsiyon audit log.
**Faz 2:** interactive offer + analitik, AI satış koçu (itiraz), buyer portal + inşaat takibi, EOI, smart booking (KYC + auto-sözleşme), online kapora, dinamik fiyat (kat katsayısı + fiyat geçmişi), 3D/sanal tur, CRM entegrasyon, Kanban + leaderboard.

> İstersen bu listeyi **devir dokümanı + strateji docx + supabase-schema.sql**'e işleyeyim (MVP'ye girenleri Bölüm 2/29'a, Faz 2'leri Bölüm 15'e, yeni alanları şemaya). Onay verirsen tutarlı şekilde dağıtırım.

---

## 7. Kaynaklar
Tapuva https://tapuva.com/ (+ /araclar) · EDAP https://www.edapturkiye.com/ · DomusHub https://domushub.io/en (+ /pricing, /use-cases/turkey) · Kords https://kords.ai/en/home · Nexprop https://nexprop.ai/ · Relata https://relata.io/ · Flatter https://www.flatter.hu/en · UnitAtlas https://unitatlas.com/

*Bilgiler firmaların kendi sitelerinden (Haziran 2026); pazarlama beyanı içerebilir, demo ile doğrulanmalı.*
