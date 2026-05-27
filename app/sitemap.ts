import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { MINISTERIES } from "@/lib/ministeries";

export default function sitemap(): MetadataRoute.Sitemap {
  const nu = new Date();
  const vast: { pad: string; prio: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] =
    [
      { pad: "/", prio: 1, freq: "daily" },
      { pad: "/migratiepact", prio: 0.9, freq: "weekly" },
      { pad: "/proces", prio: 0.6, freq: "monthly" },
      { pad: "/over", prio: 0.5, freq: "monthly" },
      { pad: "/contact", prio: 0.4, freq: "yearly" },
      { pad: "/steun", prio: 0.5, freq: "monthly" },
      { pad: "/privacy", prio: 0.3, freq: "yearly" },
    ];

  const ministeries = MINISTERIES.map((m) => ({
    pad: `/ministerie/${m.slug}`,
    prio: 0.7,
    freq: "weekly" as const,
  }));

  return [...vast, ...ministeries].map((r) => ({
    url: `${SITE_URL}${r.pad}`,
    lastModified: nu,
    changeFrequency: r.freq,
    priority: r.prio,
  }));
}
