import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Magie Klayn",
    short_name: "Magie Klayn",
    description: "Parfums de luxe livrés en Algérie — Oran, Alger et au-delà.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#a3172c",
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
