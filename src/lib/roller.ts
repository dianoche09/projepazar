// ProjePazar — rol → panel eşlemesi (Sistem Kuralları B.1: her rol AYRI panel görür).

export type Rol =
  | "uretici"
  | "emlakci"
  | "ofis_yetkili"
  | "marka_yetkili"
  | "arsa_sahibi"
  | "admin";

/** Rol'ün ana paneli. admin=BİZ (platform yönetimi); üretici/ofis/emlakçı=müşteri.
 *  Faz-1: ofis/marka/arsa rolleri henüz ayrı panele sahip değil (gelir modeli: ofis/franchise = SONRA fazı)
 *  → tahsisli stok gördükleri /havuz'a yönlendirilir (404 yerine). Ayrı panelleri Faz-2. */
export const ROL_PANEL: Record<Rol, string> = {
  admin: "/admin",
  uretici: "/uretici",
  emlakci: "/havuz",
  ofis_yetkili: "/havuz",
  marka_yetkili: "/havuz",
  arsa_sahibi: "/havuz",
};

export const ROL_ETIKET: Record<Rol, string> = {
  admin: "Yönetim",
  uretici: "Üretici kokpiti",
  emlakci: "Emlakçı havuzu",
  ofis_yetkili: "Ofis konsolu",
  marka_yetkili: "Marka konsolu",
  arsa_sahibi: "Arsa sahibi",
};

/** Rol'e göre panel yolu. Bilinmeyen/null rol → "/". */
export function panelYolu(rol: string | null | undefined): string {
  return rol && rol in ROL_PANEL ? ROL_PANEL[rol as Rol] : "/";
}
