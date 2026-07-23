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
        name: "Fut-TV",
        short_name: "FutTV",
        description: "Brasileirão, Libertadores e Copa do Mundo 2026",
        theme_color: "#19AE47",
        background_color: "#FFFFFF",
        display: "standalone",
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
