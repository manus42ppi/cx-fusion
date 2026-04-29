import React, { useState, useCallback, useRef, useEffect } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import {
  Search,
  Plus,
  X,
  Download,
  Filter,
  TrendingUp,
  Target,
  FileText,
  ShoppingCart,
  Compass,
  ChevronRight,
  ChevronDown,
  BarChart2,
  Layers,
  Zap,
  AlertCircle,
  RefreshCw,
  Globe,
  ArrowRight,
  Info,
  CheckCircle,
  Circle,
  ExternalLink,
} from "lucide-react";

const AI_URL = "/ai";
const AI_FALLBACK = "https://socialflow-pro.pages.dev/ai";

async function callAI(prompt) {
  const body = { messages: [{ role: "user", content: prompt }] };
  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("primary");
    const d = await res.json();
    return d.choices?.[0]?.message?.content || d.content || d.text || "";
  } catch {
    try {
      const res = await fetch(AI_FALLBACK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("fallback");
      const d = await res.json();
      return d.choices?.[0]?.message?.content || d.content || d.text || "";
    } catch (e) {
      console.error("AI call failed:", e);
      throw e;
    }
  }
}

function parseJSON(raw) {
  try {
    const match = raw.match(/```json\s*([\s\S]*?)```/) ||
      raw.match(/```\s*([\s\S]*?)```/);
    return JSON.parse(match ? match[1] : raw);
  } catch {
    return null;
  }
}

// ─── OnboardingEmptyState ────────────────────────────────────────────────────
function OnboardingEmptyState({ onStart }) {
  const steps = [
    {
      icon: Globe,
      title: "Domains eingeben",
      desc: "Gib deine eigene Domain und bis zu 3 Konkurrenz-Domains ein.",
      color: C.accent,
    },
    {
      icon: Zap,
      title: "KI-Analyse starten",
      desc: "cx-fusion analysiert Keyword-Profile via Common Crawl & eigener SEO-Pipeline.",
      color: C.success || "#22c55e",
    },
    {
      icon: Target,
      title: "Lücken angreifen",
      desc: "Exportiere priorisierte Keyword-Liste und erstelle gezielten Content.",
      color: C.warning || "#f59e0b",
    },
  ];

  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: `${C.accent}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}
      >
        <Layers size={32} color={C.accent} strokeWidth={IW} />
      </div>
      <h2
        style={{
          ...FONT_DISPLAY,
          fontSize: 24,
          color: T.primary,
          marginBottom: 8,
        }}
      >
        Keyword-Gap-Analyse
      </h2>
      <p style={{ ...FONT, color: T.secondary, marginBottom: 48, maxWidth: 480, margin: "0 auto 48px" }}>
        Finde heraus, welche Keywords deine Konkurrenten ranken – und du noch nicht.
        Erstelle eine priorisierte Angriffsliste in Sekunden.
      </p>

      <div
        style={{
          display: "flex",
          gap: 24,
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: 48,
        }}
      >
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: "28px 24px",
              width: 200,
              textAlign: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: `${s.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <s.icon size={22} color={s.color} strokeWidth={IW} />
            </div>
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: C.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ ...FONT, fontSize: 11, color: "#fff", fontWeight: 700 }}>
                {i + 1}
              </span>
            </div>
            <div style={{ ...FONT, fontWeight: 600, color: T.primary, marginBottom: 8, fontSize: 14 }}>
              {s.title}
            </div>
            <div style={{ ...FONT, fontSize: 12, color: T.secondary, lineHeight: 1.5 }}>
              {s.desc}
            </div>
          </div>
        ))}
      </div>

      <Btn onClick={onStart}>
        <Plus size={16} strokeWidth={IW} />
        Analyse starten
      </Btn>
    </div>
  );
}

