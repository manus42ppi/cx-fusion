import React, { useState, useEffect, useRef } from "react";
import {
  Globe, Zap, Search, Code2, TrendingUp, Shield,
  Calendar, AlertCircle, CheckCircle, ChevronRight, ChevronDown,
  ArrowLeft, Users, BarChart2, MapPin, TrendingDown,
  Minus, Activity, Clock, Smartphone, Monitor, Tablet,
  Tag, LayoutDashboard, RefreshCw, MousePointer,
  ExternalLink, LogIn, Layers, BookOpen, Moon, Sun,
  Sunrise, Sunset, LogOut, DollarSign, Key, Bot, Star,
  FileText, Printer, Info, Server, Wifi, Lock, Link, Download,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge, ScoreRing, SectionTitle, Divider } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import { fmtNum, fmtDate } from "../utils/api.js";

// ─── constants ────────────────────────────────────────────────────────────────

const SOURCE_COLORS = {
  direct: "#6366f1", organic: "#10b981", social: "#f59e0b",
  referral: "#38bdf8", email: "#ec4899", paid: "#f97316",
};
const SOURCE_LABELS = {
  direct: "Direkt", organic: "Organisch", social: "Social Media",
  referral: "Referral", email: "E-Mail", paid: "Paid / Ads",
};
const TREND_ICONS  = { wachsend: TrendingUp, stabil: Minus, rückläufig: TrendingDown };
const TREND_COLORS = { wachsend: C.success,  stabil: C.warning, rückläufig: C.danger };

const TABS = [
  { id: "overview",     label: "Übersicht",   icon: LayoutDashboard },
  { id: "visitors",     label: "Besucher",    icon: Users },
  { id: "seo",         label: "SEO & Links",  icon: Search },
  { id: "performance", label: "Performance",  icon: Zap },
  { id: "tech",        label: "Technologie",  icon: Code2 },
  { id: "history",     label: "Historie",     icon: Clock },
  { id: "links",       label: "Link-Health",  icon: Link },
  { id: "dossier",     label: "Dossier / PDF",icon: FileText },
];

// ─── helper utils ─────────────────────────────────────────────────────────────

