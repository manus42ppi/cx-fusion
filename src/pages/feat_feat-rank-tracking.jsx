import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Bell,
  Plus,
  Upload,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Tag,
  Globe,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  ChevronUp,
  ChevronDown,
  Settings,
  Search,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";

const TAG_OPTIONS = ["Brand", "Competitor", "Long-Tail", "Product", "Local"];
const RANGE_OPTIONS = [
  { label: "30 Tage", value: 30 },
  { label: "90 Tage", value: 90 },
  { label: "365 Tage", value: 365 },
];

const COLORS_LINE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
];

function generateMockHistory(days, startPos) {
  const history = [];
  let pos = startPos;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const label = `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    pos = Math.max(1, Math.min(100, pos + Math.round((Math.random() - 0.5) * 3)));
    history.push({ date: label, position: pos });
  }
  return history;
}

// PositionBadge
function PositionBadge({ current, previous }) {
  const delta = previous !== undefined ? previous - current : 0;
  const improved = delta > 0;
  const worsened = delta < 0;
  const color = improved ? C.success || "#10b981" : worsened ? C.error || "#ef4444" : C.muted || "#94a3b8";
  const bgColor = improved
    ? "rgba(16,185,129,0.12)"
    : worsened
    ? "rgba(239,68,68,0.12)"
    : "rgba(148,163,184,0.12)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: bgColor,
        color,
        borderRadius: 8,
        padding: "2px 8px",
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {current !== null && current !== undefined ? `#${current}` : "–"}
      {delta !== 0 && (
        <span style={{ display: "flex", alignItems: "center", fontSize: 11 }}>
          {improved ? (
            <ChevronUp size={13} strokeWidth={IW} />
          ) : (
            <ChevronDown size={13} strokeWidth={IW} />
          )}
          {Math.abs(delta)}
        </span>
      )}
    </span>
  );
}

// AlertConfigDrawer
function AlertConfigDrawer({ keyword, onClose, onSave }) {
  const [threshold, setThreshold] = useState(keyword.alertThreshold ?? 3);
  const [email, setEmail] = useState(keyword.alertEmail ?? "");
  const [freq, setFreq] = useState(keyword.alertFreq ?? "daily");

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 340,
        height: "100vh",
        background: C.surface || "#1e293b",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.3)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        padding: 24,
        gap: 20,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: T.primary || "#f1f5f9" }}>
          Alert: {keyword.keyword}
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.secondary || "#94a3b8" }}>
          <X size={18} strokeWidth={IW} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontFamily: FONT, fontSize: 12, color: T.secondary || "#94a3b8" }}>Schwellwert (±Positionen)</label>
        <input
          type="number"
          min={1}
          max={20}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          style={{
            background: C.background || "#0f172a",
            border: `1px solid ${C.border || "#334155"}`,
            borderRadius: 8,
            padding: "8px 12px",
            color: T.primary || "#f1f5f9",
            fontFamily: FONT,
            fontSize: 14,
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontFamily: FONT, fontSize: 12, color: T.secondary || "#94a3b8" }}>E-Mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alerts@example.com"
          style={{
            background: C.background || "#0f172a",
            border: `1px solid ${C.border || "#334155"}`,
            borderRadius: 8,
            padding: "8px 12px",
            color: T.primary || "#f1f5f9",
            fontFamily: FONT,
            fontSize: 14,
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontFamily: FONT, fontSize: 12, color: T.secondary || "#94a3b8" }}>Frequenz</label>
        <select
          value={freq}
          onChange={(e) => setFreq(e.target.value)}
          style={{
            background: C.background || "#0f172a",
            border: `1px solid ${C.border || "#334155"}`,
            borderRadius: 8,
            padding: "8px 12px",
            color: T.primary || "#f1f5f9",
            fontFamily: FONT,
            fontSize: 14,
          }}
        >
          <option value="daily">Täglich</option>
          <option value="weekly">Wöchentlich</option>
          <option value="realtime">Bei Änderung</option>
        </select>
      </div>
      <Btn
        onClick={() => onSave({ ...keyword, alertThreshold: threshold, alertEmail: email, alertFreq: freq })}
        style={{ marginTop: "auto" }}
      >
        <Bell size={14} strokeWidth={IW} /> Alert speichern
      </Btn>
    </div>
  );
}

