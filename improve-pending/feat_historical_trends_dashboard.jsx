import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Brush,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  Globe,
  ChevronDown,
  BarChart2,
  Link,
  Search,
  Users,
  Calendar,
  AlertCircle,
  Toggle,
  FileText,
  Table,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";

// ── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n, dec = 0) =>
  n == null ? "–" : Number(n).toLocaleString("de-DE", { maximumFractionDigits: dec });

const fmtPct = (n) =>
  n == null ? "–" : `${n > 0 ? "+" : ""}${Number(n).toFixed(1)}%`;

const weekLabel = (iso) => {
  const d = new Date(iso);
  const wk = Math.ceil(
    ((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7
  );
  return `KW${wk} '${String(d.getFullYear()).slice(2)}`;
};

const ALGO_UPDATES = [
  { date: "2024-03-05", name: "Core Update März 2024", color: "#f97316" },
  { date: "2024-08-15", name: "Core Update Aug 2024", color: "#a855f7" },
  { date: "2024-11-11", name: "Nov. Core Update", color: "#ef4444" },
  { date: "2025-01-20", name: "Helpful Content 2025", color: "#06b6d4" },
  { date: "2025-03-12", name: "Core Update März 2025", color: "#f97316" },
];

const METRICS = [
  { key: "seo", label: "SEO-Score", icon: Search, unit: "", color: C.primary, max: 100 },
  { key: "traffic", label: "Traffic", icon: Users, unit: "", color: "#06b6d4", max: null },
  { key: "keywords", label: "Keywords", icon: BarChart2, unit: "", color: "#a855f7", max: null },
  { key: "backlinks", label: "Backlinks", icon: Link, unit: "", color: "#f97316", max: null },
];

const MOCK_DOMAINS = [
  "example-shop.de",
  "mein-blog.com",
  "saas-startup.io",
  "agentur-website.de",
];

const generateMockSnapshots = (domain, weeks = 52) => {
  const snap = [];
  let seo = 55 + Math.random() * 20;
  let traffic = 800 + Math.random() * 3000;
  let keywords = 120 + Math.random() * 500;
  let backlinks = 80 + Math.random() * 400;
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    seo = Math.min(100, Math.max(10, seo + (Math.random() - 0.48) * 3));
    traffic = Math.max(100, traffic + (Math.random() - 0.45) * 200);
    keywords = Math.max(10, keywords + (Math.random() - 0.45) * 15);
    backlinks = Math.max(5, backlinks + (Math.random() - 0.44) * 8);
    snap.push({
      date: d.toISOString().slice(0, 10),
      seo: Math.round(seo * 10) / 10,
      traffic: Math.round(traffic),
      keywords: Math.round(keywords),
      backlinks: Math.round(backlinks),
    });
  }
  return snap;
};

// ── sub-components ────────────────────────────────────────────────────────────

const SnapshotDiffBadge = ({ current, previous }) => {
  if (current == null || previous == null || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const up = pct > 0;
  const neutral = Math.abs(pct) < 0.5;
  const bg = neutral ? T.muted + "33" : up ? "#16a34a22" : "#dc262622";
  const col = neutral ? T.muted : up ? "#16a34a" : "#dc2626";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        background: bg,
        color: col,
        borderRadius: 6,
        padding: "2px 7px",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: FONT,
      }}
    >
      {neutral ? (
        <Minus size={10} strokeWidth={IW} />
      ) : up ? (
        <TrendingUp size={10} strokeWidth={IW} />
      ) : (
        <TrendingDown size={10} strokeWidth={IW} />
      )}
      {fmtPct(pct)}
    </span>
  );
};

