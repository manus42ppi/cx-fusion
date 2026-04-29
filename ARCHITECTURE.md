# CX Fusion – Architektur & Entwicklungshandbuch

> **Dieses Dokument ist Pflichtlektüre vor jeder Änderung.**
> Es enthält Architekturregeln, häufige Fehlerquellen und die vollständige Test-Pipeline.

---

## Stack

| Layer | Technologie | Details |
|---|---|---|
| Frontend | React 18 + Vite 6 | SPA, Inline-Styles (kein CSS/Tailwind) |
| Auth | Clerk | Demo-User über `localStorage`, kein JWT-Schutz |
| AI-Proxy | Cloudflare Function `/ai` | Einziger Weg zur Anthropic API |
| KV-Store | Cloudflare KV via `/store` | Clerk-JWT-geschützt; Demo-User: kein KV |
| Deploy | Cloudflare Pages | Auto-Deploy via `git push origin main` |
| Tests | Vitest 4 + JSDOM | 26 Tests in `src/__tests__/` |

---

## Dateistruktur

```
cx-fusion/
├── src/
│   ├── App.jsx                    # Router + React.lazy() Imports
│   ├── main.jsx                   # Vite Entry
│   ├── constants/
│   │   └── colors.js              # C, T, FONT, IW, CSS – NIE in Komponenten definieren
│   ├── context/
│   │   └── AppContext.jsx         # Gesamter App-State
│   ├── utils/                     # Hilfsfunktionen (circuit-breaker, improve, etc.)
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.jsx        # Navigation – NAV_GROUPS mit id:-Strings
│   │   └── ui/index.jsx           # Design-System-Komponenten
│   └── pages/
│       ├── *.jsx                  # Aktive Seiten (alle in App.jsx registriert)
│       └── _drafts/               # Unfertige WIP-Seiten (nicht registriert, nicht deployed)
├── functions/                     # Cloudflare Pages Functions (Route Handlers)
│   ├── ai.js                      # /ai → Anthropic API Proxy (EINZIGE Datei die Anthropic aufrufen darf)
│   ├── analyze.js                 # /analyze
│   ├── schema-validate.js         # /schema-validate
│   └── ...                        # weitere Handlers
├── scripts/
│   └── pre-deploy-check.js        # Automatische Qualitätsprüfung (7 Checks)
├── .github/workflows/ci.yml       # GitHub Actions CI/CD
├── .husky/                        # Git Hooks (pre-commit, pre-push)
└── vite.config.js                 # Build-Config + Test-Config + Dev-Proxy
```

---

## Kritische Architekturregeln

### 1. API-Proxy-Pflicht
Alle KI-Aufrufe MÜSSEN über `${origin}/ai` gehen. NIEMALS `api.anthropic.com` direkt.

```js
// ✅ RICHTIG – in jedem Cloudflare Function Handler:
const origin = new URL(ctx.request.url).origin;
const res = await fetch(`${origin}/ai`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2000, messages: [...] }),
});

// ❌ FALSCH – wird vom pre-deploy-check erkannt und blockiert:
const res = await fetch("https://api.anthropic.com/v1/messages", { ... });
```

**Warum:** Der Cloudflare Function `/ai` enthält den API-Key via `ctx.env.ANTHROPIC_API_KEY`. Der Key ist niemals im Frontend oder in anderen Functions verfügbar.

### 2. React.lazy() für alle Seiten-Importe
Alle Seiten in `App.jsx` MÜSSEN über `React.lazy()` importiert werden.

```js
// ✅ RICHTIG:
const MyPage = lazy(() => import("./pages/MyPage.jsx"));

// ❌ FALSCH – bricht Code-Splitting, lädt alle Seiten auf einmal:
import MyPage from "./pages/MyPage.jsx";
```

### 3. Route + Nav synchron halten
Wenn eine neue Seite hinzugefügt wird, müssen DREI Stellen gleichzeitig aktualisiert werden:
1. `src/App.jsx` – `React.lazy()` Import
2. `src/App.jsx` – `pages`-Objekt im Router (`"route-id": <MyPage />`)
3. `src/components/layout/Sidebar.jsx` – `NAV_GROUPS` Array (`{ id: "route-id", label: "...", icon: ..., desc: "..." }`)

Der `pre-deploy-check` prüft diese Konsistenz automatisch.

### 4. Farb-Tokens niemals in Komponenten definieren
```js
// ✅ RICHTIG – immer aus constants/colors.js importieren:
import { C, T, FONT, IW, CSS } from "../../constants/colors.js";

// ❌ FALSCH – verursacht Konflikte und schwer debugbare Fehler:
const C = { bg: "#1a1a2e", ... }; // in Komponente definiert
```

