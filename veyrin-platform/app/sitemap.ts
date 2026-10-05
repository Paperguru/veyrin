import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/courses", "/interview", "/coding", "/videos", "/about", "/login"].map(path => ({ url: `https://veyrin.in${path}`, lastModified: new Date() }));
}
