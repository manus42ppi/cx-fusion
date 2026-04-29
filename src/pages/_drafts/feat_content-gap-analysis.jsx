import React, { useState, useCallback, useRef } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import {
  Search,
  Plus,
  X,
  TrendingUp,
  BarChart2,
  FileText,
  Globe,
  CheckCircle,
  Circle,
  Download,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Layers,
  BookOpen,
  Layout,
  HelpCircle,
  Loader2,
  RefreshCw,
  Filter,
  Eye,
} from "lucide-react";

const AI_URL = "/ai";
const AI_FALLBACK = "https://socialflow-pro.pages.dev/ai";

async function callAI(prompt) {
  const body = JSON.stringify({ message: prompt });
  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) throw new Error("primary");
    const d = await res.json();
    return d.response || d.content || d.text || "";
  } catch {
    try {
      const res = await fetch(AI_FALLBACK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) throw new Error("fallback");
      const d = await res.json();
      return d.response || d.content || d.text || "";
    } catch (e) {
      console.error("AI call failed:", e);
      throw e;
    }
  }
}

function parseJSON(raw) {
  try {
    const match = raw.match(/```json\s*([\s\S]*?)```/) ||
      raw.match(/```\s*([\s\S]*?)```/) ||
      [null, raw];
    return JSON.parse(match[1].trim());
  } catch {
    try { return JSON.parse(raw.trim()); } catch { return null; }
  }
}

const FORMAT_ICONS = {
  Blog: BookOpen,
  Landingpage: Layout,
  FAQ: HelpCircle,
};

const FORMAT_COLORS = {
  Blog: C.accent,
  Landingpage: C.success || "#22c55e",
  FAQ: C.warn || "#f59e0b",
};

const DIFF_COLORS = {
  Leicht: C.success || "#22c55e",
  Mittel: C.warn || "#f59e0b",
  Schwer: C.error || "#ef4444",
};

