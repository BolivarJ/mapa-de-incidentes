import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const sitio = process.env.NEXT_PUBLIC_SITIO_URL ?? "http://localhost:3000";
  return [
    { url: `${sitio}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${sitio}/reportar`, priority: 0.6 },
  ];
}
