import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["soccer-ball.png"],
      manifest: {
        name: "Cadê meu time?",
        short_name: "CMT",
        description: "Brasileirão, Libertadores, Copa do Brasil e Sulamericana: onde assistir, placar ao vivo e classificações.",
        theme_color: "#111827",
        background_color: "#FFFFFF",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "soccer-ball.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "soccer-ball.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
