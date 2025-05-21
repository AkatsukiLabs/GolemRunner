import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";

export default defineConfig(({ mode }) => ({
   server: {
    port: 3001,
       https: {
         key: fs.readFileSync("mkcert+1-key.pem"), // Path to private key file
         cert: fs.readFileSync("mkcert+1.pem"),   // Path to certificate file
       },
   },
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: mode === 'development'
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
      },
      includeAssets: [
        "icons/logo.png",
        "screenshots/loading.png",
        "screenshots/home.png",
        "screenshots/store.png",
        "screenshots/leaderboard.png"
      ],
      manifest: {
        name: "Golem Runner",
        short_name: "Golem",
        description:
          "A captivating endless runner where elemental golems dash through magical realms. This game combines fun gameplay with powerful blockchain technology!",
        start_url: "/",
        display: "standalone",
        lang: "en-US",
        theme_color: "#000000",
        background_color: "#000000",
        orientation: "any",
        icons: [
          {
            src: "/icons/logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          }
        ],
        screenshots: [
          {
            src: "/screenshots/loading.png",
            sizes: "822x1664",
            type: "image/png",
          },
          {
            src: "/screenshots/home.png",
            sizes: "822x1664",
            type: "image/png",
          },
          {
            src: "/screenshots/store.png",
            sizes: "822x1664",
            type: "image/png",
          },
          {
            src: "/screenshots/leaderboard.png",
            sizes: "822x1664",
            type: "image/png",
          }
        ],
        shortcuts: [
          {
            name: "Play Now",
            short_name: "Play",
            description: "Start a new run with your golem.",
            url: "/play"
          }
        ],
      }
    })
  ],
}));
