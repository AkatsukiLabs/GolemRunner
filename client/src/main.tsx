import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./global.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered succesfully:', registration);
      })
      .catch(error => {
        console.log('Error registering the Service Worker:', error);
      });
  });
}