// ─── DomainInputRow ───────────────────────────────────────────────────────────
function DomainInputRow({ ownDomain, setOwnDomain, competitors, setCompetitors }) {
  const addCompetitor = () => {
    if (competitors.length < 3) setCompetitors([...competitors, ""]);
  };
  const removeCompetitor = (i) =>
    setCompetitors(competitors.filter((_, idx) => idx !== i));
  const updateCompetitor = (i, val) =>
    setCompetitors(competitors.map((c, idx) => (idx === i ? val : c)));

  const inputStyle = {
    background: C.surface2 || C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: T.primary,
    fontFamily: FONT,
    fontSize: 14,
    padding: "8px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${C.accent}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Globe size={16} color={C.accent} strokeWidth={IW} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.secondary, fontFamily: FONT, marginBottom: 4 }}>
            Eigene Domain
          </div>
          <input
            style={inputStyle}
            placeholder="z.B. meinefirma.de"
            value={ownDomain}
            onChange={(e) => setOwnDomain(e.target.value)}
          />
        </div>
      </div>

      {competitors.map((comp, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${C.warn || "#f59e0b"}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Target size={16} color={C.warn || "#f59e0b"} strokeWidth={IW} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.secondary, fontFamily: FONT, marginBottom: 4 }}>
              Konkurrent {i + 1}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={inputStyle}
                placeholder={`z.B. konkurrent${i + 1}.de`}
                value={comp}
                onChange={(e) => updateCompetitor(i, e.target.value)}
              />
              <button
                onClick={() => removeCompetitor(i)}
                style={{
                  background: `${C.error || "#ef4444"}15`,
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: "0 10px",
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <X size={14} color={C.error || "#ef4444"} strokeWidth={IW} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {competitors.length < 3 && (
        <button
          onClick={addCompetitor}
          style={{
            background: "transparent",
            border: `1px dashed ${C.border}`,
            borderRadius: 8,
            cursor: "pointer",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: T.secondary,
            fontFamily: FONT,
            fontSize: 13,
            marginLeft: 42,
          }}
        >
          <Plus size={14} strokeWidth={IW} />
          Konkurrent hinzufügen ({competitors.length}/3)
        </button>
      )}
    </div>
  );
}

// ─── GapMatrixTable ───────────────────────────────────────────────────────────
function GapMatrixTable({ data, competitors, ownDomain, filter, setFilter }) {
  const [sortCol, setSortCol] = useState("traffic");
  const [sortDir, setSortDir] = useState("desc");
  const [expanded, setExpanded] = useState(false);

  const filtered = data.filter((row) => {
    if (filter === "gaps") return !row.ownCoverage;
    if (filter === "covered") return row.ownCoverage;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortCol] ?? 0;
    const vb = b[sortCol] ?? 0;
    return sortDir === "desc" ? vb - va : va - vb;
  });

  const displayed = expanded ? sorted : sorted.slice(0, 8);

  const toggleSort = (col) => {
    if (sortCol === col) setDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const setDir = setSortDir;

  const thStyle = (col) => ({
    padding: "10px 12px",
    fontSize: 11,
    fontFamily: FONT,
    color: T.secondary,
    textAlign: "left",
    borderBottom: `1px solid ${C.border}`,
    cursor: "pointer",
    userSelect: "none",
    background: C.surface2 || C.surface,
    whiteSpace: "nowrap",
  });

  const tdStyle = {
    padding: "9px 12px",
    fontSize: 13,
    fontFamily: FONT,
    color: T.primary,
    borderBottom: `1px solid ${C.border}15`,
    verticalAlign: "middle",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {["all", "gaps", "covered"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              border: `1px solid ${filter === f ? C.accent : C.border}`,
              background: filter === f ? `${C.accent}20` : "transparent",
              color: filter === f ? C.accent : T.secondary,
              fontFamily: FONT,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {f === "all" ? "Alle" : f === "gaps" ? "Nur Lücken" : "Abgedeckt"}
          </button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 12, color: T.secondary, fontFamily: FONT, display: "flex", alignItems: "center" }}>
          {filtered.length} Einträge
        </div>
      </div>

      <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle(), minWidth: 180 }}>Keyword / Thema</th>
              {competitors.filter(Boolean).map((c, i) => (
                <th key={i} style={{ ...thStyle(), textAlign: "center", minWidth: 110 }}>
                  {c.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 16)}
                </th>
              ))}
              <th style={{ ...thStyle(), textAlign: "center", minWidth: 110 }}>
                {(ownDomain || "Eigene").replace(/^https?:\/\//, "").slice(0, 16)}
              </th>
              <th
                style={{ ...thStyle(), cursor: "pointer", minWidth: 100 }}
                onClick={() => toggleSort("traffic")}
              >
                Traffic ↕
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((row, i) => (
              <tr
                key={i}
                style={{
                  background: !row.ownCoverage
                    ? `${C.accent}05`
                    : "transparent",
                }}
              >
                <td style={tdStyle}>
                  <div style={{ fontWeight: 500 }}>{row.keyword}</div>
                  {row.topic && (
                    <div style={{ fontSize: 11, color: T.secondary, marginTop: 2 }}>
                      {row.topic}
                    </div>
                  )}
                </td>
                {competitors.filter(Boolean).map((_, ci) => (
                  <td key={ci} style={{ ...tdStyle, textAlign: "center" }}>
                    {row.competitorCoverage?.[ci] ? (
                      <CheckCircle size={16} color={C.success || "#22c55e"} strokeWidth={IW} />
                    ) : (
                      <Circle size={16} color={`${T.secondary}40`} strokeWidth={IW} />
                    )}
                    {row.competitorTraffic?.[ci] && (
                      <div style={{ fontSize: 10, color: T.secondary, marginTop: 2 }}>
                        ~{row.competitorTraffic[ci]}
                      </div>
                    )}
                  </td>
                ))}
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  {row.ownCoverage ? (
                    <CheckCircle size={16} color={C.accent} strokeWidth={IW} />
                  ) : (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        background: `${C.error || "#ef4444"}15`,
                        borderRadius: 20,
                        padding: "2px 8px",
                      }}
                    >
                      <X size={10} color={C.error || "#ef4444"} strokeWidth={IW} />
                      <span style={{ fontSize: 10, color: C.error || "#ef4444" }}>fehlt</span>
                    </div>
                  )}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <TrendingUp size={12} color={C.accent} strokeWidth={IW} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>
                      {row.traffic?.toLocaleString("de") ?? "—"}
                    </span>
                    <span style={{ fontSize: 10, color: T.secondary }}>/mo</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: 10,
            background: "transparent",
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            cursor: "pointer",
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: T.secondary,
            fontFamily: FONT,
            fontSize: 12,
            width: "100%",
            justifyContent: "center",
          }}
        >
          {expanded ? <ChevronUp size={14} strokeWidth={IW} /> : <ChevronDown size={14} strokeWidth={IW} />}
          {expanded ? "Weniger anzeigen" : `${sorted.length - 8} weitere Einträge`}
        </button>
      )}
    </div>
  );
}

