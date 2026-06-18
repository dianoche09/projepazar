# 07 — Global Kapalı Geliştirici→Broker Stok Dağıtım/Tahsis Modelleri

> **Kaynak:** Perplexity (kapalı tahsis modelleri; açık B2C portal değil).
> **Tarih:** 2026-06-18 · **Durum:** Platform örnekleri doğrulanmadı (düşük risk); pattern'ler mimari referans.
> **Bağlayıcı referans:** [Sistem Kuralları](../ProjePazar-Sistem-Kurallari.md) Bölüm 7 (ekran/tahsis), Teknik Değişmez #1/#2/#3.

---

## Özet
Geliştirici-kontrollü **kapalı B2B dağıtım** olgun bir proptech segmenti (Hindistan/BAE/Fransa/ABD); TR'de boşluk. İncelenen modellerin **çoğu özelliği ProjePazar'da ZATEN VAR** — bu güçlü bir validasyon. 2-3 yeni fikir not edildi.

---

## Referans platformlar
| Platform | Bizim için en değerli yanı |
|---|---|
| **Sell.Do** (Hindistan) | Birim-bazlı görünürlük kısıtı; **gizli birim broker'da "satıldı" görünür** (boş bırakmak yerine) |
| **RealCube** (BAE) | DB-seviyesi birim kilidi + aşamalı durum (Bloke→Rezerve→Satıldı) + **AI bayat-opsiyon uyarısı** |
| **PropStackX** | Canlı stok ızgarası **broadcast** — müteahhit değişikliği anında tüm broker panellerine |
| **Unlatch** (Fransa) | **Müteahhit-onaylı rezervasyon kilidi**; 500+ müteahhit, €11,7B işlem |
| **DASH** (ABD) | **Değiştirilemez içerik kütüphanesi** — broker kendi markasıyla paylaşır ama içeriği değiştiremez |

---

## ProjePazar karşılaştırması

| Pattern | Bizde durum |
|---|---|
| Granüler görünürlük (birim/blok/kat/tip tahsis) | ✅ VAR (tahsis + RLS) |
| Aşamalı birim durum otomasyonu | ✅ VAR (müsait/opsiyon/satış bekl./satıldı/planlı) |
| DB-seviyesi tek opsiyon kilidi | ✅ VAR (unique partial index) |
| Canlı senkron broadcast | ✅ VAR (Supabase Realtime) |
| Tazelik skoru | ✅ VAR (son_guncelleme/stale) |
| Kademeli tahsis | ✅ VAR (herkes/ofis/danışman + kapsam) |

---

## Yeni fikirler (değerlendir)
1. **Sell.Do deseni:** Tahsisli olmayan birimi danışmana hiç göstermiyoruz; alternatif "satıldı/müsait değil" gri gösterimi proje doluluk algısı yaratabilir. *(UX kararı — düşük öncelik; gizliliği bozmamalı.)*
2. **DASH değiştirilemez içerik:** Danışman yalnız müteahhit-onaylı/markalı materyali paylaşır (Sistem Kuralları'nda zaten ilke). Paylaşım sayfasında içeriğin **değiştirilemezliğini** vurgula. *(Düşük efor, marka güveni.)*
3. **RealCube AI bayat-opsiyon uyarısı:** Süresi dolmak üzere opsiyon/bayat stok uyarısı. *(Faz 2 — Tazelik Sigortası cron ile birleşir.)*

---

## ProjePazar'a Etki → Aksiyon
- **Asıl çıktı = VALİDASYON:** mimari çekirdeğimiz (DB kilit + tahsis + canlı senkron + tazelik) global olgun modellerle **aynı hat**. Yanlış bir şey yapmıyoruz.
- **Opsiyonel iyileştirmeler:** yukarıdaki 3 fikir — hiçbiri MVP-blocker değil; 2 (içerik değiştirilemezliği) düşük-efor, 3 (AI uyarı) Faz 2.

---

## Kaynaklar
Sell.Do · RealCube (realcube.estate) · PropStackX · Unlatch · DASH/Relata (relata.io). *Platform iddiaları doğrulanmadı; pattern referansı olarak kullanıldı.*