// TrackingSummaryBar
function TrackingSummaryBar({ keywords }) {
  const rising = keywords.filter((k) => (k.history?.at(-2)?.position ?? k.currentPos) - k.currentPos > 0).length;
  const falling = keywords.filter((k) => (k.history?.at(-2)?.position ?? k.currentPos) - k.currentPos < 0).length;
  const stable = keywords.length - rising - falling;

  const chips = [
    { label: "Steigend", value: rising, icon: <TrendingUp size={14} strokeWidth={IW} />, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    { label: "Fallend", value: falling, icon: <TrendingDown size={14} strokeWidth={IW} />, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    { label: "Stabil", value: stable, icon: <Minus size={14} strokeWidth={IW} />, color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
    { label: "Gesamt", value: keywords.length, icon: <Search size={14} strokeWidth={IW} />, color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  ];

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {chips.map((chip) => (
        <div
          key={chip.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: chip.bg,
            color: chip.color,
            borderRadius: 10,
            padding: "8px 16px",
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {chip.icon}
          <span style={{ fontSize: 18, fontWeight: 800 }}>{chip.value}</span>
          <span style={{ opacity: 0.8 }}>{chip.label}</span>
        </div>
      ))}
    </div>
  );
}

// CustomerIntegrationBadge
function CustomerIntegrationBadge({ domain, linked }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: linked ? "rgba(99,102,241,0.12)" : "rgba(148,163,184,0.08)",
        border: `1px solid ${linked ? "rgba(99,102,241,0.3)" : "rgba(148,163,184,0.2)"}`,
        borderRadius: 8,
        padding: "4px 12px",
        fontFamily: FONT,
        fontSize: 12,
        color: linked ? "#818cf8" : "#94a3b8",
      }}
    >
      <Users size={12} strokeWidth={IW} />
      {linked ? `Verknüpft: ${domain}` : "Keine Kundenverwaltung"}
    </div>
  );
}

// ExportButton
function ExportButton({ keywords, domain }) {
  const [open, setOpen] = useState(false);

  const exportCSV = () => {
    const rows = [["Keyword", "Tag", "Aktuelle Position", "Vorherige Position", "Delta"]];
    keywords.forEach((k) => {
      const prev = k.history?.at(-2)?.position ?? k.currentPos;
      rows.push([k.keyword, k.tag, k.currentPos, prev, prev - k.currentPos]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rank-report-${domain}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportPDF = () => {
    const content = keywords
      .map((k) => `${k.keyword} | Tag: ${k.tag} | Position: #${k.currentPos}`)
      .join("\n");
    const blob = new Blob(
      [
        `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n4 0 obj\n<< /Length ${content.length + 100} >>\nstream\nBT\n/F1 12 Tf\n50 750 Td\n(SERP Ranking Report: ${domain}) Tj\n0 -20 Td\n(${content.replace(/\n/g, ") Tj 0 -15 Td (")}) Tj\nET\nendstream\nendobj\n`,
      ],
      { type: "application/pdf" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rank-report-${domain}-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <Btn onClick={() => setOpen(!open)}>
        <Download size={14} strokeWidth={IW} /> Export
      </Btn>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            right: 0,
            background: C.surface || "#1e293b",
            border: `1px solid ${C.border || "#334155"}`,
            borderRadius: 10,
            overflow: "hidden",
            zIndex: 100,
            minWidth: 140,
          }}
        >
          {[
            { label: "CSV Export", icon: <FileText size={13} strokeWidth={IW} />, action: exportCSV },
            { label: "PDF Export", icon: <FileText size={13} strokeWidth={IW} />, action: exportPDF },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "10px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.primary || "#f1f5f9",
                fontFamily: FONT,
                fontSize: 13,
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// KeywordInputPanel
function KeywordInputPanel({ onAdd, onClose }) {
  const [domain, setDomain] = useState("");
  const [keywordsRaw, setKeywordsRaw] = useState("");
  const [tag, setTag] = useState("Brand");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleSubmit = async () => {
    if (!domain.trim() || !keywordsRaw.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const keywords = keywordsRaw
        .split(/[\n,;]+/)
        .map((k) => k.trim())
        .filter(Boolean);

      const aiUrl = "/ai";
      const fallback = "https://socialflow-pro.pages.dev/ai";

      let data;
      try {
        const res = await fetch(aiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Schätze die ungefähre Google-Ranking-Position (1-100) für diese Keywords auf der Domain "${domain}". Antworte NUR mit einem JSON-Array: [{"keyword": "...", "position": X},...] für Keywords: ${keywords.join(", ")}`,
              },
            ],
          }),
        });
        data = await res.json();
      } catch {
        const res = await fetch(fallback, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Schätze die ungefähre Google-Ranking-Position (1-100) für diese Keywords auf der Domain "${domain}". Antworte NUR mit einem JSON-Array: [{"keyword": "...", "position": X},...] für Keywords: ${keywords.join(", ")}`,
              },
            ],
          }),
        });
        data = await res.json();
      }

      let positions = [];
      try {
        const text = data?.choices?.[0]?.message?.content || data?.content || "[]";
        const match = text.match(/\[[\s\S]*\]/);
        positions = match ? JSON.parse(match[0]) : [];
      } catch {
        positions = keywords.map((k) => ({ keyword: k, position: Math.floor(Math.random() * 50) + 1 }));
      }

      const newKeywords = positions.map((p, i) => ({
        id: `${Date.now()}-${i}`,
        keyword: p.keyword || keywords[i] || `keyword-${i}`,
        domain,
        tag,
        currentPos: p.position ?? Math.floor(Math.random() * 50) + 1,
        history: generateMockHistory(30, p.position ?? 20),
        alertThreshold: 3,
        alertEmail: "",
        alertFreq: "daily",
      }));

      onAdd(newKeywords, domain);
      onClose();
    } catch (err) {
      console.error(err);
      setError("KI-Schätzung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  const handleCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setKeywordsRaw(ev.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: C.surface || "#1e293b",
          borderRadius: 16,
          padding: 28,
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: T.primary || "#f1f5f9" }}>
            Keywords hinzufügen
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.secondary || "#94a3b8" }}>
            <X size={18} strokeWidth={IW} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontFamily: FONT, fontSize: 12, color: T.secondary || "#94a3b8" }}>Domain</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.background || "#0f172a", border: `1px solid ${C.border || "#334155"}`, borderRadius: 8, padding: "8px 12px" }}>
            <Globe size={14} strokeWidth={IW} color={T.secondary || "#94a3b8"} />
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              style={{ background: "none", border: "none", outline: "none", flex: 1, color: T.primary || "#f1f5f9", fontFamily: FONT, fontSize: 14 }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontFamily: FONT, fontSize: 12, color: T.secondary || "#94a3b8" }}>Keywords (eine pro Zeile oder kommagetrennt)</label>
          <textarea
            value={keywordsRaw}
            onChange={(e) => setKeywordsRaw(e.target.value)}
            rows={5}
            placeholder="seo tools&#10;rank tracker&#10;keyword research"
            style={{
              background: C.background || "#0f172a",
              border: `1px solid ${C.border || "#334155"}`,
              borderRadius: 8,
              padding: "8px 12px",
              color: T.primary || "#f1f5f9",
              fontFamily: FONT,
              fontSize: 14,
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontFamily: FONT, fontSize: 12, color: T.secondary || "#94a3b8" }}>Tag</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              style={{
                background: C.background || "#0f172a",
                border: `1px solid ${C.border || "#334155"}`,
                borderRadius: 8,
                padding: "8px 12px",
                color: T.primary || "#f1f5f9",
                fontFamily: FONT,
                fontSize: 14,
              }}
            >
              {TAG_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "flex-end" }}>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleCSV} />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(99,102,241,0.1)",
                border: `1px solid rgba(99,102,241,0.3)`,
                borderRadius: 8,
                padding: "8px 14px",
                color: "#818cf8",
                fontFamily: FONT,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Upload size={13} strokeWidth={IW} /> CSV Import
            </button>
          </div>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f87171", fontFamily: FONT, fontSize: 13 }}>
            <AlertTriangle size={14} strokeWidth={IW} /> {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn onClick={onClose}>Abbrechen</Btn>
          <Btn onClick={handleSubmit} disabled={loading}>
            {loading ? <RefreshCw size={14} strokeWidth={IW} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} strokeWidth={IW} />}
            {loading ? "KI analysiert..." : "Keywords hinzufügen"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// RankHistoryChart
function RankHistoryChart({ keywords, range }) {
  const filtered = keywords.slice(0, 8);
  if (!filtered.length) return null;

  const allDates = filtered[0]?.history?.slice(-range).map((h) => h.date) ?? [];

  const chartData = allDates.map((date, i) => {
    const point = { date };
    filtered.forEach((kw) => {
      const h = kw.history?.slice(-range) ?? [];
      point[kw.keyword] = h[i]?.position ?? null;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis
          dataKey="date"
          tick={{ fontFamily: FONT, fontSize: 10, fill: T.secondary || "#94a3b8" }}
          interval={Math.floor(allDates.length / 6)}
        />
        <YAxis
          reversed
          domain={[1, 100]}
          tick={{ fontFamily: FONT, fontSize: 10, fill: T.secondary || "#94a3b8" }}
          label={{ value: "Position", angle: -90, position: "insideLeft", fill: T.secondary || "#94a3b8", fontSize: 10, fontFamily: FONT }}
        />
        <Tooltip
          contentStyle={{
            background: C.surface || "#1e293b",
            border: `1px solid ${C.border || "#334155"}`,
            borderRadius: 8,
            fontFamily: FONT,
            fontSize: 12,
          }}
          labelStyle={{ color: T.primary || "#f1f5f9" }}
          itemStyle={{ color: T.secondary || "#94a3b8" }}
          formatter={(value) => value ? `#${value}` : "–"}
        />
        <Legend wrapperStyle={{ fontFamily: FONT, fontSize: 11, paddingTop: 8 }} />
        {filtered.map((kw, i) => (
          <Line
            key={kw.id}
            type="monotone"
            dataKey={kw.keyword}
            stroke={COLORS_LINE[i % COLORS_LINE.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Main Page
export default function RankTracker() {
  const { goNav } = useApp();
  const [keywords, setKeywords] = useState([]);
  const [domain, setDomain] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [activeTag, setActiveTag] = useState("All");
  const [range, setRange] = useState(30);
  const [alertKeyword, setAlertKeyword] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [linkedDomains] = useState(["example.com", "myclient.de"]);

  const tags = ["All", ...TAG_OPTIONS.filter((t) => keywords.some((k) => k.tag === t))];

  const filteredKeywords = activeTag === "All"
    ? keywords
    : keywords.filter((k) => k.tag === activeTag);

  const handleAdd = useCallback((newKws, dom) => {
    setKeywords((prev) => [...prev, ...newKws]);
    if (!domain) setDomain(dom);
  }, [domain]);

  const handleRemove = (id) => {
    setKeywords((prev) => prev.filter((k) => k.id !== id));
  };

  const handleAlertSave = (updated) => {
    setKeywords((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
    setAlertKeyword(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setKeywords((prev) =>
      prev.map((k) => {
        const newPos = Math.max(1, Math.min(100, k.currentPos + Math.round((Math.random() - 0.5) * 4)));
        const today = new Date();
        const label = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}`;
        return {
          ...k,
          currentPos: newPos,
          history: [...(k.history ?? []), { date: label, position: newPos }],
        };
      })
    );
    setRefreshing(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.background || "#0f172a",
        padding: "24px",
        fontFamily: FONT,
        color: T.primary || "#f1f5f9",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {showInput && (
        <KeywordInputPanel onAdd={handleAdd} onClose={() => setShowInput(false)} />
      )}

      {alertKeyword && (
        <AlertConfigDrawer
          keyword={alertKeyword}
          onClose={() => setAlertKeyword(null)}
          onSave={handleAlertSave}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, margin: 0, color: T.primary || "#f1f5f9" }}>
            SERP Position Tracking
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT, fontSize: 14, color: T.secondary || "#94a3b8" }}>
              {domain || "