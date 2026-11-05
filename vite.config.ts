import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const publicMetaEnv = {
    META_APP_ID: env.META_APP_ID || env.VITE_META_APP_ID || "",
    META_LOGIN_CONFIG_ID: env.META_LOGIN_CONFIG_ID || env.VITE_META_LOGIN_CONFIG_ID || "",
    META_GRAPH_API_VERSION: env.META_GRAPH_API_VERSION || env.VITE_META_GRAPH_API_VERSION || "",
  };

  return {
    plugins: [react()],
    define: Object.fromEntries(
      Object.entries(publicMetaEnv).map(([key, value]) => [
        `import.meta.env.${key}`,
        JSON.stringify(value),
      ]),
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
