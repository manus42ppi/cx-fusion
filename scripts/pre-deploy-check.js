#!/usr/bin/env node
/**
 * pre-deploy-check.js
 * ───────────────────
 * Validates the CX Fusion codebase before every build/deploy.
 * Run via: node scripts/pre-deploy-check.js
 *
 * Checks performed:
 *  1. No direct calls to api.anthropic.com in functions/ (except ai.js which IS the proxy)
 *  2. Every Nav item in Sidebar.jsx has a matching route in App.jsx
 *  3. Every React.lazy() import in App.jsx points to an existing file
 *  4. Every Cloudflare Function exports onRequestPost (or similar)
 *  5. No files end mid-function (truncation guard – unbalanced braces)
 *  6. All required constants are exported from constants/colors.js
 *  7. No console.log() left in production source files (warnings only)
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";

const ROOT = resolve(new URL(".", import.meta.url).pathname, "..");
const SRC  = join(ROOT, "src");
const FUNC = join(ROOT, "functions");

let errors   = 0;
let warnings = 0;

function pad(n) { return Math.max(0, n); }
function pass(msg)  { console.log(`  ✅  ${msg}`); }
function fail(msg)  { console.error(`  ❌  ${msg}`); errors++; }
function warn(msg)  { console.warn(`  ⚠️   ${msg}`); warnings++; }
function section(t) { console.log(`\n── ${t} ${"─".repeat(pad(48 - t.length))}`); }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read(path) {
  try { return readFileSync(path, "utf8"); }
  catch { return null; }
}

function jsFiles(dir) {
  try {
    return readdirSync(dir)
      .filter(f => (f.endsWith(".js") || f.endsWith(".jsx")) && !f.endsWith(".bak"))
      .map(f => join(dir, f));
  } catch { return []; }
}

/** Return non-comment lines of source that match a regex. */
function matchNonComment(src, re) {
  return src.split("\n").filter(line => {
    const t = line.trimStart();
    return !t.startsWith("//") && !t.startsWith("*") && re.test(line);
  });
}

// ─── 1. No direct Anthropic API calls ─────────────────────────────────────────
section("Check 1 – No direct api.anthropic.com calls");

// ai.js is the proxy itself — it legitimately calls Anthropic
const PROXY_WHITELIST = new Set(["ai.js"]);

const funcFiles = jsFiles(FUNC);
let directCallFound = false;
for (const f of funcFiles) {
  const name = f.split("/").pop();
  if (PROXY_WHITELIST.has(name)) continue;
  const src = read(f);
  if (!src) continue;
  const hits = matchNonComment(src, /api\.anthropic\.com/);
  if (hits.length > 0) {
    fail(`${name} calls api.anthropic.com directly — use the /ai proxy instead`);
    directCallFound = true;
  }
}
if (!directCallFound) pass("No direct Anthropic API calls found (ai.js proxy excluded)");

// ─── 2. Nav items vs Routes consistency ───────────────────────────────────────
section("Check 2 – Sidebar nav IDs match App.jsx routes");

const sidebarSrc = read(join(SRC, "components/layout/Sidebar.jsx")) || "";
const appSrc     = read(join(SRC, "App.jsx")) || "";

// Extract nav item IDs from Sidebar: { id: "some-id", ...
const navIdMatches = [...sidebarSrc.matchAll(/\bid:\s*["']([^"']+)["']/g)];
const navIds = navIdMatches.map(m => m[1]);

// Extract routes from App.jsx pages object:
// Handles both quoted keys ("analyze": ...) and unquoted keys (analyze: ...)
const routeMatches = [
  ...[...appSrc.matchAll(/["']([^"'\s]+)["']\s*:\s*</g)].map(m => m[1]),
  ...[...appSrc.matchAll(/^\s{4}(\w[\w-]*)\s*:\s*</gm)].map(m => m[1]),
];
const routeIds = [...new Set(routeMatches)];

let navMismatch = false;
for (const id of navIds) {
  if (id === "dashboard") continue; // default fallback in App.jsx
  if (!routeIds.includes(id)) {
    fail(`Nav item "${id}" in Sidebar.jsx has no matching route in App.jsx`);
    navMismatch = true;
  }
}
for (const id of routeIds) {
  if (!navIds.includes(id) && id !== "report") {
    warn(`Route "${id}" in App.jsx has no sidebar nav item (may be fine — navigated to programmatically)`);
  }
}
if (!navMismatch) pass(`All ${navIds.length} nav items have matching routes`);

// ─── 3. Lazy imports point to existing files ───────────────────────────────────
section("Check 3 – React.lazy() imports resolve to existing files");

const lazyMatches = [...appSrc.matchAll(/lazy\(\s*\(\)\s*=>\s*import\s*\(\s*["']([^"']+)["']\s*\)\s*\)/g)];
let missingImport = false;
for (const [, importPath] of lazyMatches) {
  const base = importPath.startsWith("./") ? join(SRC, importPath.slice(2)) : join(SRC, importPath);
  const candidates = [base, base + ".jsx", base + ".js"];
  if (!candidates.some(c => existsSync(c))) {
    fail(`Lazy import "${importPath}" in App.jsx → file not found`);
    missingImport = true;
  }
}
if (!missingImport) pass(`All ${lazyMatches.length} lazy imports resolve to existing files`);

