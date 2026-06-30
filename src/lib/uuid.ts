import { z } from "zod";

/**
 * Lenient UUID kontrolü.
 * Demo seed id'leri (1111.../2222.../5555.../7777...) RFC-4122 UYUMSUZ — 4. grup 8/9/a/b ile
 * başlamadığı için Zod'un strict `z.string().uuid()` doğrulaması onları REDDEDER. Bu da tahsis/
 * eklenti/admin akışlarında "kaydetmiyordu" bug'larına yol açtı. DB foreign-key gerçek bütünlüğü
 * zaten garanti ettiğinden, uygulama katmanında yalnız "şekil" kontrolü yeterli.
 */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tür-daraltan yardımcı (standalone kontrol için). */
export const gecerliUuid = (s: unknown): s is string => typeof s === "string" && UUID_RE.test(s);

/** Zod şeması — `z.string().uuid()` yerine (lenient). Schema alanı / safeParse / union ile uyumlu. */
export const zUuid = z.string().regex(UUID_RE, "Geçersiz UUID");
