import "./i18n";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

// Restore custom app icon from localStorage
const savedIcon192 = localStorage.getItem('custom-app-icon-192');
const savedIcon512 = localStorage.getItem('custom-app-icon-512');
if (savedIcon192 && savedIcon512) {
  const link = document.querySelector('link[rel="manifest"]');
  if (link) {
    fetch((link as HTMLLinkElement).href)
      .then(r => r.json())
      .then(manifest => {
        manifest.icons = [
          { src: savedIcon192, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: savedIcon512, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ];
        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        (link as HTMLLinkElement).href = URL.createObjectURL(blob);
      })
      .catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
);
