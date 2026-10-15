import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/presentation/theme/theme-provider";
import { createQueryClient } from "@/infrastructure/cache/queryClient";
import { setupCachePersistence } from "@/infrastructure/cache/persistQueryClient";
import { App } from "./App";
import "./index.css";

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
