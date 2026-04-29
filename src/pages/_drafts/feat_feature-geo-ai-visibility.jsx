import { useState, useEffect, useCallback } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import {
  Globe,
  Brain,
  Shield,
  TrendingUp,
  CheckCircle,
  Circle,
  AlertCircle,
  ChevronRight,
  Search,
  BarChart2,
  Layers,
  Star,
  Award,
  BookOpen,
  Link2,
  FileText,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  Target,
  Eye,
  Users,
} from "lucide-react";

const AI_ENDPOINT = "/ai";
const AI_FALLBACK = "https://socialflow-pro.pages.dev/ai";

async function fetchAI(prompt) {
  const body = JSON.stringify({ message: prompt });
  const headers = { "Content-Type": "application/json" };
  try {
    const res = await fetch(AI_ENDPOINT, { method: "POST", headers, body });
    if (!res.ok) throw new Error("primary");
    return await res.json();
  } catch {
    const res = await fetch(AI_FALLBACK, { method: "POST", headers, body });
    if (!res.ok) throw new Error("fallback failed");
    return await res.json();
  }
}

// ── GeoScoreRing ─────────────────────────────────────────────────────────────
function GeoScoreRing({ score, benchmark, loading }) {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const dashOffset = circ * (1 - pct);
  const color =
    score >= 70 ? C.success : score >= 45 ? C.warning : C.danger;

  return (
    <Card style={{ padding: "28px 24px", textAlign: "center", flex: 1, minWidth: 220 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, color: T.secondary, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
        GEO Visibility Score
      </div>
      <div style={{ position: "relative", display: "inline-block" }}>
        {loading ? (
          <div style={{ width: size, height: size, borderRadius: "50%", background: C.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RefreshCw size={32} color={T.muted} strokeWidth={IW} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.surface2} strokeWidth={stroke} />
              <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={stroke}
                strokeDasharray={circ}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 700, color: color, lineHeight: 1 }}>{score}</div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: T.muted, marginTop: 2 }}>/ 100</div>
            </div>
          </>
        )}
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.accent2 }} />
        <span style={{ fontFamily: FONT, fontSize: 12, color: T.secondary }}>
          Branchenschnitt: <strong style={{ color: T.primary }}>{benchmark}</strong>
        </span>
      </div>
      <div style={{ marginTop: 8 }}>
        <Badge color={score >= benchmark ? C.success : C.warning}>
          {score >= benchmark ? `+${score - benchmark} über Benchmark` : `${score - benchmark} unter Benchmark`}
        </Badge>
      </div>
    </Card>
  );
}

