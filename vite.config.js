import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";

// Auto-version: 1.1.<commit-count>
// Strategy:
//  1. Try git rev-list --count HEAD directly (works on full local clones)
//  2. If count = 1 (Cloudflare shallow clone), run git fetch --unshallow then retry
//  3. Final fallback: hours since 2026-01-01 (much more granular than days,
//     changes ~24× more often so deploys on the same day still get unique numbers)
function getVersion() {
  // Helper: try to get commit count
  function commitCount() {
    const raw = execSync("git rev-list --count HEAD", { encoding: "utf8", timeout: 5000 }).trim();
    return /^\d+$/.test(raw) ? Number(raw) : 0;
  }

  try {
    const n = commitCount();
    if (n > 1) return `1.1.${n}`;

    // n === 1 → Cloudflare shallow clone. Unshallow to get the real count.
    try {
      execSync("git fetch --unshallow", { timeout: 90000, stdio: "ignore" });
      const n2 = commitCount();
      if (n2 > 1) return `1.1.${n2}`;
    } catch { /* unshallow failed (e.g. already full, or offline) */ }

    // If still 1 after unshallow attempt, fall through to hourly fallback
  } catch { /* no git at all */ }

  // Hourly fallback — increments ~24× per day so same-day builds get distinct numbers
  const epoch = new Date("2026-01-01").getTime();
  const hours = Math.floor((Date.now() - epoch) / 3_600_000);
  return `1.1.${hours}`;
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
