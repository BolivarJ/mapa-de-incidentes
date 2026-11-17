import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const sitio = process.env.NEXT_PUBLIC_SITIO_URL ?? "http://localhost:3000";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/gestion"] },
    sitemap: `${sitio}/sitemap.xml`,
  };
}
