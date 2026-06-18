# 00 — Araştırma Sentezi: ProjePazar'da Ne Değişiyor

> 7 araştırma raporunun (01–07) damıtılmış aksiyon listesi. Tarih: 2026-06-18.
> **Tek cümle:** Araştırma ~%90 **VALİDASYON** — mimari/kararlar doğru çıktı. Gerçek yeni iş azdır.

---

## 🔴 Yapılacak (gerçek aksiyon)

| # | İş | Kaynak | Tip | Durum |
|---|---|---|---|---|
| A1 | **KVKK aydınlatma metni** lead formuna (token sayfa) + `/kvkk-aydinlatma` sayfası | 05 | Kod (küçük) | Onay bekliyor |
| A2 | Danışman/ofis **Veri İşleyen Sözleşmesi** şablonu + VERBİS değerlendirme | 05 | Hukuk/operasyon | Bekliyor |
| A3 | **Sosyal medya kullanım politikası**: paylaşım linki birebir/WhatsApp içindir, sosyal medyaya açılamaz | 03,05 | Politika + UI uyarı | Bekliyor |
| A4 | Müteahhit anlaşma **fiyat çapası** (≈150–600K TL/yıl + birim/proje ölçeği) Admin manuel anlaşmaya referans | 06 | Referans | Hazır |

## ⚠️ Senin kararın gereken
| # | Karar | Araştırma eğilimi |
|---|---|---|
| K1 | İlk hedef müteahhit segmenti: küçük tek-proje mi, **çok-projeli markalı geliştirici mi**? | (b) çok-proje/orta-büyük (LTV↑, churn↓) |
| K2 | Müteahhit fiyat bandı kesinleştirme | **Birincil saha verisi** (müteahhit görüşmeleri) gerek |

## 🟢 Validasyon (mevcut karar/kod DOĞRU — iş yok)
- Opsiyon kilidi + DB unique index = çift satışı **önceden** önler (literatür + MHub/RealCube ile aynı). [04,07]
- Canlı tek-kaynak fiyat senkronu = bayat-fiyat riskini keser. [04,07]
- **Lead-sorgu (kim-getirdi görünürlüğü)** = global "broker/client registration as transparency" best-practice ile birebir. [04]
- Tahsis + RLS + tazelik = Sell.Do/Unlatch/PropStackX ile aynı hat. [07]
- `usd_endeksli`=bilgi amaçlı + TL sözleşme = döviz yasağıyla **uyumlu**. [05]
- `satilabilir=false`/arsa payı satışa-kapalı = kat karşılığı için **doğru**. [05]
- EİDS **bizi bağlamıyor** (kapalı-devre + off-plan muaf). [01,05]
- Rakip boşluk gerçek; konsept doğrulandı. [01,03]

## 🔵 Faz 2 / opsiyonel
- Yabancı vatandaş alıcıya **döviz sözleşme** mümkün → yurtdışı modülü. [05]
- AI bayat-opsiyon uyarısı (RealCube deseni) → Tazelik Sigortası cron ile. [07]
- Paylaşım sayfasında içerik **değiştirilemezliği** vurgusu (DASH deseni) — düşük efor. [07]
- Ağ-bağlı kademe (tahsisli danışman ↑ → müteahhit üst kademe). [06]

---

## Tetikleyici rüzgarlar (pazarlama/zamanlama)
- **Sosyal medya emlak yasağı** (26 Ara 2024, 1.426 hesap, 158K ceza) → gayri resmi kanal kapanıyor = bizim için talep.
- **EİDS dijital denetim dönemi** → "doğrulanmış proje rozeti" regülasyon rüzgârıyla uyumlu.
- Concierge onboarding (Ü2) = düşük-dijital müteahhidi katmanın kanıtlı yolu.
