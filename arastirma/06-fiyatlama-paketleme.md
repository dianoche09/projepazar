# 06 — Müteahhit Anlaşması: Fiyatlama & Değer Paketleme

> **Kaynak:** Perplexity (yeniden-kapsanmış: ofis-SaaS-tier DEĞİL, müteahhit B2B anlaşma).
> **Tarih:** 2026-06-18 · **Durum:** Çapa veriler doğrulanmadı (düşük risk); model önerisi sağlam.
> **Bağlayıcı referans:** [Sistem Kuralları](../ProjePazar-Sistem-Kurallari.md) Bölüm 3 (gelir — fazlı). [[02-fiyatlandirma]] ile tamamlayıcı (o ofis-tier'di, bu müteahhit-anlaşma).

---

## Özet
- **Doğru değer metriği = yönetilen birim/proje.** Doğal model: **müteahhit-başı sabit taban + birim/proje ölçeği** (hibrit: taban + premium eklenti). Danışman/ofis **kalıcı bedava** (ağ etkisi/MOAT).
- **Ödeme gücü net:** yeni geliştirme pazarlaması satışın **%1–2'si**. TR 2025: 1.688.910 konut, ort ~4,7M TL. 100 birimlik proje sellout ~470M TL → pazarlama 4,7–9,4M TL; **tek satış bile yıllık platform ücretini (150–600K TL) kat kat karşılar.**
- **Komisyon ALMA** (modele aykırı), **saf koltuk-başı** (bedava ilkesini bozar), **lead-sahipliği fiyatlama** (kapsam dışı) — kaçınılacaklar.

---

## Komisyonsuz / sabit-anlaşma örnekleri (çapa)
| Örnek | Model | Fiyat |
|---|---|---|
| Citiwise (Hindistan) | Yıllık sabit, sınırsız proje+kullanıcı | ₹99.999/yıl |
| Corealpha | Proje başına lisans | ₹40.000/proje |
| eProp | Modül + m²/kullanıcı | $50–75/kullanıcı/ay; $0,015–0,03/sqft/yıl |
| Zoho CRM | Koltuk + kurulum | $50/kullanıcı/ay + $2.997 setup |

PropTech kurumsal **LTV $20.000–100.000**; müteahhit bu banda yakın. Müteahhit **CAC $2.000–10.000** → ilk ~20 müteahhit **el ile referans satışı** (dijital reklam değil).

---

## ProjePazar'a Etki → Aksiyon
- **ŞİMDİ (referans):** Müteahhit anlaşma çapası: yıllık **150–600K TL** bandı + birim/proje ölçeği. Admin'de manuel anlaşmaya girdi.
- **Ağ-bağlı kademe fikri:** tahsisli aktif danışman sayısı arttıkça müteahhit üst kademeye → ağ etkisini gelire bağlar. (İleride paket mantığına yedirilebilir.)
- **SONRAKİ FAZ:** 3 kademe (Başlangıç/Profesyonel/Kurumsal), orta paket cazip. `abonelik_paketi` tablosu hazır.

## ⚠️ Senin kararın gereken (GTM)
Perplexity sordu, ben de soruyorum: **ilk hedef müteahhit segmenti** — (a) tek-projeli küçük müteahhit mi, (b) çok-projeli markalı geliştirici mi? Araştırma **(b) orta-büyük/çok-proje**'ye eğilimli (LTV yüksek, churn düşük; tek-proje churn'lü). Ama bu senin GTM kararın. Fiyat netleştirmesi buna bağlı + **birincil saha verisi** (müteahhit görüşmeleri) gerek.

---

## Kaynaklar
getmonetizely (değer metriği) · butterflyvoyage/wearethethinktank (%1-2 pazarlama) · koza24 (TR 2025 konut) · qubit.capital (PropTech LTV) · citiwise/goeprop/corealpha (komisyonsuz örnekler). *Çapa rakamları sunum öncesi teyit.*
