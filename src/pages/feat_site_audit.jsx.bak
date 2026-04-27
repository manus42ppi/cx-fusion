import React, { useState, useEffect, useRef, useCallback } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import {
  Globe,
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  X,
  Download,
  Clock,
  Link,
  Image,
  FileText,
  Shield,
  Zap,
  BarChart2,
  List,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Code,
  Filter,
  ArrowUpDown,
  Calendar,
  Play,
  Pause,
  ChevronLeft,
} from "lucide-react";

const SEVERITY = {
  critical: { label: "Critical", color: "#EF4444", bg: "#FEF2F2", icon: AlertCircle },
  warning: { label: "Warning", color: "#F59E0B", bg: "#FFFBEB", icon: AlertTriangle },
  info: { label: "Info", color: "#3B82F6", bg: "#EFF6FF", icon: Info },
};

const CATEGORIES = [
  { id: "all", label: "Alle", icon: List },
  { id: "onpage", label: "On-Page", icon: FileText },
  { id: "technical", label: "Technisch", icon: Shield },
  { id: "performance", label: "Performance", icon: Zap },
  { id: "links", label: "Links", icon: Link },
  { id: "structured", label: "Strukturierte Daten", icon: Code },
  { id: "content", label: "Content", icon: BarChart2 },
];

const MOCK_ISSUES = [
  { id: 1, url: "/produkte", type: "Fehlender Title-Tag", category: "onpage", severity: "critical", details: "Seite hat keinen <title>-Tag", fix: null },
  { id: 2, url: "/ueber-uns", type: "Doppelte Meta-Description", category: "onpage", severity: "critical", details: "Identisch mit /kontakt", fix: null },
  { id: 3, url: "/blog/seo-tipps", type: "Fehlender Alt-Text", category: "onpage", severity: "warning", details: "3 Bilder ohne alt-Attribut", fix: null },
  { id: 4, url: "/shop", type: "H1-Hierarchie-Fehler", category: "onpage", severity: "warning", details: "Mehrere H1-Tags gefunden (3)", fix: null },
  { id: 5, url: "/datenschutz", type: "HTTP statt HTTPS", category: "technical", severity: "critical", details: "Seite liefert über HTTP aus", fix: null },
  { id: 6, url: "/impressum", type: "Fehlender Canonical-Tag", category: "technical", severity: "warning", details: "Kein <link rel='canonical'>", fix: null },
  { id: 7, url: "/alte-seite", type: "Redirect-Kette", category: "technical", severity: "warning", details: "301 → 302 → Ziel (3 Hops)", fix: null },
  { id: 8, url: "/produkte/item-1", type: "Langsame Ladezeit", category: "performance", severity: "warning", details: "4.2s TTFB gemessen", fix: null },
  { id: 9, url: "/blog", type: "Broken Internal Link", category: "links", severity: "critical", details: "Link zu /blog/geloescht-123 (404)", fix: null },
  { id: 10, url: "/", type: "Fehlende Schema.org-Daten", category: "structured", severity: "info", details: "Kein Organization-Markup gefunden", fix: null },
  { id: 11, url: "/produkte/item-2", type: "Dünner Content", category: "content", severity: "info", details: "Nur 87 Wörter auf der Seite", fix: null },
  { id: 12, url: "/sitemap.xml", type: "Sitemap-Fehler", category: "technical", severity: "warning", details: "14 URLs nicht erreichbar", fix: null },
];

const MOCK_HISTORY = [
  { id: 1, date: "2024-01-15", score: 62, issues: { critical: 8, warning: 14, info: 6 }, urls: 127 },
  { id: 2, date: "2024-02-01", score: 71, issues: { critical: 5, warning: 11, info: 7 }, urls: 134 },
  { id: 3, date: "2024-02-20", score: 68, issues: { critical: 6, warning: 12, info: 5 }, urls: 131 },
  { id: 4, date: "2024-03-05", score: 78, issues: { critical: 3, warning: 9, info: 8 }, urls: 142 },
];

