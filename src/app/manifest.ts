import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Focus Calendar",
    short_name: "Focus",
    description: "지금 해야 할 한 가지를 분명하게 보여주는 우선순위 캘린더",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#ffffff"
  };
}
