/**
 * Telefon numarasını normalize eder (+90 formatına getirir).
 * Lead eşleştirmesi/sorgusu için TEK kaynak — /api/lead ve müteahhit lead-sorgu aynı normalizasyonu kullanır.
 */
export function normalizeTelefon(tel: string): string {
  // Rakam dışındaki tüm karakterleri temizle
  let temiz = tel.replace(/\D/g, "");

  // Başında 0 varsa kaldır
  if (temiz.startsWith("0")) temiz = temiz.slice(1);

  // Türkiye için +90 ülke kodunu ekle
  if (temiz.length === 10) return `+90${temiz}`;

  // Zaten 90 ile başlıyorsa ve 12 haneliyse + ekle
  if (temiz.startsWith("90") && temiz.length === 12) return `+${temiz}`;

  // Diğer durumlar: temizlenmiş halini dön
  return temiz ? `+${temiz}` : "";
}
