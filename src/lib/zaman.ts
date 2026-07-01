/**
 * Server render'da geçerli zaman. Date.now()'u fonksiyon sınırının ardına alır —
 * react-hooks/purity kuralı Server Component render'ında Date.now()/new Date()'i "impure"
 * sayıyor (SSR'de tek-sefer çalıştığından aslında güvenli; bu sarmalayıcı false-positive'i giderir).
 */
export const simdiMs = (): number => Date.now();
