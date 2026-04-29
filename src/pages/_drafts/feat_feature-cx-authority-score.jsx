import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext.jsx";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import {
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Download,
  Search,
  Globe,
  BarChart2,
  Zap,
  Link2,
  Clock,
  Shield,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Layers,
} from "lucide-react";

// ─── AuthorityScoreRing ──────────────────────────────────────────────────────
const AuthorityScoreRing = ({ score = 0, size = 160, animate = true }) => {
  const [displayed, setDisplayed] = useState(0);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayed / 100) * circumference;

  const getColor = (s) => {
    if (s >= 70) return C.success || "#22c55e";
    if (s >= 40) return C.warning || "#f59e0b";
    return C.danger || "#ef4444";
  };

  useEffect(() => {
    if (!animate) { setDisplayed(score); return; }
    let start = null;
    const duration = 1200;
    const step = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [score, animate]);

  const scoreColor = getColor(score);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={T.border || "rgba(255,255,255,0.08)"}
          strokeWidth={12}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: FONT_DISPLAY,
          fontSize: size > 120 ? 36 : 24,
          fontWeight: 800,
          color: scoreColor,
          lineHeight: 1,
        }}>{displayed}</span>
        <span style={{ fontSize: 10, color: T.muted, fontFamily: FONT, marginTop: 2 }}>/ 100</span>
      </div>
    </div>
  );
};

// ─── AuthorityTrendSparkline ─────────────────────────────────────────────────
const AuthorityTrendSparkline = ({ data = [] }) => {
  if (!data || data.length < 2) return null;
  const W = 120, H = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const last = data[data.length - 1];
  const first = data[0];
  const trend = last > first ? "up" : last < first ? "down" : "flat";
  const trendColor = trend === "up" ? (C.success || "#22c55e") : trend === "down" ? (C.danger || "#ef4444") : (T.muted);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={W} height={H}>
        <polyline points={pts} fill="none" stroke={trendColor} strokeWidth={2} strokeLinejoin="round" />
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {trend === "up" && <TrendingUp size={14} color={trendColor} strokeWidth={IW} />}
        {trend === "down" && <TrendingDown size={14} color={trendColor} strokeWidth={IW} />}
        {trend === "flat" && <Minus size={14} color={trendColor} strokeWidth={IW} />}
        <span style={{ fontSize: 12, color: trendColor, fontFamily: FONT }}>
          {last > first ? "+" : ""}{last - first} pts
        </span>
      </div>
    </div>
  );
};

// ─── IndustryBenchmarkBadge ──────────────────────────────────────────────────
const IndustryBenchmarkBadge = ({ percentile, category }) => {
  if (!percentile) return null;
  const isTop = percentile <= 25;
  const color = isTop ? (C.success || "#22c55e") : (C.accent || "#6366f1");
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      borderRadius: 20, padding: "4px 12px",
    }}>
      <Award size={13} color={color} strokeWidth={IW} />
      <span style={{ fontSize: 12, fontFamily: FONT, fontWeight: 600, color }}>
        Top {percentile}% in {category || "deiner Kategorie"}
      </span>
    </div>
  );
};

// ─── ScoreBreakdownPanel ─────────────────────────────────────────────────────
const COMPONENT_META = [
  { key: "backlink_volume", label: "Backlink-Volumen", icon: Link2, weight: 25, desc: "Anzahl und Qualität der eingehenden Links" },
  { key: "pagerank", label: "PageRank-Schätzung", icon: Globe, weight: 20, desc: "Algorithmische Linkautorität der Domain" },
  { key: "organic_traffic", label: "Organischer Traffic", icon: TrendingUp, weight: 20, desc: "Geschätztes monatliches SEO-Traffic-Volumen" },
  { key: "seo_audit", label: "SEO-Audit-Score", icon: Shield, weight: 15, desc: "Technische On-Page SEO-Gesundheit" },
  { key: "performance", label: "Performance-Score", icon: Zap, weight: 12, desc: "Core Web Vitals & Ladegeschwindigkeit" },
  { key: "domain_age", label: "Domain-Alter", icon: Clock, weight: 8, desc: "Vertrauenssignal durch Domainhistorie" },
];

