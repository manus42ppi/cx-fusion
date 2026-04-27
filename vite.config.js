import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.js"],
    include: ["src/__tests__/**/*.test.{js,jsx}"],
  },
  server: {
    port: 5174,
    proxy: {
      "/pagespeed": "http://localhost:8788",
      "/pagerank": "http://localhost:8788",
      "/whois": "http://localhost:8788",
      "/crawl": "http://localhost:8788",
      "/scan": "http://localhost:8788",
      "/tech": "http://localhost:8788",
      "/ai": "http://localhost:8788",
      "/rss": "http://localhost:8788",
      "/content": "http://localhost:8788",
      "/analyze": "http://localhost:8788",
      "/improve-log": "http://localhost:8788",
      "/improve-analyze": "http://localhost:8788",
      "/improve-status": "http://localhost:8788",
      "/improve-research": "http://localhost:8788",
      "/improve-apply": "http://localhost:8788",
      "/broken-links": "http://localhost:8788",
      "/features-manifest": "http://localhost:8788",
    },
  },
});