function fmtDuration(secs) {
  if (secs == null || isNaN(secs)) return "–";
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s < 10 ? "0" : ""}${s}s` : `${s}s`;
}

function bounceColor(r) {
  return r < 40 ? C.success : r < 62 ? C.warning : C.danger;
}
function bounceLabel(r) {
  return r < 30 ? "Sehr gut" : r < 45 ? "Gut" : r < 62 ? "Durchschnitt" : "Optimierungsbedarf";
}

// ─── mini-components ──────────────────────────────────────────────────────────

function fmtK(n) {
  if (n == null || isNaN(n)) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mio.`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} Tsd.`;
  return String(n);
}

function KiBadge() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color: C.accent,
      background: C.accentLight, padding: "1px 6px",
      borderRadius: 3, letterSpacing: ".04em", verticalAlign: "middle",
      marginLeft: 4,
    }}>KI</span>
  );
}

function SectionLabel({ icon: Icon, color, children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      fontSize: 11, fontWeight: 700, color: color || C.textSoft,
      textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14,
    }}>
      {Icon && <Icon size={12} strokeWidth={IW} />}
      {children}
    </div>
  );
}

// Semi-circle bounce gauge
function BounceGauge({ value }) {
  if (value == null) return (
    <div style={{ textAlign: "center", padding: "24px 0", color: C.textSoft, fontSize: 13 }}>–</div>
  );
  const col = bounceColor(value);
  const r = 44, cx = 56, cy = 54;
  const half = Math.PI * r;
  const dash = (value / 100) * half;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={112} height={64} viewBox="0 0 112 64">
        <path d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none" stroke={C.border} strokeWidth={9} strokeLinecap="round" />
        <path d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none" stroke={col} strokeWidth={9} strokeLinecap="round"
          strokeDasharray={`${dash} ${half}`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={col}
          fontSize={22} fontWeight={800} fontFamily={FONT}>{value}%</text>
      </svg>
      <div style={{ fontSize: 11, fontWeight: 700, color: col, marginTop: -2 }}>
        {bounceLabel(value)}
      </div>
    </div>
  );
}

// Horizontal segmented bar
function SegmentBar({ segments }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;
  return (
    <div>
      <div style={{ display: "flex", height: 14, borderRadius: 99, overflow: "hidden", gap: 2, marginBottom: 16 }}>
        {segments.map((s, i) => (
          <div key={i} style={{
            flex: s.value / total, background: s.color,
            borderRadius: i === 0 ? "99px 0 0 99px" : i === segments.length - 1 ? "0 99px 99px 0" : 0,
            transition: "flex 1s ease",
          }} />
        ))}
      </div>
      <div style={{ display: "flex" }}>
        {segments.map((s, i) => (
          <div key={i} style={{
            flex: s.value / total, textAlign: "center",
            borderLeft: i > 0 ? `1px solid ${C.border}` : "none",
          }}>
            <s.icon size={16} color={s.color} strokeWidth={IW} style={{ display: "block", margin: "0 auto 4px" }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{s.value}%</div>
            <div style={{ fontSize: 11, color: C.textSoft }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Horizontal bar row
function BarRow({ label, value, max = 100, color, sub }) {
  const pct = Math.min((value / max) * 100, 100);
  const col = color || (pct >= 70 ? C.success : pct >= 40 ? C.warning : C.danger);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: C.textMid }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {sub && <span style={{ fontSize: 11, color: C.textSoft }}>{sub}</span>}
          <span style={{ fontSize: 13, fontWeight: 700, color: col }}>{value}%</span>
        </div>
      </div>
      <div style={{ height: 6, background: C.border, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, ok }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 12, color: C.textSoft }}>{label}</span>
      <span style={{
        fontSize: 12, fontFamily: mono ? "monospace" : FONT,
        color: ok === true ? C.success : ok === false ? C.danger : C.text,
        textAlign: "right", maxWidth: "60%", wordBreak: "break-all",
      }}>{value}</span>
    </div>
  );
}

function TechBadge({ name, color }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "4px 10px", borderRadius: 99,
      background: (color || C.accent) + "18",
      color: color || C.accent,
      fontSize: 12, fontWeight: 600, fontFamily: FONT,
      border: `1px solid ${(color || C.accent)}30`,
    }}>{name}</span>
  );
}

// Big metric card
function BigCard({ label, value, sub, color, badge, children }) {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
        {label}{badge}
      </div>
      {value !== undefined && (
        <div style={{ fontSize: 36, fontWeight: 800, color: color || C.text, lineHeight: 1, fontFamily: FONT_DISPLAY }}>
          {value}
        </div>
      )}
      {sub && <div style={{ fontSize: 12, color: C.textSoft, marginTop: 6, lineHeight: 1.4 }}>{sub}</div>}
      {children}
    </Card>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ReportPage() {
  const { activeReport, goNav } = useApp();
  const [tab, setTab] = useState("overview");
  const [linkResults, setLinkResults] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError]     = useState("");
  const [showExport, setShowExport]   = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    if (tab !== "links" || linkResults || linkLoading || !activeReport?.domain) return;
    setLinkLoading(true); setLinkError("");
    (async () => {
      try {
        const endpoints = ["/broken-links", "https://socialflow-pro.pages.dev/broken-links"];
        for (const url of endpoints) {
          try {
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domain: activeReport.domain }),
              signal: AbortSignal.timeout(90000),
            });
            if (!res.ok) continue;
            const data = await res.json();
            setLinkResults(data.results || []); return;
          } catch {}
        }
        throw new Error("Endpunkt nicht erreichbar – läuft local-server.js?");
      } catch (e) { setLinkError(e.message); }
      finally { setLinkLoading(false); }
    })();
  }, [tab]);

  // Close export dropdown on outside click
  useEffect(() => {
    if (!showExport) return;
    const handler = e => { if (!exportRef.current?.contains(e.target)) setShowExport(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExport]);

  if (!activeReport) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16 }}>
        <Globe size={40} color={C.textSoft} strokeWidth={IW} />
        <p style={{ color: C.textMid }}>Kein Report geladen.</p>
        <Btn onClick={() => goNav("analyze")} icon={ArrowLeft}>Zur Analyse</Btn>
      </div>
    );
  }

  const r        = activeReport;
  const ai       = r.ai || {};
  const pr       = r.pagerank || {};
  const wh       = r.whois || {};
  const perf     = r.tech?.perf || {};
  const techDet  = r.tech?.detected || {};
  const ssl      = r.tech?.ssl || {};
  const crawl    = r.crawl || {};
  const arc      = r.archiveTrend || [];
  const pages    = r.topPages || [];
  const behavior = ai.behavior || {};

  const traffic    = ai.trafficEstimate || {};
  const sources    = ai.trafficSources || {};
  const countries  = ai.topCountries || [];
  const TrendIcon  = TREND_ICONS[ai.trendSignal] || Minus;
  const trendColor = TREND_COLORS[ai.trendSignal] || C.textSoft;

  const techFailed = !r.tech || !!r.tech.error;
  const perfScore  = techFailed ? null : (perf.perfScore ?? null);
  const secScore   = techFailed ? null : (perf.secScore != null ? Math.round((perf.secScore / 6) * 100) : null);

  const pieData = Object.entries(sources)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => ({ name: SOURCE_LABELS[k] || k, value: v, color: SOURCE_COLORS[k] || C.accent }));

  const arcData = arc.map(a => ({ year: String(a.year), count: a.count }));

  const domainAgeYears = wh.createdDate
    ? (Math.floor((Date.now() - new Date(wh.createdDate)) / (1000 * 60 * 60 * 24)) / 365.25).toFixed(1)
    : null;

  const devSplit    = behavior.deviceSplit || {};
  const nVsR        = behavior.newVsReturn || {};
  const keywords    = behavior.topKeywords || [];
  const entryPages  = behavior.topEntryPages || [];
  const exitPages   = behavior.topExitPages || [];
  const referrers   = behavior.topReferrers || [];
  const sections    = behavior.topSections || [];
  const topics      = behavior.topTopics || [];
  const peakHours   = behavior.peakHours || [];
  const scrollDepth = behavior.scrollDepth || {};

  // SimilarWeb-style new fields
  const seoData      = ai.seo || {};
  const paidData     = ai.paid || {};
  const aioData      = ai.aiOverviews || {};
  const rawHistory   = ai.trafficHistory || [];
  // Normalize history: array of [month, organic, paid, direct] or objects
  const trafficHistory = rawHistory.map(e =>
    Array.isArray(e)
      ? { month: e[0], organic: e[1] ?? 0, paid: e[2] ?? 0, direct: e[3] ?? 0 }
      : e
  ).reverse(); // oldest first for chart

  // Google core update dates (major algo updates for reference lines)
  const GOOGLE_UPDATES = [
    { month: "2024-03", label: "Core März 24" },
    { month: "2024-08", label: "Core Aug 24" },
    { month: "2024-11", label: "HCU" },
    { month: "2025-03", label: "Core März 25" },
  ];
  const updateMonths = new Set(GOOGLE_UPDATES.map(u => u.month));

  const deviceSegs = [
    { label: "Mobil",   value: devSplit.mobile  ?? 0, color: C.accent,   icon: Smartphone },
    { label: "Desktop", value: devSplit.desktop ?? 0, color: C.success,  icon: Monitor },
    { label: "Tablet",  value: devSplit.tablet  ?? 0, color: C.warning,  icon: Tablet },
  ].filter(s => s.value > 0);

  // ── Tab: Übersicht ──────────────────────────────────────────────────────────

  function OverviewTab() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {ai.summary && (
          <Card style={{ padding: "16px 20px", borderLeft: `3px solid ${C.accent}` }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Zap size={14} color={C.accent} strokeWidth={IW} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
                  KI-Zusammenfassung
                </div>
                <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.75, margin: 0 }}>{ai.summary}</p>
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <BigCard label="Traffic / Monat" badge={<KiBadge />}
            value={traffic.monthly ? fmtNum(traffic.monthly) : "–"}
            color={C.accent}
            sub={traffic.range ? `${fmtNum(traffic.range.min)} – ${fmtNum(traffic.range.max)} Besuche/Mo` : "KI-Schätzung"}
          >
            {ai.trendSignal && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
                <TrendIcon size={12} color={trendColor} strokeWidth={IW} />
                <span style={{ fontSize: 12, color: trendColor, fontWeight: 600 }}>
                  {ai.trendSignal.charAt(0).toUpperCase() + ai.trendSignal.slice(1)}
                </span>
              </div>
            )}
          </BigCard>

          <BigCard label="Absprungrate" badge={<KiBadge />}
            value={behavior.bounceRate != null ? `${behavior.bounceRate}%` : "–"}
            color={behavior.bounceRate != null ? bounceColor(behavior.bounceRate) : C.textSoft}
            sub={behavior.bounceRate != null ? bounceLabel(behavior.bounceRate) : "Keine Daten"}
          />

          <BigCard label="Ø Session-Dauer" badge={<KiBadge />}
            value={behavior.avgSessionDuration != null ? fmtDuration(behavior.avgSessionDuration) : "–"}
            color={C.text}
            sub={behavior.pagesPerSession != null ? `${behavior.pagesPerSession.toFixed(1)} Seiten pro Besuch` : ""}
          />

          <BigCard label="Performance"
            value={perfScore != null ? String(perfScore) : "–"}
            color={perfScore == null ? C.textSoft : perfScore >= 70 ? C.success : perfScore >= 40 ? C.warning : C.danger}
            sub={perf.ttfb ? `TTFB ${perf.ttfb}ms` : techFailed ? "Fetch fehlgeschlagen" : "von 100 Punkten"}
          />

          <BigCard label="Sicherheit"
            value={secScore != null ? String(secScore) : "–"}
            color={secScore == null ? C.textSoft : secScore >= 70 ? C.success : secScore >= 40 ? C.warning : C.danger}
            sub={perf.secScore != null ? `${perf.secScore}/6 Header aktiv` : techFailed ? "Fetch fehlgeschlagen" : "von 100 Punkten"}
          />

          <BigCard label="Domain-Alter"
            value={domainAgeYears ?? "–"}
            color={C.text}
            sub={domainAgeYears ? `Jahre — seit ${fmtDate(wh.createdDate)}` : "Alter unbekannt"}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <SectionLabel icon={Users} color={C.accent}>Zielgruppe</SectionLabel>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
              {ai.category && <Badge color={C.info} bg={C.infoBg}>{ai.category}</Badge>}
              {ai.audienceType && <Badge color={C.warning} bg={C.warningBg}>{ai.audienceType}</Badge>}
              {/* Data quality indicator */}
              {(() => {
                const dq = ai.dataQuality;
                const conf = dq?.audienceConfidence || dq?.categoryConfidence;
                const fetched = dq?.homepageFetched;
                if (fetched === false) return (
                  <span title="Homepage konnte nicht abgerufen werden – Angaben sind Schätzungen" style={{ fontSize: 10, fontWeight: 700, color: "#d97706", background: "#fef3c7", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: 99, cursor: "help" }}>
                    ⚠ KI-Schätzung
                  </span>
                );
                if (conf === "high") return (
                  <span title="Basiert auf tatsächlichem Homepage-Inhalt" style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", background: "#dcfce7", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: 99, cursor: "help" }}>
                    ✓ Verifiziert
                  </span>
                );
                if (conf === "medium") return (
                  <span title="Basiert auf Homepage-Inhalt, aber nicht eindeutig" style={{ fontSize: 10, fontWeight: 700, color: "#d97706", background: "#fef3c7", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: 99, cursor: "help" }}>
                    ~ Plausibel
                  </span>
                );
                return null;
              })()}
            </div>
            {ai.audienceProfile && <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65, margin: 0 }}>{ai.audienceProfile}</p>}
            {/* Show raw homepage signals for transparency */}
            {r?.homepage?.title && (
              <div style={{ marginTop: 10, padding: "8px 10px", background: C.bg, borderRadius: T.rSm, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.textMute, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Quelle: Homepage-Inhalt</div>
                <div style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.5 }}>
                  <strong>Title:</strong> {r.homepage.title}
                  {r.homepage.description && <><br /><strong>Description:</strong> {r.homepage.description.slice(0, 120)}{r.homepage.description.length > 120 ? "…" : ""}</>}
                  {r.homepage.h1s?.[0] && <><br /><strong>H1:</strong> {r.homepage.h1s[0]}</>}
                </div>
              </div>
            )}
          </Card>

          <Card style={{ padding: 20 }}>
            <SectionLabel icon={TrendIcon} color={trendColor}>Trend-Signal</SectionLabel>
            <div style={{ fontSize: 24, fontWeight: 800, color: trendColor, marginBottom: 8 }}>
              {ai.trendSignal ? ai.trendSignal.charAt(0).toUpperCase() + ai.trendSignal.slice(1) : "–"}
            </div>
            {ai.trendReason && <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65, margin: 0 }}>{ai.trendReason}</p>}
          </Card>
        </div>

        {/* ── SimilarWeb-style: Organic + Paid Blöcke ─────────────────────── */}
        {(seoData.organicKeywords || paidData.monthlyClicks) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Organischer Traffic */}
            <Card style={{ padding: 20, borderTop: `3px solid ${C.success}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: T.rSm, background: C.success + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={16} color={C.success} strokeWidth={IW} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".06em" }}>Organischer Traffic</div>
                  <div style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>SEO · Kostenlos</div>
                </div>
                <KiBadge />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: "12px 14px", background: C.bg, borderRadius: T.rMd }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>
                    {traffic.monthly ? fmtK(traffic.monthly) : "–"}
                  </div>
                  <div style={{ fontSize: 11, color: C.textSoft, marginTop: 3 }}>Klicks / Monat</div>
                </div>
                {seoData.organicKeywords != null && (
                  <div style={{ padding: "12px 14px", background: C.bg, borderRadius: T.rMd }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>
                      {fmtK(seoData.organicKeywords)}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSoft, marginTop: 3 }}>Keywords</div>
                    {seoData.organicKeywordsTrend && (
                      <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 3, fontSize: 10 }}>
                        {seoData.organicKeywordsTrend === "wachsend"
                          ? <TrendingUp size={10} color={C.success} strokeWidth={IW} />
                          : seoData.organicKeywordsTrend === "rückläufig"
                          ? <TrendingDown size={10} color={C.danger} strokeWidth={IW} />
                          : <Minus size={10} color={C.warning} strokeWidth={IW} />}
                        <span style={{ color: seoData.organicKeywordsTrend === "wachsend" ? C.success : seoData.organicKeywordsTrend === "rückläufig" ? C.danger : C.warning }}>
                          {seoData.organicKeywordsTrend}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {seoData.seoValue != null && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: T.rMd, background: C.success + "0C", border: `1px solid ${C.success}25`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <DollarSign size={13} color={C.success} strokeWidth={IW} />
                    <span style={{ fontSize: 12, color: C.textMid }}>Traffic-Wert (SEO)</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.success }}>{fmtK(seoData.seoValue)} €/Mo</span>
                </div>
              )}
            </Card>

            {/* Bezahlter Traffic + AIO */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {paidData.monthlyClicks != null && (
                <Card style={{ padding: 16, borderTop: `3px solid ${C.warning}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: T.rSm, background: C.warning + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <DollarSign size={14} color={C.warning} strokeWidth={IW} />
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".06em" }}>Bezahlter Traffic</div>
                    <KiBadge />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Klicks/Mo", value: fmtK(paidData.monthlyClicks) },
                      { label: "Keywords", value: paidData.keywords ? fmtK(paidData.keywords) : "–" },
                      { label: "Kosten/Mo", value: paidData.estimatedCost ? `${fmtK(paidData.estimatedCost)} €` : "–" },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: "center", padding: "8px 4px", background: C.bg, borderRadius: T.rSm }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY }}>{value}</div>
                        <div style={{ fontSize: 10, color: C.textSoft, marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {aioData.score != null && (
                <Card style={{ padding: 16, background: "linear-gradient(135deg, #6366f108 0%, #8b5cf608 100%)", borderTop: `3px solid #8b5cf6` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: T.rSm, background: "#8b5cf618", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Bot size={14} color="#8b5cf6" strokeWidth={IW} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: ".06em" }}>AI Overviews</div>
                      <div style={{ fontSize: 10, color: C.textSoft }}>KI-Suchpräsenz</div>
                    </div>
                    <KiBadge />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#8b5cf6", fontFamily: FONT_DISPLAY }}>{aioData.score}</div>
                      <div style={{ fontSize: 10, color: C.textSoft }}>AIO-Score</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 8, background: C.border, borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
                        <div style={{ height: "100%", width: `${aioData.score}%`, background: `linear-gradient(90deg, #6366f1, #8b5cf6)`, borderRadius: 99, transition: "width 1s ease" }} />
                      </div>
                      {aioData.assessment && (
                        <div style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.4 }}>{aioData.assessment}</div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ── KI-Insights ────────────────────────────────────────────────────── */}
        {(ai.strengths?.length || ai.weaknesses?.length || ai.recommendations?.length) && (
          <Card style={{ padding: 20 }}>
            <SectionLabel icon={Zap} color={C.accent}>KI-Insights</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              {ai.strengths?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.success, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle size={12} strokeWidth={IW} /> Stärken
                  </div>
                  {ai.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, color: C.textMid, padding: "6px 0", borderBottom: `1px solid ${C.border}`, lineHeight: 1.5 }}>{s}</div>
                  ))}
                </div>
              )}
              {ai.weaknesses?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.danger, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                    <AlertCircle size={12} strokeWidth={IW} /> Schwächen
                  </div>
                  {ai.weaknesses.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, color: C.textMid, padding: "6px 0", borderBottom: `1px solid ${C.border}`, lineHeight: 1.5 }}>{s}</div>
                  ))}
                </div>
              )}
              {ai.recommendations?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.warning, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                    <ChevronRight size={12} strokeWidth={IW} /> Empfehlungen
                  </div>
                  {ai.recommendations.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, color: C.textMid, padding: "6px 0", borderBottom: `1px solid ${C.border}`, lineHeight: 1.5 }}>{s}</div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── Tab: Besucher ───────────────────────────────────────────────────────────

  const REFERRER_COLORS = { search: C.success, social: C.warning, news: C.info, partner: C.accent, other: C.textSoft };
  const REFERRER_LABELS = { search: "Suchmaschine", social: "Social Media", news: "Nachrichtenportal", partner: "Partner", other: "Sonstige" };

  function ReferrerIcon({ type }) {
    const icons = { search: Search, social: Users, news: Globe, partner: ExternalLink, other: Globe };
    const I = icons[type] || Globe;
    return <I size={13} strokeWidth={IW} color={REFERRER_COLORS[type] || C.textSoft} />;
  }

  function HourChart({ data }) {
    const max = Math.max(...data.map(h => h.relative), 1);
    const blocks = [
      { label: "Nacht", hours: [0,1,2,3,4,5], icon: Moon, color: "#6366f1" },
      { label: "Morgen", hours: [6,7,8,9,10,11], icon: Sunrise, color: "#f59e0b" },
      { label: "Mittag", hours: [12,13,14,15,16,17], icon: Sun, color: "#10b981" },
      { label: "Abend", hours: [18,19,20,21,22,23], icon: Sunset, color: "#e879f9" },
    ];
    const byHour = Object.fromEntries(data.map(h => [h.hour, h.relative]));
    const peakHour = data.reduce((a, b) => (b.relative > a.relative ? b : a), { hour: 0, relative: 0 });
    return (
      <div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60, marginBottom: 8 }}>
          {Array.from({ length: 24 }, (_, h) => {
            const val = byHour[h] ?? 0;
            const pct = max > 0 ? (val / max) * 100 : 0;
            const block = blocks.find(b => b.hours.includes(h));
            const isPeak = h === peakHour.hour;
            return (
              <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{
                  width: "100%", height: `${Math.max(pct, 4)}%`,
                  background: isPeak ? block?.color : (block?.color || C.accent) + "55",
                  borderRadius: "3px 3px 0 0",
                  transition: "height 1s ease",
                  border: isPeak ? `1px solid ${block?.color}` : "none",
                }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", borderTop: `1px solid ${C.border}` }}>
          {blocks.map(b => (
            <div key={b.label} style={{ flex: 1, textAlign: "center", paddingTop: 6 }}>
              <b.icon size={11} color={b.color} strokeWidth={IW} style={{ display: "block", margin: "0 auto 2px" }} />
              <div style={{ fontSize: 10, color: C.textSoft }}>{b.label}</div>
            </div>
          ))}
        </div>
        {peakHour.relative > 0 && (
          <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: C.textSoft }}>
            Peak: <strong style={{ color: C.text }}>{peakHour.hour}:00–{peakHour.hour + 1}:00 Uhr</strong>
          </div>
        )}
      </div>
    );
  }

  function VisitorTab() {
    const hasBehavior = behavior.bounceRate != null || behavior.avgSessionDuration != null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Verhalten-Metriken ─────────────────────────────────────────────── */}
        {hasBehavior && (
          <div>
            <SectionLabel icon={Activity} color={C.accent}>Besucher-Verhalten<KiBadge /></SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <Card style={{ padding: 20, textAlign: "center" }}>
                <BounceGauge value={behavior.bounceRate} />
                <Divider style={{ margin: "14px 0 10px" }} />
                <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>
                  <strong style={{ color: C.text }}>Absprungrate</strong><br />
                  Anteil Besucher die nach der ersten Seite abspringen
                </div>
              </Card>

              <Card style={{ padding: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>
                    {behavior.avgSessionDuration != null ? fmtDuration(behavior.avgSessionDuration) : "–"}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSoft, marginTop: 6 }}>Ø Session-Dauer</div>
                </div>
                <Divider style={{ margin: "14px 0 10px" }} />
                <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.55, textAlign: "center" }}>
                  {behavior.avgSessionDuration == null ? "–" :
                   behavior.avgSessionDuration < 60 ? "Sehr kurze Verweildauer" :
                   behavior.avgSessionDuration < 120 ? "Kurze Verweildauer — Optimierungspotenzial" :
                   behavior.avgSessionDuration < 300 ? "Durchschnittliche Verweildauer" :
                   "Gute Verweildauer — engagiertes Publikum"}
                </div>
              </Card>

              <Card style={{ padding: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>
                    {behavior.pagesPerSession != null ? behavior.pagesPerSession.toFixed(1) : "–"}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSoft, marginTop: 6 }}>Seiten pro Besuch</div>
                </div>
                <Divider style={{ margin: "14px 0 10px" }} />
                {behavior.pagesPerSession != null && (
                  <>
                    <BarRow
                      label="Engagement-Index"
                      value={Math.min(Math.round((behavior.pagesPerSession / 8) * 100), 100)}
                      color={behavior.pagesPerSession >= 4 ? C.success : behavior.pagesPerSession >= 2 ? C.warning : C.danger}
                    />
                    <div style={{ fontSize: 11, color: C.textSoft, textAlign: "center" }}>
                      {behavior.pagesPerSession < 2 ? "Wenig Exploration" :
                       behavior.pagesPerSession < 4 ? "Durchschnittliche Tiefe" :
                       "Hohes Content-Engagement"}
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── Scroll-Tiefe ───────────────────────────────────────────────────── */}
        {scrollDepth.p25 != null && (
          <Card style={{ padding: 20 }}>
            <SectionLabel icon={BarChart2} color={C.info}>Scroll-Tiefe<KiBadge /></SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "25% gescrollt", value: scrollDepth.p25, color: C.success },
                { label: "50% gescrollt", value: scrollDepth.p50, color: C.info },
                { label: "75% gescrollt", value: scrollDepth.p75, color: C.warning },
                { label: "100% gescrollt", value: scrollDepth.p100, color: C.danger },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: "center", padding: "14px 10px", background: C.bg, borderRadius: T.rMd }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: FONT_DISPLAY }}>{value ?? "–"}%</div>
                  <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4 }}>{label}</div>
                  <div style={{ marginTop: 8, height: 4, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${value ?? 0}%`, background: color, borderRadius: 99, transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: C.textSoft, textAlign: "center" }}>
              {scrollDepth.p50 != null && scrollDepth.p50 >= 60
                ? "Starkes Engagement — mehr als die Hälfte der Besucher lesen bis zur Mitte"
                : scrollDepth.p25 != null && scrollDepth.p25 < 50
                ? "Viele Besucher verlassen die Seite ohne zu scrollen — Content-Einstieg prüfen"
                : "Durchschnittliches Scroll-Verhalten"}
            </div>
          </Card>
        )}

        {/* ── Traffic-Quellen + Besucher-Typ ────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <SectionLabel icon={Activity} color={C.accent}>Traffic-Quellen<KiBadge /></SectionLabel>
            {pieData.length > 0 ? (
              <div>
                <div style={{ display: "flex", height: 12, borderRadius: 99, overflow: "hidden", gap: 1, marginBottom: 16 }}>
                  {pieData.map((e, i) => (
                    <div key={i} style={{ flex: e.value, background: e.color, transition: "flex 1s ease" }} />
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {pieData.map(e => (
                    <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: C.textMid, flex: 1 }}>{e.name}</span>
                      <div style={{ width: 70, height: 4, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${e.value}%`, background: e.color, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 34, textAlign: "right" }}>{e.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: C.textSoft, fontSize: 13 }}>Keine Daten</div>
            )}
          </Card>

          <Card style={{ padding: 20 }}>
            <SectionLabel icon={RefreshCw} color={C.success}>Neu vs. Wiederkehrend<KiBadge /></SectionLabel>
            {nVsR.new != null ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div style={{ textAlign: "center", padding: "14px 8px", background: C.accentLight, borderRadius: T.rMd }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: C.accent, fontFamily: FONT_DISPLAY }}>{nVsR.new}%</div>
                    <div style={{ fontSize: 12, color: C.accent, marginTop: 4, fontWeight: 600 }}>Neue Besucher</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "14px 8px", background: C.success + "14", borderRadius: T.rMd }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: C.success, fontFamily: FONT_DISPLAY }}>{nVsR.returning ?? (100 - nVsR.new)}%</div>
                    <div style={{ fontSize: 12, color: C.success, marginTop: 4, fontWeight: 600 }}>Wiederkehrend</div>
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 99, overflow: "hidden", display: "flex" }}>
                  <div style={{ flex: nVsR.new, background: C.accent, transition: "flex 1s ease" }} />
                  <div style={{ flex: nVsR.returning ?? (100 - nVsR.new), background: C.success, transition: "flex 1s ease" }} />
                </div>
                <div style={{ fontSize: 12, color: C.textSoft, marginTop: 10, textAlign: "center" }}>
                  {(nVsR.returning ?? (100 - nVsR.new)) > 30 ? "Starke Stammkundenbindung" : "Wachstumsorientiert — viele Neukontakte"}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: C.textSoft, fontSize: 13 }}>Keine Daten</div>
            )}
          </Card>
        </div>

        {/* ── Geräte-Verteilung ──────────────────────────────────────────────── */}
        {deviceSegs.length > 0 && (
          <Card style={{ padding: 20 }}>
            <SectionLabel icon={Monitor} color={C.info}>Geräte-Verteilung<KiBadge /></SectionLabel>
            <SegmentBar segments={deviceSegs} />
          </Card>
        )}

        {/* ── Referrer-Quellen ───────────────────────────────────────────────── */}
        {referrers.length > 0 && (
          <Card style={{ padding: 20 }}>
            <SectionLabel icon={LogIn} color={C.accent}>Referrer — Woher kommen die Besucher?<KiBadge /></SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {referrers.map((ref, i) => {
                const col = REFERRER_COLORS[ref.type] || C.textSoft;
                const maxShare = referrers[0]?.share || 1;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: T.rMd, background: C.bg, border: `1px solid ${C.border}` }}>
                    <div style={{ width: 30, height: 30, borderRadius: T.rSm, background: col + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${col}30` }}>
                      <ReferrerIcon type={ref.type} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ref.domain}</div>
                      <div style={{ fontSize: 11, color: col, fontWeight: 500, marginTop: 1 }}>{REFERRER_LABELS[ref.type] || ref.type}</div>
                    </div>
                    <div style={{ width: 120, height: 4, background: C.border, borderRadius: 99, overflow: "hidden", flexShrink: 0 }}>
                      <div style={{ height: "100%", width: `${(ref.share / maxShare) * 100}%`, background: col, borderRadius: 99, transition: "width 1s ease" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: col, minWidth: 36, textAlign: "right" }}>{ref.share}%</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Tageszeit-Verteilung ───────────────────────────────────────────── */}
        {peakHours.length > 0 && (
          <Card style={{ padding: 20 }}>
            <SectionLabel icon={Clock} color={C.warning}>Besucherzeit — Wann sind die Nutzer aktiv?<KiBadge /></SectionLabel>
            <HourChart data={peakHours} />
          </Card>
        )}

        {/* ── Top-Themen + Meistgelesene Sektionen ─────────────────────────── */}
        {(topics.length > 0 || sections.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {topics.length > 0 && (
              <Card style={{ padding: 20 }}>
                <SectionLabel icon={BookOpen} color={C.info}>Konsumierte Themen<KiBadge /></SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {topics.map((t, i) => {
                    const size = i === 0 ? 15 : i < 3 ? 13 : 12;
                    const weight = i === 0 ? 700 : i < 3 ? 600 : 500;
                    const opacity = 1 - (i * 0.08);
                    return (
                      <div key={i} style={{
                        padding: "6px 12px", borderRadius: 99,
                        background: `hsl(${210 + i * 30}, 60%, 95%)`,
                        color: `hsl(${210 + i * 30}, 60%, 35%)`,
                        fontSize: size, fontWeight: weight,
                        border: `1px solid hsl(${210 + i * 30}, 60%, 80%)`,
                        opacity,
                      }}>
                        {t.topic}
                        {t.share != null && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 5 }}>{t.share}%</span>}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
            {sections.length > 0 && (
              <Card style={{ padding: 20 }}>
                <SectionLabel icon={Layers} color={C.success}>Meistgelesene Sektionen<KiBadge /></SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sections.map((s, i) => {
                    const maxShare = sections[0]?.share || 1;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 10, color: C.textSoft, minWidth: 14, textAlign: "right", fontWeight: 700 }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{s.label}</span>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              {s.avgTime != null && <span style={{ fontSize: 11, color: C.textSoft }}>ø {fmtDuration(s.avgTime)}</span>}
                              <span style={{ fontSize: 12, fontWeight: 700, color: C.textMid }}>{s.share}%</span>
                            </div>
                          </div>
                          <div style={{ height: 5, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(s.share / maxShare) * 100}%`, background: i === 0 ? C.success : C.success + "80", borderRadius: 99, transition: "width 1s ease" }} />
                          </div>
                          {s.path && <div style={{ fontSize: 10, color: C.textSoft, fontFamily: "monospace", marginTop: 2 }}>{s.path}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── Keywords + Geo ─────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {keywords.length > 0 && (
            <Card style={{ padding: 20 }}>
              <SectionLabel icon={Tag} color={C.warning}>Top-Keywords<KiBadge /></SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {keywords.map((word, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", borderRadius: T.rMd,
                    background: i === 0 ? C.accentLight : C.bg,
                    border: `1px solid ${i === 0 ? C.accent + "30" : C.border}`,
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: i === 0 ? C.accent : C.border, color: i === 0 ? "#fff" : C.textSoft, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
                    <span style={{ fontSize: 13, color: i === 0 ? C.accent : C.textMid, fontWeight: i === 0 ? 700 : 500 }}>{word}</span>
                    {i === 0 && <Badge color={C.accent} bg={C.accentLight} style={{ marginLeft: "auto", fontSize: 10 }}>Top</Badge>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card style={{ padding: 20 }}>
            <SectionLabel icon={MapPin} color={C.success}>Geografische Verteilung<KiBadge /></SectionLabel>
            {countries.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {countries.slice(0, 5).map((c, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>
                          {c.code ? String.fromCodePoint(...[...c.code.toUpperCase()].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0))) : "🌍"}
                        </span>
                        <span style={{ fontSize: 13, color: C.text }}>{c.country}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.textMid }}>{c.share}%</span>
                    </div>
                    <div style={{ height: 5, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${c.share}%`, background: `hsl(${210 + i * 28}, 65%, 55%)`, borderRadius: 99, transition: "width 1s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: C.textSoft, fontSize: 13 }}>Keine Geodaten</div>
            )}
          </Card>
        </div>

        {/* ── Einstiegs- + Absprungseiten ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {entryPages.length > 0 && (
            <Card style={{ padding: 20 }}>
              <SectionLabel icon={LogIn} color={C.accent}>Top Einstiegsseiten<KiBadge /></SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {entryPages.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: i === 0 ? C.accentLight : C.bg, borderRadius: T.rMd, border: `1px solid ${i === 0 ? C.accent + "25" : C.border}` }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: i === 0 ? C.accent : C.surface, color: i === 0 ? "#fff" : C.textSoft, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${i === 0 ? C.accent : C.border}` }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? C.accent : C.text, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</div>
                      {p.label && <div style={{ fontSize: 11, color: C.textSoft }}>{p.label}</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.textMid }}>{p.share}%</span>
                      {p.avgTime != null && <span style={{ fontSize: 10, color: C.textSoft }}>ø {fmtDuration(p.avgTime)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {exitPages.length > 0 && (
            <Card style={{ padding: 20 }}>
              <SectionLabel icon={LogOut} color={C.danger}>Top Absprungseiten<KiBadge /></SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {exitPages.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: i === 0 ? C.danger + "0A" : C.bg, borderRadius: T.rMd, border: `1px solid ${i === 0 ? C.danger + "30" : C.border}` }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: i === 0 ? C.danger : C.surface, color: i === 0 ? "#fff" : C.textSoft, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${i === 0 ? C.danger : C.border}` }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? C.danger : C.text, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</div>
                      {p.label && <div style={{ fontSize: 11, color: C.textSoft }}>{p.label}</div>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.textMid, flexShrink: 0 }}>{p.share != null ? `${p.share}%` : "–"}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: T.rMd, background: C.danger + "08", fontSize: 11, color: C.textSoft, lineHeight: 1.5 }}>
                Seiten mit hoher Absprungrate sind Kandidaten für UX-Optimierungen oder bessere interne Verlinkung.
              </div>
            </Card>
          )}
        </div>

        {/* ── Common Crawl Realdaten ─────────────────────────────────────────── */}
        {pages.length > 0 && (
          <Card style={{ padding: 20 }}>
            <SectionLabel icon={Globe} color={C.textSoft}>Meistgecrawlte Seiten — Common Crawl (Realdaten)</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {pages.slice(0, 10).map((p, i) => {
                const maxC = pages[0].count;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: C.bg, borderRadius: T.rSm }}>
                    <span style={{ fontSize: 10, color: C.textSoft, minWidth: 14, textAlign: "right" }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: C.text, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</div>
                      <div style={{ height: 3, background: C.border, borderRadius: 99, marginTop: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(p.count / maxC) * 100}%`, background: i < 3 ? C.accent : C.textSoft + "60", borderRadius: 99 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: C.textSoft, flexShrink: 0 }}>{p.count}×</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── Tab: SEO & Links ────────────────────────────────────────────────────────

  function SEOTab() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Keyword-Metriken (SimilarWeb-Style) ─────────────────────────── */}
        {(seoData.organicKeywords || paidData.keywords) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Organische Keywords", value: fmtK(seoData.organicKeywords), color: C.success, icon: Key, sub: seoData.organicKeywordsTrend },
              { label: "SEO Traffic-Wert", value: seoData.seoValue ? `${fmtK(seoData.seoValue)} €` : "–", color: C.success, icon: DollarSign, sub: "pro Monat" },
              { label: "Paid Keywords", value: fmtK(paidData.keywords), color: C.warning, icon: Key, sub: "bezahlte Anzeigen" },
              { label: "Paid Kosten", value: paidData.estimatedCost ? `${fmtK(paidData.estimatedCost)} €` : "–", color: C.warning, icon: DollarSign, sub: "geschätzt/Monat" },
            ].map(({ label, value, color, icon: Icon, sub }) => (
              <Card key={label} style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: T.rSm, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} color={color} strokeWidth={IW} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</span>
                  <KiBadge />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: value === "–" ? C.textSoft : C.text, fontFamily: FONT_DISPLAY }}>{value}</div>
                {sub && <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4 }}>{sub}</div>}
              </Card>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ padding: 20 }}>
          <SectionLabel icon={Search} color={C.success}>SEO-Metriken</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 16, background: C.bg, borderRadius: T.rMd, textAlign: "center" }}>
              {pr.rank != null ? (
                <>
                  <div style={{ fontSize: 40, fontWeight: 800, color: C.info, fontFamily: FONT_DISPLAY }}>{pr.rank}</div>
                  <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4 }}>PageRank (0–10)</div>
                  <div style={{ marginTop: 8, height: 6, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pr.rank * 10}%`, background: C.info, borderRadius: 99 }} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, fontWeight: 700, color: C.textSoft, fontFamily: FONT_DISPLAY }}>n/a</div>
                  <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4 }}>PageRank (0–10)</div>
                  <div style={{ marginTop: 6, padding: "2px 8px", borderRadius: 99, background: T.warningBg, color: T.warningText, fontSize: 10, fontWeight: 700, display: "inline-block" }}>API-Key fehlt</div>
                </>
              )}
            </div>
            <div style={{ padding: 16, background: C.bg, borderRadius: T.rMd, textAlign: "center" }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: C.success, fontFamily: FONT_DISPLAY }}>
                {crawl.indexedPages > 0 ? fmtNum(crawl.indexedPages) : "–"}
              </div>
              <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4 }}>
                {crawl.indexedPages > 0 ? "Indexierte Seiten" : "Kein Treffer"}
              </div>
            </div>
          </div>
          <Divider style={{ marginBottom: 14 }} />
          <InfoRow label="Registrar" value={wh.registrar} />
          <InfoRow label="Erstellt" value={fmtDate(wh.createdDate)} />
          <InfoRow label="Läuft ab" value={fmtDate(wh.expiresDate)} />
          <InfoRow label="Nameserver" value={wh.nameservers?.[0]} mono />
          <InfoRow label="HSTS" value={ssl.hsts != null ? (ssl.hsts ? "✓ Aktiv" : "✗ Fehlt") : null} ok={ssl.hsts} />
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionLabel icon={Globe} color={C.accent}>Top-Seiten (Common Crawl)</SectionLabel>
          {pages.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pages.map((p, i) => {
                const maxC = pages[0].count;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: C.textSoft, minWidth: 16, textAlign: "right" }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: C.text, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</div>
                      <div style={{ height: 3, background: C.border, borderRadius: 99, marginTop: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(p.count / maxC) * 100}%`, background: i < 3 ? C.accent : C.border, borderRadius: 99 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: C.textSoft, flexShrink: 0 }}>{p.count}×</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0", color: C.textSoft, fontSize: 13 }}>
              Domain nicht in Common Crawl gefunden
            </div>
          )}
        </Card>
        </div>
      </div>
    );
  }

  // ── helper: classify tech error ──────────────────────────────────────────────
  function classifyTechError(msg) {
    if (!msg) return { type: "Unbekannt", detail: "Keine Fehlerdetails verfügbar." };
    const e = msg.toLowerCase();
    if (e.includes("403") || e.includes("forbidden"))
      return { type: "Bot-Schutz (403 Forbidden)", detail: "Der Server hat unsere Anfrage als Bot erkannt und aktiv blockiert." };
    if (e.includes("timeout") || e.includes("timed out") || e.includes("aborted"))
      return { type: "Server-Timeout", detail: "Die Antwort dauerte zu lange — möglicherweise DDoS-Schutz oder sehr langsamer Server." };
    if (e.includes("ssl") || e.includes("cert"))
      return { type: "SSL/TLS-Fehler", detail: "Zertifikatsproblem beim verschlüsselten Verbindungsaufbau." };
    if (e.includes("econnrefused") || e.includes("refused"))
      return { type: "Verbindung abgelehnt", detail: "Der Server akzeptiert keine externen Verbindungen auf Port 80/443." };
    if (e.includes("enotfound") || e.includes("dns"))
      return { type: "DNS-Fehler", detail: "Domain konnte nicht aufgelöst werden." };
    return { type: "Verbindungsfehler", detail: msg.slice(0, 120) };
  }

  function inferFromNameservers(nameservers) {
    const ns = (nameservers || []).join(" ").toLowerCase();
    const hints = [];
    if (ns.includes("cloudflare"))  hints.push({ name: "Cloudflare CDN", color: "#F38020" });
    if (ns.includes("hetzner"))     hints.push({ name: "Hetzner",         color: "#D50C2D" });
    if (ns.includes("digitalocean")) hints.push({ name: "DigitalOcean",   color: "#0080FF" });
    if (ns.includes("strato"))      hints.push({ name: "Strato",          color: "#004F9E" });
    if (ns.includes("ionos") || ns.includes("1and1")) hints.push({ name: "IONOS", color: "#003D8F" });
    if (ns.includes("siteground"))  hints.push({ name: "SiteGround",      color: "#00A651" });
    if (ns.includes("aws") || ns.includes("amazon")) hints.push({ name: "AWS",    color: "#FF9900" });
    if (ns.includes("azure") || ns.includes("microsoft")) hints.push({ name: "Azure", color: "#0089D6" });
    if (ns.includes("rackspace"))   hints.push({ name: "Rackspace",       color: "#C40E20" });
    return hints;
  }

  // ── Tab: Performance ────────────────────────────────────────────────────────

  function PerformanceTab() {
    const techError = r.tech?.error ? classifyTechError(r.tech.error) : null;
    const nsHints = inferFromNameservers(wh.nameservers);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Blocked state — rich explanation */}
        {techFailed && (
          <Card style={{ padding: 24, borderLeft: `4px solid ${C.warning}` }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: T.rMd, background: T.warningBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Shield size={22} color={C.warning} strokeWidth={IW} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>
                  Performance-Messung blockiert
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10, padding: "3px 10px", borderRadius: 99, background: T.warningBg, border: `1px solid ${C.warning}30` }}>
                  <AlertCircle size={11} color={C.warning} strokeWidth={IW} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.warningText }}>{techError?.type}</span>
                </div>
                <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7, margin: 0 }}>
                  {techError?.detail} Viele professionelle Websites setzen Sicherheitssysteme (Cloudflare, Akamai, Imperva) ein, die automatisierte Anfragen ohne Browser-Session blockieren — das ist normales Sicherheitsverhalten und kein Fehler der Domain.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: "14px 16px", background: C.bg, borderRadius: T.rMd, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Info size={11} strokeWidth={IW} /> Warum wird blockiert?
                </div>
                {[
                  "Bot-Erkennungs-Algorithmen analysieren Header, Timing & Verhalten",
                  "Kein JavaScript-Rendering → fehlende Browser-Fingerprints",
                  "Rate-Limiting schützt vor Massenabfragen",
                  "IP-Reputation von Hosting-IPs oft als Bot eingestuft",
                ].map((t, i) => (
                  <div key={i} style={{ fontSize: 12, color: C.textMid, padding: "5px 0", borderBottom: `1px solid ${C.border}`, lineHeight: 1.5, display: "flex", gap: 6 }}>
                    <span style={{ color: C.warning }}>·</span> {t}
                  </div>
                ))}
              </div>
              <div style={{ padding: "14px 16px", background: C.bg, borderRadius: T.rMd, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Wifi size={11} strokeWidth={IW} /> Alternativen
                </div>
                {[
                  { label: "PageSpeed Insights (Google)", url: `https://pagespeed.web.dev/report?url=https://${r.domain}` },
                  { label: "GTmetrix", url: "https://gtmetrix.com" },
                  { label: "WebPageTest", url: "https://www.webpagetest.org" },
                  { label: "SecurityHeaders.com", url: `https://securityheaders.com/?q=${r.domain}` },
                ].map(({ label, url }) => (
                  <div key={label} style={{ fontSize: 12, color: C.accent, padding: "5px 0", borderBottom: `1px solid ${C.border}`, lineHeight: 1.5 }}>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: "none" }}>→ {label}</a>
                  </div>
                ))}
              </div>
            </div>

            {/* DNS-based hints */}
            {nsHints.length > 0 && (
              <div style={{ marginTop: 12, padding: "12px 16px", background: C.accentLight, borderRadius: T.rMd, border: `1px solid ${C.accent}20` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 5 }}>
                  <Server size={11} strokeWidth={IW} /> Infrastruktur-Hinweise (aus DNS)
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {nsHints.map(h => (
                    <span key={h.name} style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: h.color + "20", color: h.color, border: `1px solid ${h.color}30` }}>
                      {h.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card style={{ padding: 24 }}>
            <SectionLabel icon={Zap} color={C.warning}>Performance & Scores</SectionLabel>
            <div style={{ display: "flex", gap: 32, justifyContent: "center", marginBottom: 24 }}>
              <ScoreRing score={perfScore} size={88} label="Performance" />
              <ScoreRing score={secScore}  size={88} label="Sicherheit" />
            </div>

            {perf.ttfb != null && (
              <>
                <Divider style={{ marginBottom: 16 }} />
                <BarRow
                  label="TTFB (Time to First Byte)"
                  value={perf.ttfb < 200 ? 95 : perf.ttfb < 600 ? 72 : perf.ttfb < 1500 ? 40 : 15}
                  color={perf.ttfb < 200 ? C.success : perf.ttfb < 600 ? C.warning : C.danger}
                  sub={`${perf.ttfb}ms`}
                />
              </>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              <InfoRow label="Server"        value={perf.server} />
              <InfoRow label="Komprimierung" value={perf.compression} />
              <InfoRow label="HTML-Größe"    value={perf.htmlSizeKb ? `${perf.htmlSizeKb} KB` : null} />
              <InfoRow label="Scripts"       value={perf.scripts != null ? `${perf.scripts} gefunden` : null} />
              <InfoRow label="Bilder"        value={perf.images  != null ? `${perf.images} gefunden`  : null} />
            </div>
          </Card>

          <Card style={{ padding: 24 }}>
            <SectionLabel icon={Shield} color={C.success}>Sicherheits-Header</SectionLabel>
            {!techFailed ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "HSTS",                    value: ssl.hsts,           desc: "Erzwingt HTTPS-Verbindungen" },
                  { label: "Content-Security-Policy", value: ssl.csp,            desc: "Schutz vor XSS-Angriffen" },
                  { label: "X-Frame-Options",         value: ssl.xFrame,         desc: "Verhindert Clickjacking" },
                  { label: "X-Content-Type-Options",  value: ssl.xContentType,   desc: "MIME-Type Sniffing Schutz" },
                  { label: "Referrer-Policy",         value: ssl.referrerPolicy, desc: "Kontrolliert Referrer-Infos" },
                  { label: "Komprimierung",           value: !!perf.compression, desc: "Reduziert Übertragungsgröße" },
                ].map(({ label, value, desc }) => (
                  <div key={label} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px",
                    background: value ? C.success + "0C" : C.bg,
                    borderRadius: T.rMd,
                    border: `1px solid ${value ? C.success + "30" : C.border}`,
                  }}>
                    {value
                      ? <CheckCircle size={14} color={C.success} strokeWidth={IW} />
                      : <AlertCircle size={14} color={C.danger}  strokeWidth={IW} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: value ? C.text : C.textMid }}>{label}</div>
                      <div style={{ fontSize: 11, color: C.textSoft }}>{desc}</div>
                    </div>
                    <Badge color={value ? C.success : C.danger} bg={(value ? C.success : C.danger) + "18"} style={{ fontSize: 10 }}>
                      {value ? "Aktiv" : "Fehlt"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "20px 0", color: C.textSoft, fontSize: 13, textAlign: "center" }}>
                Sicherheits-Header konnten nicht abgerufen werden.<br />
                <span style={{ fontSize: 11 }}>Bitte <a href={`https://securityheaders.com/?q=${r.domain}`} target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>securityheaders.com</a> manuell prüfen.</span>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // ── Tab: Technologie ────────────────────────────────────────────────────────

  function TechTab() {
    const cats = [
      { key: "cms",       label: "CMS",               color: "#6366f1", desc: "Content Management System" },
      { key: "framework", label: "Frontend-Framework", color: "#f59e0b", desc: "JavaScript-Framework" },
      { key: "analytics", label: "Analytics & Tracking", color: "#10b981", desc: "Webanalyse & Tracking" },
      { key: "marketing", label: "Marketing Tools",    color: "#f97316", desc: "Marketing-Automation" },
      { key: "ecommerce", label: "E-Commerce",         color: "#ec4899", desc: "Shop-System" },
      { key: "cdn",       label: "CDN & Hosting",      color: "#38bdf8", desc: "Delivery-Infrastruktur" },
    ];
    const detected = cats.filter(c => techDet[c.key]?.length > 0);
    const techError = r.tech?.error ? classifyTechError(r.tech.error) : null;
    const nsHints = inferFromNameservers(wh.nameservers);
    const aiTechHint = ai.category || ai.summary?.slice(0, 120);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Blocked explanation */}
        {techFailed && (
          <Card style={{ padding: 24, borderLeft: `4px solid ${C.warning}` }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: T.rMd, background: T.warningBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Code2 size={22} color={C.warning} strokeWidth={IW} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>
                  Technologie-Erkennung blockiert
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10, padding: "3px 10px", borderRadius: 99, background: T.warningBg, border: `1px solid ${C.warning}30` }}>
                  <AlertCircle size={11} color={C.warning} strokeWidth={IW} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.warningText }}>{techError?.type}</span>
                </div>
                <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7, margin: 0 }}>
                  Die Technologie-Erkennung analysiert das HTML, HTTP-Header und Skripte einer Seite. Wenn der Server den Zugriff blockiert, kann diese Analyse nicht durchgeführt werden. Das ist keine Fehlfunktion — sondern gutes Sicherheitsverhalten der Ziel-Website.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* DNS-based hints */}
              <div style={{ padding: "14px 16px", background: C.bg, borderRadius: T.rMd, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Server size={11} strokeWidth={IW} /> Infrastruktur (aus DNS-Daten)
                </div>
                {nsHints.length > 0 ? (
                  <>
                    <p style={{ fontSize: 12, color: C.textSoft, marginBottom: 10, lineHeight: 1.5 }}>
                      Aus den Nameserver-Einträgen lassen sich folgende Hosting-Anbieter ableiten:
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {nsHints.map(h => (
                        <span key={h.name} style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99, background: h.color + "18", color: h.color, border: `1px solid ${h.color}30` }}>
                          {h.name}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>
                    Keine eindeutigen Hosting-Hinweise aus den Nameservern erkennbar.
                    {(wh.nameservers || []).slice(0,2).map((ns, i) => (
                      <div key={i} style={{ fontFamily: "monospace", fontSize: 11, marginTop: 4, color: C.textMute }}>{ns}</div>
                    ))}
                  </p>
                )}
              </div>

              {/* AI context hint */}
              <div style={{ padding: "14px 16px", background: C.bg, borderRadius: T.rMd, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Bot size={11} strokeWidth={IW} /> KI-Kontext
                </div>
                <p style={{ fontSize: 12, color: C.textMid, lineHeight: 1.65, margin: 0 }}>
                  {aiTechHint || "Keine KI-Einschätzung zum Tech-Stack verfügbar."}
                </p>
                {ai.category && (
                  <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <TechBadge name={ai.category} color={C.accent} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: T.rMd, background: C.bg, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>
                Externe Tools zum manuellen Prüfen
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { name: "BuiltWith", url: `https://builtwith.com/${r.domain}` },
                  { name: "Wappalyzer", url: `https://www.wappalyzer.com/lookup/${r.domain}` },
                  { name: "Netcraft", url: `https://sitereport.netcraft.com/?url=${r.domain}` },
                ].map(({ name, url }) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: C.accent, textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    <ExternalLink size={11} strokeWidth={IW} /> {name}
                  </a>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Normal detected tech grid */}
        {detected.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {detected.map(({ key, label, color, desc }) => (
              <Card key={key} style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: T.rMd, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Code2 size={16} color={color} strokeWidth={IW} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{label}</div>
                    <div style={{ fontSize: 11, color: C.textSoft }}>{desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(techDet[key] || []).map(n => <TechBadge key={n} name={n} color={color} />)}
                </div>
              </Card>
            ))}
          </div>
        )}

        {!techFailed && detected.length === 0 && (
          <Card style={{ padding: 48, textAlign: "center" }}>
            <Code2 size={32} color={C.textSoft} strokeWidth={IW} style={{ margin: "0 auto 12px" }} />
            <p style={{ color: C.textSoft, fontSize: 14 }}>Keine bekannten Technologien im HTML erkannt</p>
          </Card>
        )}
      </div>
    );
  }

  // ── Tab: Historie ────────────────────────────────────────────────────────────

  function HistoryTab() {
    const [histRange, setHistRange] = useState("8M");
    const ranges = { "4M": 4, "6M": 6, "8M": 8 };
    const visibleHistory = trafficHistory.slice(-(ranges[histRange] || 8));

    const fmtHistNum = (v) => {
      if (v == null) return "";
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
      return String(v);
    };

    const hasTrafficHistory = visibleHistory.length > 0;
    const hasOrganicData = visibleHistory.some(h => h.organic > 0);
    const hasPaidData    = visibleHistory.some(h => h.paid > 0);
    const hasDirectData  = visibleHistory.some(h => h.direct > 0);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Traffic-Verlauf Multi-Line Chart (SimilarWeb-Style) ─────────── */}
        {hasTrafficHistory && (
          <Card style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <SectionLabel icon={TrendingUp} color={C.accent}>Traffic-Verlauf<KiBadge /></SectionLabel>
                <div style={{ padding: "6px 10px", borderRadius: T.rMd, background: C.accentLight + "80", border: `1px solid ${C.accent}15`, marginBottom: 10, display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <Info size={11} color={C.accent} strokeWidth={IW} style={{ marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: C.textSoft, margin: 0, lineHeight: 1.6 }}>
                    KI-Schätzung der monatlichen Besucherzahlen nach Kanal — basierend auf PageRank, Crawl-Tiefe, Domain-Alter und Kategorie. Reale Werte können abweichen. Die <strong style={{ color: "#4285F4" }}>G-Marker</strong> zeigen bekannte Google-Algorithm-Updates.
                  </p>
                </div>
                {ai.trendReason && (
                  <div style={{ fontSize: 12, color: C.textSoft, display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                    <TrendIcon size={12} color={trendColor} strokeWidth={IW} />
                    {ai.trendReason}
                  </div>
                )}
              </div>
              {/* Zeitraum-Filter (wie SimilarWeb) */}
              <div style={{ display: "flex", gap: 4 }}>
                {Object.keys(ranges).map(r => (
                  <button key={r} onClick={() => setHistRange(r)} style={{
                    padding: "4px 10px", borderRadius: T.rSm, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${histRange === r ? C.accent : C.border}`,
                    background: histRange === r ? C.accentLight : "transparent",
                    color: histRange === r ? C.accent : C.textSoft,
                    cursor: "pointer", fontFamily: FONT,
                  }}>{r}</button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={visibleHistory} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: C.textSoft }}
                  tickFormatter={m => m?.slice(5) || m}
                />
                <YAxis tick={{ fontSize: 11, fill: C.textSoft }} tickFormatter={fmtHistNum} />
                <Tooltip
                  contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: T.rMd, fontSize: 12 }}
                  labelStyle={{ color: C.text, fontWeight: 600 }}
                  formatter={(v, name) => [fmtHistNum(v), name]}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />

                {/* Google Update Referenzlinien */}
                {GOOGLE_UPDATES.filter(u => visibleHistory.some(h => h.month === u.month)).map(u => (
                  <ReferenceLine key={u.month} x={u.month} stroke="#4285F4" strokeDasharray="4 4" strokeWidth={1.5}
                    label={{ value: "G", position: "top", fill: "#4285F4", fontSize: 11, fontWeight: 800 }}
                  />
                ))}

                {hasOrganicData && (
                  <Line type="monotone" dataKey="organic" name="Organisch" stroke={C.success}
                    strokeWidth={2.5} dot={{ r: 3, fill: C.success }} activeDot={{ r: 5 }} />
                )}
                {hasPaidData && (
                  <Line type="monotone" dataKey="paid" name="Bezahlt" stroke={C.warning}
                    strokeWidth={2} dot={{ r: 3, fill: C.warning }} activeDot={{ r: 5 }} strokeDasharray="5 3" />
                )}
                {hasDirectData && (
                  <Line type="monotone" dataKey="direct" name="Direkt" stroke={C.accent}
                    strokeWidth={2} dot={{ r: 3, fill: C.accent }} activeDot={{ r: 5 }} />
                )}
              </LineChart>
            </ResponsiveContainer>

            {/* Google Update Legende */}
            {GOOGLE_UPDATES.some(u => visibleHistory.some(h => h.month === u.month)) && (
              <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
                {GOOGLE_UPDATES.filter(u => visibleHistory.some(h => h.month === u.month)).map(u => (
                  <div key={u.month} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textSoft }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, background: "#4285F4", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 800 }}>G</div>
                    {u.label}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Wayback Archiv-Trend */}
          <Card style={{ padding: 24 }}>
            <SectionLabel icon={Calendar} color={C.info}>Archiv-Aktivität (Wayback Machine)</SectionLabel>
            <div style={{ padding: "8px 12px", borderRadius: T.rMd, background: C.info + "08", border: `1px solid ${C.info}20`, marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Info size={12} color={C.info} strokeWidth={IW} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: C.textSoft, margin: 0, lineHeight: 1.6 }}>
                Zeigt wie oft die <strong>Wayback Machine (archive.org)</strong> einen Snapshot dieser Domain gespeichert hat — <em>nicht</em> den tatsächlichen Traffic. Mehr Snapshots = höhere historische Relevanz der Domain.
              </p>
            </div>
            {arcData.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={arcData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.textSoft }} />
                  <YAxis tick={{ fontSize: 11, fill: C.textSoft }} />
                  <Tooltip
                    contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: T.rMd, fontSize: 12 }}
                    labelStyle={{ color: C.text }}
                    formatter={(v) => [`${v} Snapshots`, "Archiviert"]}
                  />
                  <Bar dataKey="count" fill={C.info} radius={[3, 3, 0, 0]} name="Snapshots" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: "32px 0", textAlign: "center", color: C.textSoft, fontSize: 13 }}>Keine Archivdaten</div>
            )}
          </Card>

          {/* Domain-Profil */}
          <Card style={{ padding: 24 }}>
            <SectionLabel icon={Calendar} color={C.warning}>Domain-Profil</SectionLabel>
            <div style={{ textAlign: "center", padding: "12px 0 16px" }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>
                {domainAgeYears ?? "–"}
              </div>
              <div style={{ fontSize: 13, color: C.textSoft, marginTop: 4 }}>
                {domainAgeYears ? "Jahre online" : "Alter unbekannt"}
              </div>
              {domainAgeYears && (
                <div style={{ marginTop: 10 }}>
                  <Badge
                    color={parseFloat(domainAgeYears) >= 5 ? C.success : parseFloat(domainAgeYears) >= 2 ? C.warning : C.danger}
                    bg={(parseFloat(domainAgeYears) >= 5 ? C.success : parseFloat(domainAgeYears) >= 2 ? C.warning : C.danger) + "18"}
                  >
                    {parseFloat(domainAgeYears) >= 10 ? "Sehr etabliert" : parseFloat(domainAgeYears) >= 5 ? "Etabliert" : parseFloat(domainAgeYears) >= 2 ? "Wachsend" : "Neu"}
                  </Badge>
                </div>
              )}
            </div>
            <Divider style={{ marginBottom: 14 }} />
            <InfoRow label="Erstellt"       value={fmtDate(wh.createdDate)} />
            <InfoRow label="Zuerst gesehen" value={wh.firstSeen && wh.firstSeen !== wh.createdDate ? fmtDate(wh.firstSeen) : null} />
            <InfoRow label="Läuft ab"       value={fmtDate(wh.expiresDate)} />
            <InfoRow label="Registrar"      value={wh.registrar} />
            <InfoRow label="Status"         value={wh.status} />
            {(wh.nameservers || []).slice(0, 2).map((ns, i) => (
              <InfoRow key={i} label={i === 0 ? "Nameserver" : ""} value={ns} mono />
            ))}
          </Card>
        </div>
      </div>
    );
  }

  // ── Tab: Dossier / PDF ──────────────────────────────────────────────────────

  function DossierTab() {
    const monthly = traffic.monthly ? fmtNum(traffic.monthly) : "–";
    const bounce  = behavior.bounceRate != null ? `${behavior.bounceRate}%` : "–";
    const session = behavior.avgSessionDuration != null ? fmtDuration(behavior.avgSessionDuration) : "–";

    // Overall score (0–100)
    const scores = [];
    if (perfScore != null)  scores.push(perfScore);
    if (secScore  != null)  scores.push(secScore);
    if (behavior.bounceRate != null) scores.push(100 - behavior.bounceRate);
    if (domainAgeYears != null) scores.push(Math.min(parseFloat(domainAgeYears) * 8, 100));
    if (pr.rank != null) scores.push(pr.rank * 10);
    const overallScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const grade = overallScore == null ? "–" : overallScore >= 80 ? "A" : overallScore >= 65 ? "B" : overallScore >= 50 ? "C" : overallScore >= 35 ? "D" : "F";
    const gradeColor = overallScore == null ? C.textSoft : overallScore >= 80 ? C.success : overallScore >= 65 ? C.info : overallScore >= 50 ? C.warning : C.danger;

    function printDossier() {
      const win = window.open("", "_blank", "width=960,height=800");
      const logoUrl = window.location.origin + "/ppitalk-logo-color.png";
      const dateStr = new Date(r.analyzedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
      const yr = new Date().getFullYear();

      // ── Helpers ──
      const fmt = (v) => v != null ? String(v) : "–";
      const trafficTier = !traffic.monthly ? "Portal" :
        traffic.monthly >= 10000000 ? "Top-Tier-Portal" :
        traffic.monthly >= 1000000  ? "Großportal" :
        traffic.monthly >= 100000   ? "etabliertes Portal" :
        traffic.monthly >= 10000    ? "mittelgroßes Portal" : "kleines Portal";

      // ── Analytical texts ──
      const trafficText = traffic.monthly
        ? `${r.domain} erreicht laut KI-Schätzung ca. ${fmtK(traffic.monthly)} Besucher pro Monat und zählt damit zu den ${trafficTier}en. ` +
          (traffic.range ? `Der plausible Bereich liegt zwischen ${fmtK(traffic.range.min)} und ${fmtK(traffic.range.max)} Besuchen monatlich (Konfidenz: ${traffic.confidence || "mittel"}). ` : "") +
          (ai.trendSignal ? `Der aktuelle Trend ist ${ai.trendSignal}. ${ai.trendReason || ""}` : "")
        : "Verlässliche Traffic-Daten konnten nicht ermittelt werden. Eine direkte Einbindung von Analytics-Daten (Google Analytics 4, Matomo) wird empfohlen.";

      const bounceText = behavior.bounceRate != null
        ? (behavior.bounceRate > 65
            ? `Die Absprungrate von ${behavior.bounceRate}% liegt deutlich über dem Branchendurchschnitt (ca. 45–55%). Dies deutet auf Diskrepanzen zwischen Nutzererwartung und tatsächlichem Content hin — oder auf technische Probleme wie langsame Ladezeiten. Handlungsbedarf ist hoch.`
            : behavior.bounceRate > 50
            ? `Die Absprungrate von ${behavior.bounceRate}% liegt im durchschnittlichen Bereich. Gezielte UX-Optimierungen — insbesondere auf Einstiegsseiten — können diesen Wert auf unter 45% senken.`
            : `Die Absprungrate von ${behavior.bounceRate}% ist ${behavior.bounceRate < 35 ? "ausgezeichnet" : "gut"} und zeigt hohe Content-Relevanz sowie eine gelungene User Experience.`)
        : "Keine Absprungrate-Daten verfügbar.";

      const sessionText = behavior.avgSessionDuration != null
        ? `Die durchschnittliche Session-Dauer von ${fmtDuration(behavior.avgSessionDuration)} ` +
          (behavior.pagesPerSession ? `bei ${behavior.pagesPerSession.toFixed(1)} aufgerufenen Seiten pro Besuch ` : "") +
          (behavior.avgSessionDuration > 180
            ? "zeigt hohe Content-Tiefe und starkes Nutzer-Engagement. Besucher finden relevante Inhalte und erkunden die Website aktiv."
            : behavior.avgSessionDuration > 90
            ? "liegt im soliden Mittelfeld. Durch verbesserte interne Verlinkung und Content-Empfehlungen ist eine Steigerung möglich."
            : "ist verbesserungswürdig. Interaktive Elemente, bessere Navigation und ansprechender Content können die Verweildauer signifikant erhöhen.")
        : "Keine Session-Daten verfügbar.";

      const seoText = (seoData.organicKeywords || pr.rank != null)
        ? `${r.domain} rankt für geschätzte ${fmtK(seoData.organicKeywords) || "eine unbekannte Anzahl von"} Keywords organisch in Suchmaschinen. ` +
          (pr.rank != null ? `Der PageRank von ${pr.rank}/10 ${pr.rank >= 7 ? "reflektiert eine starke Domain-Autorität" : pr.rank >= 4 ? "zeigt eine solide, ausbaufähige Domain-Autorität" : "zeigt Aufbaupotenzial durch gezielte Backlink-Arbeit"}. ` : "") +
          (seoData.seoValue ? `Der äquivalente Traffic-Wert des organischen Traffics beträgt ${fmtK(seoData.seoValue)} €/Monat — das ist der Gegenwert, den bezahlte Suchanzeigen für diesen Traffic kosten würden.` : "")
        : "SEO-Daten konnten nur eingeschränkt ermittelt werden.";

      const perfText = techFailed
        ? `Die technische Performance-Messung war nicht möglich, da der Server automatisierte Anfragen blockiert (Bot-Schutz). Dies ist ein Indikator für professionelles Sicherheitsmanagement. Die Performance-Bewertung basiert ausschließlich auf indirekten Signalen.`
        : perfScore != null
        ? `Der Performance-Score von ${perfScore}/100 ${perfScore >= 80 ? "ist ausgezeichnet und zeigt eine technisch hochwertige, schnell ladende Website" : perfScore >= 60 ? "ist solide — Optimierungen bei Ladezeit und Core Web Vitals können diesen Wert steigern" : "ist verbesserungswürdig. Ladezeit-Optimierungen (Bildkomprimierung, Caching, CDN) haben direkten Einfluss auf SEO-Rankings und Conversions"}. ` +
          (perf.ttfb ? `Der TTFB (Time to First Byte) von ${perf.ttfb}ms ${perf.ttfb < 200 ? "ist exzellent" : perf.ttfb < 600 ? "ist akzeptabel" : "sollte optimiert werden"}. ` : "") +
          (secScore != null ? `Der Sicherheits-Score von ${secScore}/100 basiert auf ${perf.secScore || 0} von 6 aktiven Sicherheits-Headern.` : "")
        : "Performance-Daten konnten nicht ermittelt werden.";

      // ── Roadmap ──
      const phase1 = [
        "Google Search Console und Google Analytics 4 einrichten für verlässliche Echtdaten.",
        !ssl?.hsts ? "HSTS-Header implementieren: erzwingt HTTPS für alle Verbindungen — kritischer Sicherheitsfaktor." : null,
        !ssl?.csp  ? "Content-Security-Policy (CSP) aktivieren: Schutz vor Cross-Site-Scripting (XSS)." : null,
        behavior.bounceRate > 60 ? `Absprungrate senken (aktuell ${behavior.bounceRate}%): Top-Einstiegsseiten auf Ladezeit und Relevanz prüfen.` : null,
        "Core Web Vitals mit PageSpeed Insights messen (LCP < 2,5s, CLS < 0,1, INP < 200ms).",
        "Sitemap.xml, robots.txt und Canonical-Tags validieren und optimieren.",
        "Technische SEO-Basis: Duplicate Content, broken Links und 404-Seiten identifizieren.",
      ].filter(Boolean);

      const phase2 = [
        seoData.organicKeywords
          ? `Keyword-Potenzial ausschöpfen: ~${fmtK(seoData.organicKeywords)} rankende Keywords — durch Long-Tail-Content-Ausbau +20–40% erreichbar.`
          : "Keyword-Recherche durchführen: strategische Long-Tail-Keywords und Content-Gaps identifizieren.",
        "Backlink-Strategie starten: Qualitätslinks von Branchenportalen, Verzeichnissen und Kooperationspartnern akquirieren.",
        behavior.pagesPerSession != null && behavior.pagesPerSession < 3
          ? `Interne Verlinkung optimieren: Seiten/Besuch von ${behavior.pagesPerSession.toFixed(1)} auf 3+ steigern durch Content-Empfehlungen und bessere Navigation.`
          : "Interne Verlinkungsstruktur ausbauen: Themen-Cluster und Pillar-Pages aufbauen.",
        "Redaktionsplan erstellen: monatlicher Content-Kalender basierend auf Suchintentionen und saisonalen Trends.",
        "Meta-Daten-Optimierung: Title-Tags (50–60 Zeichen) und Meta-Descriptions (140–160 Zeichen) für alle wichtigen Seiten überarbeiten.",
        "E-Mail-Marketing aufbauen: Newsletter-Strategie für höhere Wiederkehrrate implementieren.",
      ].filter(Boolean);

      const phase3 = [
        traffic.monthly && traffic.monthly < 500000
          ? `Traffic-Wachstum: Von ${fmtK(traffic.monthly)} auf ${fmtK(Math.round(traffic.monthly * 1.5))} Besucher/Monat durch SEO + Content-Offensive.`
          : "Traffic-Mix optimieren: organischen Anteil steigern, Abhängigkeit von einzelnen Kanälen reduzieren.",
        "Conversion-Rate-Optimierung (CRO): A/B-Tests auf Top-Einstiegsseiten und CTAs implementieren.",
        paidData.monthlyClicks
          ? "Google Ads ROAS verbessern: negative Keywords erweitern, Gebotsstrategien optimieren, Qualitätsfaktor steigern."
          : "Paid Advertising evaluieren: Google Ads Testkampagne für strategische Keywords starten.",
        "Social Media Synergie: Content-Recycling-System für alle relevanten Plattformen (LinkedIn, Instagram, etc.).",
        behavior.bounceRate > 45
          ? "User Experience überarbeiten: Mobile-Optimierung, A/B-Tests auf Landing Pages, Heatmap-Analyse."
          : "Personalisierung: dynamische Content-Empfehlungen und User-Segmentierung einführen.",
        "Structured Data (Schema.org) implementieren: FAQ, Breadcrumbs, Reviews für bessere SERP-Darstellung.",
      ].filter(Boolean);

      const phase4 = [
        "Brand Authority aufbauen: Thought-Leadership-Programm — Gastbeiträge in Fachmedien, Podcast-Auftritte, Whitepaper.",
        "Marketing-Automation: automatisierte Lead-Nurturing-Strecken für verschiedene Zielgruppen-Segmente.",
        "KI-Integration: AI-gestützte Content-Personalisierung und Chatbot für höhere Engagement-Rate.",
        "Wettbewerber-Monitoring: monatliches Benchmarking gegen Top-3-Wettbewerber mit Reaktionsstrategie.",
        "Advanced Analytics: Custom Dashboards mit GA4 + Looker Studio für Echtzeit-Entscheidungsunterstützung.",
        "Community Building: Forum, User-Generated Content oder Kommentarfunktion für höhere Bindung.",
      ];

      // ── Management Summary points ──
      const mgmt = [
        {
          icon: "📊", title: "Traffic-Niveau und Marktposition",
          text: traffic.monthly
            ? `${r.domain} erreicht ${fmtK(traffic.monthly)} Besucher/Monat und ist ein ${trafficTier}. Der Trend ist <strong>${ai.trendSignal || "stabil"}</strong>${ai.trendReason ? ` — ${ai.trendReason}` : ""}. Dies entspricht einem SEO-Traffic-Wert von ${seoData.seoValue ? fmtK(seoData.seoValue) + " €/Monat" : "unbekannt"}.`
            : "Traffic-Daten konnten nur eingeschränkt ermittelt werden. Direkte Analytics-Integration empfohlen.",
        },
        behavior.bounceRate != null ? {
          icon: "🎯", title: `Nutzer-Engagement: Absprungrate ${behavior.bounceRate}% — ${bounceLabel(behavior.bounceRate)}`,
          text: behavior.bounceRate > 60
            ? `Dringender Handlungsbedarf: Die Absprungrate von <strong>${behavior.bounceRate}%</strong> zeigt, dass Nutzer die Seite häufig sofort verlassen. Priorität 1: Ladezeit, UX und Content-Relevanz auf Einstiegsseiten verbessern.`
            : `Die Absprungrate von <strong>${behavior.bounceRate}%</strong> ist ${behavior.bounceRate < 40 ? "ausgezeichnet" : "solide"}. Besucher engagieren sich mit dem Content.`,
        } : null,
        {
          icon: "🔍", title: "SEO-Stärke und organisches Potenzial",
          text: seoData.organicKeywords
            ? `Aktuell ca. <strong>${fmtK(seoData.organicKeywords)} rankende Keywords</strong>${seoData.organicKeywordsTrend ? ` (Trend: ${seoData.organicKeywordsTrend})` : ""}. Der organische Traffic hat einen Werbegegenwert von ca. <strong>${fmtK(seoData.seoValue) || "unbekannt"} €/Monat</strong>. PageRank: <strong>${pr.rank != null ? pr.rank + "/10" : "n/a"}</strong>.`
            : `SEO-Potenzial vorhanden. PageRank: <strong>${pr.rank != null ? pr.rank + "/10" : "nicht ermittelbar"}. </strong>Durch strukturierte Keyword-Strategie und Backlink-Aufbau ist deutliches Wachstum möglich.`,
        },
        ai.strengths?.length ? {
          icon: "✅", title: "Wichtigste strategische Stärke",
          text: `<strong>${ai.strengths[0]}</strong>${ai.strengths[1] ? ` Weitere Stärke: ${ai.strengths[1]}` : ""}`,
        } : null,
        ai.weaknesses?.length ? {
          icon: "⚠️", title: "Dringendster Handlungsbedarf",
          text: `<strong>${ai.weaknesses[0]}</strong>${ai.recommendations?.[0] ? ` — Empfohlene Maßnahme: ${ai.recommendations[0]}` : ""}`,
        } : null,
        {
          icon: "🚀", title: "Quick-Win-Maßnahme mit höchstem ROI",
          text: `<strong>${phase1[0]}</strong> Diese Maßnahme kann innerhalb von 2 Wochen umgesetzt werden und erzielt direkte Wirkung auf Sichtbarkeit und Sicherheit.`,
        },
        {
          icon: "📈", title: "Mittelfristiges Wachstumspotenzial (3–6 Monate)",
          text: traffic.monthly
            ? `Durch konsequente Umsetzung des Vorgehensmodells ist eine Steigerung des Traffics auf <strong>${fmtK(Math.round((traffic.monthly || 50000) * 1.4))}/Monat</strong> (+40%) realistisch — verbunden mit einer Verbesserung des SEO-Traffic-Werts auf ca. <strong>${fmtK(Math.round((seoData.seoValue || 10000) * 1.4))} €/Monat</strong>.`
            : "Durch konsequente SEO-Arbeit, technische Optimierungen und Content-Aufbau ist erhebliches Wachstum erreichbar.",
        },
      ].filter(Boolean);

      // ── HTML builder helpers ──
      const row2 = (l, r2) =>
        `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f3f4f6"><span style="color:#6b7280;font-size:12px">${l}</span><strong style="font-size:12px;color:#111">${r2}</strong></div>`;
      const metric4 = (items) =>
        `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0">` +
        items.map(([v, l, col]) =>
          `<div style="background:#f8fafc;border-radius:8px;padding:14px;border:1px solid #e5e7eb;border-top:3px solid ${col || "#6366f1"}">` +
          `<div style="font-size:20px;font-weight:800;color:${col || "#111"}">${v}</div>` +
          `<div style="font-size:10px;color:#6b7280;margin-top:4px;text-transform:uppercase;letter-spacing:.04em">${l}</div></div>`
        ).join("") + `</div>`;
      const analysisBox = (text) =>
        `<p style="font-size:12px;color:#374151;line-height:1.8;background:#f8fafc;padding:14px 18px;border-radius:8px;border-left:3px solid #6366f1;margin:12px 0">${text}</p>`;
      const sectionHead = (num, title, color) =>
        `<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid ${color || "#6366f1"}">` +
        `<div style="width:28px;height:28px;background:${color || "#6366f1"};border-radius:6px;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:800;flex-shrink:0">${num}</div>` +
        `<div style="font-size:18px;font-weight:800;color:#111">${title}</div></div>`;
      const pageHeader = (chNum, chTitle, chColor) =>
        `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;padding-bottom:14px;border-bottom:2px solid ${chColor || "#6366f1"}">` +
        sectionHead(chNum, chTitle, chColor) +
        `<div style="display:flex;align-items:center;gap:6px;flex-shrink:0">` +
        `<img src="${logoUrl}" style="height:18px" /><span style="font-size:9px;font-weight:800;color:${chColor || "#6366f1"};letter-spacing:.06em">PRO AI</span></div></div>`;
      const pageFooter = (pg) =>
        `<div style="margin-top:40px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af">` +
        `<span>${r.domain} · Web Intelligence Dossier · ${dateStr}</span><span>Seite ${pg} · © ${yr} ppi talk GmbH</span></div>`;
      const phaseBlock = (num, title, time, color, steps) =>
        `<div style="border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:18px">` +
        `<div style="background:${color}14;padding:14px 20px;display:flex;align-items:center;gap:12px;border-bottom:1px solid ${color}30">` +
        `<div style="width:32px;height:32px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:14px;flex-shrink:0">${num}</div>` +
        `<div style="font-size:14px;font-weight:800;color:#111">${title}</div>` +
        `<div style="margin-left:auto;font-size:11px;font-weight:600;color:white;background:${color};padding:3px 10px;border-radius:99px">${time}</div></div>` +
        `<div style="padding:14px 20px;background:white">` +
        steps.map(s =>
          `<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #f9fafb;align-items:flex-start">` +
          `<div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;margin-top:5px"></div>` +
          `<span style="font-size:12px;color:#374151;line-height:1.6">${s}</span></div>`
        ).join("") + `</div></div>`;

      // ── CSS ──
      const css = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;font-size:12px;line-height:1.6}
.cover{background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%);min-height:100vh;display:flex;flex-direction:column;padding:0;page-break-after:always}
.cover-hd{padding:28px 48px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.12)}
.cover-body{flex:1;padding:52px 48px 40px}
.cover-label{font-size:10px;font-weight:700;color:#a5b4fc;letter-spacing:.12em;text-transform:uppercase;margin-bottom:14px}
.cover-domain{font-size:52px;font-weight:900;color:white;line-height:1.05;letter-spacing:-.02em;margin-bottom:20px}
.cover-summary{font-size:13px;color:rgba(255,255,255,.82);line-height:1.85;max-width:640px;background:rgba(255,255,255,.08);padding:20px 24px;border-radius:12px;border-left:3px solid #a5b4fc;margin-bottom:32px}
.cover-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:32px}
.cov-m{background:rgba(255,255,255,.1);border-radius:10px;padding:16px;border:1px solid rgba(255,255,255,.15)}
.cov-m-val{font-size:24px;font-weight:800;color:white}
.cov-m-lbl{font-size:10px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
.grade-bubble{width:90px;height:90px;border-radius:14px;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.35);display:flex;flex-direction:column;align-items:center;justify-content:center}
.grade-val{font-size:40px;font-weight:900;color:white;line-height:1}
.grade-sub{font-size:9px;color:rgba(255,255,255,.6);letter-spacing:.06em;text-transform:uppercase;margin-top:4px}
.confid{font-size:9px;font-weight:800;padding:3px 10px;border-radius:4px;background:rgba(255,255,255,.15);color:rgba(255,255,255,.8);letter-spacing:.06em}
.page{padding:44px 52px;page-break-before:always;min-height:100vh;box-sizing:border-box}
.tag{display:inline-block;font-size:10px;font-weight:700;padding:2px 9px;border-radius:4px;margin-right:6px}
@media print{
  .cover{page-break-after:always;-webkit-print-color-adjust:exact;print-color-adjust:exact;height:100vh}
  .page{page-break-before:always}
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}`;

      // ── Cover Page ──
      const coverPage = `
<div class="cover">
  <div class="cover-hd">
    <div style="display:flex;align-items:center;gap:10px">
      <img src="${logoUrl}" style="height:28px" />
      <span style="font-size:10px;font-weight:800;background:rgba(255,255,255,.2);color:white;padding:3px 9px;border-radius:4px;letter-spacing:.06em">PRO AI</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:11px;color:rgba(255,255,255,.6)">${dateStr}</span>
      <span class="confid">VERTRAULICH</span>
    </div>
  </div>
  <div class="cover-body">
    <div class="cover-label">Web Intelligence Dossier</div>
    <div class="cover-domain">${r.domain}</div>
    <div style="display:flex;gap:8px;margin-bottom:20px">
      ${ai.category ? `<span class="tag" style="background:rgba(165,180,252,.25);color:#c7d2fe">${ai.category}</span>` : ""}
      ${ai.audienceType ? `<span class="tag" style="background:rgba(253,230,138,.2);color:#fde68a">${ai.audienceType}</span>` : ""}
      ${ai.trendSignal ? `<span class="tag" style="background:rgba(167,243,208,.2);color:#a7f3d0">Trend: ${ai.trendSignal}</span>` : ""}
    </div>
    ${ai.summary ? `<div class="cover-summary">${ai.summary}</div>` : ""}
    <div class="cover-metrics">
      <div class="cov-m"><div class="cov-m-val">${fmtK(traffic.monthly) || "–"}</div><div class="cov-m-lbl">Traffic / Monat</div></div>
      <div class="cov-m"><div class="cov-m-val">${behavior.bounceRate != null ? behavior.bounceRate + "%" : "–"}</div><div class="cov-m-lbl">Absprungrate</div></div>
      <div class="cov-m"><div class="cov-m-val">${domainAgeYears ? domainAgeYears + " J" : "–"}</div><div class="cov-m-lbl">Domain-Alter</div></div>
      <div class="cov-m"><div class="cov-m-val">${seoData.seoValue ? fmtK(seoData.seoValue) + " €" : (pr.rank != null ? "PR " + pr.rank : "–")}</div><div class="cov-m-lbl">${seoData.seoValue ? "SEO-Wert/Mo" : "PageRank"}</div></div>
    </div>
    <div style="margin-top:32px;display:flex;align-items:center;gap:20px">
      <div class="grade-bubble"><div class="grade-val">${grade}</div><div class="grade-sub">Gesamt</div></div>
      <div style="font-size:12px;color:rgba(255,255,255,.65);line-height:1.8">
        Gesamtbewertung basierend auf<br>Performance, Sicherheit, SEO und<br>Nutzerverhalten (KI-Schätzung).<br>
        <span style="color:rgba(255,255,255,.4);font-size:10px">Analysiert mit ppi talk PRO AI · Claude AI</span>
      </div>
    </div>
  </div>
</div>`;

      // ── Chapter 1: Executive Summary ──
      const ch1 = `
<div class="page">
  ${pageHeader("1", "Executive Summary &amp; Marktpositionierung", "#6366f1")}
  <div style="margin-bottom:24px">
    <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #6366f1;padding-left:10px;margin-bottom:10px">Zusammenfassung</div>
    ${ai.summary ? `<p style="font-size:13px;color:#374151;line-height:1.85;background:#f8fafc;padding:18px 22px;border-radius:10px;border-left:3px solid #6366f1">${ai.summary}</p>` : ""}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
    <div>
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #6366f1;padding-left:10px;margin-bottom:10px">Marktpositionierung</div>
      ${row2("Kategorie", ai.category || "–")}
      ${row2("Zielgruppe", ai.audienceType || "–")}
      ${row2("Traffic-Segment", trafficTier)}
      ${row2("Trend", ai.trendSignal || "–")}
      ${row2("Domain-Alter", domainAgeYears ? domainAgeYears + " Jahre" : "–")}
      ${row2("Registrar", wh.registrar || "–")}
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #10b981;padding-left:10px;margin-bottom:10px">Kernkennzahlen</div>
      ${row2("Traffic / Monat", fmtK(traffic.monthly) || "–")}
      ${row2("Absprungrate", behavior.bounceRate != null ? behavior.bounceRate + "%" : "–")}
      ${row2("Ø Session-Dauer", behavior.avgSessionDuration != null ? fmtDuration(behavior.avgSessionDuration) : "–")}
      ${row2("Seiten / Besuch", behavior.pagesPerSession != null ? behavior.pagesPerSession.toFixed(1) : "–")}
      ${row2("PageRank", pr.rank != null ? pr.rank + " / 10" : "n/a")}
      ${row2("SEO-Wert", seoData.seoValue ? fmtK(seoData.seoValue) + " €/Mo" : "–")}
    </div>
  </div>
  <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #6366f1;padding-left:10px;margin-bottom:10px">Traffic-Analyse</div>
  ${analysisBox(trafficText)}
  ${ai.trendReason ? `<div style="margin-top:12px;padding:12px 16px;background:#ede9fe;border-radius:8px;font-size:12px;color:#5b21b6;line-height:1.6"><strong>Trend-Einschätzung:</strong> ${ai.trendReason}</div>` : ""}
  ${ai.audienceProfile ? `<div style="margin-top:14px"><div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #f59e0b;padding-left:10px;margin-bottom:8px">Zielgruppen-Profil</div><p style="font-size:12px;color:#374151;line-height:1.8;padding:12px 16px;background:#fffbeb;border-radius:8px">${ai.audienceProfile}</p></div>` : ""}
  ${pageFooter(2)}
</div>`;

      // ── Chapter 2: Traffic & Besucher ──
      const sourcesTable = pieData.length
        ? `<table style="width:100%;border-collapse:collapse;margin-bottom:14px">
            <tr style="background:#f3f4f6"><th style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;padding:7px 10px;text-align:left;letter-spacing:.05em">Kanal</th><th style="padding:7px 10px;text-align:right;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase">Anteil</th></tr>
            ${pieData.map((s, i) => `<tr style="background:${i % 2 ? "#fafafa" : "white"}"><td style="padding:8px 10px;font-size:12px;color:#374151;display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${s.color}"></span>${s.name}</td><td style="padding:8px 10px;font-size:13px;font-weight:700;color:#111;text-align:right">${s.value}%</td></tr>`).join("")}
          </table>` : "<p style='color:#9ca3af;font-size:12px'>Keine Quellen-Daten verfügbar</p>";
      const countriesTable = countries.length
        ? `<table style="width:100%;border-collapse:collapse;margin-bottom:14px">
            <tr style="background:#f3f4f6"><th style="font-size:10px;font-weight:700;color:#6b7280;padding:7px 10px;text-align:left;letter-spacing:.05em;text-transform:uppercase">Land</th><th style="padding:7px 10px;text-align:right;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase">Anteil</th></tr>
            ${countries.slice(0, 6).map((c, i) => `<tr style="background:${i % 2 ? "#fafafa" : "white"}"><td style="padding:8px 10px;font-size:12px;color:#374151">${c.country}</td><td style="padding:8px 10px;font-size:13px;font-weight:700;color:#111;text-align:right">${c.share}%</td></tr>`).join("")}
          </table>` : "<p style='color:#9ca3af;font-size:12px'>Keine Geo-Daten verfügbar</p>";

      const ch2 = `
<div class="page">
  ${pageHeader("2", "Traffic &amp; Besucher-Analyse", "#10b981")}
  ${metric4([
    [fmtK(traffic.monthly) || "–", "Traffic / Monat", "#10b981"],
    [behavior.bounceRate != null ? behavior.bounceRate + "%" : "–", "Absprungrate", behavior.bounceRate != null ? (behavior.bounceRate > 60 ? "#ef4444" : behavior.bounceRate > 45 ? "#f59e0b" : "#10b981") : "#6b7280"],
    [behavior.avgSessionDuration != null ? fmtDuration(behavior.avgSessionDuration) : "–", "Ø Session-Dauer", "#6366f1"],
    [behavior.pagesPerSession != null ? behavior.pagesPerSession.toFixed(1) : "–", "Seiten / Besuch", "#f59e0b"],
  ])}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
    <div>
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #10b981;padding-left:10px;margin-bottom:10px">Traffic-Quellen</div>
      ${sourcesTable}
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #38bdf8;padding-left:10px;margin-bottom:10px">Geografische Verteilung</div>
      ${countriesTable}
    </div>
  </div>
  <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #10b981;padding-left:10px;margin-bottom:8px">Bewertung Absprungrate</div>
  ${analysisBox(bounceText)}
  <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #6366f1;padding-left:10px;margin-bottom:8px;margin-top:16px">Bewertung Engagement &amp; Session</div>
  ${analysisBox(sessionText)}
  ${behavior.deviceSplit ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px">
    ${[["Mobil", behavior.deviceSplit.mobile, "#6366f1"], ["Desktop", behavior.deviceSplit.desktop, "#10b981"], ["Tablet", behavior.deviceSplit.tablet, "#f59e0b"]].filter(([,v]) => v != null).map(([l, v, c]) =>
      `<div style="background:#f8fafc;border-radius:8px;padding:12px;border:1px solid #e5e7eb;text-align:center">
        <div style="font-size:22px;font-weight:800;color:${c}">${v}%</div>
        <div style="font-size:10px;color:#6b7280;margin-top:3px">${l}</div></div>`).join("")}
  </div>` : ""}
  ${pageFooter(3)}
</div>`;

      // ── Chapter 3: SEO ──
      const topPagesTable = pages.length
        ? `<table style="width:100%;border-collapse:collapse">
            <tr style="background:#f3f4f6"><th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase">#</th><th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase">URL</th><th style="padding:7px 10px;text-align:right;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase">Crawls</th></tr>
            ${pages.slice(0, 8).map((p, i) => `<tr style="background:${i % 2 ? "#fafafa" : "white"}"><td style="padding:7px 10px;font-size:12px;color:#6b7280">${i + 1}</td><td style="padding:7px 10px;font-size:12px;color:#374151;font-family:monospace">${p.path}</td><td style="padding:7px 10px;font-size:12px;font-weight:700;color:#111;text-align:right">${p.count}×</td></tr>`).join("")}
          </table>`
        : "<p style='color:#9ca3af;font-size:12px'>Keine Common-Crawl-Daten verfügbar</p>";

      const ch3 = `
<div class="page">
  ${pageHeader("3", "SEO &amp; Online-Sichtbarkeit", "#059669")}
  ${metric4([
    [pr.rank != null ? pr.rank + " / 10" : "n/a", "PageRank", pr.rank != null ? (pr.rank >= 7 ? "#10b981" : pr.rank >= 4 ? "#f59e0b" : "#ef4444") : "#6b7280"],
    [crawl.indexedPages > 0 ? fmtNum(crawl.indexedPages) : "–", "Indexierte Seiten", "#6366f1"],
    [fmtK(seoData.organicKeywords) || "–", "Organ. Keywords", "#10b981"],
    [seoData.seoValue ? fmtK(seoData.seoValue) + " €" : "–", "SEO-Wert/Monat", "#059669"],
  ])}
  <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #059669;padding-left:10px;margin-bottom:8px">SEO-Bewertung</div>
  ${analysisBox(seoText)}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
    <div>
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #059669;padding-left:10px;margin-bottom:10px">Domain-Infos</div>
      ${row2("Erstellt", fmtDate(wh.createdDate))}
      ${row2("Läuft ab", fmtDate(wh.expiresDate))}
      ${row2("Registrar", wh.registrar || "–")}
      ${row2("Nameserver", wh.nameservers?.[0] || "–")}
      ${row2("HSTS", ssl?.hsts ? "✓ Aktiv" : "✗ Fehlt")}
      ${paidData.keywords != null ? row2("Paid Keywords", fmtK(paidData.keywords)) : ""}
      ${paidData.estimatedCost ? row2("Paid Kosten/Mo", fmtK(paidData.estimatedCost) + " €") : ""}
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #6366f1;padding-left:10px;margin-bottom:10px">Top-Seiten (Common Crawl)</div>
      ${topPagesTable}
    </div>
  </div>
  ${pageFooter(4)}
</div>`;

      // ── Chapter 4: Performance & Sicherheit ──
      const headerRows = [
        ["HSTS", ssl?.hsts, "Erzwingt HTTPS für alle Verbindungen"],
        ["Content-Security-Policy", ssl?.csp, "Schutz vor Cross-Site-Scripting"],
        ["X-Frame-Options", ssl?.xFrame, "Verhindert Clickjacking"],
        ["X-Content-Type-Options", ssl?.xContentType, "MIME-Type Sniffing Schutz"],
        ["Referrer-Policy", ssl?.referrerPolicy, "Kontrolliert Referrer-Weitergabe"],
        ["Komprimierung", !!perf?.compression, "Reduziert Übertragungsgröße"],
      ];
      const headerTable = !techFailed ? `<table style="width:100%;border-collapse:collapse">
        <tr style="background:#f3f4f6"><th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase">Header</th><th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase">Beschreibung</th><th style="padding:7px 10px;text-align:center;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase">Status</th></tr>
        ${headerRows.map(([h, ok, d]) => `<tr><td style="padding:9px 10px;font-size:12px;color:#374151;font-weight:600">${h}</td><td style="padding:9px 10px;font-size:11px;color:#6b7280">${d}</td><td style="padding:9px 10px;text-align:center"><span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:${ok ? "#d1fae5" : "#fee2e2"};color:${ok ? "#065f46" : "#991b1b"}">${ok ? "✓ Aktiv" : "✗ Fehlt"}</span></td></tr>`).join("")}
      </table>` : `<p style="font-size:12px;color:#92400e;background:#fef3c7;padding:14px;border-radius:8px">Header-Prüfung nicht möglich — Bot-Schutz aktiv. Manuelle Prüfung via securityheaders.com empfohlen.</p>`;

      const ch4 = `
<div class="page">
  ${pageHeader("4", "Performance &amp; Technische Sicherheit", "#dc2626")}
  ${metric4([
    [perfScore != null ? perfScore + " / 100" : "–", "Performance-Score", perfScore != null ? (perfScore >= 70 ? "#10b981" : perfScore >= 40 ? "#f59e0b" : "#ef4444") : "#6b7280"],
    [secScore != null ? secScore + " / 100" : "–", "Sicherheits-Score", secScore != null ? (secScore >= 70 ? "#10b981" : secScore >= 40 ? "#f59e0b" : "#ef4444") : "#6b7280"],
    [perf?.ttfb != null ? perf.ttfb + " ms" : "–", "TTFB", perf?.ttfb != null ? (perf.ttfb < 200 ? "#10b981" : perf.ttfb < 600 ? "#f59e0b" : "#ef4444") : "#6b7280"],
    [perf?.secScore != null ? perf.secScore + " / 6" : "–", "Aktive Sec-Header", "#6366f1"],
  ])}
  <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #dc2626;padding-left:10px;margin-bottom:8px">Performance-Bewertung</div>
  ${analysisBox(perfText)}
  ${Object.values(techDet).some(v => v?.length > 0) ? `<div style="margin:16px 0">
    <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #f59e0b;padding-left:10px;margin-bottom:10px">Technologie-Stack</div>
    <div>${Object.entries(techDet).filter(([,v]) => v?.length > 0).map(([k, v]) => v.map(t => `<span style="display:inline-block;margin:3px;padding:4px 12px;border-radius:99px;background:#f3f4f6;border:1px solid #e5e7eb;font-size:12px;font-weight:600;color:#374151">${t}</span>`).join("")).join("")}</div>
  </div>` : ""}
  <div style="margin-top:20px">
    <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;border-left:3px solid #dc2626;padding-left:10px;margin-bottom:12px">Sicherheits-Header Checkliste</div>
    ${headerTable}
  </div>
  ${pageFooter(5)}
</div>`;

      // ── Chapter 5: Stärken, Schwächen, Empfehlungen ──
      const mkList = (items, icon, color, bg) => items?.length
        ? items.map(s => `<div style="display:flex;gap:10px;padding:10px 14px;border-radius:8px;background:${bg};margin-bottom:8px;align-items:flex-start"><span style="font-size:14px;flex-shrink:0">${icon}</span><span style="font-size:12px;color:#374151;line-height:1.65">${s}</span></div>`).join("")
        : `<p style="font-size:12px;color:#9ca3af">Keine Daten verfügbar.</p>`;

      const ch5 = `
<div class="page">
  ${pageHeader("5", "St\u00e4rken, Schw\u00e4chen &amp; Handlungsempfehlungen", "#7c3aed")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
    <div>
      <div style="font-size:12px;font-weight:800;color:#059669;margin-bottom:12px;display:flex;align-items:center;gap:6px">✅ St\u00e4rken (${ai.strengths?.length || 0})</div>
      ${mkList(ai.strengths, "✓", "#059669", "#f0fdf4")}
    </div>
    <div>
      <div style="font-size:12px;font-weight:800;color:#dc2626;margin-bottom:12px;display:flex;align-items:center;gap:6px">⚠️ Schw\u00e4chen (${ai.weaknesses?.length || 0})</div>
      ${mkList(ai.weaknesses, "✗", "#dc2626", "#fef2f2")}
    </div>
  </div>
  <div>
    <div style="font-size:12px;font-weight:800;color:#d97706;margin-bottom:12px">→ Konkrete Handlungsempfehlungen</div>
    ${ai.recommendations?.length ? ai.recommendations.map((s, i) => `
      <div style="display:flex;gap:12px;padding:12px 16px;border-radius:8px;background:#fffbeb;border:1px solid #fef3c7;margin-bottom:8px;align-items:flex-start">
        <div style="width:24px;height:24px;border-radius:50%;background:#f59e0b;color:white;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">${i + 1}</div>
        <span style="font-size:12px;color:#374151;line-height:1.7">${s}</span>
      </div>`).join("") : `<p style="font-size:12px;color:#9ca3af">Keine Empfehlungen verfügbar.</p>`}
  </div>
  ${pageFooter(6)}
</div>`;

      // ── Chapter 6: Vorgehensmodell ──
      const ch6 = `
<div class="page">
  ${pageHeader("6", "Vorgehensmodell — Stufenplan zur Verbesserung", "#0891b2")}
  <p style="font-size:12px;color:#374151;line-height:1.75;margin-bottom:20px;background:#f0f9ff;padding:14px 18px;border-radius:8px;border-left:3px solid #0891b2">
    Der folgende Stufenplan beschreibt konkrete Maßnahmen in vier Phasen — von kurzfristigen Quick Wins bis zur langfristigen strategischen Positionierung. Alle Maßnahmen sind priorisiert nach Aufwand, ROI und zeitlicher Abhängigkeit.
  </p>
  ${phaseBlock(1, "Quick Wins &amp; Fundament legen", "0–30 Tage", "#10b981", phase1)}
  ${phaseBlock(2, "Optimierung &amp; Aufbau", "1–3 Monate", "#6366f1", phase2)}
  ${phaseBlock(3, "Skalierung &amp; Wachstum", "3–6 Monate", "#f59e0b", phase3)}
  ${phaseBlock(4, "Langfristige Positionierung", "6–12 Monate", "#7c3aed", phase4)}
  ${pageFooter(7)}
</div>`;

      // ── Chapter 7: Management Summary ──
      const ch7 = `
<div class="page">
  ${pageHeader("7", "Management Summary — Das Wichtigste auf den Punkt", "#1d4ed8")}
  <p style="font-size:12px;color:#374151;line-height:1.75;margin-bottom:20px;background:#eff6ff;padding:14px 18px;border-radius:8px;border-left:3px solid #1d4ed8">
    Diese Zusammenfassung richtet sich an Entscheider und gibt einen kompakten Überblick über die wichtigsten Erkenntnisse der Analyse sowie die priorisierten Handlungsfelder für <strong>${r.domain}</strong>.
  </p>
  ${mgmt.map((m, i) =>
    `<div style="display:flex;gap:14px;padding:16px 18px;background:#f8fafc;border-radius:10px;margin-bottom:12px;border:1px solid #e5e7eb;align-items:flex-start">
      <div style="font-size:22px;line-height:1;flex-shrink:0;margin-top:2px">${m.icon}</div>
      <div>
        <div style="font-size:13px;font-weight:800;color:#111;margin-bottom:5px">${m.title}</div>
        <div style="font-size:12px;color:#374151;line-height:1.7">${m.text}</div>
      </div>
    </div>`
  ).join("")}
  <div style="margin-top:28px;padding:18px 22px;background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-radius:10px;border:1px solid #c7d2fe">
    <div style="font-size:12px;font-weight:800;color:#1d4ed8;margin-bottom:8px">Priorisierte Handlungsfelder</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${[
        ["🔴 Sofort (0–4 Wochen)", phase1.slice(0, 2).join(" · ")],
        ["🟡 Kurzfristig (1–3 Monate)", phase2.slice(0, 2).join(" · ")],
        ["🟢 Mittelfristig (3–6 Monate)", phase3.slice(0, 2).join(" · ")],
        ["🔵 Langfristig (6–12 Monate)", phase4.slice(0, 2).join(" · ")],
      ].map(([label, text]) =>
        `<div style="background:white;border-radius:8px;padding:10px 14px;border:1px solid #e5e7eb">
          <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:4px">${label}</div>
          <div style="font-size:11px;color:#6b7280;line-height:1.5">${text}</div></div>`
      ).join("")}
    </div>
  </div>
  <div style="margin-top:28px;padding:14px 18px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between;align-items:center">
    <span>© ${yr} ppi talk GmbH · Alle Rechte vorbehalten · Vertraulich</span>
    <span>Alle KI-Schätzungen basieren auf öffentlichen Daten (Common Crawl, WHOIS, OpenPageRank, Wayback Machine, Anthropic Claude)</span>
  </div>
</div>`;

      win.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Web Intelligence Dossier — ${r.domain}</title><style>${css}</style></head><body>${coverPage}${ch1}${ch2}${ch3}${ch4}${ch5}${ch6}${ch7}</body></html>`);
      win.document.close();
      setTimeout(() => win.print(), 600);
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Header + PDF button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", background: "linear-gradient(135deg, #6366f108 0%, #8b5cf608 100%)", borderRadius: T.rLg, border: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>
              ppi talk PRO AI · Web Intelligence
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 6 }}>{r.domain}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {ai.category    && <Badge color={C.info} bg={C.infoBg}>{ai.category}</Badge>}
              {ai.audienceType && <Badge color={C.warning} bg={C.warningBg}>{ai.audienceType}</Badge>}
              <span style={{ fontSize: 11, color: C.textSoft }}>Analyse vom {new Date(r.analyzedAt).toLocaleDateString("de-DE")}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            {overallScore != null && (
              <div style={{ width: 80, height: 80, borderRadius: T.rLg, background: gradeColor + "18", border: `2px solid ${gradeColor}40`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: gradeColor, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>{grade}</div>
                <div style={{ fontSize: 10, color: C.textSoft, marginTop: 3 }}>Gesamt</div>
              </div>
            )}
            <button onClick={printDossier} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: T.rMd,
              background: C.accent, color: "#fff",
              border: "none", cursor: "pointer", fontFamily: FONT,
              fontSize: 13, fontWeight: 600,
            }}>
              <Printer size={14} strokeWidth={IW} />
              PDF exportieren
            </button>
          </div>
        </div>

        {/* AI Summary */}
        {ai.summary && (
          <Card style={{ padding: 20, borderLeft: `3px solid ${C.accent}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Executive Summary</div>
            <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.8, margin: 0 }}>{ai.summary}</p>
          </Card>
        )}

        {/* Key Metrics Grid */}
        <div>
          <SectionLabel icon={BarChart2} color={C.accent}>Kernkennzahlen</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Traffic / Monat", value: monthly, color: C.accent, ki: true },
              { label: "Absprungrate", value: bounce, color: behavior.bounceRate != null ? bounceColor(behavior.bounceRate) : C.textSoft, ki: true },
              { label: "Ø Session-Dauer", value: session, color: C.text, ki: true },
              { label: "Seiten / Besuch", value: behavior.pagesPerSession != null ? behavior.pagesPerSession.toFixed(1) : "–", color: C.text, ki: true },
              { label: "Domain-Alter", value: domainAgeYears ? `${domainAgeYears} J` : "–", color: C.text },
              { label: "PageRank (0–10)", value: pr.rank != null ? String(pr.rank) : "n/a", color: C.info },
              { label: "Performance", value: perfScore != null ? String(perfScore) : "–", color: perfScore != null ? (perfScore >= 70 ? C.success : perfScore >= 40 ? C.warning : C.danger) : C.textSoft },
              { label: "SEO-Wert", value: seoData.seoValue ? `${fmtK(seoData.seoValue)} €` : "–", color: C.success, ki: true },
            ].map(({ label, value, color, ki }) => (
              <Card key={label} style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: value === "–" || value === "n/a" ? C.textSoft : color, fontFamily: FONT_DISPLAY, lineHeight: 1, marginBottom: 6 }}>
                  {value}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  {label}{ki && <KiBadge />}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Traffic Sources + Countries */}
        {(pieData.length > 0 || countries.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {pieData.length > 0 && (
              <Card style={{ padding: 20 }}>
                <SectionLabel icon={BarChart2} color={C.accent}>Traffic-Quellen<KiBadge /></SectionLabel>
                {pieData.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: C.textMid }}>{s.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.value}%</span>
                  </div>
                ))}
              </Card>
            )}
            {countries.length > 0 && (
              <Card style={{ padding: 20 }}>
                <SectionLabel icon={MapPin} color={C.accent}>Top-Länder<KiBadge /></SectionLabel>
                {countries.slice(0, 6).map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 12, color: C.textMid }}>{c.country}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{c.share}%</span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {/* Strengths / Weaknesses / Recommendations */}
        {(ai.strengths?.length || ai.weaknesses?.length || ai.recommendations?.length) && (
          <Card style={{ padding: 20 }}>
            <SectionLabel icon={Zap} color={C.accent}>KI-Bewertung</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              {ai.strengths?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.success, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle size={12} strokeWidth={IW} /> Stärken
                  </div>
                  {ai.strengths.map((s, i) => <div key={i} style={{ fontSize: 13, color: C.textMid, padding: "6px 0", borderBottom: `1px solid ${C.border}`, lineHeight: 1.5 }}>{s}</div>)}
                </div>
              )}
              {ai.weaknesses?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.danger, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                    <AlertCircle size={12} strokeWidth={IW} /> Schwächen
                  </div>
                  {ai.weaknesses.map((s, i) => <div key={i} style={{ fontSize: 13, color: C.textMid, padding: "6px 0", borderBottom: `1px solid ${C.border}`, lineHeight: 1.5 }}>{s}</div>)}
                </div>
              )}
              {ai.recommendations?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.warning, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                    <ChevronRight size={12} strokeWidth={IW} /> Empfehlungen
                  </div>
                  {ai.recommendations.map((s, i) => <div key={i} style={{ fontSize: 13, color: C.textMid, padding: "6px 0", borderBottom: `1px solid ${C.border}`, lineHeight: 1.5 }}>{s}</div>)}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Tech Stack summary */}
        {!techFailed && Object.values(techDet).some(v => v?.length > 0) && (
          <Card style={{ padding: 20 }}>
            <SectionLabel icon={Code2} color={C.accent}>Technologie-Stack</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(techDet).filter(([, v]) => v?.length > 0).flatMap(([, v]) => v).map(t => (
                <TechBadge key={t} name={t} color={C.accent} />
              ))}
            </div>
          </Card>
        )}

        {/* PDF Chapter Overview */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <SectionLabel icon={FileText} color={C.accent}>PDF-Dossier Inhalt — 8 Seiten</SectionLabel>
            <button onClick={printDossier} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: T.rMd,
              background: C.accent, color: "#fff",
              border: "none", cursor: "pointer", fontFamily: FONT,
              fontSize: 12, fontWeight: 600,
            }}>
              <Printer size={13} strokeWidth={IW} />
              PDF erstellen
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { num: "◎", title: "Deckblatt", desc: "Markenidentität, Gesamtnote, 4 Kernmetriken", color: "#4338ca" },
              { num: "1", title: "Executive Summary", desc: "Marktpositionierung, Zielgruppe, Trend-Analyse", color: "#6366f1" },
              { num: "2", title: "Traffic & Besucher", desc: "Quellen, Geo-Verteilung, Bounce, Engagement", color: "#10b981" },
              { num: "3", title: "SEO & Sichtbarkeit", desc: "Keywords, PageRank, SEO-Wert, Top-Seiten", color: "#059669" },
              { num: "4", title: "Performance & Sicherheit", desc: "Scores, TTFB, Tech-Stack, Security-Header", color: "#dc2626" },
              { num: "5", title: "Stärken & Empfehlungen", desc: "SWOT-Analyse, priorisierte Handlungsempfehlungen", color: "#7c3aed" },
              { num: "6", title: "Vorgehensmodell", desc: "4-Phasen-Stufenplan (0–12 Monate)", color: "#0891b2" },
              { num: "7", title: "Management Summary", desc: "Entscheider-Kurzfassung, Handlungsfelder", color: "#1d4ed8" },
            ].map(({ num, title, desc, color }) => (
              <div key={num} style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 12px", borderRadius: T.rMd,
                background: color + "08", border: `1px solid ${color}20`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: color, display: "flex", alignItems: "center",
                  justifyContent: "center", color: "white",
                  fontSize: 11, fontWeight: 800,
                }}>{num}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.4 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Disclaimer */}
        <div style={{ padding: "12px 16px", borderRadius: T.rMd, background: C.bg, border: `1px solid ${C.border}`, fontSize: 11, color: C.textMute, lineHeight: 1.6 }}>
          <strong style={{ color: C.textSoft }}>Hinweis:</strong> Alle mit <KiBadge /> markierten Werte sind KI-Schätzungen auf Basis öffentlich zugänglicher Daten (Common Crawl, WHOIS, OpenPageRank, Wayback Machine, Anthropic Claude). Reale Analytics-Daten können abweichen.
        </div>
      </div>
    );
  }

  // ── Tab: Link-Health ─────────────────────────────────────────────────────────

  function LinkHealthTab() {
    if (linkLoading) return (
      <Card style={{ padding: 40, textAlign: "center" }}>
        <RefreshCw size={28} color={C.accent} strokeWidth={IW} style={{ margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14, color: C.textSoft }}>Links werden geprüft… (bis zu 60 Sek.)</div>
      </Card>
    );
    if (linkError) return (
      <Card style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 8, color: "#dc2626", fontSize: 13 }}>
          <AlertCircle size={16} strokeWidth={IW} style={{ flexShrink: 0 }} />{linkError}
        </div>
      </Card>
    );
    if (!linkResults) return null;

    const broken  = linkResults.filter(l => !l.ok && !l.error);
    const errors  = linkResults.filter(l => l.error);
    const ok      = linkResults.filter(l => l.ok);
    const redirected = linkResults.filter(l => l.ok && l.redirect);

    const statusColor = (l) => l.error ? "#6b7280" : !l.ok ? "#dc2626" : l.redirect ? "#d97706" : "#16a34a";
    const statusLabel = (l) => l.error ? `Fehler` : !l.ok ? `${l.status}` : l.redirect ? `${l.status} Redirect` : `${l.status} OK`;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Geprüft",    value: linkResults.length, color: C.accent,   bg: C.accentLight },
            { label: "OK",         value: ok.length,          color: "#16a34a",  bg: "#dcfce7" },
            { label: "Broken",     value: broken.length,      color: "#dc2626",  bg: "#fee2e2" },
            { label: "Timeouts",   value: errors.length,      color: "#6b7280",  bg: C.bg },
          ].map(({ label, value, color, bg }) => (
            <Card key={label} style={{ padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: FONT_DISPLAY }}>{value}</div>
              <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginTop: 4 }}>{label}</div>
            </Card>
          ))}
        </div>

        {/* Results table */}
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
            Alle Links ({linkResults.length})
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Status", "URL", "Redirect zu"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: C.textSoft, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linkResults.map((l, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "8px 8px", whiteSpace: "nowrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                        color: statusColor(l), background: statusColor(l) + "18",
                      }}>{statusLabel(l)}</span>
                    </td>
                    <td style={{ padding: "8px 8px", color: C.textMid, fontFamily: "monospace", maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <a href={l.url} target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "none" }}>{l.url}</a>
                    </td>
                    <td style={{ padding: "8px 8px", color: C.textMute, fontFamily: "monospace", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.redirect && l.finalUrl !== l.url ? l.finalUrl : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {broken.length > 0 && (
          <Card style={{ padding: 16, borderLeft: `3px solid #dc2626` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".07em" }}>
              {broken.length} Broken Link{broken.length > 1 ? "s" : ""} — sofortiger Handlungsbedarf
            </div>
            {broken.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "1px 7px", borderRadius: 99 }}>{l.status}</span>
                <a href={l.url} target="_blank" rel="noopener" style={{ fontSize: 11, color: "#dc2626", fontFamily: "monospace", textDecoration: "none" }}>{l.url}</a>
              </div>
            ))}
          </Card>
        )}
      </div>
    );
  }

  // ── Export helpers ────────────────────────────────────────────────────────────

  function exportJSON() {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${r.domain}-report.json`;
    a.click(); setShowExport(false);
  }

  function exportCSV() {
    const rows = [
      ["Metrik", "Wert"],
      ["Domain", r.domain],
      ["Analysiert am", new Date(r.analyzedAt).toLocaleString("de-DE")],
      ["Traffic/Monat (geschätzt)", traffic.monthly || "–"],
      ["PageRank", pr.rank || "–"],
      ["Bounce Rate", behavior.bounceRate != null ? `${behavior.bounceRate}%` : "–"],
      ["Ø Session", behavior.avgSessionDuration != null ? `${behavior.avgSessionDuration}s` : "–"],
      ["SEO Keywords", ai.seo?.organicKeywords || "–"],
      ["SEO-Wert/Mo (EUR)", ai.seo?.seoValue || "–"],
      ["Trend", ai.trendSignal || "–"],
      ["Kategorie", ai.category || "–"],
    ];
    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${r.domain}-report.csv`;
    a.click(); setShowExport(false);
  }

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1160, margin: "0 auto", padding: "24px 24px 60px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <Btn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => goNav("analyze")}>Zurück</Btn>
        <div style={{
          width: 32, height: 32, borderRadius: T.rMd,
          background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Globe size={16} color={C.accent} strokeWidth={IW} />
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-.01em" }}>
          {r.domain}
        </h1>
        {ai.category    && <Badge color={C.info}    bg={C.infoBg}>{ai.category}</Badge>}
        {ai.audienceType && <Badge color={C.warning} bg={C.warningBg}>{ai.audienceType}</Badge>}
        <span style={{ fontSize: 12, color: C.textSoft, marginLeft: "auto" }}>
          {new Date(r.analyzedAt).toLocaleString("de-DE")}
        </span>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: "flex", gap: 2, padding: 4,
        background: C.bg, borderRadius: T.rLg,
        border: `1px solid ${C.border}`,
        marginBottom: 24, overflowX: "auto",
      }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: T.rMd,
                border: "none", cursor: "pointer",
                background: active ? C.surface : "transparent",
                color: active ? C.text : C.textSoft,
                fontFamily: FONT, fontSize: 13, fontWeight: active ? 600 : 500,
                boxShadow: active ? T.shadowXs : "none",
                transition: "all .15s", whiteSpace: "nowrap", flexShrink: 0,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textSoft; }}
            >
              <Icon size={14} strokeWidth={IW} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "overview"    && <OverviewTab />}
      {tab === "visitors"    && <VisitorTab />}
      {tab === "seo"         && <SEOTab />}
      {tab === "performance" && <PerformanceTab />}
      {tab === "tech"        && <TechTab />}
      {tab === "history"     && <HistoryTab />}
      {tab === "links"       && <LinkHealthTab />}
      {tab === "dossier"     && <DossierTab />}

      {/* Floating Export Button */}
      <div ref={exportRef} style={{ position: "fixed", bottom: 28, right: 28, zIndex: 200 }}>
        {showExport && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 8px)", right: 0,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: T.rMd, boxShadow: T.shadowLg,
            minWidth: 160, overflow: "hidden",
          }}>
            {[
              { label: "JSON herunterladen", fn: exportJSON, icon: FileText },
              { label: "CSV herunterladen",  fn: exportCSV,  icon: BarChart2 },
              { label: "PDF drucken",        fn: () => { setShowExport(false); setTimeout(() => window.print(), 100); }, icon: Printer },
            ].map(({ label, fn, icon: Ico }) => (
              <button key={label} onClick={fn} style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "11px 16px", background: "none", border: "none",
                cursor: "pointer", fontFamily: FONT, fontSize: 13, color: C.text, textAlign: "left",
                borderBottom: `1px solid ${C.border}`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <Ico size={13} strokeWidth={IW} color={C.textSoft} /> {label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setShowExport(o => !o)} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: T.rMd,
          background: C.accent, color: "white", border: "none", cursor: "pointer",
          fontFamily: FONT, fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,.2)", transition: "all .15s",
        }}>
          <Download size={14} strokeWidth={IW} /> Export
          <ChevronDown size={12} strokeWidth={IW} style={{ transform: showExport ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
        </button>
      </div>
    </div>
  );
}
