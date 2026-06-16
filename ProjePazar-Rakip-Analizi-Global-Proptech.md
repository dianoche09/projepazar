# Rakip & Referans Analizi — Global PropTech (Geliştirici Satış Platformları)
### ProjePazar açısından dürüst değerlendirme · 13 Haziran 2026
İncelenenler: Flatter (HU), DomusHub, Relata (IN), UnitAtlas, Kords (MENA), Nexprop (IN/UAE).

---

## 1. En kritik bulgu (önce bunu oku)
**Bu kategori yeni değil — küresel ve olgunlaşıyor.** "Tek doğru kaynak stok + çift-satış kilidi + emlakçı/broker kabini + komisyon + ödeme planı + link'le interaktif teklif" artık **standart** (DomusHub, Kords, Nexprop, Relata bunları zaten satıyor). ProjePazar bunları "icat ettik" diye konumlamamalı.

**Ama ProjePazar'ın hâlâ sahip olduğu beyaz alan net:**
1. **Çok-müteahhitli canlı havuz / ağ** — incelenenlerin neredeyse tamamı **tek-geliştiriciye** SaaS (her geliştirici kendi stoğu + kendi broker'ı). Kords dev↔broker bağlıyor ama yine tek-kiracı. ProjePazar'ın "birçok müteahhit, tek paylaşımlı canlı havuz + granüler tahsis + güven protokolü" yapısı farklı.
2. **Türkiye'ye özel:** kat karşılığı / arsa payı (satılamaz) ayrımı, KKTC koçanı, Türkçe-önce, ve **WhatsApp deep-link + concierge ile dijitalleşmemiş küçük müteahhit (Ü2).** Bu yabancı araçların hiçbiri sahadaki küçük Türk müteahhitine hitap etmiyor.
3. **Radikal basitlik + concierge** — rakipler dijitalleşmiş geliştirici için self-serve/kurumsal SaaS; küçük müteahhit onların müşterisi değil.

**En yakın tehdit: DomusHub.** Türkiye use-case sayfası var, Türkçe dahil 5 dil, çoklu döviz, yabancı/off-plan yatırımcı odaklı, ajan kabininde **satır-içi komisyon**, link'le teklif, **veri katmanında çift-satış engeli**. Bizim eklediğimiz özelliklerin çoğu onlarda zaten var. Fark: o **tek-geliştirici SaaS**, biz **çok-taraflı ağ**.

---

## 2. Oyuncu profilleri
**DomusHub** — "Sales OS for off-plan developers." 4 kabin: Developer Hub / Sales Cabinet / Agent Cabinet / Buyer Portal. Poligon-haritalı masterplan, real-time stok, booking timer + auto-expire, stage/milestone ödeme planı + auto-invoice, **eşik-tabanlı komisyon (birim üstünde satır-içi)**, çoklu döviz/canlı kur, **5 dil (EN·RU·TR·TH·ID)**, link'le interaktif teklif (PDF yok), buyer portal + inşaat güncellemeleri. Pazar: MENA·SEA·CIS (Dubai, Georgia, Cyprus, **Turkey**, Thailand, Indonesia). "CRM'ini değiştirme, yanına otur." Fiyat: **$250–500/ay** (sınırsız kullanıcı). 5.000+ birim. → **En ProjePazar'a benzer + en olgun.**

**Kords (kords.ai, MENA/Mısır, Arapça)** — "Real Estate OS for rapid project sales." **Geliştiricileri ve broker'ları birleştiren** birleşik platform; stoğu broker ağına anında dağıt, **precision matching** (alıcı eşleştirme), EOI→RSV→Deal hattı, AI asistan "Perry", web/mobil, Excel import. → **"Geliştirici→broker ağı" tezi bize en yakın olan**; ama MENA/Arapça, tek-kiracı.

**Nexprop (nexprop.ai, Hindistan/Dubai)** — AI-first modüler suite: NexCore (CRM), NexEngage (omnichannel, **WhatsApp/email/SMS**), NexVision (3D/360 tur), NexGo (mobil), kanal-partner yönetimi, envanter, post-sales (booking/ödeme/belge). Kurumsal, "6+ aracı tek stack'le değiştir." → Geniş kurumsal CRM-suite.

**Relata (relata.io, Hindistan)** — Immersive odaklı: dijital satış galerisi, sanal turlar, smart booking suite, broker app, EOI, fuar/exhibition araçları. 280+ proje, **$4B+ stok satıldı**. → Sunum/deneyim ağırlıklı.

**Flatter (flatter.hu, Macaristan)** — Hafif, "plug-and-play" interaktif daire seçici: 3D bina modeli, real-time müsaitlik, analytics, 2-3 günde canlı, 4 dil. Küçük geliştirici sitesine gömülen katman. → Dar kapsam (görselleştirme/seçici).

**UnitAtlas (unitatlas.com)** — İnteraktif plot/bina/birim görselleştirme + renk-kodlu durum + real-time müsaitlik + **AI lead scoring**. Erken aşama (Lovable ile kurulmuş demo). → Görselleştirme + AI lead skoru.

---

## 3. Karşılaştırma (özellik × oyuncu)
| Özellik | DomusHub | Kords | Nexprop | Relata | Flatter | UnitAtlas | **ProjePazar** |
|---|---|---|---|---|---|---|---|
| Tek-doğru-kaynak stok | ✅ | ✅ | ✅ | ✅ | ✅(seçici) | ✅ | ✅ |
| Çift-satış kilidi (DB) | ✅ | ~ | ~ | ✅ | — | — | ✅ |
| Çok-**müteahhit** paylaşımlı ağ | ❌ tek-dev | ~ dev↔broker | ❌ | ❌ | ❌ | ❌ | ✅ **fark** |
| Granüler tahsis (kim/neyi/şart) | ~ | ~ | ~ | ~ | — | — | ✅ **moat** |
| Komisyon görünürlüğü (satır-içi) | ✅ | ✅ | ✅ | ~ | — | — | ✅ (ekledik) |
| Ödeme planı (stage/milestone) | ✅ | ✅ | ✅ | ✅ | — | — | Faz 2 |
| Link'le interaktif teklif | ✅ | ~ | ~ | ✅ | ~ | ~ | Paylaşım Stüdyosu |
| WhatsApp ana kanal | ~ | ~ | ✅(NexEngage) | ~ | — | — | ✅ **wedge** |
| Çoklu döviz / çok-dil | ✅ (5 dil) | Arapça/EN | ✅ | ✅ | 4 dil | ~ | Faz 2 (hazır) |
| AI lead scoring / eşleştirme | ~ | ✅ matching | ✅ | ~ | — | ✅ | Faz 2 (AI-2) |
| Buyer portal + inşaat takibi | ✅ | ~ | ✅ | ✅ | — | — | Faz 2 |
| **Türkiye'ye özel** (kat karşılığı/koçan/Ü2) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **fark** |
| Dijitalleşmemiş küçük müteahhit (concierge+WA) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **fark** |

(~ = kısmi/belirsiz)

---

## 4. İki alt-kategori — ProjePazar nerede duruyor
- **A) Geliştirici Satış OS'u (tek-kiracı SaaS):** DomusHub, Kords, Nexprop, Relata. Bir geliştiriciye kendi stoğu + kendi broker'ı + booking + ödeme + komisyon + portal. **Gelir: geliştiriciye SaaS.**
- **B) Görselleştirme/seçici katmanı:** Flatter, UnitAtlas. Geliştirici sitesine gömülen interaktif birim seçici + müsaitlik + analytics.

