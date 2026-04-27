# CX Fusion — ppi talk PRO AI · Projektstatus

> Letzte Aktualisierung: 25. April 2026  
> Starte IMMER hier bevor du arbeitest — dann CLAUDE.md lesen falls vorhanden.

---

## Projektkontext

**Was ist das?**  
CX Fusion ist eine eigenständige Web-Analytics-App ("ppi talk PRO AI") — NICHT SocialFlow Pro.  
Sie analysiert beliebige Domains mit freien APIs + KI und zeigt strukturierte Web-Intelligence-Reports.

**Verzeichnisse:**
- App-Code: `/Users/mas/DEV/cx-fusion/`
- Kein React Router — State-basiertes Routing in `src/App.jsx`
- Kein Tailwind/CSS — ausschließlich Inline-Styles
- Design-Tokens: `src/constants/colors.js` (C, T, FONT, FONT_DISPLAY, IW)

**Dev starten:**
```bash
# API-Server (Port 8788) — in cx-fusion Verzeichnis starten
/usr/local/bin/node /Users/mas/DEV/cx-fusion/local-server.js &

# Vite Dev-Server (Port 5174) — in cx-fusion Verzeichnis
/usr/local/bin/node /Users/mas/DEV/cx-fusion/node_modules/vite/bin/vite.js --port 5174
```

---

## Datenquellen (alle kostenlos)

| Quelle | Was | Endpoint |
|---|---|---|
| OpenPageRank | PageRank 0–10 | `openpagerank.com/api` |
| Common Crawl CDX | Gecrawlte URLs, Indexseiten | `index.commoncrawl.org/collinfo.json` |
| Wayback CDX | Archiv-Snapshots pro Jahr | `web.archive.org/cdx/...` |
| RDAP/IANA | WHOIS-Daten | `rdap.org/domain/...` |
| DNS-over-HTTPS | DNS-Records | Cloudflare DoH |
| Anthropic Claude | Alle KI-Schätzungen | via SocialFlow Pro Proxy |
| PSI (optional) | PageSpeed Score | `pagespeedinsights.googleapis.com` |

**KI-Proxy:** `https://socialflow-pro.pages.dev/ai` (Fallback wenn kein lokaler Key)  
**Wichtig:** Niemals direkt `api.anthropic.com` aus dem Frontend aufrufen.

---

## Architektur

```
src/
├── App.jsx              # Root, State-Routing (nav: "analyze"|"report"|"dashboard"|...)
├── constants/colors.js  # C, T, FONT, FONT_DISPLAY, IW, CSS
├── context/AppContext.jsx
├── utils/api.js         # analyzeDomain(), fmtNum(), fmtDate(), STORAGE_KEY, REPORTS_KEY
├── pages/
│   ├── AnalyzePage.jsx  # Eingabe + Beispiel-Chips + Analyse-Start
│   ├── DashboardPage.jsx
│   ├── ReportPage.jsx   # ★ HAUPTSEITE — 6-Tab Report
│   └── ...
└── components/
    ├── layout/Sidebar.jsx  # ppi talk Logo + PRO AI Badge
    └── ui/index.jsx        # Card, Btn, Badge, ScoreRing, etc.

local-server.js          # Node.js API-Server Port 8788
```

**Report-Tabs:**
1. `overview` — KI-Zusammenfassung, BigCards (Traffic, Bounce, Performance, ...), KI-Insights
2. `visitors` — Absprungrate-Gauge, Session-Dauer, Scroll-Tiefe, Traffic-Quellen, Geräte, Referrer, Tageszeit-Chart, Themen, Sektionen, Keywords, Geo, Einstiegs-/Absprungseiten
3. `seo` — PageRank, Indexseiten, Domain-Infos, Common Crawl Top-Seiten
4. `performance` — ScoreRings (Perf/Security), TTFB, Security-Header-Check
5. `tech` — Erkannte Technologien (CMS, CDN, Analytics, Frameworks)
6. `history` — Wayback-Snapshots Balkendiagramm, Domain-Alter + -Profil

---

## KI-Prompt (local-server.js ~Zeile 368)

**Schickt:** pagerank, whois, crawl, tech, topPages, archiveTrend  
**Erwartet:** JSON mit folgenden Feldern:

```
trafficEstimate { monthly, confidence, range }
globalRank
category, summary
trafficSources { direct, organic, social, referral, email, paid }
topCountries [{ country, code, share }]
audienceType, audienceProfile
trendSignal, trendReason
behavior {
  bounceRate, avgSessionDuration, pagesPerSession,
  scrollDepth { p25, p50, p75, p100 },
  deviceSplit { mobile, desktop, tablet },
  topKeywords, newVsReturn,
  topEntryPages [{ path, share, label, avgTime }],
  topExitPages [{ path, share, label }],
  topReferrers [{ domain, type, share }],
  topSections [{ path, label, share, avgTime }],
  topTopics [{ topic, share }],
  peakHours [{ hour, relative }]
}
strengths, weaknesses, recommendations
```

**max_tokens:** 3500 | **Modell:** claude-sonnet-4-6

---

## ✅ Implementiert & funktionsfähig (Stand 25.04.2026)

### Core
- [x] Analyse-Orchestrator (parallel: PageRank, Common Crawl, Tech-Check, topPages + sequenziell: WHOIS, Archiv-Trend)
- [x] KI-Insights (Claude via SocialFlow Pro Proxy)
- [x] 6-Tab Report-Layout
- [x] Dashboard mit Letzte-Reports-Liste
- [x] ppi talk Logo + PRO AI Branding