### 5. Inline-Styles überall
Kein CSS, kein Tailwind, keine CSS Modules. Ausschließlich `style={{ ... }}`.

### 6. Cloudflare Function Handler-Struktur
Jede Function muss `onRequestPost` (oder `onRequestGet` etc.) exportieren.

```js
export async function onRequestPost(ctx) {
  try {
    // AbortController für AI-Calls (verhindert endless hanging):
    const origin = new URL(ctx.request.url).origin;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 55000); // 55s Timeout
    
    const res = await fetch(`${origin}/ai`, { signal: ctrl.signal, ... });
    clearTimeout(timer);
    
    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  }});
}
```

---

## Test-Pipeline

### Schnelle lokale Prüfung (< 5 Sekunden)
```bash
node scripts/pre-deploy-check.js
```

**Was wird geprüft:**
1. Keine direkten `api.anthropic.com`-Aufrufe in functions/ (außer `ai.js`)
2. Alle Sidebar-Nav-IDs haben passende App.jsx-Routen
3. Alle `React.lazy()` Imports zeigen auf existierende Dateien
4. Alle Cloudflare Functions exportieren einen `onRequest*`-Handler
5. Keine abgeschnittenen Dateien (node --check + EOF-Check)
6. `constants/colors.js` exportiert alle Pflicht-Tokens (C, T, FONT, IW, CSS)
7. Keine `console.log()` im Produktionscode (nur Warnung)

### Unit Tests
```bash
npm test
```

Test-Dateien in `src/__tests__/`:
- `circuit-breaker.test.js` – Circuit-Breaker-Logik
- `improve.test.js` – Fehler-Logging (logError, logWarn, logInfo)
- `cors-proxy.test.js` – CORS-Proxy-Validierung
- `improve-page.test.js` – ImprovePage-Komponente

### Vollständiger Pre-Deploy-Check
```bash
npm run predeploy
# entspricht: npm run validate && npm test
```

### Build prüfen
```bash
npm run build
```

---

## Git Hooks (automatisch via Husky)

### pre-commit
Läuft bei jedem `git commit`:
- `node scripts/pre-deploy-check.js` (7 Strukturchecks)

Schnell (<3s), blockiert Commits mit strukturellen Fehlern.

### pre-push
Läuft bei jedem `git push`:
- `node scripts/pre-deploy-check.js`
- `npm test` (alle Unit Tests)
- `npm run build` (Vite Build)

Verhindert, dass defekte Builds auf Cloudflare Pages deployen.

**Notfall-Bypass** (nur wenn wirklich nötig):
```bash
git push --no-verify  # Hooks überspringen
```

---

## GitHub Actions CI

Bei jedem Push und PR auf `main` läuft `.github/workflows/ci.yml`:
1. `npm ci` – Dependencies installieren
2. `node scripts/pre-deploy-check.js` – Strukturchecks
3. `npm test` – Unit Tests
4. `npm run build` – Build-Check

Build-Artefakte werden 7 Tage aufbewahrt (nur main-Branch).

---

## Häufige Fehlerquellen & Lösungen

### Problem: Seite lädt nicht / TDZ-Fehler
**Ursache:** `const variable = x` NACH einem `useMemo`/`useEffect` das auf `variable` zugreift.
```js
// ❌ FALSCH – TDZ (Temporal Dead Zone):
const sorted = useMemo(() => savedReports.slice(0,8), [savedReports]); // savedReports noch nicht definiert!
const savedReports = reports;

// ✅ RICHTIG – Reihenfolge beachten:
const savedReports = reports;
const sorted = useMemo(() => savedReports.slice(0,8), [savedReports]);
```

### Problem: AI-Analyse falsche Kategorie/Zielgruppe
**Ursache:** AI hat keinen echten Seiteninhalt zur Analyse.
**Lösung:** Homepage-Content fetchen und im Prompt als oberste Priorität übergeben:
```js
const homepageData = await fetchHomepageContent(domain);
const hpSection = homepageData
  ? `═══ TATSÄCHLICHER HOMEPAGE-INHALT (höchste Priorität!) ═══\nTitle: ${homepageData.title}\n...`
  : `WARNUNG: Homepage konnte nicht abgerufen werden.`;
```

### Problem: JSON.parse-Fehler bei AI-Antworten
**Ursachen:**
1. AI-Antwort überschreitet `max_tokens` → Response wird mitten im JSON abgeschnitten
2. AI gibt Markdown-Code-Fences zurück (` ```json ... ``` `)

