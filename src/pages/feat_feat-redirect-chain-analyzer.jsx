import React, { useState, useCallback, useRef } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import {
  Link,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Download,
  RefreshCw,
  Globe,
  Zap,
  BarChart2,
  Clock,
  XCircle,
  ChevronRight,
  FileJson,
  FileText,
  Loader,
  Search,
} from "lucide-react";

// ─── HopCountBadge ───────────────────────────────────────────────────────────
function HopCountBadge({ count }) {
  const severity =
    count === 0
      ? "ok"
      : count <= 2
      ? "warn"
      : count >= 10
      ? "loop"
      : "critical";

  const cfg = {
    ok: { bg: C.success + "22", color: C.success, icon: CheckCircle, label: `${count} Hop` },
    warn: { bg: C.warn + "22", color: C.warn, icon: AlertTriangle, label: `${count} Hops` },
    critical: { bg: C.error + "22", color: C.error, icon: AlertCircle, label: `${count} Hops` },
    loop: { bg: C.error, color: "#fff", icon: XCircle, label: "Loop!" },
  };

  const { bg, color, icon: Icon, label } = cfg[severity];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: bg,
        color,
        borderRadius: 20,
        padding: "2px 10px",
        fontSize: 12,
        fontFamily: FONT,
        fontWeight: 600,
      }}
    >
      <Icon size={12} strokeWidth={IW} />
      {label}
    </span>
  );
}

// ─── LatencyEstimateBar ───────────────────────────────────────────────────────
function LatencyEstimateBar({ hops, estimatedMs }) {
  const max = 1500;
  const pct = Math.min((estimatedMs / max) * 100, 100);
  const color =
    estimatedMs < 300 ? C.success : estimatedMs < 800 ? C.warn : C.error;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Clock size={12} strokeWidth={IW} style={{ color: T.secondary, flexShrink: 0 }} />
      <div
        style={{
          flex: 1,
          height: 6,
          background: C.surface2,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 4,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: T.secondary, fontFamily: FONT, whiteSpace: "nowrap" }}>
        ~{estimatedMs}ms extra
      </span>
    </div>
  );
}

