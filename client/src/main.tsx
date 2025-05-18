import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Dojo & Starknet
import { init } from "@dojoengine/sdk";
import { DojoSdkProvider } from "@dojoengine/sdk/react";
import { dojoConfig } from "./dojo/dojoConfig";
import type { SchemaType } from "./dojo/bindings";
import { setupWorld } from "./dojo/contracts.gen";
import StarknetProvider from "./dojo/starknet-provider";

// App Entry
import Main from "../src/app/App";

// Styles
import "./global.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// PWA Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { type: "module" })
      .then((registration) => {
        console.log("ServiceWorker registration successful:", registration);
      })
      .catch((error) => {
        console.log("ServiceWorker registration failed:", error);
      });
  });
}

// Init Dojo
async function main() {
  const sdk = await init<SchemaType>({
    client: {
      toriiUrl: dojoConfig.toriiUrl,
      relayUrl: dojoConfig.relayUrl,
      worldAddress: dojoConfig.manifest.world.address,
    },
    domain: {
      name: "GolemRunner",
      version: "1.0",
      chainId: "KATANA",
      revision: "1",
    },
  });

  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element not found");

  createRoot(rootElement).render(
    <StrictMode>
      <DojoSdkProvider sdk={sdk} dojoConfig={dojoConfig} clientFn={setupWorld}>
        <StarknetProvider>
          <Main />
        </StarknetProvider>
      </DojoSdkProvider>
    </StrictMode>
  );
}

main().catch((error) => {
  console.error("Failed to initialize the application:", error);
});