**Lösungen:**
- Großzügige `max_tokens` setzen (4096 statt 2000)
- Keine großen JSON-Objekte in AI-Antwort verlangen (z.B. kein `schemaRaw` mit vollem JSON-LD)
- Robuste `extractJSON()` Funktion verwenden (Brace-Matching statt `JSON.parse` direkt):
```js
function extractJSON(text) {
  if (!text) return null;
  const stripped = text.replace(/^```[\w]*\n?/gm, "").replace(/^```$/gm, "").trim();
  const match = stripped.match(/\{[\s\S]*\}/s);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}
```

### Problem: Versionsnummer zeigt "v2" statt "1.1.X"
**Ursache:** Cloudflare Pages verwendet `--depth 1` Shallow-Clone → `git rev-list --count HEAD` gibt 1 zurück.
**Lösung:** `vite.config.js` nutzt Fallback auf Tage-seit-Projektepoche:
```js
function getVersion() {
  try {
    const count = execSync("git rev-list --count HEAD", ...).trim();
    if (count && /^\d+$/.test(count) && Number(count) > 1) return `1.1.${count}`;
  } catch {}
  const epoch = new Date("2026-01-01").getTime();
  return `1.1.${Math.floor((Date.now() - epoch) / 86_400_000)}`;
}
```

### Problem: Improve-Funktionen hängen endlos
**Ursache:** Direkter Anthropic-API-Aufruf scheitert (kein Key, CORS) oder kein Timeout.
**Lösung:** AbortController mit 55s Timeout + `/ai`-Proxy verwenden (siehe Abschnitt "Cloudflare Function Handler-Struktur").

### Problem: Neue Feature-Seite fehlt in Navigation
**Ursache:** Beim automatischen Generieren wurde nur die Datei erstellt, aber nicht in App.jsx + Sidebar.jsx registriert.
**Lösung:** Pre-deploy-check (Check 2 + 3) erkennt dies. Manuell 3 Stellen synchronisieren (siehe Regel 3).

### Problem: Abgeschnittene Auto-generierte Datei bricht Build
**Ursache:** KI-generierte Dateien werden manchmal mitten im Code abgeschnitten (context limit).
**Lösung:** Pre-deploy-check (Check 5) prüft EOF-Token. Abgeschnittene Dateien werden nach `src/pages/_drafts/` verschoben bis sie fertiggestellt sind.

### Problem: Lucide-Icon-Import fehlt → ReferenceError
**Ursache:** Neues Icon in Sidebar oder Komponente verwendet, aber nicht importiert.
**Erkennung:** Build schlägt fehl mit `ReferenceError: X is not defined`.
**Lösung:** Immer `import { ... } from "lucide-react"` überprüfen wenn neue Icons hinzugefügt werden.

---

## Auto-Versioning

Das App-Build-System (`vite.config.js`) injiziert `__APP_VERSION__` als Build-Konstante.
In der Sidebar angezeigt: `1.1.<build-number>`.

Build-Number-Strategie:
1. `git rev-list --count HEAD` (funktioniert bei Full-Clone)
2. Fallback: Tage seit 2026-01-01 (funktioniert bei Cloudflare Shallow-Clone)

---

## KI-Analyse-Architektur (`analyze.js`)

Der Analyse-Flow ist zweistufig:

```
1. Parallele Datenabrufe:
   - PageSpeed Insights (PSI)
   - OpenPageRank
   - WHOIS
   - Common Crawl
   - Technik-Stack (Crawl)
   - Homepage-Content-Fetch (EIGENER Abruf, regex-basiert)

2. Einzelner AI-Call mit allem gebündelten Kontext:
   - Homepage-Inhalt hat HÖCHSTE Priorität im Prompt
   - AI muss Kategorie UND Zielgruppe aus echtem Inhalt ableiten
   - dataQuality-Felder geben Konfidenz-Niveau zurück
```

Der Homepage-Content-Fetch extrahiert ohne DOM-Parser:
- `<title>`, `<meta name="description">`, Open-Graph-Tags
- `<h1>`, `<h2>` (erste 5 jeweils)
- `<script type="application/ld+json">` Blöcke

---

## Deployment

```bash
# Normaler Workflow:
git add -p                    # Nur relevante Änderungen stagen
git commit -m "Beschreibung"  # pre-commit Hook läuft automatisch
git push origin main          # pre-push Hook läuft automatisch → CI/CD startet
```

Cloudflare Pages deployed automatisch nach erfolgreichem Push (~30 Sekunden).

Die GitHub Actions CI läuft parallel zum Cloudflare-Deployment und liefert zusätzliche Validierung.
