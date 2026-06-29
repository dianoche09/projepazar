import type { MetadataRoute } from "next";

const SITE = "https://projepazar.vercel.app";

/** Yalnız herkese açık (indexlenebilir) sayfalar — kapalı-devre ağ; panel route'ları yok. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/kullanim-kosullari`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/gizlilik`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/kvkk-aydinlatma`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
