import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import path from "path";

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  const isLocalHttps = process.env.VITE_LOCAL_HTTPS === 'true';

  // Conditionally load HTTPS certs in development
  const getHttpsConfig = () => {
    if (!isDev || !isLocalHttps) return {};

    const keyPath = path.resolve('./mkcert+1-key.pem');
    const certPath = path.resolve('./mkcert+1.pem');

    try {
      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        return {
          https: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          },
        };
      }
    } catch (err) {
      console.warn('⚠️ Error reading HTTPS certificates. Falling back to HTTP.');
    }

    return {};
  };

  return {
    server: {
      port: 3001,
      ...getHttpsConfig(),
      ...(isDev && {
        host: true,
        cors: true,
      }),
    },

    define: {
      global: 'globalThis',
    },

    optimizeDeps: {
      include: ['buffer'],
    },

    plugins: [
      react(),
      wasm(),
      topLevelAwait(),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: isDev,
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        includeAssets: [
          "icons/logo.png",
          "screenshots/loading.png",
          "screenshots/home.png",
          "screenshots/store.png",
          "screenshots/leaderboard.png",
        ],
        manifest: {
          name: "Golem Runner",
          short_name: "Golem",
          description: "A captivating endless runner where elemental golems dash through magical realms. This game combines fun gameplay with powerful blockchain technology!",
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
              purpose: "any maskable",
            },
            {
              src: "/icons/logo.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
          ],
          screenshots: [
            { src: "/screenshots/loading.png", sizes: "822x1664", type: "image/png" },
            { src: "/screenshots/home.png",   sizes: "822x1664", type: "image/png" },
            { src: "/screenshots/store.png",  sizes: "822x1664", type: "image/png" },
            { src: "/screenshots/leaderboard.png", sizes: "822x1664", type: "image/png" },
          ],
          shortcuts: [
            {
              name: "Play Now",
              short_name: "Play",
              description: "Start a new run with your golem.",
              url: "/play",
            },
          ],
        },
      }),
    ],
  };
});
