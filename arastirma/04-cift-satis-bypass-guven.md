# 04 — Çift-Satış / Eski-Fiyat / Bypass & Güven Mekanizmaları

> **Kaynak:** Perplexity (Deep Research) özet çıktısı, işlenmiş.
> **Tarih:** 2026-06-18 · **Durum:** Hukuki atıflar doğrulanmalı (Yargıtay/TBK referansları birincil kaynaktan teyit edilmeli).
> **Bağlayıcı referans:** [Sistem Kuralları](../ProjePazar-Sistem-Kurallari.md) Teknik Değişmez #2/#3, Bölüm 6 (güven protokolü).

---

## Özet
Dört sorunun tek kök nedeni: **müteahhit↔danışman arasında ortak, gerçek-zamanlı, yetkili veri katmanı yok.** ProjePazar'ın mevcut mekanizmaları bunları doğrudan karşılıyor.

---

## Bulgular → ProjePazar karşılığı

| Sorun | Hukuki çerçeve (doğrulanmalı) | ProjePazar çözümü | Durum |
|---|---|---|---|
| **(a) Çift satış** | Topraktan satışta tapu yok → aynı bağımsız bölüm 2 kişiye: tazminat + **TCK 158/1-f** nitelikli dolandırıcılık; Yargıtay 15. HD önceliği sözleşme tarihine göre — ama **sonradan** mahkemede çözülüyor | **Opsiyon/rezervasyon kilidi + DB unique partial index** (önceden, sistematik önleme) | ✅ Kodda var |
| **(b) Eski fiyat** | Gecikmeli PDF/Excel → TBK dürüstlük kuralı, danışman tazminat riski | **Canlı tek-kaynak fiyat senkronu** (paylaşımda canlı değerden basılır) | ✅ Kodda var |
| **(d) Bypass** | Müşteri danışmanı atlıyor → TBK m.520–525 komisyon hakkı korunur ama **ispat yükü danışmanda**, yazılı belge yoksa hak aramak güç | **Kim-getirdi GÖRÜNÜRLÜĞÜ** (müteahhit sorgular, ilk kaydeden çıkar — zaman damgalı, garanti değil şeffaflık) | ✅ Yeni eklendi (lead-sorgu) |

> (c) Stok görünmezliği = canlı durum (müsait/opsiyon/satıldı) ile çözülür — kodda var.

---

## En iyi pratik (global)
- **MHub (Malezya):** 350.000+ rezervasyonda **sıfır çift satış** — merkezi rezervasyon kilidi modeli.
- **Hindistan (RERA), ABD geliştiricileri:** "broker/client registration" formunu **sahiplik garantisi değil, ŞEFFAFLIK aracı** olarak kullanıyor — zaman damgalı müşteri kaydı.
- **ProjePazar uyumu:** Bizim yeni **lead-sorgu** (müteahhit ad/telefon sorgular → ilk kaydeden danışman) = tam bu "registration as transparency" deseni. Kararla (garanti yok, görünürlük var) birebir örtüşüyor.

---

## ProjePazar'a Etki → Aksiyon
- **Validasyon:** opsiyon kilidi + canlı senkron + lead-sorgu = literatürün önerdiği üç mekanizma. Yeni eklenen lead-sorgu, global best-practice ile aynı çerçevede — doğru karar.
- **Aksiyon yok (kod hazır).** Yalnız: hukuki atıflar (TCK 158/1-f, Yargıtay 15.HD, TBK 520-525) pazarlama/satış materyalinde kullanılacaksa **birincil kaynaktan teyit** edilmeli.

---

## Kaynaklar (doğrulanmalı)
- Topraktan satış / çifte satış hukuku: tghukukdanismanlik.com, ademtosun.av.tr (Yargıtay emsal) — *birincil karar metniyle teyit edilmeli.*
- MHub / RERA broker registration — global proptech pratiği.