const DomainSelectorDropdown = ({ domains, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: "8px 14px", cursor: "pointer",
          color: T.primary, fontFamily: FONT, fontSize: 14, fontWeight: 500,
        }}
      >
        <Globe size={15} strokeWidth={IW} />
        {value || "Domain wählen"}
        <ChevronDown size={14} strokeWidth={IW} style={{ marginLeft: 4, opacity: 0.6 }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0,
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10, minWidth: 220, zIndex: 200,
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          }}
        >
          {domains.map((d) => (
            <button
              key={d}
              onClick={() => { onChange(d); setOpen(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "10px 14px", background: "none", border: "none",
                cursor: "pointer", color: d === value ? C.primary : T.primary,
                fontFamily: FONT, fontSize: 14,
                fontWeight: d === value ? 600 : 400,
              }}
            >
              {d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MetricSelector = ({ value, onChange }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
    {METRICS.map((m) => {
      const active = value === m.key;
      const Icon = m.icon;
      return (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8, cursor: "pointer",
            border: `1.5px solid ${active ? m.color : T.border}`,
            background: active ? m.color + "18" : T.surface,
            color: active ? m.color : T.secondary,
            fontFamily: FONT, fontSize: 13, fontWeight: active ? 600 : 400,
            transition: "all .15s",
          }}
        >
          <Icon size={13} strokeWidth={IW} />
          {m.label}
        </button>
      );
    })}
  </div>
);

const AutoMonitorToggle = ({ domain, enabled, onToggle }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <span style={{ fontFamily: FONT, fontSize: 13, color: T.secondary }}>
      Auto-Monitoring
    </span>
    <button
      onClick={() => onToggle(!enabled)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: enabled ? C.primary : T.border,
        border: "none", cursor: "pointer", position: "relative",
        transition: "background .2s",
      }}
    >
      <span
        style={{
          position: "absolute", top: 3,
          left: enabled ? 23 : 3,
          width: 18, height: 18, borderRadius: 9,
          background: "#fff",
          transition: "left .2s",
          boxShadow: "0 1px 4px rgba(0,0,0,.2)",
        }}
      />
    </button>
    {enabled && (
      <span style={{ fontFamily: FONT, fontSize: 11, color: "#16a34a" }}>
        aktiv
      </span>
    )}
  </div>
);

const PeriodCompareToggle = ({ enabled, onToggle, periodA, periodB, setPeriodA, setPeriodB, dataLen }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
    <button
      onClick={() => onToggle(!enabled)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 8, cursor: "pointer",
        border: `1.5px solid ${enabled ? C.primary : T.border}`,
        background: enabled ? C.primary + "18" : T.surface,
        color: enabled ? C.primary : T.secondary,
        fontFamily: FONT, fontSize: 13, fontWeight: enabled ? 600 : 400,
      }}
    >
      <Calendar size={13} strokeWidth={IW} />
      Perioden-Vergleich
    </button>
    {enabled && (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: FONT, fontSize: 12, color: T.secondary }}>A:</span>
          <select
            value={periodA}
            onChange={(e) => setPeriodA(Number(e.target.value))}
            style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 6, padding: "4px 8px", color: T.primary,
              fontFamily: FONT, fontSize: 12,
            }}
          >
            {[4, 8, 13, 26].map((w) => (
              <option key={w} value={w}>{w} Wochen</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: FONT, fontSize: 12, color: T.secondary }}>B:</span>
          <select
            value={periodB}
            onChange={(e) => setPeriodB(Number(e.target.value))}
            style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 6, padding: "4px 8px", color: T.primary,
              fontFamily: FONT, fontSize: 12,
            }}
          >
            {[4, 8, 13, 26].map((w) => (
              <option key={w} value={w}>{w} Wochen</option>
            ))}
          </select>
        </div>
      </>
    )}
  </div>
);

const AlgorithmTooltip = ({ active, payload, label, snapshots }) => {
  if (!active || !payload?.length) return null;
  const snap = snapshots.find((s) => s.date === label);
  const update = ALGO_UPDATES.find((u) => u.date === label);
  return (
    <div
      style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: "12px 16px",
        boxShadow: "0 8px 24px rgba(0,0,0,.15)",
        fontFamily: FONT, minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 600, color: T.primary, marginBottom: 6, fontSize: 13 }}>
        {snap ? weekLabel(label) : label}
      </div>
      {update && (
        <div
          style={{
            background: update.color + "22", color: update.color,
            borderRadius: 5, padding: "3px 7px", fontSize: 11,
            fontWeight: 600, marginBottom: 8,
          }}
        >
          🔔 {update.name}
        </div>
      )}
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 12, marginBottom: 3 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 600, color: T.primary }}>{fmt(p.value, 1)}</span>
        </div>
      ))}
    </div>
  );
};

