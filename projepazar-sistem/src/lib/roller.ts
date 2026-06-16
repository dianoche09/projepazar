// ProjePazar — rol → panel eşlemesi (Sistem Kuralları B.1: her rol AYRI panel görür).

export type Rol =
  | "uretici"
  | "emlakci"
  | "ofis_yetkili"
  | "marka_yetkili"
  | "arsa_sahibi"
  | "admin";

/** Rol'ün ana paneli. admin=BİZ (platform yönetimi); üretici/ofis/emlakçı=müşteri. */
export const ROL_PANEL: Record<Rol, string> = {
  admin: "/admin",
  uretici: "/uretici",
  emlakci: "/havuz",
  ofis_yetkili: "/ofis",
  marka_yetkili: "/marka",
  arsa_sahibi: "/arsa",
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