function DonutChart({ critical, warning, info, score }) {
  const total = critical + warning + info || 1;
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circ = 2 * Math.PI * r;
  const critPct = (critical / total) * circ;
  const warnPct = (warning / total) * circ;
  const infoPct = (info / total) * circ;
  const gap = 2;

  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={14} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#EF4444" strokeWidth={14}
        strokeDasharray={`${critPct - gap} ${circ - critPct + gap}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="butt"
      />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#F59E0B" strokeWidth={14}
        strokeDasharray={`${warnPct - gap} ${circ - warnPct + gap}`}
        strokeDashoffset={circ / 4 - critPct}
        strokeLinecap="butt"
      />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#3B82F6" strokeWidth={14}
        strokeDasharray={`${infoPct - gap} ${circ - infoPct + gap}`}
        strokeDashoffset={circ / 4 - critPct - warnPct}
        strokeLinecap="butt"
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={22} fontWeight={700} fill={T.primary} fontFamily={FONT_DISPLAY}>
        {score}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill={T.secondary} fontFamily={FONT}>
        Score
      </text>
    </svg>
  );
}

function LineChart({ data }) {
  if (!data || data.length < 2) return null;
  const w = 260;
  const h = 70;
  const pad = 10;
  const scores = data.map(d => d.score);
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const xStep = (w - pad * 2) / (data.length - 1);
  const yScale = (s) => h - pad - ((s - min) / (max - min)) * (h - pad * 2);
  const points = data.map((d, i) => `${pad + i * xStep},${yScale(d.score)}`).join(" ");

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={C.accent}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={pad + i * xStep}
          cy={yScale(d.score)}
          r={4}
          fill={C.accent}
          stroke={C.bg}
          strokeWidth={2}
        />
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={pad + i * xStep}
          y={yScale(d.score) - 8}
          textAnchor="middle"
          fontSize={9}
          fill={T.secondary}
          fontFamily={FONT}
        >
          {d.score}
        </text>
      ))}
    </svg>
  );
}

export default function SiteAudit() {
  const { goNav } = useApp();

  const [phase, setPhase] = useState("config"); // config | crawling | results
  const [domain, setDomain] = useState("");
  const [depth, setDepth] = useState(2);
  const [maxUrls, setMaxUrls] = useState(250);
  const [authUser, setAuthUser] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  const [crawlProgress, setCrawlProgress] = useState(0);
  const [crawledUrls, setCrawledUrls] = useState(0);
  const [urlsPerSec, setUrlsPerSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [issues, setIssues] = useState([]);
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [sortField, setSortField] = useState("severity");
  const [sortDir, setSortDir] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [aiFixLoading, setAiFixLoading] = useState(false);
  const [aiFixText, setAiFixText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [history, setHistory] = useState(MOCK_HISTORY);
  const [activeTab, setActiveTab] = useState("issues");
  const [exportLoading, setExportLoading] = useState(false);

  const crawlInterval = useRef(null);
  const totalUrls = maxUrls;

  const startCrawl = () => {
    if (!domain.trim()) return;
    setPhase("crawling");
    setCrawlProgress(0);
    setCrawledUrls(0);
    setIsPaused(false);
    let count = 0;
    crawlInterval.current = setInterval(() => {
      if (isPaused) return;
      count += Math.floor(Math.random() * 8) + 3;
      const pct = Math.min((count / totalUrls) * 100, 100);
      setCrawlProgress(pct);
      setCrawledUrls(Math.min(count, totalUrls));
      setUrlsPerSec(parseFloat((Math.random() * 4 + 2).toFixed(1)));
      if (pct >= 100) {
        clearInterval(crawlInterval.current);
        finishCrawl();
      }
    }, 400);
  };

  const finishCrawl = () => {
    const s = Math.floor(Math.random() * 20) + 70;
    setScore(s);
    setLastScore(MOCK_HISTORY[MOCK_HISTORY.length - 1].score);
    setIssues(MOCK_ISSUES);
    const newEntry = {
      id: history.length + 1,
      date: new Date().toISOString().split("T")[0],
      score: s,
      issues: { critical: 4, warning: 7, info: 3 },
      urls: totalUrls,
    };
    setHistory(prev => [...prev, newEntry]);
    setPhase("results");
  };

  useEffect(() => {
    return () => clearInterval(crawlInterval.current);
  }, []);

  const fetchAiFix = async (issue) => {
    setAiFixLoading(true);
    setAiFixText("");
    setDrawerOpen(true);
    setSelectedIssue(issue);

    const prompt = `Du bist ein SEO-Experte. Erkläre kurz und präzise das SEO-Problem "${issue.type}" auf der URL "${issue.url}". Details: "${issue.details}". Gib eine konkrete Fix-Empfehlung mit Code-Snippet (HTML/JS). Format: 1 Absatz Erklärung, dann Code-Block.`;

    try {
      let res = await fetch("/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("primary");
      const data = await res.json();
      setAiFixText(data.response || data.text || data.content || "Kein Ergebnis.");
    } catch {
      try {
        let res = await fetch("https://socialflow-pro.pages.dev/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        setAiFixText(data.response || data.text || data.content || "Kein Ergebnis.");
      } catch (e) {
        console.error("AI fetch failed:", e);
        setAiFixText("KI-Empfehlung konnte nicht geladen werden.");
      }
    }
    setAiFixLoading(false);
  };

  const filteredIssues = issues.filter(issue => {
    if (activeCategory !== "all" && issue.category !== activeCategory) return false;
    if (filterSeverity !== "all" && issue.severity !== filterSeverity) return false;
    if (searchQuery && !issue.url.toLowerCase().includes(searchQuery.toLowerCase()) && !issue.type.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    const sevOrder = { critical: 0, warning: 1, info: 2 };
    if (sortField === "severity") {
      const diff = sevOrder[a.severity] - sevOrder[b.severity];
      return sortDir === "asc" ? diff : -diff;
    }
    if (sortField === "url") {
      return sortDir === "asc" ? a.url.localeCompare(b.url) : b.url.localeCompare(a.url);
    }
    return 0;
  });

  const issueCounts = {
    critical: issues.filter(i => i.severity === "critical").length,
    warning: issues.filter(i => i.severity === "warning").length,
    info: issues.filter(i => i.severity === "info").length,
  };

  const scoreDelta = score - lastScore;
  const eta = crawlProgress > 0 ? Math.round(((100 - crawlProgress) / crawlProgress) * (crawledUrls / Math.max(urlsPerSec, 0.1))) : 0;

  const handleExport = (type) => {
    setExportLoading(true);
    setTimeout(() => {
      setExportLoading(false);
    }, 1200);
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const containerStyle = {
    minHeight: "100vh",
    background: C.bg,
    fontFamily: FONT,
    color: T.primary,
    padding: "24px",
    paddingBottom: "60px",
  };

  const pageHeaderStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  };

  const titleStyle = {
    fontSize: "24px",
    fontWeight: 700,
    fontFamily: FONT_DISPLAY,
    color: T.primary,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: 0,
  };

  const inputStyle = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: T.primary,
    fontFamily: FONT,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "12px",
    fontWeight: 600,
    color: T.secondary,
    marginBottom: "6px",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const tabStyle = (active) => ({
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: active ? 600 : 400,
    color: active ? C.accent : T.secondary,
    background: active ? `${C.accent}18` : "transparent",
    cursor: "pointer",
    border: "none",
    fontFamily: FONT,
    whiteSpace: "nowrap",
  });

  const severityBadgeStyle = (sev) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
    background: SEVERITY[sev]?.bg,
    color: SEVERITY[sev]?.color,
  });

  // CONFIG PHASE
  if (phase === "config") {
    return (
      <div style={containerStyle}>
        <div style={pageHeaderStyle}>
          <h1 style={titleStyle}>
            <Globe size={24} color={C.accent} strokeWidth={IW} />
            Site-Audit Engine
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", maxWidth: "960px" }}>
          <Card style={{ padding: "28px" }}>
            <div style={{ marginBottom: "24px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, fontFamily: FONT_DISPLAY }}>Neuen Audit starten</span>
              <p style={{ fontSize: "13px", color: T.secondary, marginTop: "4px", marginBottom: 0 }}>
                Konfiguriere den Crawl-Vorgang für deine Domain
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Domain *</label>
              <div style={{ position: "relative" }}>
                <Globe size={16} color={T.secondary} strokeWidth={IW} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  style={{ ...inputStyle, paddingLeft: "38px" }}
                  placeholder="https://example.com"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={labelStyle}>Crawl-Tiefe (1–5)</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map(d => (
                    <button
                      key={d}
                      onClick={() => setDepth(d)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: "8px",
                        border: `2px solid ${depth === d ? C.accent : C.border}`,
                        background: depth === d ? `${C.accent}18` : C.surface,
                        color: depth === d ? C.accent : T.secondary,
                        fontWeight: depth === d ? 700 : 400,
                        fontSize: "14px",
                        cursor: "pointer",
                        fontFamily: FONT,
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Max. URLs</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[50, 250, 1000].map(u => (
                    <button
                      key={u}
                      onClick={() => setMaxUrls(u)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: "8px",
                        border: `2px solid ${maxUrls === u ? C.accent : C.border}`,
                        background: maxUrls === u ? `${C.accent}18` : C.surface,
                        color: maxUrls === u ? C.accent : T.secondary,
                        fontWeight: maxUrls === u ? 700 : 400,
                        fontSize: "13px",
                        cursor: "pointer",
                        fontFamily: FONT,
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={() => setShowAuth(a => !a)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "none", border: "none", color: T.secondary,
                  fontSize: "13px", cursor: "pointer", fontFamily: FONT, padding: 0,
                }}
              >
                <Shield size={14} strokeWidth={IW} />
                HTTP-Authentifizierung (optional)
                <ChevronDown size={14} strokeWidth={IW} style={{ transform: showAuth ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {showAuth && (
                <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Benutzername</label>
                    <input style={inputStyle} value={authUser} onChange={e => setAuthUser(e.target.value)} placeholder="user" />
                  </div>
                  <div>
                    <label style={labelStyle}>Passwort</label>
                    <input style={inputStyle} type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} placeholder="••••••" />
                  </div>
                </div>
              )}
            </div>

            <Btn
              onClick={startCrawl}
              disabled={!domain.trim()}
              style={{ width: "100%", justifyContent: "center", gap: "8px" }}
            >
              <Play size={16} strokeWidth={IW} />
              Audit starten
            </Btn>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card style={{ padding: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", fontFamily: FONT_DISPLAY }}>Was wird geprüft?</div>
              {[
                ["On-Page", "Title, Meta, H1, Alt-Texte"],
                ["Technisch", "HTTPS, Canonical, Redirects"],
                ["Performance", "Ladezeit, TTFB, Core Web Vitals"],
                ["Links", "Broken Links, Redirect-Ketten"],
                ["Structured Data", "Schema.org Markup"],
                ["Content", "Dünner Content, Doppelungen"],
                ["robots.txt & Sitemap", "Validierung & Erreichbarkeit"],
              ].map(([cat, desc]) => (
                <div key={cat} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                  <CheckCircle size={14} color={C.accent} strokeWidth={IW} style={{ marginTop: "1px", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: T.primary }}>{cat}</div>
                    <div style={{ fontSize: "11px", color: T.secondary }}>{desc}</div>
                  </div>
                </div>
              ))}
            </Card>

            <Card style={{ padding: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", fontFamily: FONT_DISPLAY }}>Letzte Audits</div>
              {history.slice(-3).reverse().map(h => (
                <div key={h.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: `1px solid ${C.border}`,
                }}>
                  <div>
                    <div style={{ fontSize: "12px", color: T.secondary }}>{h.date}</div>
                    <div style={{ fontSize: "11px", color: T.muted }}>{h.urls} URLs</div>
                  </div>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: h.score >= 80 ? "#DCFCE7" : h.score >= 60 ? "#FEF3C7" : "#FEE2E2",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", fontWeight: 700,
                    color: h.score >= 80 ? "#16A34A" : h.score >= 60 ? "#D97706" : "#DC2626",
                  }}>
                    {h.score}
                  </div>
                </div>
              ))}
              <button
                onClick={() => { setPhase("results"); setIssues(MOCK_ISSUES); setScore(78); setLastScore(68); }}
                style={{ marginTop: "10px", fontSize: "12px", color: C.accent, background: "none", border: "none", cursor: "pointer", fontFamily: FONT }}
              >
                Demo-Ergebnisse anzeigen →
              </button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // CRAWLING PHASE
  if (phase === "crawling") {
    return (
      <div style={containerStyle}>
        <div style={pageHeaderStyle}>
          <h1 style={titleStyle}>
            <Globe size={24} color={C.accent} strokeWidth={IW} />
            Site-Audit Engine
          </h1>
        </div>

        <div style={{ maxWidth: "600px", margin: "60px auto" }}>
          <Card style={{ padding: "40px", textAlign: "center" }}>
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: `${C.accent}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <Search size={36} color={C.accent} strokeWidth={IW} style={{
                animation: isPaused ? "none" : "spin 2s linear infinite",
              }} />
            </div>

            <div style={{ fontSize: "20px", fontWeight: 700, fontFamily: FONT_DISPLAY, marginBottom: "8px" }}>
              Crawle {domain || "example.com"}
            </div>
            <div style={{ fontSize: "14px", color: T.secondary, marginBottom: "32px" }}>
              Tiefe {depth} • Max. {maxUrls} URLs
            </div>

            <div style={{ background: C.surface, borderRadius: "12px", height: "10px", marginBottom: "16px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${crawlProgress}%`,
                background: `linear-gradient(90deg, ${C.accent}, ${C.accent}CC)`,
                borderRadius: "12px",
                transition: "width 0.4s ease",
              }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: T.secondary, marginBottom: "24px" }}>
              <span>{Math.round(crawlProgress)}% abgeschlossen</span>
              <span>{crawledUrls} von {totalUrls} URLs</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "28px" }}>
              {[
                ["URLs/s", urlsPerSec.toFixed(1), Zap],
                ["Gefunden", crawledUrls, Globe],
                ["ETA", `${eta}s`, Clock],
              ].map(([label, val, Icon]) => (
                <div key={label} style={{ background: C.surface, borderRadius: "10px", padding: "14px" }}>
                  <Icon size={16} color={C.accent} strokeWidth={IW} style={{ marginBottom: "6px" }} />
                  <div style={{ fontSize: "20px", fontWeight: 700, fontFamily: FONT_DISPLAY }}>{val}</div>
                  <div style={{ fontSize: "11px", color: T.secondary }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Btn onClick={() => setIsPaused(p => !p)} style={{ gap: "8px" }}>
                {isPaused ? <Play size={14} strokeWidth={IW} /> : <Pause size={14} strokeWidth={IW} />}
                {isPaused ? "Fortsetzen" : "Pausieren"}
              </Btn>
              <button
                onClick={() => { clearInterval(crawlInterval.current); setPhase("config"); }}
                style={{ padding: "8px 16px