import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "応募者・採用進捗ボード",
    short_name: "みなと採用",
    description: "応募者を待たせない、小さな採用チームのボード",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f0",
    theme_color: "#243c47",
    lang: "ja",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
