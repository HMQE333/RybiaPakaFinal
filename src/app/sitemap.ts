import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = [
    { path: "/", priority: 1 },
    { path: "/forum", priority: 0.9 },
    { path: "/galeria", priority: 0.8 },
    { path: "/dyskusje", priority: 0.7 },
    { path: "/informacje", priority: 0.6 },
    { path: "/kontakt", priority: 0.6 },
    { path: "/faq", priority: 0.5 },
    { path: "/polityka-prywatnosci", priority: 0.4 },
    { path: "/regulamin", priority: 0.4 },
    { path: "/zglos-problem", priority: 0.5 },
    { path: "/tipply", priority: 0.4 },
  ];

  return routes.map((route) => ({
    url: new URL(route.path, SITE_URL).toString(),
    lastModified: now,
    changeFrequency: "weekly",
    priority: route.priority,
  }));
}
