// ProjePazar — paylaşılan DB tipleri (MVP). Supabase şemasıyla hizalı.

export type BirimDurum =
  | "musait"
  | "opsiyonlu"
  | "satis_beklemede"
  | "satildi"
  | "stop"
  | "planli"
  | "kiralandi";

export type InsaatAsama =
  | "planlama"
  | "temel"
  | "kaba_insaat"
  | "ince_insaat"
  | "cevre_duzenleme"
  | "tamamlandi";

export interface Proje {
  id: string;
  ad: string;
  il: string | null;
  ilce: string | null;
  mahalle: string | null;
  ada: string | null;
  parsel: string | null;
  insaat_asamasi: InsaatAsama;
  ilerleme_yuzde: number;
  baslama_tarihi: string | null;
  teslim_tarihi: string | null;
  iskan_tarihi: string | null;
  etap: string | null;
  belge_dogrulandi: boolean;
  son_guncelleme: string;
}

export interface Birim {
  id: string;
  blok_id: string | null;
  tip_id: string | null;
  kat: number | null;
  daire_no: string | null;
  durum: BirimDurum;
  liste_fiyati: number | null;
  para_birimi: string;
  satilabilir: boolean;
  net_m2: number | null;
  yon: string | null;
  manzara: string | null;
  durum_notu: string | null;
}

// Sinyal renkleri (Berrak Güven): yeşil=müsait, amber=opsiyon, kırmızı=satıldı
export const DURUM_BG: Record<BirimDurum, string> = {
  musait: "bg-green",
  opsiyonlu: "bg-amber",
  satis_beklemede: "bg-amber",
  satildi: "bg-red",
  stop: "bg-gray",
  planli: "bg-navy/30",
  kiralandi: "bg-teal",
};

export const DURUM_ETIKET: Record<BirimDurum, string> = {
  musait: "Müsait",
  opsiyonlu: "Opsiyonlu",
  satis_beklemede: "Satış bekliyor",
  satildi: "Satıldı",
  stop: "Durduruldu",
  planli: "Planlı",
  kiralandi: "Kiralandı",
};

export const ASAMA_ETIKET: Record<InsaatAsama, string> = {
  planlama: "Planlama",
  temel: "Temel",
  kaba_insaat: "Kaba inşaat",
  ince_insaat: "İnce inşaat",
  cevre_duzenleme: "Çevre düzenleme",
  tamamlandi: "Tamamlandı",
};

/** Basit "X önce" tazelik etiketi (UI'da nabız). */
export function zamanOnce(iso: string): string {
  const fark = Date.now() - new Date(iso).getTime();
  const saat = Math.floor(fark / 3_600_000);
  if (saat < 1) return "az önce";
  if (saat < 24) return `${saat} saat önce`;
  const gun = Math.floor(saat / 24);
  return `${gun} gün önce`;
}