const ScoreBreakdownPanel = ({ components = {}, isOpen, onToggle }) => {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "none", border: "none", cursor: "pointer", padding: "8px 0",
          color: T.text, fontFamily: FONT,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Score-Aufschlüsselung</span>
        {isOpen
          ? <ChevronUp size={16} color={T.muted} strokeWidth={IW} />
          : <ChevronDown size={16} color={T.muted} strokeWidth={IW} />}
      </button>

      {isOpen && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
          {COMPONENT_META.map((meta) => {
            const Icon = meta.icon;
            const val = components[meta.key] ?? 0;
            const contribution = Math.round((val / 100) * meta.weight);
            const barColor = val >= 70 ? (C.success || "#22c55e") : val >= 40 ? (C.warning || "#f59e0b") : (C.danger || "#ef4444");

            return (
              <div key={meta.key} style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Icon size={14} color={T.muted} strokeWidth={IW} />
                  <span style={{ flex: 1, fontSize: 13, color: T.text, fontFamily: FONT }}>{meta.label}</span>
                  <button
                    onMouseEnter={() => setTooltip(meta.key)}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                  >
                    <Info size={12} color={T.muted} strokeWidth={IW} />
                  </button>
                  <span style={{ fontSize: 12, color: T.muted, fontFamily: FONT, minWidth: 60, textAlign: "right" }}>
                    {meta.weight}% Gewicht
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: barColor, minWidth: 28, textAlign: "right", fontFamily: FONT }}>
                    {val}
                  </span>
                </div>
                <div style={{ background: T.border || "rgba(255,255,255,0.08)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${val}%`,
                    background: barColor, borderRadius: 4,
                    transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: T.muted, fontFamily: FONT }}>
                    Beitrag: +{contribution} Punkte
                  </span>
                </div>
                {tooltip === meta.key && (
                  <div style={{
                    position: "absolute", right: 0, top: 24, zIndex: 99,
                    background: T.cardAlt || C.surface || "#1e1e2e",
                    border: `1px solid ${T.border || "rgba(255,255,255,0.1)"}`,
                    borderRadius: 8, padding: "8px 12px", maxWidth: 220,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  }}>
                    <p style={{ fontSize: 12, color: T.text, fontFamily: FONT, margin: 0 }}>{meta.desc}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── ScoreExplainerModal ─────────────────────────────────────────────────────
const ScoreExplainerModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div
        style={{
          background: T.card || C.surface || "#16162a",
          border: `1px solid ${T.border || "rgba(255,255,255,0.1)"}`,
          borderRadius: 16, padding: 28, maxWidth: 560, width: "100%",
          maxHeight: "80vh", overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <HelpCircle size={20} color={C.accent || "#6366f1"} strokeWidth={IW} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text, fontFamily: FONT_DISPLAY }}>
              Wie wird der cx Authority Score berechnet?
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
            <X size={18} color={T.muted} strokeWidth={IW} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: `${C.accent || "#6366f1"}12`, borderRadius: 10, padding: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: T.text, fontFamily: FONT, lineHeight: 1.7 }}>
              Der <strong>cx Authority Score (cxAS)</strong> ist ein aggregierter Autoritäts-Indikator auf einer Skala von 0–100,
              der 6 unabhängige Datenpunkte durch eine KI-gewichtete Formel kombiniert. Er ist vergleichbar mit Moz Domain Authority
              oder Ahrefs Domain Rating — aber optimiert für die cx-fusion Datenquellen.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: FONT, marginBottom: 10 }}>
              Formel-Übersicht
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {COMPONENT_META.map(m => (
                <div key={m.key} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px",
                  background: T.cardAlt || "rgba(255,255,255,0.03)",
                  borderRadius: 8, border: `1px solid ${T.border || "rgba(255,255,255,0.06)"}`,
                }}>
                  <span style={{ fontSize: 13, color: T.text, fontFamily: FONT }}>{m.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      background: `${C.accent || "#6366f1"}20`,
                      borderRadius: 12, padding: "2px 8px",
                    }}>
                      <span style={{ fontSize: 12, color: C.accent || "#6366f1", fontWeight: 700, fontFamily: FONT }}>
                        {m.weight}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: FONT, marginBottom: 10 }}>
              Bewertungsskala
            </h3>
            {[
              { range: "70–100", label: "Hohe Autorität", color: C.success || "#22c55e" },
              { range: "40–69", label: "Mittlere Autorität", color: C.warning || "#f59e0b" },
              { range: "0–39", label: "Niedrige Autorität", color: C.danger || "#ef4444" },
            ].map(s => (
              <div key={s.range} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: s.color, fontFamily: FONT, minWidth: 56 }}>{s.range}</span>
                <span style={{ fontSize: 13, color: T.muted, fontFamily: FONT }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: `${C.warning || "#f59e0b"}10`,
            border: `1px solid ${C.warning || "#f59e0b"}30`,
            borderRadius: 8, padding: 12,
          }}>
            <p style={{ margin: 0, fontSize: 12, color: T.muted, fontFamily: FONT, lineHeight: 1.6 }}>
              <strong style={{ color: T.text }}>Hinweis:</strong> Der cxAS ist ein relativer Score und kein absoluter Ranking-Faktor.
              Er dient als Orientierungswert für Vergleiche und Reporting. Alle Datenpunkte werden täglich aktualisiert.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ComparisonScoreBar ──────────────────────────────────────────────────────
