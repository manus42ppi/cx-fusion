import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  Users, Plus, Globe, Trash2, Search,
  TrendingUp, TrendingDown, Minus, ChevronRight, X,
  BookText, Clock, History, ChevronDown, ChevronUp,
  ExternalLink, BarChart2, Code2, AlertTriangle,
  CheckCircle, RefreshCw, Share2, Sparkles,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { cleanDomain, fmtDate, loadFullHistory, loadFullHistorySync } from "../utils/api.js";
import { useApp } from "../context/AppContext.jsx";

// ─── Report type registry ─────────────────────────────────────────────────────
// Add new report types HERE — the rest of the page auto-adapts.

const REPORT_TYPES = [
  {
    id:      "website",
    label:   "Website-Analyse",
    icon:    Globe,
    color:   "#0057D9",
    navTo:   "analyze",
    navResult: "report",
    metric:  r => {
      const t = r?.ai?.trafficEstimate?.monthly;
      if (!t) return null;
      if (t >= 1_000_000) return { value: (t / 1_000_000).toFixed(1) + " Mio.", sub: "Traffic/Mo" };
      if (t >= 1_000)     return { value: (t / 1_000).toFixed(1) + "K",          sub: "Traffic/Mo" };
      return { value: String(t), sub: "Traffic/Mo" };
    },
    summaryLine: e => {
      const t = e?.summary?.traffic;
      if (!t) return null;
      if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)} Mio. Traffic/Mo`;
      if (t >= 1_000)     return `${(t / 1_000).toFixed(1)}K Traffic/Mo`;
      return `${t} Traffic/Mo`;
    },
  },
  {
    id:      "content",
    label:   "Content-Audit",
    icon:    BookText,
    color:   "#7c3aed",
    navTo:   "content",
    metric:  r => {
      const n = r?.articleCount ?? r?.articles?.length;
      if (!n) return null;
      return { value: `${n}`, sub: "Artikel" };
    },
    summaryLine: e => {
      const n = e?.summary?.articles;
      const tone = e?.summary?.tone;
      if (n == null && !tone) return null;
      return [n != null ? `${n} Artikel` : null, tone].filter(Boolean).join(" · ");
    },
  },
  {
    id:      "schema",
    label:   "Structure-Audit",
    icon:    Code2,
    color:   "#059669",
    navTo:   "feat-schema-validator",
    metric:  r => {
      const pages = r?.pages;
      if (!pages?.length) return null;
      const ok  = pages.filter(p => p.status === "valid").length;
      const err = pages.filter(p => p.status === "error").length;
      const total = pages.length;
      return { value: `${ok}/${total}`, sub: err > 0 ? `${err} Fehler` : "Seiten OK" };
    },
    summaryLine: e => {
      const sc = e?.summary?.schemaCount;
      const ok = e?.summary?.validCount;
      if (sc == null) return null;
      return `${sc} Schema${sc !== 1 ? "s" : ""}${ok != null ? ` · ${ok} valide` : ""}`;
    },
  },
  {
    id:      "social",
    label:   "Social Intelligence",
    icon:    Share2,
    color:   "#0ea5e9",
    navTo:   "social-media-stats",
    metric:  r => {
      const score  = r?.score;
      const active = Object.values(r?.profiles || {}).filter(p => p?.url).length;
      if (score == null && !active) return null;
      return { value: score != null ? `${score}` : `${active}`, sub: score != null ? "Social Score" : "Plattformen" };
    },
    summaryLine: e => {
      const score  = e?.summary?.score;
      const active = e?.summary?.activeCount;
      const plat   = e?.summary?.primaryPlatform;
      if (score == null && active == null) return null;
      const parts = [];
      if (score != null) parts.push(`Score ${score}/100`);
      if (active != null) parts.push(`${active} Plattformen`);
      if (plat) parts.push(plat);
      return parts.join(" · ");
    },
  },
];

function fmtK(n) {
  if (n == null || isNaN(n)) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mio.`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const TREND_ICONS  = { wachsend: TrendingUp, stabil: Minus, rückläufig: TrendingDown };
const TREND_COLORS = { wachsend: C.success, stabil: "#d97706", rückläufig: "#ef4444" };

const CAT_COLORS = {
  traffic:   "#0057D9",
  content:   "#7c3aed",
  technical: "#059669",
  social:    "#0ea5e9",
};

const EFFORT_COLORS = {
  low:    { bg: "#dcfce7", color: "#166534" },
  medium: { bg: "#fef3c7", color: "#92400e" },
  high:   { bg: "#fee2e2", color: "#991b1b" },
};

// ─── Single report type row ───────────────────────────────────────────────────

const ReportRow = memo(function ReportRow({ typeDef, report, onOpen, onAnalyze }) {
  const { label, icon: Icon, color, metric } = typeDef;
  const hasReport = !!report;
  const m = hasReport ? metric(report) : null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px", borderRadius: T.rMd,
      background: hasReport ? color + "08" : C.bg,
      border: `1px solid ${hasReport ? color + "25" : C.border}`,
    }}>
      {/* Type icon */}
      <div style={{
        width: 32, height: 32, borderRadius: T.rSm, flexShrink: 0,
        background: hasReport ? color + "15" : C.surface,
        border: `1px solid ${hasReport ? color + "25" : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={14} color={hasReport ? color : C.textSoft} strokeWidth={IW} />
      </div>

      {/* Label + date */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: hasReport ? color : C.textSoft }}>{label}</div>
        {hasReport && report.savedAt && (
          <div style={{ fontSize: 10, color: C.textMute, marginTop: 1 }}>
            {fmtDate(report.savedAt)}
          </div>
        )}
      </div>

      {/* Metric */}
      {hasReport && m && (
        <div style={{ textAlign: "right", flexShrink: 0, marginRight: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>{m.value}</div>
          <div style={{ fontSize: 9, color: color + "90", marginTop: 1 }}>{m.sub}</div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        {hasReport && (
          <button
            onClick={onOpen}
            title="Öffnen"
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "5px 12px", borderRadius: T.rSm,
              background: color, color: "#fff",
              border: "none", cursor: "pointer", fontFamily: FONT,
              fontSize: 11, fontWeight: 600,
            }}
          >
            <ChevronRight size={11} strokeWidth={IW} /> Öffnen
          </button>
        )}
        <button
          onClick={onAnalyze}
          title={hasReport ? "Neu analysieren" : "Analysieren"}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "5px 10px", borderRadius: T.rSm,
            background: hasReport ? "transparent" : color + "12",
            color: color, border: `1px solid ${color + "35"}`,
            cursor: "pointer", fontFamily: FONT,
            fontSize: 11, fontWeight: 600,
          }}
        >
          {hasReport
            ? <RefreshCw size={11} strokeWidth={IW} />
            : <><Search size={11} strokeWidth={IW} /> Analysieren</>
          }
        </button>
      </div>
    </div>
  );
});

// ─── History panel ────────────────────────────────────────────────────────────

const HistoryPanel = memo(function HistoryPanel({ domain, onOpen }) {
  const [entries, setEntries] = useState(() => loadFullHistorySync(domain));

  useEffect(() => {
    loadFullHistory(domain).then(setEntries);
  }, [domain]);

  if (!entries?.length) return (
    <div style={{ padding: "10px 0 4px", fontSize: 11, color: C.textMute, textAlign: "center" }}>
      Noch keine Historik – starte eine Analyse.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {entries.map((entry, idx) => {
        const typeDef = REPORT_TYPES.find(t => t.id === entry.type) || REPORT_TYPES[0];
        const { label, icon: Icon, color, summaryLine } = typeDef;
        const sum = summaryLine(entry);

        return (
          <div key={entry.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: T.rMd,
            background: idx === 0 ? color + "08" : C.surface,
            border: `1px solid ${idx === 0 ? color + "25" : C.border}`,
          }}>
            {/* Icon */}
            <div style={{
              width: 28, height: 28, borderRadius: T.rSm, flexShrink: 0,
              background: color + "15", border: `1px solid ${color}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={13} color={color} strokeWidth={IW} />
            </div>

            {/* Label + summary */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
                {idx === 0 && (
                  <span style={{ fontSize: 9, fontWeight: 800, color, background: color + "18", padding: "1px 6px", borderRadius: 99 }}>NEU</span>
                )}
              </div>
              {sum && <div style={{ fontSize: 10, color: C.textMute, marginTop: 1 }}>{sum}</div>}
            </div>

            {/* Date + open */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: C.textMute, display: "flex", alignItems: "center", gap: 3 }}>
                <Clock size={9} strokeWidth={IW} /> {fmtDate(entry.savedAt)}
              </div>
              <button
                onClick={() => onOpen(entry)}
                style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "3px 9px", borderRadius: T.rSm,
                  background: color, color: "#fff",
                  border: "none", cursor: "pointer", fontFamily: FONT,
                  fontSize: 10, fontWeight: 700,
                }}
              >
                <ExternalLink size={9} strokeWidth={IW} /> Laden
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ─── Strategieplan Modal ──────────────────────────────────────────────────────

const StratModal = memo(function StratModal({ client, reports, contentReports, schemaReports, socialReports, onClose }) {
  const storageKey = `cxf_strat_${(client.domain || "").replace(/\./g, "_")}`;
  const [plan, setPlan]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setPlan(JSON.parse(saved));
    } catch {}
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [storageKey]);

  const availableTypes = REPORT_TYPES.filter(t => {
    if (t.id === "website") return !!reports[client.domain];
    if (t.id === "content") return !!contentReports?.[client.domain];
    if (t.id === "schema")  return !!schemaReports?.[client.domain];
    if (t.id === "social")  return !!socialReports?.[client.domain];
    return false;
  });

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError("");

    // Collect summary data only (stay within token limits)
    const websiteR = reports[client.domain];
    const contentR = contentReports?.[client.domain];
    const schemaR  = schemaReports?.[client.domain];
    const socialR  = socialReports?.[client.domain];

    const dataSummary = {};
    if (websiteR) {
      dataSummary.website = {
        traffic: websiteR.ai?.trafficEstimate?.monthly,
        category: websiteR.ai?.category,
        trendSignal: websiteR.ai?.trendSignal,
        audienceType: websiteR.ai?.audienceType,
        topKeywords: websiteR.ai?.topKeywords?.slice(0, 5),
        techStack: websiteR.ai?.techStack?.slice(0, 5),
        summary: websiteR.ai?.summary,
      };
    }
    if (contentR) {
      dataSummary.content = {
        articleCount: contentR.articleCount ?? contentR.articles?.length,
        tone: contentR.tone,
        avgWordCount: contentR.avgWordCount,
        topTopics: contentR.topTopics?.slice(0, 5),
        summary: contentR.summary,
      };
    }
    if (schemaR) {
      const pages = schemaR.pages || [];
      dataSummary.schema = {
        totalPages: pages.length,
        validPages: pages.filter(p => p.status === "valid").length,
        errorPages: pages.filter(p => p.status === "error").length,
        warningPages: pages.filter(p => p.status === "warning").length,
        schemaTypes: schemaR.schemaTypes,
      };
    }
    if (socialR) {
      dataSummary.social = {
        score: socialR.score,
        activePlatforms: Object.entries(socialR.profiles || {})
          .filter(([, v]) => v?.url)
          .map(([k]) => k),
        followers: socialR.totalFollowers,
        engagementRate: socialR.engagementRate,
      };
    }

    const prompt = `Du bist ein erfahrener Digital-Marketing-Stratege. Analysiere die vorliegenden Daten für den Kunden "${client.name}" (Domain: ${client.domain}) und erstelle einen konkreten, datenbasierten Strategieplan.

Verfügbare Analysedaten:
${JSON.stringify(dataSummary, null, 2)}

Antworte AUSSCHLIESSLICH mit validem JSON in exakt diesem Format:
{
  "executive_summary": "2-3 Sätze Gesamtbewertung",
  "current_score": { "overall": 0-100, "label": "gut|ausbaufähig|kritisch" },
  "priorities": [
    {
      "rank": 1,
      "category": "traffic|content|technical|social",
      "title": "Kurzer Titel",
      "problem": "Was ist das konkrete Problem (mit Daten)",
      "action": "Was genau tun",
      "impact": "Welche Kennzahl verbessert sich wie stark",
      "timeline": "In X Wochen/Monaten",
      "effort": "low|medium|high",
      "kpis": ["Kennzahl 1", "Kennzahl 2"]
    }
  ],
  "forecast_90_days": "Was realistisch in 90 Tagen erreichbar ist",
  "quick_wins": ["Sofortmaßnahme 1", "Sofortmaßnahme 2", "Sofortmaßnahme 3"]
}

Erstelle 3-5 Prioritäten basierend auf den tatsächlichen Daten. Kein Text außerhalb des JSON.`;

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], max_tokens: 2000 }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
      const d = await res.json();
      const text = d.content?.[0]?.text ?? d.choices?.[0]?.message?.content ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Kein JSON in der Antwort gefunden");
      const parsed = JSON.parse(jsonMatch[0]);
      setPlan(parsed);
      try { localStorage.setItem(storageKey, JSON.stringify(parsed)); } catch {}
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || "Fehler beim Generieren");
    } finally {
      setLoading(false);
    }
  }, [client, reports, contentReports, schemaReports, socialReports, storageKey]);

  const scoreColor = plan?.current_score?.label === "gut"
    ? "#059669"
    : plan?.current_score?.label === "kritisch"
    ? "#ef4444"
    : "#d97706";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "90vw", maxWidth: 860,
        maxHeight: "90vh", overflowY: "auto",
        background: C.surface,
        borderRadius: T.rLg,
        border: `1px solid ${C.border}`,
        boxShadow: T.shadowLg,
        display: "flex", flexDirection: "column",
      }}>
        {/* Modal header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "flex-start", gap: 14,
          position: "sticky", top: 0, background: C.surface, zIndex: 1,
          borderRadius: `${T.rLg} ${T.rLg} 0 0`,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: T.rMd, flexShrink: 0,
            background: "#7c3aed15", border: "1px solid #7c3aed30",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={18} color="#7c3aed" strokeWidth={IW} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY }}>
              Strategieplan – {client.name}
            </div>
            <div style={{ fontSize: 11, color: C.textSoft, marginTop: 2, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {availableTypes.map(t => (
                <span key={t.id} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: 99,
                  background: t.color + "12", border: `1px solid ${t.color}25`, color: t.color,
                  fontSize: 10, fontWeight: 700,
                }}>
                  <t.icon size={9} strokeWidth={IW} /> {t.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: T.rMd,
                background: loading ? "#7c3aed40" : "#7c3aed",
                color: "#fff", border: "none", cursor: loading ? "default" : "pointer",
                fontFamily: FONT, fontSize: 12, fontWeight: 700,
              }}
            >
              <RefreshCw size={13} strokeWidth={IW} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              {plan ? "Neu generieren" : "Generieren"}
            </button>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: T.rSm,
                background: "transparent", border: `1px solid ${C.border}`,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={15} color={C.textSoft} strokeWidth={IW} />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Error */}
          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: T.rMd,
              background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b",
              fontSize: 13, display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertTriangle size={15} strokeWidth={IW} /> {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !plan && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: i === 1 ? 80 : 100, borderRadius: T.rMd,
                  background: `linear-gradient(90deg, ${C.bg} 25%, ${C.border} 50%, ${C.bg} 75%)`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.4s infinite",
                }} />
              ))}
            </div>
          )}

          {/* Plan content */}
          {plan && !loading && (
            <>
              {/* Current score + executive summary */}
              <div style={{
                padding: "16px 20px", borderRadius: T.rMd,
                background: "#EFF6FF", border: "1px solid #BFDBFE",
                display: "flex", gap: 16, alignItems: "flex-start",
              }}>
                {plan.current_score && (
                  <div style={{
                    flexShrink: 0, width: 60, height: 60, borderRadius: T.rMd,
                    background: scoreColor + "15", border: `2px solid ${scoreColor}40`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                      {plan.current_score.overall}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: scoreColor + "cc", marginTop: 2 }}>
                      {plan.current_score.label}
                    </div>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#1e40af", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Executive Summary
                  </div>
                  <div style={{ fontSize: 13, color: "#1e3a8a", lineHeight: 1.6 }}>
                    {plan.executive_summary}
                  </div>
                </div>
              </div>

              {/* Quick wins */}
              {plan.quick_wins?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.textSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Quick Wins
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {plan.quick_wins.map((win, i) => (
                      <div key={i} style={{
                        padding: "5px 12px", borderRadius: 99,
                        background: "#fef3c7", border: "1px solid #fcd34d",
                        fontSize: 12, color: "#92400e", fontWeight: 600,
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                        <CheckCircle size={11} color="#d97706" strokeWidth={IW} />
                        {win}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Priorities */}
              {plan.priorities?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.textSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Handlungsprioritäten
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {plan.priorities.map((p, idx) => {
                      const catColor = CAT_COLORS[p.category] || C.accent;
                      const effortStyle = EFFORT_COLORS[p.effort] || EFFORT_COLORS.medium;
                      return (
                        <div key={idx} style={{
                          padding: "14px 16px", borderRadius: T.rMd,
                          background: C.bg, border: `1px solid ${catColor}25`,
                          borderLeft: `3px solid ${catColor}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                            {/* Rank */}
                            <div style={{
                              width: 28, height: 28, borderRadius: T.rSm, flexShrink: 0,
                              background: catColor + "15", border: `1px solid ${catColor}30`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, fontWeight: 900, color: catColor,
                            }}>
                              {p.rank}
                            </div>
                            {/* Title + badges */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.title}</span>
                                <span style={{
                                  padding: "2px 8px", borderRadius: 99,
                                  background: catColor + "15", color: catColor,
                                  fontSize: 10, fontWeight: 700,
                                }}>{p.category}</span>
                                {p.effort && (
                                  <span style={{
                                    padding: "2px 8px", borderRadius: 99,
                                    background: effortStyle.bg, color: effortStyle.color,
                                    fontSize: 10, fontWeight: 700,
                                  }}>{p.effort}</span>
                                )}
                                {p.timeline && (
                                  <span style={{
                                    padding: "2px 8px", borderRadius: 99,
                                    background: C.surface, border: `1px solid ${C.border}`,
                                    fontSize: 10, color: C.textSoft, fontWeight: 600,
                                    display: "flex", alignItems: "center", gap: 3,
                                  }}>
                                    <Clock size={9} strokeWidth={IW} /> {p.timeline}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ paddingLeft: 38, display: "flex", flexDirection: "column", gap: 5 }}>
                            {p.problem && (
                              <div style={{ fontSize: 12, color: "#991b1b", lineHeight: 1.5 }}>
                                <span style={{ fontWeight: 700 }}>Problem: </span>{p.problem}
                              </div>
                            )}
                            {p.action && (
                              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                                <span style={{ fontWeight: 700, color: catColor }}>Maßnahme: </span>{p.action}
                              </div>
                            )}
                            {p.impact && (
                              <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>
                                <span style={{ fontWeight: 700 }}>Impact: </span>{p.impact}
                              </div>
                            )}
                            {p.kpis?.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 3 }}>
                                {p.kpis.map((kpi, ki) => (
                                  <span key={ki} style={{
                                    padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                                    background: catColor + "10", color: catColor, border: `1px solid ${catColor}20`,
                                  }}>
                                    {kpi}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Forecast */}
              {plan.forecast_90_days && (
                <div style={{
                  padding: "14px 18px", borderRadius: T.rMd,
                  background: "#f0fdf4", border: "1px solid #bbf7d0",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    90-Tage-Prognose
                  </div>
                  <div style={{ fontSize: 13, color: "#14532d", lineHeight: 1.6 }}>
                    {plan.forecast_90_days}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state (no plan yet) */}
          {!plan && !loading && !error && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <Sparkles size={36} color="#7c3aed" strokeWidth={IW} style={{ margin: "0 auto 14px" }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                Noch kein Strategieplan generiert
              </div>
              <p style={{ fontSize: 13, color: C.textSoft, maxWidth: 380, margin: "0 auto 20px", lineHeight: 1.7 }}>
                Klicke auf "Generieren" um auf Basis der vorhandenen Reports einen KI-gestützten Strategieplan zu erstellen.
              </p>
              <button
                onClick={handleGenerate}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: T.rMd,
                  background: "#7c3aed", color: "#fff",
                  border: "none", cursor: "pointer", fontFamily: FONT,
                  fontSize: 13, fontWeight: 700,
                }}
              >
                <Sparkles size={14} strokeWidth={IW} /> Strategieplan generieren
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { clients, addClient, removeClient, reports, contentReports, schemaReports, socialReports, setActiveReport, goNav } = useApp();
  const [showForm, setShowForm]           = useState(false);
  const [form, setForm]                   = useState({ name: "", domain: "" });
  const [formErr, setFormErr]             = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [openHistory, setOpenHistory]     = useState({});
  const [openCards, setOpenCards]         = useState(new Set());
  const [stratClient, setStratClient]     = useState(null);

  // Build report map per type for each domain
  function getReport(domain, typeId) {
    if (typeId === "website") return reports[domain];
    if (typeId === "content") return contentReports?.[domain];
    if (typeId === "schema")  return schemaReports?.[domain];
    if (typeId === "social")  return socialReports?.[domain];
    return null;
  }

  const handleAdd = useCallback((e) => {
    e.preventDefault();
    const name   = form.name.trim();
    const domain = cleanDomain(form.domain);
    if (!name)   return setFormErr("Name erforderlich");
    if (!domain) return setFormErr("Domain erforderlich");
    addClient(name, domain);
    setForm({ name: "", domain: "" });
    setFormErr("");
    setShowForm(false);
  }, [form, addClient]);

  const handleOpen = useCallback((client, entry) => {
    const { type, data } = entry;
    if (type === "website") {
      setActiveReport({ domain: client.domain, ...data });
      goNav("report");
    } else if (type === "content") {
      goNav("content", { domain: client.domain, report: data });
    } else if (type === "schema") {
      goNav("feat-schema-validator");
    }
  }, [setActiveReport, goNav]);

  const handleAnalyze = useCallback((client, typeId) => {
    if (typeId === "website") {
      goNav("analyze", { domain: client.domain });
    } else if (typeId === "content") {
      goNav("content", { domain: client.domain });
    } else if (typeId === "schema") {
      goNav("feat-schema-validator");
    }
  }, [goNav]);

  const handleOpenCurrentReport = useCallback((client, typeId) => {
    const report = getReport(client.domain, typeId);
    if (!report) return;
    if (typeId === "website") {
      setActiveReport({ domain: client.domain, ...report });
      goNav("report");
    } else if (typeId === "content") {
      goNav("content", { domain: client.domain, report });
    } else if (typeId === "schema") {
      goNav("feat-schema-validator");
    } else if (typeId === "social") {
      goNav("social-media-stats");
    }
  }, [reports, contentReports, schemaReports, socialReports, setActiveReport, goNav]);

  const handleDelete = useCallback((id) => {
    if (deleteConfirm === id) {
      removeClient(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  }, [deleteConfirm, removeClient]);

  const toggleHistory = useCallback((id) => {
    setOpenHistory(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleCard = useCallback((id) => {
    setOpenCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const totalReports = useMemo(() => {
    return clients.reduce((sum, c) => {
      return sum + REPORT_TYPES.filter(t => !!getReport(c.domain, t.id)).length;
    }, 0);
  }, [clients, reports, contentReports, schemaReports, socialReports]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 60px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: T.rMd, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={22} color={C.accent} strokeWidth={IW} />
          </div>
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Kunden</h1>
            <p style={{ fontSize: 13, color: C.textSoft, margin: 0 }}>
              {clients.length > 0
                ? `${clients.length} Domain${clients.length !== 1 ? "s" : ""} · ${totalReports} gespeicherte Reports`
                : "Kundendomains verwalten und schnell analysieren"}
            </p>
          </div>
        </div>
        <Btn icon={Plus} onClick={() => { setShowForm(true); setFormErr(""); }}>
          Kunde hinzufügen
        </Btn>
      </div>

      {/* Report types legend */}
      {clients.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {REPORT_TYPES.map(({ id, label, icon: Icon, color }) => (
            <div key={id} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
              background: color + "10", border: `1px solid ${color}25`, color,
            }}>
              <Icon size={11} strokeWidth={IW} /> {label}
            </div>
          ))}
          <div style={{ fontSize: 11, color: C.textMute, display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
            <History size={11} strokeWidth={IW} /> Bis zu 5 Reports pro Typ gespeichert
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <Card style={{ padding: 20, marginBottom: 20, borderTop: `3px solid ${C.accent}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Neuer Kunde</div>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <X size={16} color={C.textSoft} strokeWidth={IW} />
            </button>
          </div>
          <form onSubmit={handleAdd}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, marginBottom: 6 }}>Kundenname *</div>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="z.B. Müller GmbH"
                  autoFocus
                  style={{ width: "100%", padding: "9px 12px", borderRadius: T.rMd, border: `1px solid ${C.border}`, background: C.bg, fontFamily: FONT, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, marginBottom: 6 }}>Domain *</div>
                <input
                  value={form.domain}
                  onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                  placeholder="beispiel.de"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: T.rMd, border: `1px solid ${C.border}`, background: C.bg, fontFamily: FONT, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
            {formErr && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{formErr}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn type="submit" icon={Plus}>Speichern</Btn>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Abbrechen</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Empty state */}
      {clients.length === 0 ? (
        <Card style={{ padding: 64, textAlign: "center" }}>
          <Users size={44} color={C.textSoft} strokeWidth={IW} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.textMid, marginBottom: 8 }}>Noch keine Kunden</div>
          <p style={{ fontSize: 13, color: C.textSoft, maxWidth: 360, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Speichere Kundendomains und starte Website-Analyse, Content-Audit und Structure-Audit — alle Reports werden automatisch hier gespeichert.
          </p>
          <Btn icon={Plus} onClick={() => setShowForm(true)}>Ersten Kunden hinzufügen</Btn>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clients.map(client => {
            const ai          = reports[client.domain]?.ai || {};
            const TrendIcon   = TREND_ICONS[ai.trendSignal] || Minus;
            const trendColor  = TREND_COLORS[ai.trendSignal] || C.textSoft;
            const anyReport   = REPORT_TYPES.some(t => !!getReport(client.domain, t.id));
            const isHistOpen  = !!openHistory[client.id];
            const isOpen      = openCards.has(client.id);
            const reportCount = REPORT_TYPES.filter(t => !!getReport(client.domain, t.id)).length;
            const canStrat    = reportCount >= 2;

            return (
              <Card key={client.id} style={{ padding: 0, overflow: "hidden" }}>

                {/* ── Collapsed header row (always visible) ──────────────── */}
                <div
                  onClick={() => toggleCard(client.id)}
                  style={{
                    padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                    cursor: "pointer",
                    background: isOpen ? C.surface : C.bg,
                    borderBottom: isOpen ? `1px solid ${C.border}` : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = C.surface; }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = C.bg; }}
                >
                  {/* Letter avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: T.rMd, flexShrink: 0,
                    background: anyReport ? C.accentLight : C.bg,
                    border: `1px solid ${anyReport ? C.accent + "30" : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, color: C.accent,
                  }}>
                    {client.name.slice(0, 1).toUpperCase()}
                  </div>

                  {/* Name + domain */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{client.name}</span>
                      <span style={{ fontSize: 11, color: C.textSoft, fontFamily: "monospace" }}>{client.domain}</span>
                      {reportCount > 0 && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: C.accent,
                          background: C.accentLight, padding: "1px 6px", borderRadius: 99,
                        }}>
                          {reportCount}/{REPORT_TYPES.length} Reports
                        </span>
                      )}
                    </div>

                    {/* Colored dots for available reports */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                      {REPORT_TYPES.map(t => {
                        const has = !!getReport(client.domain, t.id);
                        return (
                          <div key={t.id} style={{
                            display: "flex", alignItems: "center", gap: 3,
                          }}>
                            <div style={{
                              width: 7, height: 7, borderRadius: "50%",
                              background: has ? t.color : C.border,
                              flexShrink: 0,
                            }} />
                            {has && (
                              <span style={{ fontSize: 10, color: t.color, fontWeight: 600 }}>{t.label}</span>
                            )}
                          </div>
                        );
                      })}

                      {/* AI tags (category / trend) */}
                      {ai.category && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: C.info || "#0ea5e9",
                          background: (C.infoBg || "#e0f2fe"), padding: "1px 6px", borderRadius: 99,
                        }}>{ai.category}</span>
                      )}
                      {ai.trendSignal && (
                        <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, fontWeight: 600, color: trendColor }}>
                          <TrendIcon size={9} color={trendColor} strokeWidth={IW} />
                          {ai.trendSignal}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Strategieplan button */}
                  {canStrat && (
                    <button
                      onClick={e => { e.stopPropagation(); setStratClient(client); }}
                      title="Strategieplan generieren"
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "6px 12px", borderRadius: T.rMd, flexShrink: 0,
                        background: "#7c3aed12", border: "1px solid #7c3aed30",
                        color: "#7c3aed", cursor: "pointer", fontFamily: FONT,
                        fontSize: 11, fontWeight: 700,
                      }}
                    >
                      <Sparkles size={12} strokeWidth={IW} /> Strategieplan
                    </button>
                  )}

                  {/* Expand chevron */}
                  <div style={{ color: C.textSoft, flexShrink: 0 }}>
                    {isOpen
                      ? <ChevronUp size={15} strokeWidth={IW} />
                      : <ChevronDown size={15} strokeWidth={IW} />
                    }
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(client.id); }}
                    title={deleteConfirm === client.id ? "Nochmal klicken zum Bestätigen" : "Kunde entfernen"}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 28, height: 28, borderRadius: T.rSm, flexShrink: 0,
                      background: deleteConfirm === client.id ? "#ef444420" : "transparent",
                      border: `1px solid ${deleteConfirm === client.id ? "#ef4444" : C.border}`,
                      color: deleteConfirm === client.id ? "#ef4444" : C.textSoft,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={12} strokeWidth={IW} />
                  </button>
                </div>

                {/* ── Expanded body ─────────────────────────────────────────── */}
                {isOpen && (
                  <>
                    {/* ── Report rows ─────────────────────────────────────── */}
                    <div style={{ padding: "14px 18px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {REPORT_TYPES.map(typeDef => (
                        <ReportRow
                          key={typeDef.id}
                          typeDef={typeDef}
                          report={getReport(client.domain, typeDef.id)}
                          onOpen={() => handleOpenCurrentReport(client, typeDef.id)}
                          onAnalyze={() => handleAnalyze(client, typeDef.id)}
                        />
                      ))}
                    </div>

                    {/* ── History toggle ───────────────────────────────────── */}
                    <button
                      onClick={() => toggleHistory(client.id)}
                      style={{
                        width: "100%", padding: "8px 18px",
                        background: C.bg, border: "none",
                        borderTop: `1px solid ${C.border}`,
                        cursor: "pointer", fontFamily: FONT,
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: 11, color: C.textSoft, fontWeight: 600,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = C.surface}
                      onMouseLeave={e => e.currentTarget.style.background = C.bg}
                    >
                      <History size={11} strokeWidth={IW} color={C.accent} />
                      Report-Verlauf (max. 5 pro Typ)
                      <div style={{ marginLeft: "auto" }}>
                        {isHistOpen ? <ChevronUp size={12} strokeWidth={IW} /> : <ChevronDown size={12} strokeWidth={IW} />}
                      </div>
                    </button>

                    {isHistOpen && (
                      <div style={{ padding: "12px 18px 16px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
                        <HistoryPanel
                          domain={client.domain}
                          onOpen={entry => handleOpen(client, entry)}
                        />
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Strategieplan Modal */}
      {stratClient && (
        <StratModal
          client={stratClient}
          reports={reports}
          contentReports={contentReports}
          schemaReports={schemaReports}
          socialReports={socialReports}
          onClose={() => setStratClient(null)}
        />
      )}
    </div>
  );
}
