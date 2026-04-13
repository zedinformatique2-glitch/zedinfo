import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZED INFORMATIQUE",
    short_name: "ZED INFO",
    description:
      "Solutions informatiques haute performance en Algérie. PC gaming, composants, configurateur sur mesure.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0035d0",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