const SnapshotHistoryTable = ({ data, metric }) => {
  const [sortDir, setSortDir] = useState("desc");
  const m = METRICS.find((x) => x.key === metric);

  const sorted = [...data].sort((a, b) =>
    sortDir === "desc"
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date)
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.border}` }}>
            <th
              style={{ textAlign: "left", padding: "8px 12px", color: T.secondary, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                Datum <ArrowUpDown size={12} strokeWidth={IW} />
              </span>
            </th>
            {METRICS.map((mx) => (
              <th key={mx.key} style={{ textAlign: "right", padding: "8px 12px", color: mx.key === metric ? mx.color : T.secondary, fontWeight: mx.key === metric ? 600 : 400 }}>
                {mx.label}
              </th>
            ))}
            <th style={{ textAlign: "right", padding: "8px 12px", color: T.secondary, fontWeight: 500 }}>
              Δ {m?.label}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const prev = sorted[i + 1];
            return (
              <tr
                key={row.date}
                style={{ borderBottom: `1px solid ${T.border}30`, background: i % 2 === 0 ? "transparent" : T.surface + "60" }}
              >
                <td style={{ padding: "8px 12px", color: T.primary, fontWeight: 500, whiteSpace: "nowrap" }}>
                  {weekLabel(row.date)}
                  <span style={{ display: "block", fontSize: 10, color: T.muted }}>{row.date}</span>
                </td>
                {METRICS.map((mx) => (
                  <td key={mx.key} style={{ textAlign: "right", padding: "8px 12px", color: mx.key === metric ? mx.color : T.secondary, fontWeight: mx.key === metric ? 600 : 400 }}>
                    {fmt(row[mx.key], mx.key === "seo" ? 1 : 0)}
                  </td>
                ))}
                <td style={{ textAlign: "right", padding: "8px 12px" }}>
                  <SnapshotDiffBadge current={row[metric]} previous={prev?.[metric]} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const ExportButton = ({ snapshots, domain, metric }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const exportCSV = () => {
    const header = "Datum,KW,SEO-Score,Traffic,Keywords,Backlinks\n";
    const rows = snapshots.map((s) =>
      `${s.date},${weekLabel(s.date)},${s.seo},${s.traffic},${s.keywords},${s.backlinks}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${domain}-seo-timeline.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportPDF = () => {
    const content = `SEO & Traffic Zeitstrahl\nDomain: ${domain}\nExportiert: ${new Date().toLocaleDateString("de-DE")}\n\n` +
      snapshots.map((s) => `${s.date} | SEO: ${s.seo} | Traffic: ${s.traffic} | KW: ${s.keywords} | BL: ${s.backlinks}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${domain}-seo-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Btn onClick={() => setOpen((o) => !o)} variant="outline" size="sm">
        <Download size={14} strokeWidth={IW} style={{ marginRight: 6 }} />
        Export
        <ChevronDown size={12} strokeWidth={IW} style={{ marginLeft: 4 }} />
      </Btn>
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10, minWidth: 160, zIndex: 200,
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          }}
        >
          <button
            onClick={exportCSV}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "10px 14px", background: "none",
              border: "none", cursor: "pointer", color: T.primary,
              fontFamily: FONT, fontSize: 13,
            }}
          >
            <Table size={14} strokeWidth={IW} /> CSV exportieren
          </button>
          <button
            onClick={exportPDF}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "10px 14px", background: "none",
              border: "none", cursor: "pointer", color: T.primary,
              fontFamily: FONT, fontSize: 13,
            }}
          >
            <FileText size={14} strokeWidth={IW} /> Report exportieren
          </button>
        </div>
      )}
    </div>
  );
};

// ── main page ─────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const { goNav } = useApp();

  const [domains] = useState(MOCK_DOMAINS);
  const [selectedDomain, setSelectedDomain] = useState(MOCK_DOMAINS[0]);
  const [snapshots, setSnapshots] = useState([]);
  const [metric, setMetric] = useState("seo");
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [autoMonitor, setAutoMonitor] = useState(true);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [periodA, setPeriodA] = useState(13);
  const [periodB, setPeriodB] = useState(13);
  const [weeks, setWeeks] = useState(26);
  const [error, setError] = useState("");

  const currentMetric = METRICS.find((m) => m.key === metric);

  const loadSnapshots = useCallback(() => {
    setLoading(true);
    setError("");
    setTimeout(() => {
      setSnapshots(generateMockSnapshots(selectedDomain, 52));
      setLoading(false);
    }, 600);
  }, [selectedDomain]);

  useEffect(() => {
    loadSnapshots();
    setAiInsight("");
  }, [loadSnapshots]);

  const visibleData = snapshots.slice(-weeks);

  const getCompareData = () => {
    if (!compareEnabled || snapshots.length < periodA + periodB) return null;
    const sliceA = snapshots.slice(-(periodA + periodB), -periodB);
    const sliceB = snapshots.slice(-periodB);
    const maxLen = Math.max(sliceA.length, sliceB.length);
    return Array.from({ length: maxLen }, (_, i) => ({
      idx: i + 1,
      periodA: sliceA[i]?.[metric] ?? null,
      periodB: sliceB[i]?.[metric] ?? null,
    }));
  };

  const compareData = getCompareData();

  const fetchAiInsight = async () => {
    if (!snapshots.length) return;
    setAiLoading(true);
    const last8 = snapshots.slice(-8).map((s) => `${s.date}: SEO=${s.seo}, Traffic=${s.traffic}, KW=${s.keywords}, BL=${s.backlinks}`).join("\n");
    const body = {
      prompt: `Analysiere diese SEO-Zeitreihendaten für ${selectedDomain} und gib 3 konkrete Handlungsempfehlungen in max. 120 Wörtern:\n${last8}`,
      system: "Du bist ein SEO-Experte. Antworte auf Deutsch, präzise und handlungsorientiert.",
    };
    try {
      let res = await fetch("/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
      if (!res?.ok) {
        res = await fetch("https://socialflow-pro.pages.dev/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      const data = await res.json();
      setAiInsight(data.text || data.content || data.message || "Keine Antwort erhalten.");
    } catch (e) {
      console.error(e);
      setError("KI-Analyse fehlgeschlagen.");
    } finally {
      setAiLoading(false);
    }
  };

  const latest = snapshots[snapshots.length - 1];
  const prev = snapshots[snapshots.length - 2];

  const algoInView = ALGO_UPDATES.filter((u) =>
    visibleData.some((s) => s.date === u.date)
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: T.primary, margin: 0 }}>
              SEO & Traffic Zeitstrahl
            </h1>
            <p style={{ color: T.secondary, fontSize: 14, margin: "4px 0 0" }}>
              Historische Domain-Performance auf einen Blick
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <ExportButton snapshots={snapshots} domain={selectedDomain} metric={metric} />
            <Btn onClick={loadSnapshots} variant="outline" size="sm">
              <RefreshCw size={14} strokeWidth={IW} style={{ marginRight: 6 }} />
              Aktualisieren
            </Btn>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <DomainSelectorDropdown
              domains={domains}
              value={selectedDomain}
              onChange={setSelectedDomain}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: FONT, fontSize: 12, color: T.secondary }}>Zeitraum:</span>
              {[12, 26, 52].map((w) => (
                <button
                  key={w}
                  onClick={() => setWeeks(w)}
                  style={{
                    padding: "5px 11px", borderRadius: 7, border: `1px solid ${weeks === w ? C.primary : T.border}`,
                    background: weeks === w ? C.primary + "18" : "transparent",
                    color: weeks === w ? C.primary : T.secondary,
                    cursor: "pointer", fontFamily: FONT, fontSize: 12, fontWeight: weeks === w ? 600 : 400,
                  }}
                >
                  {w}W
                </button>
              ))}
            </div>
          </div>
          <AutoMonitorToggle domain={selectedDomain} enabled={autoMonitor} onToggle={setAutoMonitor} />
        </div>
      </Card>

      {/* KPI Cards */}
      {latest && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
          {METRICS.map((m) => (
            <Card
              key={m.key}
              style={{ padding: "14px 18px", cursor: "pointer", border: `1.5px solid ${metric === m.key ? m.color : T.border}` }}
              onClick={() => setMetric(m.key)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: T.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {m.label}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: m.color, fontFamily: FONT_DISPLAY }}>
                    {fmt(latest[m.key], m.key === "seo" ? 1 : 0)}
                    {m.key === "seo" && <span style={{ fontSize: 13, color: T.muted }}>/100</span>}
                  </p>
                </div>
                <SnapshotDiffBadge current={latest[m.key]} previous={prev?.[m.key]} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 16 }}>
          <AlertCircle size={16} strokeWidth={IW} color="#dc2626" />
          <span style={{ color: "#dc2626", fontSize: 13 }}>{error}</span>
        </div>
      )}

      {/* Metric Selector + Compare */}
      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
          <MetricSelector value={metric} onChange={setMetric} />
          <PeriodCompareToggle
            enabled={compareEnabled}
            onToggle={setCompareEnabled}
            period