// ── AiSourceTracker ──────────────────────────────────────────────────────────
function AiSourceTracker({ citations, loading }) {
  const platforms = [
    { key: "sge", label: "Google SGE", icon: Search, color: "#4285F4" },
    { key: "perplexity", label: "Perplexity AI", icon: Brain, color: "#20B2AA" },
    { key: "chatgpt", label: "ChatGPT Search", icon: Zap, color: "#10a37f" },
  ];

  return (
    <Card style={{ padding: "24px", flex: 1, minWidth: 260 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: T.primary, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Eye size={16} color={C.accent} strokeWidth={IW} />
        AI Source Citations
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 56, borderRadius: 8, background: C.surface2, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {platforms.map(({ key, label, icon: Icon, color }) => {
            const data = citations?.[key] || { count: 0, trend: 0, queries: [] };
            return (
              <div key={key} style={{ background: C.surface2, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color={color} strokeWidth={IW} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT, fontSize: 13, color: T.primary, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontFamily: FONT, fontSize: 11, color: T.muted, marginTop: 2 }}>
                    {data.queries?.slice(0, 1).join(", ") || "Keine Daten"}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: T.primary }}>{data.count}</div>
                  <div style={{ fontFamily: FONT, fontSize: 10, color: data.trend > 0 ? C.success : data.trend < 0 ? C.danger : T.muted, display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end" }}>
                    {data.trend > 0 ? <ArrowUp size={10} strokeWidth={IW} /> : data.trend < 0 ? <ArrowDown size={10} strokeWidth={IW} /> : <Minus size={10} strokeWidth={IW} />}
                    {Math.abs(data.trend)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 12, fontFamily: FONT, fontSize: 11, color: T.muted, fontStyle: "italic" }}>
        * KI-geschätzte Werte auf Basis von Crawl-Daten
      </div>
    </Card>
  );
}

// ── EeatScoreCard ────────────────────────────────────────────────────────────
function EeatScoreCard({ eeat, loading }) {
  const metrics = [
    { key: "experience", label: "Experience", icon: Star, desc: "Direkte Erfahrung mit Themen" },
    { key: "expertise", label: "Expertise", icon: BookOpen, desc: "Fachliches Tiefenwissen" },
    { key: "authoritativeness", label: "Authoritativeness", icon: Award, desc: "Anerkennung durch andere" },
    { key: "trustworthiness", label: "Trustworthiness", icon: Shield, desc: "Vertrauenswürdigkeit & Transparenz" },
  ];

  return (
    <Card style={{ padding: "24px" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: T.primary, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Shield size={16} color={C.accent} strokeWidth={IW} />
        E-E-A-T Analyse
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {metrics.map(({ key, label, icon: Icon, desc }) => {
          const val = eeat?.[key] ?? 0;
          const color = val >= 70 ? C.success : val >= 45 ? C.warning : C.danger;
          return (
            <div key={key} style={{ background: C.surface2, borderRadius: 10, padding: "14px 16px" }}>
              {loading ? (
                <div style={{ height: 60, borderRadius: 6, background: C.surface3, animation: "pulse 1.5s infinite" }} />
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon size={15} color={color} strokeWidth={IW} />
                      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.primary }}>{label}</span>
                    </div>
                    <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color }}>{val}</span>
                  </div>
                  <div style={{ height: 6, background: C.surface3, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${val}%`, background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 11, color: T.muted, marginTop: 6 }}>{desc}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── SemanticCoverageMap ──────────────────────────────────────────────────────
function SemanticCoverageMap({ topics, loading }) {
  const allTopics = topics || [];

  return (
    <Card style={{ padding: "24px" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: T.primary, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Layers size={16} color={C.accent} strokeWidth={IW} />
        Semantische Topic-Abdeckung
      </div>
      {loading ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ height: 32, width: 80 + Math.random() * 60, borderRadius: 6, background: C.surface2, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : allTopics.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: T.muted, fontFamily: FONT }}>
          Keine Topic-Daten verfügbar
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            {[
              { label: "Abgedeckt", color: C.success },
              { label: "Schwach", color: C.warning },
              { label: "Fehlend", color: C.danger },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ fontFamily: FONT, fontSize: 11, color: T.secondary }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {allTopics.map((t, i) => {
              const color = t.status === "covered" ? C.success : t.status === "weak" ? C.warning : C.danger;
              const bg = t.status === "covered" ? `${C.success}18` : t.status === "weak" ? `${C.warning}18` : `${C.danger}18`;
              return (
                <div key={i} style={{
                  background: bg, border: `1px solid ${color}44`, borderRadius: 6,
                  padding: "6px 12px", display: "flex", alignItems: "center", gap: 6
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontFamily: FONT, fontSize: 12, color: T.primary }}>{t.name}</span>
                  <span style={{ fontFamily: FONT, fontSize: 11, color: T.muted }}>({t.relevance}%)</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

// ── GeoCheckList ─────────────────────────────────────────────────────────────
function GeoCheckList({ items, loading }) {
  const [expanded, setExpanded] = useState(null);

  const priorityColor = (p) => p === "high" ? C.danger : p === "medium" ? C.warning : C.success;
  const priorityLabel = (p) => p === "high" ? "Hoch" : p === "medium" ? "Mittel" : "Niedrig";

  return (
    <Card style={{ padding: "24px" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: T.primary, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <CheckCircle size={16} color={C.accent} strokeWidth={IW} />
        GEO Optimierungs-Checkliste
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: 52, borderRadius: 8, background: C.surface2, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(items || []).map((item, i) => (
            <div
              key={i}
              style={{ background: C.surface2, borderRadius: 10, overflow: "hidden", cursor: "pointer" }}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                {item.done
                  ? <CheckCircle size={18} color={C.success} strokeWidth={IW} style={{ flexShrink: 0 }} />
                  : <Circle size={18} color={T.muted} strokeWidth={IW} style={{ flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT, fontSize: 13, color: item.done ? T.muted : T.primary, fontWeight: 600, textDecoration: item.done ? "line-through" : "none" }}>
                    {item.title}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 11, color: T.muted, marginTop: 2 }}>{item.category}</div>
                </div>
                <Badge color={priorityColor(item.priority)}>{priorityLabel(item.priority)}</Badge>
                <ChevronRight size={14} color={T.muted} strokeWidth={IW} style={{ transform: expanded === i ? "rotate(90deg)" : "none", transition: "0.2s" }} />
              </div>
              {expanded === i && (
                <div style={{ padding: "0 14px 14px 42px", fontFamily: FONT, fontSize: 12, color: T.secondary, borderTop: `1px solid ${C.surface3}`, paddingTop: 10, marginTop: 0 }}>
                  {item.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── CompetitorGeoComparison ──────────────────────────────────────────────────
function CompetitorGeoComparison({ domain, competitors, loading }) {
  const all = [{ domain: domain || "Ihre Domain", score: competitors?.[0]?.ownScore ?? 0, isOwn: true }, ...(competitors?.slice(0, 3) || [])];
  const maxScore = Math.max(...all.map(c => c.score), 1);

  return (
    <Card style={{ padding: "24px", flex: 1, minWidth: 260 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: T.primary, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Users size={16} color={C.accent} strokeWidth={IW} />
        Wettbewerber-Vergleich
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 48, borderRadius: 8, background: C.surface2, animation: "pulse 1.5s infinite" }} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {all.map((comp, i) => (
            <div key={i} style={{ background: comp.isOwn ? `${C.accent}18` : C.surface2, borderRadius: 10, padding: "12px 14px", border: comp.isOwn ? `1px solid ${C.accent}44` : "1px solid transparent" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontFamily: FONT, fontSize: 13, color: T.primary, fontWeight: comp.isOwn ? 700 : 400 }}>
                  {comp.domain} {comp.isOwn && <span style={{ color: C.accent, fontSize: 11 }}>← Sie</span>}
                </div>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: comp.isOwn ? C.accent : T.primary }}>{comp.score}</span>
              </div>
              <div style={{ height: 6, background: C.surface3, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(comp.score / maxScore) * 100}%`, background: comp.isOwn ? C.accent : C.accent2, borderRadius: 3, transition: "width 0.8s ease" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── GeoTrendChart ────────────────────────────────────────────────────────────
function GeoTrendChart({ data, loading }) {
  const chartH = 120;
  const chartW = 480;
  const months = data || [];
  const max = Math.max(...months.map(m => m.score), 1);
  const pts = months.map((m, i) => {
    const x = (i / Math.max(months.length - 1, 1)) * chartW;
    const y = chartH - (m.score / max) * (chartH - 20);
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const areaPath = `M0,${chartH} L${pts[0]?.split(",")[0]},${pts[0]?.split(",")[1]} L${polyline.replace(/ /g, " L")} L${chartW},${chartH} Z`;

  return (
    <Card style={{ padding: "24px" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: T.primary, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <TrendingUp size={16} color={C.accent} strokeWidth={IW} />
        GEO Score Verlauf (12 Monate)
      </div>
      {loading ? (
        <div style={{ height: 140, borderRadius: 8, background: C.surface2, animation: "pulse 1.5s infinite" }} />
      ) : months.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: T.muted, fontFamily: FONT }}>Keine Verlaufsdaten</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 400, position: "relative" }}>
            <svg viewBox={`0 0 ${chartW} ${chartH + 30}`} style={{ width: "100%", height: "auto", display: "block" }}>
              <defs>
                <linearGradient id="geoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.accent} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={C.accent} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#geoGrad)" />
              <polyline points={polyline} fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {months.map((m, i) => {
                const x = (i / Math.max(months.length - 1, 1)) * chartW;
                const y = chartH - (m.score / max) * (chartH - 20);
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={4} fill={C.accent} />
                    <text x={x} y={chartH + 20} textAnchor="middle" fontSize="11" fill={T.muted} fontFamily={FONT}>{m.month}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function GeoVisibilityPage() {
  const [domain, setDomain] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const analyze = useCallback(async (d) => {
    if (!d) return;
    setLoading(true);
    setError(null);
    try {
      const prompt = `Du bist ein GEO (Generative Engine Optimization) Experte. Analysiere die Domain "${d}" für AI-Search-Sichtbarkeit.
Antworte NUR mit validem JSON in exakt diesem Format:
{
  "score": <Zahl 0-100>,
  "benchmark": <Branchenschnitt Zahl 0-100>,
  "citations": {
    "sge": { "count": <Zahl>, "trend": <Zahl %>, "queries": ["<query1>"] },
    "perplexity": { "count": <Zahl>, "trend": <Zahl %>, "queries": ["<query1>"] },
    "chatgpt": { "count": <Zahl>, "trend": <Zahl %>, "queries": ["<query1>"] }
  },
  "eeat": {
    "experience": <0-100>,
    "expertise": <0-100>,
    "authoritativeness": <0-100>,
    "trustworthiness": <0-100>
  },
  "topics": [
    { "name": "<topic>", "status": "covered|weak|missing", "relevance": <Zahl> }
  ],
  "checklist": [
    { "title": "<titel>", "category": "<kategorie>", "priority": "high|medium|low", "done": false, "description": "<details>" }
  ],
  "competitors": [
    { "domain": "<domain>", "score": <0-100> },
    { "domain": "<domain>", "score": <0-100> },
    { "domain": "<domain>", "score": <0-100> }
  ],
  "trend": [
    { "month": "Jan", "score": <Zahl> },
    { "month": "Feb", "score": <Zahl> },
    { "month": "Mär", "score": <Zahl> },
    { "month": "Apr", "score": <Zahl> },
    { "month": "Mai", "score": <Zahl> },
    { "month": "Jun", "score": <Zahl> },
    { "month": "Jul", "score": <Zahl> },
    { "month": "Aug", "score": <Zahl> },
    { "month": "Sep", "score": <Zahl> },
    { "month": "Okt", "score": <Zahl> },
    { "month": "Nov", "score": <Zahl> },
    { "month": "Dez", "score": <Zahl> }
  ]
}
Generiere realistische, domainspezifische Werte. Gib ausschließlich JSON zurück.`;

      const res = await fetchAI(prompt);
      const raw = res?.response || res?.message || res?.content || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Kein JSON in Antwort");
      const parsed = JSON.parse(jsonMatch[0]);
      const competitorsWithOwn = [
        { domain: d, score: parsed.score, isOwn: true, ownScore: parsed.score },
        ...(parsed.competitors || []),
      ];
      setData({ ...parsed, competitorsFormatted: competitorsWithOwn });
    } catch (e) {
      console.error("GEO analysis failed:", e);
      setError("Analyse fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const cleaned = inputVal.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!cleaned) return;
    setDomain(cleaned);
    analyze(cleaned);
  };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${C.accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Globe size={22} color={C.accent} strokeWidth={IW} />
          </div>
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: T.primary, margin: 0 }}>
              GEO – AI Search Visibility
            </h1>
            <p style={{ fontFamily: FONT, fontSize: 13, color: T.secondary, margin: 0, marginTop: 2 }}>
              Wie sichtbar ist deine Domain in KI-generierten Suchantworten?
            </p>
          </div>
          <Badge color={C.accent} style={{ marginLeft: "auto" }}>
            <Zap size={11} strokeWidth={IW} style={{ marginRight: 4 }} />
            First-Mover 2026
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <Card style={{ padding: "20px 24px", marginBottom: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
            <Globe size={16} color={T.muted} strokeWidth={IW} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="example.com eingeben..."
              style={{
                width: "100%", padding: "11px 12px 11px