// ─── DomainInputRow ──────────────────────────────────────────────────────────
function DomainInputRow({ ownDomain, setOwnDomain, competitors, setCompetitors, customers }) {
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);

  const getSuggestions = (val) => {
    if (!val || val.length < 2) return [];
    return (customers || [])
      .filter((c) => c.domain?.toLowerCase().includes(val.toLowerCase()))
      .slice(0, 5)
      .map((c) => c.domain);
  };

  const handleInput = (field, val) => {
    if (field === "own") setOwnDomain(val);
    else {
      const updated = [...competitors];
      updated[field] = val;
      setCompetitors(updated);
    }
    setSuggestions(getSuggestions(val));
    setActiveField(field);
  };

  const pickSuggestion = (field, val) => {
    if (field === "own") setOwnDomain(val);
    else {
      const updated = [...competitors];
      updated[field] = val;
      setCompetitors(updated);
    }
    setSuggestions([]);
    setActiveField(null);
  };

  const addCompetitor = () => {
    if (competitors.length < 3) setCompetitors([...competitors, ""]);
  };

  const removeCompetitor = (i) => {
    setCompetitors(competitors.filter((_, idx) => idx !== i));
  };

  const inputStyle = {
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "10px 14px",
    color: T.primary,
    ...FONT,
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle = {
    ...FONT,
    fontSize: 11,
    fontWeight: 600,
    color: T.secondary,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Own domain */}
      <div style={{ position: "relative" }}>
        <label style={labelStyle}>Deine Domain</label>
        <div style={{ position: "relative" }}>
          <Globe
            size={15}
            color={C.accent}
            strokeWidth={IW}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            style={{ ...inputStyle, paddingLeft: 36, borderColor: C.accent }}
            placeholder="z.B. meine-firma.de"
            value={ownDomain}
            onChange={(e) => handleInput("own", e.target.value)}
            onFocus={() => { setSuggestions(getSuggestions(ownDomain)); setActiveField("own"); }}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
          />
        </div>
        {activeField === "own" && suggestions.length > 0 && (
          <SuggestionList suggestions={suggestions} onPick={(v) => pickSuggestion("own", v)} />
        )}
      </div>

      {/* Competitors */}
      <div>
        <label style={labelStyle}>Konkurrenten (max. 3)</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {competitors.map((c, i) => (
            <div key={i} style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <Target
                  size={15}
                  color={T.secondary}
                  strokeWidth={IW}
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  style={{ ...inputStyle, paddingLeft: 36, paddingRight: 40 }}
                  placeholder={`Konkurrent ${i + 1} Domain`}
                  value={c}
                  onChange={(e) => handleInput(i, e.target.value)}
                  onFocus={() => { setSuggestions(getSuggestions(c)); setActiveField(i); }}
                  onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                />
                <button
                  onClick={() => removeCompetitor(i)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    color: T.secondary,
                  }}
                >
                  <X size={14} strokeWidth={IW} />
                </button>
              </div>
              {activeField === i && suggestions.length > 0 && (
                <SuggestionList suggestions={suggestions} onPick={(v) => pickSuggestion(i, v)} />
              )}
            </div>
          ))}
          {competitors.length < 3 && (
            <button
              onClick={addCompetitor}
              style={{
                background: `${C.accent}10`,
                border: `1px dashed ${C.accent}60`,
                borderRadius: 10,
                padding: "10px 14px",
                color: C.accent,
                ...FONT,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Plus size={14} strokeWidth={IW} />
              Konkurrent hinzufügen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestionList({ suggestions, onPick }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        marginTop: 4,
        zIndex: 50,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          onMouseDown={() => onPick(s)}
          style={{
            display: "block",
            width: "100%",
            padding: "10px 14px",
            textAlign: "left",
            background: "none",
            border: "none",
            borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : "none",
            color: T.primary,
            cursor: "pointer",
            ...FONT,
            fontSize: 13,
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ─── FilterToolbar ───────────────────────────────────────────────────────────
function FilterToolbar({ filters, setFilters, totalResults }) {
  const types = [
    { key: "all", label: "Alle", icon: Layers },
    { key: "informational", label: "Informational", icon: FileText },
    { key: "transactional", label: "Transactional", icon: ShoppingCart },
    { key: "navigational", label: "Navigational", icon: Compass },
  ];

  const diffOptions = ["Alle", "Leicht (0–30)", "Mittel (31–60)", "Schwer (61+)"];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        padding: "14px 0",
        borderBottom: `1px solid ${C.border}`,
        marginBottom: 16,
      }}
    >
      {/* Intent filter */}
      <div style={{ display: "flex", gap: 6 }}>
        {types.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilters((f) => ({ ...f, type: t.key }))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${filters.type === t.key ? C.accent : C.border}`,
              background: filters.type === t.key ? `${C.accent}20` : C.bg,
              color: filters.type === t.key ? C.accent : T.secondary,
              cursor: "pointer",
              ...FONT,
              fontSize: 12,
              fontWeight: filters.type === t.key ? 600 : 400,
            }}
          >
            <t.icon size={12} strokeWidth={IW} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Difficulty filter */}
      <select
        value={filters.difficulty}
        onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value }))}
        style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "6px 12px",
          color: T.primary,
          ...FONT,
          fontSize: 12,
          cursor: "pointer",
          outline: "none",
        }}
      >
        {diffOptions.map((o) => <option key={o}>{o}</option>)}
      </select>

      {/* Min potential */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ ...FONT, fontSize: 12, color: T.secondary }}>Min. Potenzial:</span>
        <select
          value={filters.minPotential}
          onChange={(e) => setFilters((f) => ({ ...f, minPotential: Number(e.target.value) }))}
          style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "6px 12px",
            color: T.primary,
            ...FONT,
            fontSize: 12,
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value={0}>Alle</option>
          <option value={30}>30+</option>
          <option value={50}>50+</option>
          <option value={70}>70+</option>
        </select>
      </div>

      <div style={{ marginLeft: "auto", ...FONT, fontSize: 12, color: T.secondary }}>
        <strong style={{ color: T.primary }}>{totalResults}</strong> Keywords gefunden
      </div>
    </div>
  );
}

// ─── GapPriorityChart ────────────────────────────────────────────────────────
function GapPriorityChart({ keywords, onSelect }) {
  const svgRef = useRef(null);
  const W = 600, H = 320;
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const IW2 = W - PAD.left - PAD.right;
  const IH = H - PAD.top - PAD.bottom;

  const validKWs = keywords.filter(
    (kw) => kw.difficulty !== undefined && kw.potentialScore !== undefined
  );

  const xScale = (v) => PAD.left + (v / 100) * IW2;
  const yScale = (v) => PAD.top + IH - (v / 100) * IH;
  const rScale = (v) => 6 + (v / 3) * 8;

  const typeColors = {
    informational: "#6366f1",
    transactional: "#22c55e",
    navigational: "#f59e0b",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={xScale(v)} y1={PAD.top}
              x2={xScale(v)} y2={PAD.top + IH}
              stroke={C.border} strokeWidth={0.5} strokeDasharray="3,3"
            />
            <line
              x1={PAD.left} y1={yScale(v)}
              x2={PAD.left + IW2} y2={yScale(v)}
              stroke={C.border} strokeWidth={0.5} strokeDasharray="3,3"
            />
            <text x={xScale(v)} y={H - 8} textAnchor="middle"
              style={{ fontSize: 10, fill: T.secondary, fontFamily: "inherit" }}>
              {v}
            </text>
            <text x={PAD.left - 8} y={yScale(v) + 4} textAnchor="end"
              style={{ fontSize: 10, fill: T.secondary, fontFamily: "inherit" }}>
              {v}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text x={PAD.left + IW2 / 2} y={H - 2} textAnchor="middle"
          style={{ fontSize: 11, fill: T.secondary, fontFamily: "inherit" }}>
          Difficulty →
        </text>
        <text
          transform={`translate(12, ${PAD.top + IH / 2}) rotate(-90)`}
          textAnchor="middle"
          style={{ fontSize: 11, fill: T.secondary, fontFamily: "inherit" }}
        >
          Traffic-Potenzial →
        </text>

        {/* Quadrant labels */}
        <text x={PAD.left + 8} y={PAD.top + 18}
          style={{ fontSize: 9, fill: "#22c55e", fontFamily: "inherit", fontWeight: 600 }}>
          ★ QUICK WINS
        </text>
        <text x={PAD.left + IW2 - 8} y={PAD.top + 18} textAnchor="end"
          style={{ fontSize: 9, fill: "#f59e0b", fontFamily: "inherit" }}>
          Langfristig
        </text>

        {/* Bubbles */}
        {validKWs.slice(0, 40).map((kw, i) => {
          const cx = xScale(kw.difficulty);
          const cy = yScale(kw.potentialScore);
          const r = rScale(kw.competitorCount || 1);
          const color = typeColors[kw.type] || C.accent;
          return (
            <g key={i} style={{ cursor: "pointer" }} onClick={() => onSelect(kw)}>
              <circle cx={cx} cy={cy} r={r} fill={`${color}60`} stroke={color} strokeWidth={1.5} />
              {r > 12 && (
                <text x={cx} y={cy + 4} textAnchor="middle"
                  style={{ fontSize: 8, fill: color, fontFamily: "inherit", pointerEvents: "none" }}>
                  {kw.keyword?.substring(0, 8)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            <span style={{ ...FONT, fontSize: 11, color: T.secondary, textTransform: "capitalize" }}>
              {type}
            </span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.secondary, opacity: 0.4 }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: T.secondary, opacity: 0.4 }} />
          <span style={{ ...FONT, fontSize: 11, color: T.secondary }}>= Anzahl Konkurrenten</span>
        </div>
      </div>
    </div>
  );
}

// ─── KeywordGapMatrix ────────────────────────────────────────────────────────
function KeywordGapMatrix({ keywords, ownDomain, competitors, onSelect }) {
  const diffColor = (d) => {
    if (d <= 30) return "#22c55e";
    if (d <= 60) return "#f59e0b";
    return "#ef4444";
  };

  const typeIcon = (t) => {
    if (t === "transactional") return <ShoppingCart size={11} strokeWidth={IW} />;
    if (t === "navigational") return <Compass size={11} strokeWidth={IW} />;
    return <FileText size={11} strokeWidth={IW} />;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", ...FONT, fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.bg }}>
            <th style={{ padding: "10px 14px", textAlign: "left", color: T.secondary, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.border}` }}>
              Keyword
            </th>
            {competitors.filter(Boolean).map((c, i) => (
              <th key={i} style={{ padding: "10px 14px", textAlign: "center", color: "#ef4444", fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${C.border}`, maxWidth: 100 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                  <Target size={11} strokeWidth={IW} />
                  {c.replace(/^https?:\/\//, "").substring(0, 16)}
                </div>
              </th>
            ))}
            <th style={{ padding: "10px 14px", textAlign: "center", color: C.accent, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                <Globe size={11} strokeWidth={IW} />
                {(ownDomain || "Deine Domain").substring(0, 16)}
              </div>
            </th>
            <th style={{ padding: "10px 14px", textAlign: "right", color: T.secondary, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${C.border}` }}>
              Vol.
            </th>
            <th style={{ padding: "10px 14px", textAlign: "center", color: T.secondary, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${C.border}` }}>
              KD
            </th>
            <th style={{ padding: "10px 14px", textAlign: "right", color: T.secondary, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${C.border}` }}>
              Potenzial
            </th>
          </tr>
        </thead>
        <tbody>
          {keywords.map((kw, i) => (
            <tr
              key={i}
              onClick={() => onSelect(kw)}
              style={{
                borderBottom: `1px solid ${C.border}`,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = `${C.accent}08`}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <td style={{ padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: T.secondary }}>
                    {typeIcon(kw.type)}
                  </span>
                  <span style={{ color: T.primary, fontWeight: 500 }}>{kw.keyword}</span>
                </div>
              </td>
              {competitors.filter(Boolean).map((_, ci) => (
                <td key={ci} style={{ padding: "10px 14px", textAlign: "center" }}>
                  {kw.competitorRanks?.[ci] !== undefined ? (
                    <span
                      style={{
                        background: `${kw.competitorRanks[ci] <= 3 ? "#ef4444" : kw.competitorRanks[ci] <= 10 ? "#f59e0b" : "#94a3b8"}20`,
                        color: kw.competitorRanks[ci] <= 3 ? "#ef4444" : kw.competitorRanks[ci] <= 10 ? "#f59e0b" : T.secondary,
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      #{kw.competitorRanks[ci]}
                    </span>
                  ) : (
                    <span style={{ color: C.border }}>—</span>
                  )}
                </td>
              ))}
              <td style={{ padding: "10px 14px", textAlign: "center" }}>
                <span
                  style={{
                    background: `${C.border}40`,
                    color: T.secondary,
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  —
                </span>
              </td>
              <td style={{ padding: "10px 14px", textAlign: "right", color: T.secondary, fontSize: 12 }}>
                {kw.searchVolume >= 1000
                  ? `${(kw.searchVolume / 1000).toFixed(1)}K`
                  : kw.searchVolume}
              </td>
              <td style={{ padding: "10px 14px", textAlign: "center" }}>
                <span
                  style={{
                    background: `${diffColor(kw.difficulty)}20`,
                    color: diffColor(kw.difficulty),
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {kw.difficulty}
                </span>
              </td>
              <td style={{ padding: "10px 14px", textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                  <div
                    style={{
                      width: 60,
                      height: 6,
                      background: C.border,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${kw.potentialScore}%`,
                        height: "100%",
                        background: kw.potentialScore >= 70
                          ? "#22c55e"
                          : kw.potentialScore >= 40
                            ? "#f59e0b"
                            : C.accent,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <span style={{ ...FONT, fontSize: 12, fontWeight: 600, color: T.primary, minWidth: 24 }}>
                    {kw.potentialScore}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── KeywordDetailDrawer ─────────────────────────────────────────────────────
function KeywordDetailDrawer({ keyword, onClose }) {