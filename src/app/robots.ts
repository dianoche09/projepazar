import type { MetadataRoute } from "next";

const SITE = "https://projepazar.vercel.app";

/**
 * Kapalı-devre B2B ağ: yalnız landing + yasal sayfalar indexlenir.
 * Panel/havuz/api route'ları (özel veri) disallow. AI crawler'lar landing için açık.
 */
export default function robots(): MetadataRoute.Robots {
  const gizli = ["/havuz", "/uretici", "/admin", "/api", "/hesap-bekliyor", "/p/", "/tasarim", "/login", "/kayit"];
  const aiCrawlers = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot",
    "Google-Extended",
    "Applebot-Extended",
    "Amazonbot",
    "Bytespider",
    "CCBot",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: gizli },
      // AI arama motorları landing içeriğini okuyabilsin (GEO görünürlüğü)
      { userAgent: aiCrawlers, allow: "/", disallow: gizli },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
