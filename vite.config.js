import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";

// Auto-version: 1.1.<build-number>
// build-number = days since 2026-01-01 (reliable on Cloudflare Pages shallow clones)
// Falls back to git commit count if available for finer granularity.
function getVersion() {
  // Try git commit count first (works when full clone is available)
  try {
    const count = execSync("git rev-list --count HEAD", { encoding: "utf8", timeout: 3000 }).trim();
    if (count && /^\d+$/.test(count) && Number(count) > 1) {
      return `1.1.${count}`;
    }
  } catch { /* shallow clone or no git */ }

  // Fallback: days since project epoch — always works, always increases
  const epoch = new Date("2026-01-01").getTime();
  const days  = Math.floor((Date.now() - epoch) / 86_400_000);
  return `1.1.${days}`;
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(getVersion()),
  },
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
      "/schema-validate": "http://localhost:8788",
    },
  },
});
