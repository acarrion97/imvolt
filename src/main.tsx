import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/presentation/theme/theme-provider";
import { createQueryClient } from "@/infrastructure/cache/queryClient";
import { setupCachePersistence } from "@/infrastructure/cache/persistQueryClient";
import { App } from "./App";
import "./index.css";

if (import.meta.env.PROD && window.location.protocol !== "https:") {
  const secureUrl = new URL(window.location.href);
  secureUrl.protocol = "https:";
  window.location.replace(secureUrl.toString());
} else {
  const queryClient = createQueryClient();

  // Persiste en IndexedDB solo los dominios habilitados en cache/cachePolicy.ts.
  setupCachePersistence(queryClient);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
