import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET || "http://127.0.0.1:8001";
  const apiBaseUrl = String(env.VITE_API_BASE_URL || "").trim();
  const shouldUseProxy =
    !apiBaseUrl || apiBaseUrl === "/api" || apiBaseUrl === "/api/";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: shouldUseProxy
        ? {
            "/api": {
              target: devProxyTarget,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
  };
});