// ─── ChainFlowDiagram ─────────────────────────────────────────────────────────
function ChainFlowDiagram({ chain }) {
  const NODE_W = 140;
  const NODE_H = 48;
  const ARROW_W = 36;
  const PAD = 12;
  const totalWidth = chain.length * NODE_W + (chain.length - 1) * ARROW_W + PAD * 2;
  const svgH = NODE_H + 32;

  const statusColor = (code) => {
    if (!code) return C.error;
    if (code < 300) return C.success;
    if (code < 400) return C.warn;
    return C.error;
  };

  const statusLabel = (code) =>
    code ? `${code}` : "ERR";

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <svg
        width={Math.max(totalWidth, 300)}
        height={svgH}
        style={{ display: "block", minWidth: 300 }}
      >
        {chain.map((hop, i) => {
          const x = PAD + i * (NODE_W + ARROW_W);
          const y = 8;
          const color = statusColor(hop.status);
          const isLast = i === chain.length - 1;
          const isLoop = hop.isLoop;

          return (
            <g key={i}>
              {/* Node box */}
              <rect
                x={x}
                y={y}
                width={NODE_W}
                height={NODE_H}
                rx={8}
                fill={isLoop ? C.error + "22" : isLast ? C.success + "18" : C.surface2}
                stroke={color}
                strokeWidth={isLoop ? 2 : 1.5}
              />

              {/* Status badge */}
              <rect
                x={x + NODE_W - 36}
                y={y + 4}
                width={32}
                height={18}
                rx={4}
                fill={color + "33"}
              />
              <text
                x={x + NODE_W - 20}
                y={y + 16}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fontFamily={FONT}
                fill={color}
              >
                {statusLabel(hop.status)}
              </text>

              {/* URL text */}
              <text
                x={x + 8}
                y={y + 22}
                fontSize={10}
                fontFamily={FONT}
                fill={T.primary}
              >
                {truncate(hop.url, 16)}
              </text>
              <text
                x={x + 8}
                y={y + 36}
                fontSize={9}
                fontFamily={FONT}
                fill={T.secondary}
              >
                {hop.domain || ""}
              </text>

              {/* Hop index label */}
              <text
                x={x + 6}
                y={y + 12}
                fontSize={9}
                fontFamily={FONT}
                fill={T.secondary}
              >
                {i === 0 ? "Origin" : isLast ? "Final" : `Hop ${i}`}
              </text>

              {/* Arrow to next */}
              {!isLast && (
                <g>
                  <line
                    x1={x + NODE_W}
                    y1={y + NODE_H / 2}
                    x2={x + NODE_W + ARROW_W - 8}
                    y2={y + NODE_H / 2}
                    stroke={isLoop ? C.error : T.secondary}
                    strokeWidth={1.5}
                    strokeDasharray={isLoop ? "4 2" : "none"}
                  />
                  <polygon
                    points={`${x + NODE_W + ARROW_W - 8},${y + NODE_H / 2 - 4} ${x + NODE_W + ARROW_W},${y + NODE_H / 2} ${x + NODE_W + ARROW_W - 8},${y + NODE_H / 2 + 4}`}
                    fill={isLoop ? C.error : T.secondary}
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function truncate(str, n) {
  if (!str) return "";
  try {
    const u = new URL(str);
    const short = u.hostname + (u.pathname.length > 1 ? u.pathname.slice(0, 8) : "");
    return short.length > n ? short.slice(0, n) + "…" : short;
  } catch {
    return str.length > n ? str.slice(0, n) + "…" : str;
  }
}

// ─── RedirectSummaryCard ─────────────────────────────────────────────────────
function RedirectSummaryCard({ chains }) {
  if (!chains?.length) return null;

  const total = chains.length;
  const avgHops =
    chains.reduce((s, c) => s + (c.hops?.length || 0), 0) / total;
  const loops = chains.filter((c) => c.hasLoop).length;
  const criticals = chains.filter((c) => (c.hops?.length || 0) >= 3).length;
  const avgLatency = Math.round(
    chains.reduce((s, c) => s + (c.estimatedLatencyMs || 0), 0) / total
  );

  const stats = [
    { icon: Link, label: "Redirect-Chains", value: total, color: C.accent },
    { icon: BarChart2, label: "Ø Hop-Count", value: avgHops.toFixed(1), color: T.primary },
    { icon: AlertTriangle, label: "Performance (3+ Hops)", value: criticals, color: C.warn },
    { icon: XCircle, label: "Redirect-Loops", value: loops, color: loops > 0 ? C.error : C.success },
    { icon: Clock, label: "Ø Extra-Latenz", value: `${avgLatency}ms`, color: T.secondary },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
        marginBottom: 20,
      }}
    >
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div
          key={label}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Icon size={14} strokeWidth={IW} style={{ color }} />
            <span style={{ fontSize: 11, color: T.secondary, fontFamily: FONT }}>
              {label}
            </span>
          </div>
          <div
            style={{
              fontSize: 22,
              fontFamily: FONT_DISPLAY,
              color,
              fontWeight: 700,
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ChainExportButton ────────────────────────────────────────────────────────
function ChainExportButton({ chains }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const exportCSV = () => {
    const rows = [
      ["Origin URL", "Final URL", "Hop Count", "Status Codes", "Has Loop", "Est. Latency (ms)"],
      ...chains.map((c) => [
        c.originUrl,
        c.finalUrl,
        c.hops?.length || 0,
        (c.hops || []).map((h) => h.status || "ERR").join("→"),
        c.hasLoop ? "YES" : "NO",
        c.estimatedLatencyMs || 0,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    download("redirect-chains.csv", "text/csv", csv);
    setOpen(false);
  };

  const exportJSON = () => {
    download(
      "redirect-chains.json",
      "application/json",
      JSON.stringify(chains, null, 2)
    );
    setOpen(false);
  };

  const download = (name, type, content) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name;
    a.click();
  };

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <Btn
        onClick={() => setOpen((p) => !p)}
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        <Download size={14} strokeWidth={IW} />
        Export
      </Btn>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 6,
            zIndex: 100,
            minWidth: 160,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          }}
        >
          {[
            { icon: FileText, label: "Als CSV", action: exportCSV },
            { icon: FileJson, label: "Als JSON", action: exportJSON },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                borderRadius: 7,
                cursor: "pointer",
                color: T.primary,
                fontFamily: FONT,
                fontSize: 13,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.surface2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Icon size={14} strokeWidth={IW} style={{ color: C.accent }} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ChainCard ────────────────────────────────────────────────────────────────
function ChainCard({ chain }) {
  const [expanded, setExpanded] = useState(false);

  const hopCount = chain.hops?.length || 0;
  const severity = chain.hasLoop ? "loop" : hopCount >= 3 ? "critical" : hopCount >= 1 ? "warn" : "ok";

  const borderColor =
    severity === "loop"
      ? C.error
      : severity === "critical"
      ? C.error + "88"
      : severity === "warn"
      ? C.warn + "66"
      : C.border;

  return (
    <div
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        background: C.surface,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setExpanded((p) => !p)}
      >
        <Globe size={14} strokeWidth={IW} style={{ color: C.accent, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: T.primary,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {chain.originUrl}
          </div>
          {chain.finalUrl && chain.finalUrl !== chain.originUrl && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: T.secondary,
                fontFamily: FONT,
                marginTop: 2,
              }}
            >
              <ArrowRight size={10} strokeWidth={IW} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {chain.finalUrl}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <HopCountBadge count={hopCount} />
          <ChevronRight
            size={14}
            strokeWidth={IW}
            style={{
              color: T.secondary,
              transform: expanded ? "rotate(90deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </div>
      </div>

      {expanded && (
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            padding: "16px",
            background: C.bg,
          }}
        >
          {chain.hasLoop && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.error + "18",
                border: `1px solid ${C.error}44`,
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
              }}
            >
              <XCircle size={14} strokeWidth={IW} style={{ color: C.error }} />
              <span style={{ fontSize: 12, color: C.error, fontFamily: FONT, fontWeight: 600 }}>
                Redirect-Loop erkannt! Diese Kette führt in eine Endlosschleife.
              </span>
            </div>
          )}

          {hopCount >= 3 && !chain.hasLoop && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.warn + "18",
                border: `1px solid ${C.warn}44`,
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
              }}
            >
              <AlertTriangle size={14} strokeWidth={IW} style={{ color: C.warn }} />
              <span style={{ fontSize: 12, color: C.warn, fontFamily: FONT }}>
                Performance-Warnung: {hopCount} Redirects verlangsamen die Ladezeit erheblich.
              </span>
            </div>
          )}

          <ChainFlowDiagram chain={chain.hops || []} />

          <div style={{ marginTop: 14 }}>
            <LatencyEstimateBar hops={hopCount} estimatedMs={chain.estimatedLatencyMs || 0} />
          </div>

          {chain.aiInsight && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                background: C.accent + "11",
                border: `1px solid ${C.accent}33`,
                borderRadius: 8,
                fontSize: 12,
                color: T.primary,
                fontFamily: FONT,
                lineHeight: 1.6,
              }}
            >
              <span style={{ color: C.accent, fontWeight: 600 }}>KI-Analyse: </span>
              {chain.aiInsight}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RedirectChainAnalysisPage() {
  const { goNav } = useApp();
  const [url, setUrl] = useState("");
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("chains");
  const [filter, setFilter] = useState("all");
  const abortRef = useRef(null);

  // Simulate recursive redirect chain following via AI
  const analyzeRedirects = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setChains([]);

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const aiUrl = "/ai";
      const fallbackUrl = "https://socialflow-pro.pages.dev/ai";

      const prompt = `Du bist ein Web-Performance-Analysator. Analysiere die URL "${url.trim()}" und simuliere eine realistische Redirect-Ketten-Analyse.

Gib ein JSON-Array zurück mit 5-8 realistischen Redirect-Chain-Objekten, die so aussehen könnten, als kämen sie von einem echten Broken-Link-Checker mit Redirect-Tracking.

Jedes Objekt hat diese Struktur:
{
  "id": "chain_1",
  "originUrl": "https://beispiel.com/alte-seite",
  "finalUrl": "https://beispiel.com/neue-seite",
  "hasLoop": false,
  "estimatedLatencyMs": 420,
  "aiInsight": "Kurze KI-Erklärung auf Deutsch (max 80 Zeichen)",
  "hops": [
    { "url": "https://beispiel.com/alte-seite", "status": 301, "domain": "beispiel.com", "isLoop": false },
    { "url": "https://www.beispiel.com/alte-seite", "status": 302, "domain": "www.beispiel.com", "isLoop": false },
    { "url": "https://www.beispiel.com/neue-seite", "status": 200, "domain": "www.beispiel.com", "isLoop": false }
  ]
}

Variiere die Chains: einige mit 1 Hop, einige mit 3+ Hops (Performance-Warning), mindestens 1 mit einem Loop (hasLoop:true, isLoop:true in mindestens einem Hop). 
Verwende reale URL-Muster passend zur analysierten Domain.
Antworte NUR mit dem JSON-Array, kein weiterer Text.`;

      let response;
      try {
        response = await fetch(aiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
          signal: ctrl.signal,
        });
        if (!response.ok) throw new Error("primary failed");
      } catch {
        response = await fetch(fallbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
          signal: ctrl.signal,
        });
      }

      const data = await response.json();
      const raw =
        data?.choices?.[0]?.message?.content ||
        data?.content ||
        data?.message ||
        "";

      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Ungültige KI-Antwort");

      const parsed = JSON.parse(jsonMatch[0]);
      setChains(parsed);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Redirect analysis failed:", err);
        setError("Analyse fehlgeschlagen. Bitte prüfe die URL und versuche es erneut.");
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  const filteredChains = chains.filter((c) => {
    if (filter === "loops") return c.hasLoop;
    if (filter === "critical") return (c.hops?.length || 0) >= 3 && !c.hasLoop;
    if (filter === "ok") return (c.hops?.length || 0) <= 2 && !c.hasLoop;
    return true;
  });

  const tabs = [
    { id: "chains", label: "Redirect-Ketten", icon: Link },
    { id: "summary", label: "Übersicht", icon: BarChart2 },
  ];

  const filterOpts = [
    { id: "all", label: "Alle" },
    { id: "loops", label: "Loops" },
    { id: "critical", label: "3+ Hops" },
    { id: "ok", label: "OK (≤2 Hops)" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        padding: "24px 20px",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: C.accent + "22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowRight size={18} strokeWidth={IW} style={{ color: C.accent }} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 22,
                color: T.primary,
                margin: 0,
                fontWeight: 700,
              }}
            >
              Redirect-Ketten-Analyse
            </h1>
            <p style={{ fontFamily: FONT, fontSize: 12, color: T.secondary, margin: 0 }}>
              Broken-Link-Checker · Redirect-Tracking
            </p>
          </div>
        </div>
      </div>

      {/* Input */}
      <Card style={{ padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label
              style={{
                display: "block",
                fontFamily: FONT,
                fontSize: 12,
                color: T.secondary,
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Website-URL analysieren
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyzeRedirects()}
              placeholder="https://example.com"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: C.surface2,
                border: `1px solid ${C.border}`,
                borderRadius: 9,
                color: T.primary,
                fontFamily: FONT,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = C.accent)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
          </div>
          <Btn
            onClick={analyzeRedirects}
            disabled={loading || !url.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              opacity: !url.trim() ? 0.5 : 1,
            }}
          >
            {loading ? (
              <Loader size={14} strokeWidth={IW} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Search size={14} strokeWidth={IW} />
            )}
            {loading ? "Analysiere…" : "Analysieren"}
          </Btn>
          {chains.length > 0 && (
            <ChainExportButton chains={chains} />
          )}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: C.error + "18",
            border: `1px solid ${C.error}44`,
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 20,
          }}
        >
          <AlertCircle size={16} strokeWidth={IW} style={{ color: C.error }} />
          <span style={{ fontFamily: FONT, fontSize: 13, color: C.error }}>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <Card style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ marginBottom: 16 }}>
            <Loader
              size={32}
              strokeWidth={IW}
              style={{ color: C.accent, animation: "spin 1s linear infinite", margin: "0 auto" }}
            />
          </div>
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: T.primary, margin: "0 0 6px" }}>
            Redirect-Ketten werden verfolgt…
          </p>
          <p style={{ fontFamily: FONT, fontSize: 12, color: T.secondary, margin: 0 }}>
            Verfolge HEAD-Requests mit Location-Header-Following (max. 10 Hops)
          </p>
        </Card>
      )}

      {/* Results */}
      {!loading && chains.length > 0 && (
        <>
          {/* Summary Cards */}
          <RedirectSummaryCard chains={chains} />

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  background: activeTab === id ? C.accent : "transparent",
                  color: activeTab === id ? "#fff" : T.secondary,
                  border: `1px solid ${activeTab === id ? C.accent : C.border}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: activeTab === id ? 600 : 400,
                  transition: "all 0.2s",
                }}
              >
                <Icon size={13} strokeWidth={IW} />
                {label}
              </button>
            ))}
          </div>

          {activeTab === "chains