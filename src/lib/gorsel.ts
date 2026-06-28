// Proje kapak görseli — gerçek kapak yoksa fal.ai ile üretilmiş render'lardan
// deterministik (aynı proje hep aynı görsel) seçer. Görselle ayrışma her ekranda.
const URETILEN_KAPAKLAR = [
  "/gorseller/proje-cankaya-vadi.jpg",
  "/gorseller/proje-test-konaklari.jpg",
  "/gorseller/proje-bahce-evleri.jpg",
  "/gorseller/proje-kule-rezidans.jpg",
  "/gorseller/proje-sahil-konutlari.jpg",
] as const;

/** Kapak varsa onu, yoksa proje anahtarından deterministik üretilmiş kapağı döndürür. */
export function projeKapak(kapak: string | null | undefined, anahtar: string): string {
  if (kapak) return kapak;
  let h = 0;
  for (let i = 0; i < anahtar.length; i++) h = (h * 31 + anahtar.charCodeAt(i)) >>> 0;
  return URETILEN_KAPAKLAR[h % URETILEN_KAPAKLAR.length];
}
