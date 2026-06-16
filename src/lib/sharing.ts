import { createHmac } from "crypto";

const SECRET = process.env.LEAD_SHARE_SECRET || "proje_pazar_default_share_secret_key_998877";

/**
 * Emlakçı ve Birim ID'sini kullanarak imzalı URL için token üretir.
 */
export function generateShareToken(emlakciId: string, birimId: string): string {
  return createHmac("sha256", SECRET)
    .update(`${emlakciId}:${birimId}`)
    .digest("hex")
    .slice(0, 16); // 16 karakter uzunluk URL'de temiz durur ve yeterince güvenlidir.
}

/**
 * Token'ın doğruluğunu kontrol eder.
 */
export function verifyShareToken(emlakciId: string, birimId: string, token: string): boolean {
  const expected = generateShareToken(emlakciId, birimId);
  return expected === token;
}