**ProjePazar bunların ikisi de değil — üçüncü tip:** **çok-taraflı dağıtım ağı** (birçok müteahhit → kontrollü tahsis → paylaşımlı emlakçı havuzu) + Türkiye-özel + WhatsApp-önce. Bu, A'daki tekil silolardan ve B'deki sunum katmanından ayrışır. (Topli'nin "açık pazaryeri"nden de "üretici-kontrolü" ile ayrışıyorduk — bkz. strateji dokümanı Bölüm 2.6/22.)

---

## 5. Tehditler
1. **DomusHub** zaten Türkiye + Türkçe + çoklu döviz + yabancı off-plan'da; TR dağıtımına ağırlık verirse en yakın rakip. (Ama tek-geliştirici SaaS; ağ/concierge/Ü2 değil.)
2. **Kords** MENA'da "dev↔broker ağı"nı kuruyor; coğrafi genişleme riski.
3. Genel risk: kategori olgun → "özellik" ile değil **ağ likiditesi + Türkiye-özel + dağıtım** ile kazanılır (zaten tezimiz buydu).

---

## 6. Ne öğrenmeli / almalı (kanıtlanmış desenler)
- **Link'le interaktif teklif + görüntülenme analitiği** (DomusHub/Relata/Kords) → Paylaşım Stüdyosu'na birebir uyar; "kim açtı, ne zaman" izini güçlendirir.
- **Stage/milestone ödeme planı + auto-invoice** (DomusHub) → ödeme planı motoru (Faz 2) için referans tasarım.
- **Buyer Portal + inşaat güncellemeleri** (DomusHub/Relata/Nexprop) → özellikle **yurtdışı/uzak yatırımcıyı** sakinleştirir; yurtdışı ekseniyle örtüşür.
- **AI lead scoring / precision matching** (UnitAtlas/Nexprop/Kords) → AI-2 eşleştirme + Lead Engine'in evrimi.
- **"CRM'ini değiştirme, yanına otur" entegrasyon duruşu** (DomusHub) → Ü1 stratejimizle (Novo/Yapıtaşı'na API ile bağlan) aynı.
- **Fiyat referansı:** DomusHub $250–500/ay sınırsız kullanıcı → ofis/franchise abonelik fiyatlamamız için kıyas.
- **Onboarding hızı vaadi:** Flatter "2-3 günde canlı", DomusHub "200 birim altı 2 hafta" → concierge + hızlı kurulum mesajımızı güçlendirir.

---

## 7. Konum keskinleştirme (öneri)
ProjePazar'ı **"geliştirici satış OS'u"** olarak konumlama — o kalabalık ve olgun. Konum:
> **"Türkiye'nin (ve Türkiye'den satılan yurtdışı projelerin) çok-müteahhitli, üretici-kontrollü, WhatsApp-önce canlı dağıtım ağı — gayrimenkulün güven protokolü."**

Kazanma sırası değişmedi: **ağ likiditesi (Closed Deal Club) + Türkiye-özel + WhatsApp/concierge wedge + güven protokolü (Lead Protection, Tazelik Sigortası).** Rakiplerin olgun özellik setini "icat etme"; kanıtlanmışları (link-teklif, ödeme planı, buyer portal, AI scoring) **Faz 2'de hızla benimse**, çekirdekte ağ + dağıtım + Türkiye'de ayrış.

---

## 8. Kaynaklar
- DomusHub — https://domushub.io/en (+ /use-cases/turkey, /pricing)
- Kords — https://kords.ai/en/home
- Nexprop — https://nexprop.ai/
- Relata — https://relata.io/
- Flatter — https://www.flatter.hu/en
- UnitAtlas — https://unitatlas.com/ · demo https://demo.unitatlas.com/

*Not: Bilgiler firmaların kendi sitelerinden (Haziran 2026). Özellik kapsamları pazarlama beyanıdır; demo ile doğrulanmalı.*