// ─── 4. Functions export required handler ─────────────────────────────────────
section("Check 4 – Cloudflare Functions export a request handler");

const HANDLER_RE = /export\s+async\s+function\s+onRequest(Post|Get|Put|Delete|Options|Patch)/;
// Files that are utility modules, not route handlers
const NON_HANDLER = new Set(["circuit-breaker.js", "cors-proxy.js"]);

let missingExport = false;
for (const f of funcFiles) {
  const name = f.split("/").pop();
  if (NON_HANDLER.has(name)) continue;
  const src = read(f);
  if (!src) continue;
  if (!HANDLER_RE.test(src)) {
    fail(`${name} has no onRequest* export — not a valid Cloudflare Function?`);
    missingExport = true;
  }
}
if (!missingExport) pass(`All ${funcFiles.length - NON_HANDLER.size} function files export a request handler`);

// ─── 5. Truncation guard ──────────────────────────────────────────────────────
section("Check 5 – Source files are not truncated");

// For plain .js files (Cloudflare Functions): use node --check (real syntax check)
let truncated = false;
let checkedCount = 0;
for (const f of funcFiles) {
  const name = f.split("/").pop();
  if (NON_HANDLER.has(name)) continue;
  try {
    execSync(`node --check "${f}"`, { encoding: "utf8", timeout: 5000, stdio: "pipe" });
    checkedCount++;
  } catch (e) {
    const msg = (e.stderr || e.message || "").split("\n")[0];
    fail(`${name} failed syntax check: ${msg}`);
    truncated = true;
  }
}
pass(`${checkedCount} Cloudflare Functions passed node --check`);

// For .jsx pages/components REFERENCED in App.jsx: check the file ends with "}"
// This catches auto-generated files that were truncated mid-JSX before connecting them.
// Draft pages in src/pages/_drafts/ are excluded (unfinished work, not yet connected).
const referencedImports = [...appSrc.matchAll(/lazy\(\s*\(\)\s*=>\s*import\s*\(\s*["']([^"']+)["']\s*\)\s*\)/g)]
  .map(([, p]) => {
    const base = p.startsWith("./") ? join(SRC, p.slice(2)) : join(SRC, p);
    const candidates = [base, base + ".jsx", base + ".js"];
    return candidates.find(c => existsSync(c));
  })
  .filter(Boolean);

// Also always check core files
const coreFiles = [
  join(SRC, "App.jsx"),
  join(SRC, "components/layout/Sidebar.jsx"),
  join(SRC, "context/AppContext.jsx"),
  ...jsFiles(join(SRC, "utils")),
  ...jsFiles(join(SRC, "constants")),
];

const activeJsxFiles = [...new Set([...referencedImports, ...coreFiles])];
let jsxTruncated = false;
for (const f of activeJsxFiles) {
  if (!f || !existsSync(f)) continue;
  const src = read(f);
  if (!src || src.trim().length < 100) continue;
  const lastChar = src.trimEnd().slice(-1);
  if (lastChar !== "}" && lastChar !== ";") {
    fail(`${f.replace(ROOT + "/", "")} doesn't end with "}" or ";" — likely truncated (ends: ...${JSON.stringify(src.trimEnd().slice(-30))})`);
    jsxTruncated = true;
  }
}
if (!jsxTruncated) pass(`All ${activeJsxFiles.length} active source files end with a valid closing token`);

// ─── 6. Required color constants exported ─────────────────────────────────────
section("Check 6 – colors.js exports required tokens");

const colorsSrc = read(join(SRC, "constants/colors.js")) || "";
const REQUIRED = ["C", "T", "FONT", "IW", "CSS"];
let missingColor = false;
for (const exp of REQUIRED) {
  const re = new RegExp(`\\bexport\\b[^;\\n]*\\b${exp}\\b`);
  if (!re.test(colorsSrc)) {
    fail(`constants/colors.js does not export "${exp}"`);
    missingColor = true;
  }
}
if (!missingColor) pass(`colors.js exports all required tokens: ${REQUIRED.join(", ")}`);

// ─── 7. No console.log in src (warning only) ──────────────────────────────────
section("Check 7 – No console.log() in production source");

const srcFilesOnly = [
  ...jsFiles(SRC),
  ...jsFiles(join(SRC, "pages")),
  ...jsFiles(join(SRC, "components")),
  ...jsFiles(join(SRC, "components/layout")),
  ...jsFiles(join(SRC, "utils")),
  ...jsFiles(join(SRC, "context")),
];
let logCount = 0;
for (const f of srcFilesOnly) {
  const src = read(f);
  if (!src) continue;
  src.split("\n").forEach((line, i) => {
    if (/^\s*(\/\/|\/\*)/.test(line)) return;
    if (/console\.log\(/.test(line)) {
      warn(`console.log at ${f.replace(ROOT + "/", "")}:${i + 1}`);
      logCount++;
    }
  });
}
if (logCount === 0) pass("No console.log() found in source files");

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(55));
if (errors === 0 && warnings === 0) {
  console.log("✅  All checks passed — safe to deploy");
  process.exit(0);
} else if (errors === 0) {
  console.log(`✅  No blocking errors | ⚠️  ${warnings} warning(s) — review before deploying`);
  process.exit(0);
} else {
  console.error(`❌  ${errors} error(s), ${warnings} warning(s) — FIX before deploying`);
  process.exit(1);
}