const ComparisonScoreBar = ({ domains = [] }) => {
  if (!domains.length) return null;
  const maxScore = Math.max(...domains.map(d => d.score || 0), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {domains.map((d, i) => {
        const color = i === 0 ? (C.accent || "#6366f1") : (T.muted);
        const barColor = d.score >= 70 ? (C.success || "#22c55e") : d.score >= 40 ? (C.warning || "#f59e0b") : (C.danger || "#ef4444");
        return (
          <div key={d.domain || i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: T.text, fontFamily: FONT }}>{d.domain}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: barColor, fontFamily: FONT }}>{d.score}</span>
            </div>
            <div style={{ background: T.border || "rgba(255,255,255,0.08)", borderRadius: 6, height: 10, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(d.score / 100) * 100}%`,
                background: barColor,
                borderRadius: 6,
                transition: "width 1s cubic-bezier(.4,0,.2,1)",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── BatchAnalysisScoreColumn ────────────────────────────────────────────────
const BatchAnalysisScoreColumn = ({ items = [] }) => {
  if (!items.length) return (
    <div style={{ textAlign: "center", padding: 20, color: T.muted, fontFamily: FONT, fontSize: 13 }}>
      Keine Batch-Daten vorhanden
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.border || "rgba(255,255,255,0.08)"}` }}>
            {["Domain", "cxAS", "Backlinks", "Traffic", "SEO", "Perf.", "Alter"].map(h => (
              <th key={h} style={{
                padding: "8px 12px", textAlign: "left",
                fontSize: 11, fontWeight: 600, color: T.muted,
                fontFamily: FONT, whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const sc = item.score || 0;
            const scoreColor = sc >= 70 ? (C.success || "#22c55e") : sc >= 40 ? (C.warning || "#f59e0b") : (C.danger || "#ef4444");
            return (
              <tr key={i} style={{
                borderBottom: `1px solid ${T.border || "rgba(255,255,255,0.04)"}`,
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
              }}>
                <td style={{ padding: "10px 12px", fontSize: 13, color: T.text, fontFamily: FONT }}>{item.domain}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: scoreColor, fontFamily: FONT_DISPLAY }}>{sc}</span>
                    <div style={{
                      width: 40, height: 6,
                      background: T.border || "rgba(255,255,255,0.08)",
                      borderRadius: 3, overflow: "hidden",
                    }}>
                      <div style={{ height: "100%", width: `${sc}%`, background: scoreColor, borderRadius: 3 }} />
                    </div>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: T.muted, fontFamily: FONT }}>{item.backlinks ?? "—"}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: T.muted, fontFamily: FONT }}>{item.traffic ?? "—"}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: T.muted, fontFamily: FONT }}>{item.seo ?? "—"}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: T.muted, fontFamily: FONT }}>{item.performance ?? "—"}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: T.muted, fontFamily: FONT }}>{item.age ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const AI_ENDPOINT = "/ai";
const AI_FALLBACK = "https://socialflow-pro.pages.dev/ai";

async function callAI(payload) {
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("primary");
    return await res.json();
  } catch {
    const res = await fetch(AI_FALLBACK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("ai_unavailable");
    return await res.json();
  }
}

const TABS = ["Analyse", "Vergleich", "Batch", "Methodik"];

export default function CxAuthorityScore() {
  const { goNav } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [compareDomains, setCompareDomains] = useState([]);
  const [compareInput, setCompareInput] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [batchResults, setBatchResults] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const inputRef = useRef(null);

  const analyzeAuthority = useCallback(async (targetDomain) => {
    if (!targetDomain.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await callAI({
        prompt: `Du bist ein Domain-Autoritäts-Analyse-Experte. Analysiere die Domain "${targetDomain}" und berechne einen cx Authority Score von 0-100.

Antworte NUR mit validem JSON in diesem exakten Format:
{
  "domain": "${targetDomain}",
  "authority_score": <number 0-100>,
  "components": {
    "backlink_volume": <number 0-100>,
    "pagerank": <number 0-100>,
    "organic_traffic": <number 0-100>,
    "seo_audit": <number 0-100>,
    "performance": <number 0-100>,
    "domain_age": <number 0-100>
  },
  "industry": "<Kategorie auf Deutsch>",
  "percentile": <number 1-100>,
  "trend_data": [<30 Zahlen 0-100 als 30-Tage Verlauf>],
  "summary": "<2-3 Sätze Expertenzusammenfassung auf Deutsch>",
  "raw_metrics": {
    "backlinks_estimate": "<z.B. 12.400>",
    "monthly_traffic": "<z.B. 45.000>",
    "domain_age_years": <number>,
    "indexed_pages": "<z.B. 8.200>"
  }
}`,
        model: "gpt-4o-mini",
      });

      let parsed = data;
      if (typeof data === "string") {
        const match = data.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } else if (data.content) {
        const match = data.content.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } else if (data.choices?.[0]?.message?.content) {
        const match = data.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }

      setResult(parsed);
    } catch (err) {
      console.error("Authority analysis failed:", err);
      setError("Analyse fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, []);

  const addComparisonDomain = useCallback(async () => {
    if (!compareInput.trim()) return;
    const target = compareInput.trim();
    setCompareInput("");

    try {
      const data = await callAI({
        prompt: `Analysiere die Domain "${target}" und gib nur JSON zurück: {"domain": "${target}", "score": <0-100>, "industry": "<kategorie>"}`,
        model: "gpt-4o-mini",
      });
      let parsed = data;
      if (typeof data === "string") { const m = data.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); }
      else if (data.content) { const m = data.content.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); }
      else if (data.choices?.[0]?.message?.content) { const m = data.choices[0].message.content.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); }
      setCompareDomains(prev => [...prev.filter(d => d.domain !== parsed.domain), parsed]);
    } catch (err) {
      console.error("Comparison domain failed:", err);
    }
  }, [compareInput]);

  const runBatchAnalysis = useCallback(async () => {
    const domains = batchInput.split("\n").map(d => d.trim()).filter(Boolean);
    if (!domains.length) return;
    setBatchLoading(true);
    setBatchResults([]);

    try {
      const data = await callAI({
        prompt: `Analysiere diese Domains und gib ein JSON-Array zurück:
Domains: ${domains.join(", ")}

Format: [{"domain": "...", "score": <0-100>, "backlinks": "<num>", "traffic": "<num>", "seo": <0-100>, "performance": <0-100>, "age": "<X Jahre>"}]

Antworte NUR mit dem JSON-Array.`,
        model: "gpt-4o-mini",
      });
      let parsed = data;
      if (typeof data === "string") { const m = data.match(/\[[\s\S]*\]/); if (m) parsed = JSON.parse(m[0]); }
      else if (data.content) { const m = data.content.match(/\[[\s\S]*\]/); if (m) parsed = JSON.parse(m[0]); }
      else if (data.choices?.[0]?.message?.content) { const m = data.choices[0].message.content.match(/\[[\s\S]*\]/); if (m) parsed = JSON.parse(m[0]); }
      if (Array.isArray(parsed)) setBatchResults(parsed);
    } catch (err) {
      console.error("Batch analysis failed:", err);
    } finally {
      setBatchLoading(false);
    }
  }, [batchInput]);

  const cardStyle = {
    background: T.card || "rgba(255,255,255,0.04)",
    border: `1px solid ${T.border || "rgba(