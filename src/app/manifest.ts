import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Focus Calendar",
    short_name: "Focus",
    description: "Deadline-first schedule management",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fb",
    theme_color: "#ffffff"
  };
}