// ─── OpportunityScoreCard ─────────────────────────────────────────────────────
function OpportunityScoreCard({ opportunities, onGenerateBrief, briefLoading, selectedOpp, setSelectedOpp }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {opportunities.map((opp, i) => {
        const FmtIcon = FORMAT_ICONS[opp.format] || FileText;
        const isSelected = selectedOpp?.keyword === opp.keyword;
        return (
          <div
            key={i}
            onClick={() => setSelectedOpp(isSelected ? null : opp)}
            style={{
              background: isSelected ? `${C.accent}10` : C.surface2 || C.surface,
              border: `1px solid ${isSelected ? C.accent : C.border}`,
              borderRadius: 10,
              padding: "12px 14px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: `${C.accent}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: FONT_DISPLAY || FONT,
                  fontWeight: 700,
                  fontSize: 14,
                  color: C.accent,
                }}
              >
                #{i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: T.primary, fontFamily: FONT }}>
                    {opp.keyword}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: `${FORMAT_COLORS[opp.format] || C.accent}20`,
                      color: FORMAT_COLORS[opp.format] || C.accent,
                      fontFamily: FONT,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <FmtIcon size={10} strokeWidth={IW} />
                    {opp.format}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: `${DIFF_COLORS[opp.difficulty] || C.warn}20`,
                      color: DIFF_COLORS[opp.difficulty] || C.warn,
                      fontFamily: FONT,
                    }}
                  >
                    {opp.difficulty}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.secondary, fontFamily: FONT, marginTop: 4 }}>
                  {opp.rationale}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <TrendingUp size={12} color={C.accent} strokeWidth={IW} />
                    <span style={{ fontSize: 12, fontFamily: FONT, color: T.primary }}>
                      ~{opp.trafficPotential?.toLocaleString("de")} /mo
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <BarChart2 size={12} color={C.warn || "#f59e0b"} strokeWidth={IW} />
                    <span style={{ fontSize: 12, fontFamily: FONT, color: T.primary }}>
                      Impact: {opp.impactScore}/10
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: `conic-gradient(${C.accent} ${opp.impactScore * 36}deg, ${C.border} 0deg)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: C.bg || C.surface,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.accent,
                      fontFamily: FONT,
                    }}
                  >
                    {opp.impactScore}
                  </div>
                </div>
              </div>
            </div>

            {isSelected && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <Btn
                  onClick={(e) => { e.stopPropagation(); onGenerateBrief(opp); }}
                  disabled={briefLoading}
                  style={{ fontSize: 12 }}
                >
                  {briefLoading ? (
                    <Loader2 size={14} strokeWidth={IW} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Sparkles size={14} strokeWidth={IW} />
                  )}
                  Content Brief generieren
                </Btn>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── TopicClusterVenn ─────────────────────────────────────────────────────────
function TopicClusterVenn({ clusters, competitors, ownDomain }) {
  const [activeFilter, setActiveFilter] = useState("all");

  if (!clusters || !clusters.exclusive || !clusters.shared) return null;

  const allItems = [
    ...clusters.exclusive.own.map(t => ({ label: t, type: "own" })),
    ...clusters.exclusive.competitors.map(t => ({ label: t, type: "competitor" })),
    ...clusters.shared.map(t => ({ label: t, type: "shared" })),
  ];

  const filtered = allItems.filter(item => {
    if (activeFilter === "own") return item.type === "own";
    if (activeFilter === "competitor") return item.type === "competitor";
    if (activeFilter === "shared") return item.type === "shared";
    return true;
  });

  const typeColors = {
    own: C.accent,
    competitor: C.warn || "#f59e0b",
    shared: C.success || "#22c55e",
  };

  const typeLabels = {
    own: "Nur eigene Domain",
    competitor: "Nur Wettbewerber",
    shared: "Überlappend",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {["all", "own", "competitor", "shared"].map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              border: `1px solid ${activeFilter === f ? (typeColors[f] || C.accent) : C.border}`,
              background: activeFilter === f ? `${typeColors[f] || C.accent}20` : "transparent",
              color: activeFilter === f ? (typeColors[f] || C.accent) : T.secondary,
              fontFamily: FONT,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {f === "all" ? "Alle" : typeLabels[f]}
            <span style={{ marginLeft: 5, opacity: 0.7 }}>
              ({allItems.filter(i => f === "all" || i.type === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Visual Venn representation */}
      <div style={{ position: "relative", height: 160, marginBottom: 16, overflow: "hidden" }}>
        <svg width="100%" height="160" style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <filter id="blur1">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>
          {/* Own domain circle */}
          <ellipse cx="35%" cy="50%" rx="30%" ry="38%" fill={`${C.accent}18`} stroke={C.accent} strokeWidth="1.5" strokeDasharray="4 2" />
          {/* Competitor circle */}
          <ellipse cx="65%" cy="50%" rx="30%" ry="38%" fill={`${C.warn || "#f59e0b"}18`} stroke={C.warn || "#f59e0b"} strokeWidth="1.5" strokeDasharray="4 2" />
          {/* Labels */}
          <text x="22%" y="88%" fill={C.accent} fontSize="11" fontFamily={FONT} textAnchor="middle">
            {(ownDomain || "Eigene").slice(0, 12)}
          </text>
          <text x="50%" y="50%" fill={T.secondary} fontSize="10" fontFamily={FONT} textAnchor="middle">
            Überlappung
          </text>
          <text x="78%" y="88%" fill={C.warn || "#f59e0b"} fontSize="11" fontFamily={FONT} textAnchor="middle">
            Wettbewerber
          </text>
          <text x="22%" y="48%" fill={C.accent} fontSize="18" fontFamily={FONT_DISPLAY || FONT} fontWeight="700" textAnchor="middle">
            {clusters.exclusive.own.length}
          </text>
          <text x="50%" y="46%" fill={T.primary} fontSize="18" fontFamily={FONT_DISPLAY || FONT} fontWeight="700" textAnchor="middle">
            {clusters.shared.length}
          </text>
          <text x="78%" y="48%" fill={C.warn || "#f59e0b"} fontSize="18" fontFamily={FONT_DISPLAY || FONT} fontWeight="700" textAnchor="middle">
            {clusters.exclusive.competitors.length}
          </text>
        </svg>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {filtered.map((item, i) => (
          <div
            key={i}
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              background: `${typeColors[item.type]}15`,
              border: `1px solid ${typeColors[item.type]}40`,
              fontSize: 12,
              color: typeColors[item.type],
              fontFamily: FONT,
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ContentBriefGenerator ────────────────────────────────────────────────────
function ContentBriefGenerator({ brief, onClose }) {
  if (!brief) return null;

  const sectionStyle = {
    marginBottom: 14,
  };

  const labelStyle = {
    fontSize: 11,
    color: T.secondary,
    fontFamily: FONT,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const valueStyle = {
    fontSize: 13,
    color: T.primary,
    fontFamily: FONT,
    lineHeight: 1.6,
  };

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.accent}40`,
        borderRadius: 12,
        padding: 18,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color={C.accent} strokeWidth={IW} />
          <span style={{ fontWeight: 600, fontSize: 14, color: T.primary, fontFamily: FONT }}>
            Content Brief
          </span>
          <Badge>{brief.keyword}</Badge>
        </div>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
        >
          <X size={16} color={T.secondary} strokeWidth={IW} />
        </button>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Empfohlener Titel</div>
        <div style={{ ...valueStyle, fontWeight: 600, fontSize: 15 }}>{brief.title}</div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Ziel-Keywords</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {brief.targetKeywords?.map((kw, i) => (
            <span
              key={i}
              style={{
                padding: "3px 9px",
                borderRadius: 20,
                background: `${C.accent}15`,
                color: C.accent,
                fontSize: 12,
                fontFamily: FONT,
              }}
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>H2-Vorschläge</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {brief.h2Suggestions?.map((h2, i) => (
            <div
              key={i}
              style={{
                ...valueStyle,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span style={{ color: C.accent, fontWeight: 700, flexShrink: 0 }}>H2</span>
              {h2}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={sectionStyle}>
          <div style={labelStyle}>Format</div>
          <div style={valueStyle}>{brief.format}</div>
        </div>
        <div style={sectionStyle}>
          <div style={labelStyle}>Tonalität</div>
          <div style={valueStyle}>{brief.tonality}</div>
        </div>
        <div style={sectionStyle}>
          <div style={labelStyle}>Wortanzahl</div>
          <div style={valueStyle}>{brief.wordCount} Wörter</div>
        </div>
      </div>

      {brief.cta && (
        <div style={sectionStyle}>
          <div style={labelStyle}>CTA-Empfehlung</div>
          <div style={valueStyle}>{brief.cta}</div>
        </div>
      )}
    </div>
  );
}

// ─── ExportButton ─────────────────────────────────────────────────────────────
function ExportButton({ data, ownDomain, competitors }) {