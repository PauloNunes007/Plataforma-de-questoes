import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${APP_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
