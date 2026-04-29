import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Download,
  RefreshCw,
  Globe,
  BarChart2,
  CheckSquare,
  Square,
  Layers,
  Clock,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Activity,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";

// ─── Constants ──────────────────────────────────────────────────────────────
const METRICS = [
  { key: "traffic", label: "Traffic", color: C.primary, unit: "" },
  { key: "seoScore", label: "SEO-Score", color: C.success, unit: "%" },
  { key: "pageRank", label: "PageRank", color: C.warning, unit: "" },
  { key: "bounceRate", label: "Bounce-Rate", color: C.error, unit: "%" },
  { key: "performance", label: "Performance", color: "#8b5cf6", unit: "" },
];

const RANGES = [
  { key: "30d", label: "30 Tage" },
  { key: "90d", label: "90 Tage" },
  { key: "1y", label: "1 Jahr" },
  { key: "all", label: "Gesamt" },
];

const STORAGE_KEY = "cxfusion_trend_snapshots";
const DOMAINS_KEY = "cxfusion_tracked_domains";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadSnapshots() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSnapshots(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded – silently ignore */
  }
}

function loadDomains() {
  try {
    return JSON.parse(localStorage.getItem(DOMAINS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDomains(domains) {
  try {
    localStorage.setItem(DOMAINS_KEY, JSON.stringify(domains));
  } catch {}
}

function filterByRange(snapshots, range) {
  if (range === "all") return snapshots;
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 365;
  const cutoff = Date.now() - days * 86400000;
  return snapshots.filter((s) => new Date(s.timestamp).getTime() >= cutoff);
}

function calcDelta(current, previous, key) {
  if (previous === undefined || previous === null) return null;
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function generateMockSnapshot(domain, daysAgo = 0, seed = 1) {
  const base = (domain.length * 13 + seed * 7) % 40;
  return {
    timestamp: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    domain,
    traffic: Math.round(1200 + base * 80 + seed * 120 + Math.random() * 200),
    seoScore: Math.min(100, Math.round(42 + base * 0.8 + seed * 1.2 + Math.random() * 5)),
    pageRank: Math.min(10, Math.round((2 + seed * 0.15 + Math.random()) * 10) / 10),
    bounceRate: Math.max(20, Math.round(68 - seed * 0.8 + Math.random() * 8)),
    performance: Math.min(100, Math.round(55 + base * 0.5 + seed * 0.9 + Math.random() * 6)),
  };
}

// ─── AutoSnapshotBadge ───────────────────────────────────────────────────────
export function AutoSnapshotBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: C.primaryAlpha || "#e0f2fe",
        color: C.primary,
        borderRadius: 20,
        padding: "2px 8px",
        fontSize: 11,
        fontFamily: FONT,
        fontWeight: 600,
      }}
    >
      <Activity size={10} strokeWidth={IW} />
      Wird automatisch getracked
    </span>
  );
}

// ─── MetricSelector ──────────────────────────────────────────────────────────
function MetricSelector({ selected, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {METRICS.map((m) => {
        const active = selected.includes(m.key);
        return (
          <button
            key={m.key}
            onClick={() =>
              onChange(
                active ? selected.filter((k) => k !== m.key) : [...selected, m.key]
              )
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 20,
              border: `2px solid ${active ? m.color : T.muted}`,
              background: active ? m.color + "18" : "transparent",
              color: active ? m.color : T.secondary,
              cursor: "pointer",
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            {active ? (
              <CheckSquare size={13} strokeWidth={IW} />
            ) : (
              <Square size={13} strokeWidth={IW} />
            )}
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── DeltaBadge ──────────────────────────────────────────────────────────────
function DeltaBadge({ delta, unit = "%" }) {
  if (delta === null || delta === undefined) return null;
  const pos = delta > 0;
  const neutral = Math.abs(delta) < 0.5;
  const color = neutral ? T.muted : pos ? C.success : C.error;
  const Icon = neutral ? Minus : pos ? TrendingUp : TrendingDown;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        background: color + "18",
        color,
        borderRadius: 12,
        padding: "2px 7px",
        fontSize: 11,
        fontWeight: 700,
        fontFamily: FONT,
      }}
    >
      <Icon size={10} strokeWidth={IW} />
      {neutral ? "±0" : `${pos ? "+" : ""}${delta.toFixed(1)}${unit}`}
    </span>
  );
}

// ─── SnapshotCard ─────────────────────────────────────────────────────────────
function SnapshotCard({ snapshot, previous, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        background: T.surface || "#fff",
        border: `1px solid ${T.border || "#e5e7eb"}`,
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: C.primary + "15",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.primary,
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            #{index + 1}
          </div>
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: T.primary }}>
              {formatDate(snapshot.timestamp)}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 11, color: T.secondary }}>
              SEO {snapshot.seoScore}% · Traffic {snapshot.traffic.toLocaleString("de-DE")}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {previous && (
            <DeltaBadge delta={calcDelta(snapshot.seoScore, previous.seoScore, "seoScore")} />
          )}
          {expanded ? (
            <ChevronUp size={14} strokeWidth={IW} color={T.secondary} />
          ) : (
            <ChevronDown size={14} strokeWidth={IW} color={T.secondary} />
          )}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${T.border || "#e5e7eb"}`,
          }}
        >
          {METRICS.map((m) => (
            <div key={m.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: FONT, fontSize: 12, color: T.secondary }}>{m.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: m.color }}>
                  {snapshot[m.key]}{m.unit}
                </span>
                {previous && (
                  <DeltaBadge delta={calcDelta(snapshot[m.key], previous[m.key])} unit="%" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, metricKey, color }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ width: 80, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: FONT, fontSize: 10, color: T.muted }}>–</span>
      </div>
    );
  }
  const vals = data.map((d) => d[metricKey]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const last = vals[vals.length - 1];
  const first = vals[0];
  const trending = last > first;

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={trending ? C.success : C.error}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={w}
        cy={h - ((last - min) / range) * h}
        r={2.5}
        fill={trending ? C.success : C.error}
      />
    </svg>
  );
}

// ─── DomainRow ────────────────────────────────────────────────────────────────
function DomainRow({ domain, snapshots, onSelect, isSelected }) {
  const last = snapshots[snapshots.length - 1];
  const prev = snapshots[snapshots.length - 2];
  if (!last) return null;
  return (
    <div
      onClick={() => onSelect(domain)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 10,
        background: isSelected ? C.primary + "12" : T.surface || "#fff",
        border: `1.5px solid ${isSelected ? C.primary : T.border || "#e5e7eb"}`,
        cursor: "pointer",
        transition: "all 0.15s",
        marginBottom: 6,
      }}
    >
      <Globe size={14} strokeWidth={IW} color={isSelected ? C.primary : T.secondary} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.primary }}>
          {domain}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: T.secondary }}>
          {snapshots.length} Snapshots · Letzter: {formatDate(last.timestamp)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
        <Sparkline data={snapshots} metricKey="seoScore" color={C.success} />
        {prev && <DeltaBadge delta={calcDelta(last.seoScore, prev.seoScore)} />}
      </div>
    </div>
  );
}

// ─── SnapshotTimeline ─────────────────────────────────────────────────────────
function SnapshotTimeline({ snapshots, selectedMetrics, range, compareSnapshots, compareDomain }) {
  const filtered = filterByRange(snapshots, range);
  const compareFiltered = compareSnapshots ? filterByRange(compareSnapshots, range) : null;

  const chartData = filtered.map((s) => ({
    date: formatDate(s.timestamp),
    ...METRICS.reduce((acc, m) => ({ ...acc, [m.key]: s[m.key] }), {}),
  }));

  const compareData = compareFiltered
    ? compareFiltered.map((s) => ({
        date: formatDate(s.timestamp),
        ...METRICS.reduce((acc, m) => ({ ...acc, [`${m.key}_cmp`]: s[m.key] }), {}),
      }))
    : [];

  // Merge compare data by index for overlay
  const merged = chartData.map((d, i) => ({
    ...d,
    ...(compareData[i] || {}),
  }));

  const activeMetrics = METRICS.filter((m) => selectedMetrics.includes(m.key));

  if (merged.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220 }}>
        <span style={{ fontFamily: FONT, fontSize: 13, color: T.muted }}>
          Keine Daten für diesen Zeitraum
        </span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={merged} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.border || "#e5e7eb"} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontFamily: FONT, fontSize: 10, fill: T.secondary }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontFamily: FONT, fontSize: 10, fill: T.secondary }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            fontFamily: FONT,
            fontSize: 12,
            borderRadius: 8,
            border: `1px solid ${T.border || "#e5e7eb"}`,
            background: T.surface || "#fff",
          }}
        />
        <Legend
          wrapperStyle={{ fontFamily: FONT, fontSize: 11 }}
          iconType="circle"
          iconSize={8}
        />
        {activeMetrics.map((m) => (
          <Line
            key={m.key}
            type="monotone"
            dataKey={m.key}
            name={m.label}
            stroke={m.color}
            strokeWidth={2}
            dot={{ r: 3, fill: m.color }}
            activeDot={{ r: 5 }}
          />
        ))}
        {compareDomain &&
          activeMetrics.map((m) => (
            <Line
              key={`${m.key}_cmp`}
              type="monotone"
              dataKey={`${m.key}_cmp`}
              name={`${m.label} (${compareDomain})`}
              stroke={m.color}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              opacity={0.6}
            />
          ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── ExportTimelineButton ─────────────────────────────────────────────────────
function ExportTimelineButton({ domain, snapshots }) {
  const [open, setOpen] = useState(false);

  function exportCSV() {
    const headers = ["Datum", ...METRICS.map((m) => m.label)].join(";");
    const rows = snapshots.map((s) =>
      [formatDate(s.timestamp), ...METRICS.map((m) => s[m.key])].join(";")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${domain}_trends.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function exportPDF() {
    // Minimal print-based PDF export
    const w = window.open("", "_blank");
    const rows = snapshots
      .map(
        (s) =>
          `<tr><td>${formatDate(s.timestamp)}</td>${METRICS.map(
            (m) => `<td>${s[m.key]}${m.unit}</td>`
          ).join("")}</tr>`
      )
      .join("");
    w.document.write(`
      <html><head><title>${domain} Trend-Report</title>
      <style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f4f6}</style>
      </head><body>
      <h2>Trend-Report: ${domain}</h2>
      <p>Erstellt: ${new Date().toLocaleDateString("de-DE")}</p>
      <table><thead><tr><th>Datum</th>${METRICS.map((m) => `<th>${m.label}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody></table>
      </body></html>`);
    w.document.close();
    w.print();
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <Btn
        onClick={() => setOpen(!open)}
        variant="secondary"
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
      >
        <Download size={13} strokeWidth={IW} />
        Export
        <ChevronDown size={11} strokeWidth={IW} />
      </Btn>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            background: T.surface || "#fff",
            border: `1px solid ${T.border || "#e5e7eb"}`,
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 50,
            minWidth: 140,
            overflow: "hidden",
          }}
        >
          {[
            { label: "CSV-Export", icon: FileText, fn: exportCSV },
            { label: "PDF-Report", icon: FileText, fn: exportPDF },
          ].map(({ label, icon: Icon, fn }) => (
            <button
              key={label}
              onClick={fn}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: FONT,
                fontSize: 13,
                color: T.primary,
                textAlign: "left",
              }}
            >
              <Icon size={13} strokeWidth={IW} color={T.secondary} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DomainCompareOverlay ─────────────────────────────────────────────────────
function DomainCompareOverlay({ allDomains, currentDomain, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Layers size={14} strokeWidth={IW} color={T.secondary} />
      <span style={{ fontFamily: FONT, fontSize: 12, color: T.secondary }}>Vergleichen:</span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        style={{
          fontFamily: FONT,
          fontSize: 12,
          border: `1px solid ${T.border || "#e5e7eb"}`,
          borderRadius: 8,
          padding: "4px 8px",
          background: T.surface || "#fff",
          color: T.primary,
          cursor: "pointer",
        }}
      >
        <option value="">– kein Vergleich –</option>
        {allDomains
          .filter((d) => d !== currentDomain)
          .map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
      </select>
      {value && (
        <button
          onClick={() => onChange(null)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.secondary,
            display: "flex",
          }}
        >
          <X size={13} strokeWidth={IW} />
        </button>
      )}
    </div>
  );
}

// ─── OnboardingEmptyState ─────────────────────────────────────────────────────
function OnboardingEmptyState({ onAddDomain }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        textAlign: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: C.primary + "15",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <TrendingUp size={32} strokeWidth={IW} color={C.primary} />
      </div>
      <div style={{ fontFamily: FONT_DISPLAY || FONT, fontSize: 22, fontWeight: 700, color: T.primary }}>
        Verlaufsdaten sammeln
      </div>
      <div style={{ fontFamily: FONT, fontSize: 14, color: T.secondary, maxWidth: 380, lineHeight: 1.6 }}>
        cx-fusion speichert automatisch jeden Scan als Datenpunkt. Nach <strong>30 Tagen</strong> sind
        erste aussagekräftige Verläufe sichtbar. Starte jetzt – jede Analyse wird sofort getracked.
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: 8,
        }}
      >
        {["Traffic", "SEO-Score", "PageRank", "Bounce", "Performance"].map((m) => (
          <div
            key={m}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: T.surface || "#fff",
              border: `1px solid ${T.border || "#e5e7eb"}`,
              borderRadius: 20,
              padding: "6px 12px",
            }}
          >
            <Activity size={11} strokeWidth={IW} color={C.primary} />
            <span style={{ fontFamily: FONT, fontSize: 12, color: T.primary, fontWeight: 600 }}>{m}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <Btn onClick={onAddDomain} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Globe size={14} strokeWidth={IW} />
          Erste Domain hinzufügen
        </Btn>
      </div>
      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          background: C.warning + "15",
          borderRadius: 10,
          border: `1px solid ${C.warning}30`,
          maxWidth: 360,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Sparkles size={14} strokeWidth={IW} color={C.warning} style={{ marginTop: 2 }} />
          <span style={{ fontFamily: FONT, fontSize: 12, color: T.secondary, lineHeight: 1.5 }}>
            <strong style={{ color: T.primary }}>Retroaktiv-Import:</strong> Alle bereits
            gecachten Analysen werden automatisch als erster Datenpunkt importiert.
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── AddDomainModal ───────────────────────────────────────────────────────────
function AddDomainModal({ onAdd, onClose, loading }) {
  const [val, setVal] = useState("");
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: T.surface || "#fff",
          borderRadius: 16,
          padding: 28,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: FONT_DISPLAY || FONT, fontSize: 17, fontWeight: 700, color: T.primary }}>
            Domain hinzufügen
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.secondary }}
          >
            <X size={16} strokeWidth={IW} />
          </button>
        </div>
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && val.trim() && onAdd(val.trim())}
          placeholder="z.B. beispiel.de"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 10,
            border: `1.5px solid ${T.border || "#e5e7eb"}`,
            fontFamily: FONT,
            fontSize: 14,
            color: T.primary,
            background: T.background || "#f9fafb",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 14,
          }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>
            Abbrechen
          </Btn>
          <Btn onClick={() => val.trim() && onAdd(val.trim())} disabled={loading || !val.trim()}>
            {loading ? "Analysiere…" : "Tracken starten"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Main TrendsDashboard ─────────────────────────────────────────────────────
export default function TrendsDashboard() {
  const { goNav } = useApp();

  const [allSnapshots, setAllSnapshots] = useState({});
  const [trackedDomains, setTrackedDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [compareDomain, setCompareDomain] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(["traffic", "seoScore", "performance"]);
  const [range, setRange] = useState("90d");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading