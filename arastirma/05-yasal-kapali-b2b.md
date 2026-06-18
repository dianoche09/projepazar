# 05 — Yasal: Kapalı B2B Ağ (KVKK · Döviz · EİDS · Yetkilendirme · Kat Karşılığı)

> **Kaynak:** Perplexity özet + bağımsız doğrulama (WebSearch).
> **Tarih:** 2026-06-18 · **Durum:** Döviz + EİDS off-plan + sosyal medya DOĞRULANDI; KVKK rol-ayrımı doğrulanmalı (hukuk görüşü).
> **Bağlayıcı referans:** [Sistem Kuralları](../ProjePazar-Sistem-Kurallari.md) Bölüm 12 (stack/para), Teknik Değişmez #1 (RLS).
> ⚠️ Bu bir hukuki görüş değildir; sözleşme/uyum öncesi avukat teyidi şart.

---

## Özet (en aksiyonlu rapor)
- **KVKK:** Lead'i toplayan **danışman/ofis = veri sorumlusu**; ProjePazar depolama sağladığı için **veri işleyen** → her danışmanla **Veri İşleyen Sözleşmesi** + token'lı forma **aydınlatma metni linki** ZORUNLU. (KVKK 2024-25'te sert: 16.350 kuruluşa ~504M TL ceza; VERBİS + 5 gün ihlal bildirimi.)
- **Döviz (DOĞRULANDI):** TR-yerleşik arası konut sözleşmesinde döviz/endeks **yasak, 2026'da sürüyor**. USD alanı **yalnız bilgi amaçlı**, sözleşme **TL**. İstisna: **yabancı vatandaş alıcı** döviz kullanabilir.
- **EİDS (DOĞRULANDI):** Token'lı kapalı sayfa "ilan" sayılma olasılığı düşük + **off-plan (kat irtifakı yok) muaf**. Risk: danışman linki **sosyal medyaya açarsa** kamuya-açık ilan olur → kullanım politikası.
- **Yetkilendirme:** Müteahhit kendi konutunu satarken yetki belgesi gerekmez; **danışman gerekir**. Yönetmelik m.15 yazılı **yetkilendirme sözleşmesi** önerilir.
- **Kat karşılığı:** Arsa sahibi payında müteahhit satış yetkisi yok ("satışa kapalı" etiket); kentsel dönüşümde %16'ya kadar satış.

---

## Bulgular & Doğrulama

| Konu | Bulgu | Durum |
|---|---|---|
| KVKK veri sorumlusu/işleyen | danışman/ofis=sorumlu, platform=işleyen; veri işleyen sözleşmesi + aydınlatma + (marketing WhatsApp ise) İYS, 6.000 TL/aykırılık | ⚠️ Mantıklı ama **hukuk teyidi** (joint controller riski?) |
| Döviz / 32 sk | Gayrimenkulde TR-yerleşik arası döviz/endeks yasak; menkul muafiyeti (6 Mar 2025) gayrimenkulü kapsamaz; aykırı sözleşme **kesin hükümsüz** | ✅ DOĞRULANDI |
| Döviz istisnası | Yabancı vatandaş alıcı / yabancı kontrollü şirket / serbest bölge → döviz mümkün | ✅ DOĞRULANDI (Faz 2 yurtdışı açısı) |
| EİDS off-plan | Kat irtifakı yok = "tapusu yok" = kapsam DIŞI | ✅ DOĞRULANDI |
| EİDS token sayfa | Kapalı/token sayfa "ilan platformu" sayılma olasılığı düşük | ◷ Makul; net içtihat yok → temkinli |
| Sosyal medya ilan yasağı | 26 Ara 2024, 1.426 hesap, 158.460 TL ceza | ✅ DOĞRULANDI |

---

## ProjePazar'a Etki → Aksiyon

### 🔴 Kod/uyum (yapılacak)
- **KVKK-1:** Token'lı lead formuna **aydınlatma metni linki** + `/kvkk-aydinlatma` sayfası. *(küçük kod — onay bekliyor)*
- **KVKK-2:** Danışman/ofis ile **Veri İşleyen Sözleşmesi** şablonu (hukuki metin) + VERBİS değerlendirmesi. *(operasyon/hukuk)*
- **POLİTİKA:** "Paylaşım linki birebir/WhatsApp içindir, sosyal medyaya açık paylaşım yasaktır" → kullanım koşulları + (ileride) paylaşım ekranında uyarı.

### 🟢 Validasyon (mevcut karar doğru)
- `usd_endeksli` = bilgi amaçlı, TL sözleşme → Sistem Kuralları Bölüm 12 ile **birebir doğru**.
- `satilabilir=false` / `sahiplik='arsa'` satışa-kapalı → kat karşılığı için **doğru**.
- Off-plan muafiyeti → public microsite endişesi büyük ölçüde kapandı.

### 🔵 Faz 2
- Yabancı vatandaş alıcıya **döviz sözleşme** mümkün → yurtdışı/yatırımcı modülünde değerlendir.

---

## Kaynaklar
- Döviz/32 sk gayrimenkul: https://www.gsghukuk.com/tr/bultenler-yayinlar/duyurular/bedelin-doviz-cinsinden-veya-dogrudan-veya-dolayli-olarak-dovize-endeksli-olarak-belirlenmesi.html · HMB SSS (Kas 2025): https://ms.hmb.gov.tr/uploads/2025/11/Sikca-Sorulan-Sorular-ba3feb0209aa5f1a.pdf
- EİDS off-plan muafiyeti: https://www.aa.com.tr/tr/ekonomi/10-soruda-emlak-sektorunde-uygulanan-elektronik-ilan-dogrulama-sisteminin-ayrintilari/3373964
- Sosyal medya yasağı: https://www.aa.com.tr/tr/ekonomi/ticaret-bakanligi-sosyal-medyadaki-tasinmaz-ve-tasit-ilanlariyla-ilgili-uyarida-bulundu/3434553
- KVKK (rol-ayrımı, doğrulanmalı): kvkk.gov.tr