### Übersicht-Tab
- [x] KI-Zusammenfassung
- [x] BigCards: Traffic/Monat, Absprungrate, Session-Dauer, Performance, Sicherheit, Domain-Alter
- [x] Zielgruppe + Trend-Signal
- [x] Stärken / Schwächen / Empfehlungen (3-spaltig)

### Besucher-Tab (zuletzt stark ausgebaut — April 2026)
- [x] Absprungrate Halbkreis-Gauge mit Farbcodierung
- [x] Session-Dauer + Seiten/Besuch
- [x] Scroll-Tiefe (25/50/75/100%)
- [x] Traffic-Quellen (gestapelter Balken)
- [x] Neu vs. Wiederkehrend (Split-Anzeige)
- [x] Geräte-Verteilung (Mobil/Desktop/Tablet SegmentBar)
- [x] Referrer-Quellen (konkrete Domains mit Typ-Badge)
- [x] Tageszeit-Chart (24h Balken, Nacht/Morgen/Mittag/Abend)
- [x] Konsumierte Themen (Tag-Cloud)
- [x] Meistgelesene Sektionen (Ranking + ø Verweildauer)
- [x] Top-Keywords (Ranking)
- [x] Geografische Verteilung (Flags + Balken)
- [x] Top Einstiegsseiten (mit ø Verweildauer)
- [x] Top Absprungseiten
- [x] Common Crawl Realdaten (gecrawlte URLs)

### SEO-Tab
- [x] PageRank (0–10)
- [x] Indexierte Seiten (Common Crawl)
- [x] Domain-Infos (Registrar, Erstellt, Läuft ab, Nameserver, HSTS)
- [x] Top-Seiten Common Crawl

### Performance-Tab
- [x] ScoreRings (Performance + Sicherheit)
- [x] TTFB-Messung
- [x] Security-Header Checkliste (6 Header)
- [x] Bot-Schutz Fallback-Handling

### Technologie-Tab
- [x] Erkannte Technologien (CMS, CDN, Analytics, Frameworks, etc.)

### Historie-Tab
- [x] Wayback Machine Balkendiagramm (2019–2025)
- [x] Domain-Alter + Establishment-Badge

---

## 🔄 Geplant / In Arbeit (SimilarWeb-Inspiration)

### Nächste Schritte — Priorisiert

#### Phase 1: Trend-Deltas & SEO-Metriken (NÄCHSTER SCHRITT)
- [ ] **Delta-Badges** auf BigCards (↑↓ vs. letzter Report, z.B. "+12% vs. vorherige Analyse")
- [ ] **Organische Keywords** — KI-Schätzung Anzahl rankender Keywords
- [ ] **Paid Keywords** — KI-Schätzung bezahlte Keywords
- [ ] **SEO-Wert / Traffic-Kosten** — äquivalenter Werbewert des organischen Traffics (€/Monat)
- [ ] **Paid Traffic** — geschätzte Paid-Klicks/Monat + Kosten

#### Phase 2: Traffic-Verlauf Chart (SimilarWeb-Kern-Feature)
- [ ] **Multi-Line Chart** — Organisch / Bezahlt / Direkt über 8 Monate
- [ ] **Zeitraum-Filter** — 6M / 12M / 24M Buttons
- [ ] **Google Algorithm Update-Marker** — bekannte Core Updates als Referenzlinien
- [ ] Erweiterung im Historie-Tab oder eigener Traffic-Tab

#### Phase 3: AI Overviews Intelligence
- [ ] **AIO-Traffic-Score** — KI-Schätzung wie präsent die Seite in KI-Antworten ist
- [ ] **Erwähnungen** — geschätzte Brand-Mentions
- [ ] **Link-Präsenz** — Backlink-Qualitätsscore

#### Phase 4: History Comparison
- [ ] **Vergleich mit letzter Analyse** — wenn Domain schon analysiert wurde, Delta anzeigen
- [ ] Persistenz: mehrere Reports pro Domain in cxf_reports speichern (aktuell: überschreiben)

#### Phase 5: Wettbewerber-Benchmarking
- [ ] **Competitor-Vergleich** — mehrere Domains nebeneinander (Vergleichen-Seite ausbauen)
- [ ] **Marktpositionierung** — wo steht die Domain vs. Kategorie-Durchschnitt

---

## Bekannte Einschränkungen

| Problem | Ursache | Workaround |
|---|---|---|
| PageRank immer "n/a" | API-Key fehlt (OpenPageRank) | User trägt Key im Admin ein |
| Performance-Score oft "–" | Bot-Schutz blockiert fetch | Klar kommuniziert ("Bot-Schutz") |
| Alle Besucher-Daten KI-geschätzt | Kein Zugang zu echten Analytics | KI-Badge auf allen geschätzten Werten |
| max_tokens 3500 | Proxy-Limit | Kompaktes JSON-Format im Prompt |

---

## Kritische Regeln

- **Kein Tailwind, kein CSS** — ausschließlich Inline-Styles
- **C und T niemals in Komponenten definieren** — immer aus colors.js importieren  
- **KI-Badge** auf allen AI-geschätzten Metriken (KiBadge Komponente)
- **Kein direkter Anthropic-Aufruf aus Frontend** — immer über /ai Proxy
- **console.log verboten** — nur console.error in catch-Blöcken
