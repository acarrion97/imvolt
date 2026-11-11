import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig, loadEnv } from "vite";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localCertPath = path.resolve(__dirname, ".cert/localhost.pem");
const localKeyPath = path.resolve(__dirname, ".cert/localhost-key.pem");
const hasTrustedLocalCert = fs.existsSync(localCertPath) && fs.existsSync(localKeyPath);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const publicMetaEnv = {
    META_APP_ID: env.META_APP_ID || env.VITE_META_APP_ID || "",
    META_LOGIN_CONFIG_ID: env.META_LOGIN_CONFIG_ID || env.VITE_META_LOGIN_CONFIG_ID || "",
    META_GRAPH_API_VERSION: env.META_GRAPH_API_VERSION || env.VITE_META_GRAPH_API_VERSION || "",
  };

  return {
    plugins: [react(), ...(hasTrustedLocalCert ? [] : [basicSsl()])],
    server: {
      ...(hasTrustedLocalCert
        ? {
            https: {
              cert: fs.readFileSync(localCertPath),
              key: fs.readFileSync(localKeyPath),
            },
          }
        : {}),
      allowedHosts: ["mothproof-manlike-vocalist.ngrok-free.dev"],
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
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
