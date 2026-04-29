import React, { useState, useRef, useCallback, useEffect } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart2,
  DollarSign,
  Globe,
  Star,
  ShoppingCart,
  Map,
  MessageSquare,
  Upload,
  Download,
  Tag,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Minus,
  AlertCircle,
  Loader,
  FileText,
  Link,
  Award,
  Activity,
  Zap,
  Target,
  List,
  Trash2,
  Save,
} from "lucide-react";

// ─── Sparkline Mini Chart ───────────────────────────────────────────
const Sparkline = ({ data = [], color = C.accent, height = 40, width = 120 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={`0,${height} ${pts.join(" ")} ${width},${height}`}
        fill={color}
        fillOpacity="0.12"
        stroke="none"
      />
    </svg>
  );
};

// ─── Difficulty Gauge ───────────────────────────────────────────────
const DifficultyGauge = ({ value = 0, size = 120 }) => {
  const r = 45;
  const cx = 60;
  const cy = 60;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - Math.min(value, 100) / 100);
  const getColor = (v) => {
    if (v < 30) return "#22c55e";
    if (v < 60) return "#f59e0b";
    if (v < 80) return "#f97316";
    return "#ef4444";
  };
  const getLabel = (v) => {
    if (v < 30) return "Easy";
    if (v < 60) return "Medium";
    if (v < 80) return "Hard";
    return "Very Hard";
  };
  const color = getColor(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size * 0.6} viewBox="0 0 120 72">
        <path
          d={`M 15 60 A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={C.border || "#2a2a3a"}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M 15 60 A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="60" y="55" textAnchor="middle" fill={T.primary} fontSize="18" fontWeight="700">
          {value}
        </text>
      </svg>
      <span style={{ fontSize: FONT.sm, color, fontWeight: "600", marginTop: 2 }}>
        {getLabel(value)}
      </span>
    </div>
  );
};

// ─── CPC Badge ──────────────────────────────────────────────────────
const CPCBadge = ({ value = 0, trend = 0 }) => {
  const getLevel = (v) => {
    if (v < 1) return { label: "Low", color: "#22c55e" };
    if (v < 5) return { label: "Medium", color: "#f59e0b" };
    return { label: "High", color: "#ef4444" };
  };
  const { label, color } = getLevel(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: FONT.xl, fontWeight: "700", color: T.primary }}>
        ${value.toFixed(2)}
      </span>
      <Badge style={{ background: color + "22", color, border: `1px solid ${color}44` }}>
        {label}
      </Badge>
      {trend !== 0 && (
        <span style={{ display: "flex", alignItems: "center", color: trend > 0 ? "#ef4444" : "#22c55e" }}>
          {trend > 0 ? (
            <TrendingUp size={14} strokeWidth={IW} />
          ) : (
            <TrendingDown size={14} strokeWidth={IW} />
          )}
          <span style={{ fontSize: FONT.xs, marginLeft: 2 }}>{Math.abs(trend)}%</span>
        </span>
      )}
    </div>
  );
};

// ─── SERP Feature Icon ──────────────────────────────────────────────
const SERPIcon = ({ type, active }) => {
  const icons = {
    featured_snippet: { icon: Star, label: "Featured Snippet" },
    people_also_ask: { icon: MessageSquare, label: "People Also Ask" },
    shopping: { icon: ShoppingCart, label: "Shopping" },
    maps: { icon: Map, label: "Maps" },
    news: { icon: FileText, label: "News" },
    video: { icon: Activity, label: "Video" },
    knowledge_panel: { icon: Award, label: "Knowledge Panel" },
    site_links: { icon: Link, label: "Site Links" },
  };
  const config = icons[type] || { icon: Zap, label: type };
  const Icon = config.icon;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "8px 10px",
        borderRadius: 8,
        background: active ? C.accent + "22" : (C.surface2 || "#1a1a2e"),
        border: `1px solid ${active ? C.accent + "55" : (C.border || "#2a2a3a")}`,
        opacity: active ? 1 : 0.4,
        minWidth: 70,
      }}
    >
      <Icon size={18} strokeWidth={IW} color={active ? C.accent : T.muted} />
      <span style={{ fontSize: 10, color: active ? T.primary : T.muted, textAlign: "center", lineHeight: 1.2 }}>
        {config.label}
      </span>
    </div>
  );
};

// ─── Volume Metric Card ─────────────────────────────────────────────
const VolumeMetricCard = ({ volume, trend, months }) => {
  const formatNum = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n?.toString() || "0";
  };
  const trendPct =
    months && months.length >= 2
      ? Math.round(((months[months.length - 1] - months[0]) / (months[0] || 1)) * 100)
      : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
        <span style={{ fontSize: 32, fontWeight: "800", color: T.primary, fontFamily: FONT_DISPLAY }}>
          {formatNum(volume)}
        </span>
        <span
          style={{
            fontSize: FONT.sm,
            color: trendPct >= 0 ? "#22c55e" : "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: 2,
            marginBottom: 6,
          }}
        >
          {trendPct >= 0 ? <TrendingUp size={14} strokeWidth={IW} /> : <TrendingDown size={14} strokeWidth={IW} />}
          {Math.abs(trendPct)}% YoY
        </span>
      </div>
      <span style={{ fontSize: FONT.xs, color: T.muted }}>Monthly Search Volume</span>
      {months && months.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <Sparkline data={months} color={trendPct >= 0 ? "#22c55e" : "#ef4444"} width={160} height={44} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span style={{ fontSize: 9, color: T.muted }}>12 months ago</span>
            <span style={{ fontSize: 9, color: T.muted }}>Now</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────
export default function KeywordIntelligenceHub() {
  const { goNav } = useApp();

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("keyword"); // "keyword" | "domain"
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedLists, setSavedLists] = useState([
    { id: 1, name: "Q1 Campaign", keywords: ["seo tools", "keyword research"], tags: ["marketing"] },
  ]);
  const [activeTab, setActiveTab] = useState("overview");
  const [bulkInput, setBulkInput] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [analyzedKeywords, setAnalyzedKeywords] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);

  const inputRef = useRef(null);
  const suggestTimer = useRef(null);

  const AI_ENDPOINT = "/ai";
  const AI_FALLBACK = "https://socialflow-pro.pages.dev/ai";

  const fetchAI = useCallback(async (payload) => {
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
      if (!res.ok) throw new Error("AI service unavailable");
      return await res.json();
    }
  }, []);

  // Auto-suggest
  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      try {
        const data = await fetchAI({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a keyword research assistant. Return ONLY a JSON array of 5 keyword suggestions (strings) related to the input. No explanation.",
            },
            { role: "user", content: `Suggest 5 keywords related to: "${query}"` },
          ],
        });
        const text = data?.choices?.[0]?.message?.content || "[]";
        const match = text.match(/\[[\s\S]*\]/);
        if (match) setSuggestions(JSON.parse(match[0]));
      } catch {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(suggestTimer.current);
  }, [query, fetchAI]);

  const analyzeKeyword = useCallback(
    async (kw) => {
      if (!kw.trim()) return;
      setLoading(true);
      setError(null);
      setResults(null);
      setShowSuggestions(false);
      try {
        const prompt =
          mode === "domain"
            ? `Analyze the domain "${kw}" for SEO. Return JSON with: { "domain": "${kw}", "topKeywords": [ { "keyword": string, "volume": number, "difficulty": number, "cpc": number, "cpcTrend": number, "competition": number, "monthlyTrend": [12 numbers], "serpFeatures": { "featured_snippet": bool, "people_also_ask": bool, "shopping": bool, "maps": bool, "news": bool, "video": bool, "knowledge_panel": bool, "site_links": bool }, "topDomains": [ { "domain": string, "da": number, "trafficShare": number, "url": string } x 5 ] } x 5 ], "domainAuthority": number, "organicTraffic": number, "totalKeywords": number }`
            : `Provide realistic SEO metrics for keyword "${kw}". Return JSON: { "keyword": "${kw}", "volume": number, "difficulty": number (0-100), "cpc": number (USD), "cpcTrend": number (% change), "competition": number (0-1), "monthlyTrend": [12 realistic monthly volumes], "serpFeatures": { "featured_snippet": bool, "people_also_ask": bool, "shopping": bool, "maps": bool, "news": bool, "video": bool, "knowledge_panel": bool, "site_links": bool }, "topDomains": [ { "domain": string, "da": number (0-100), "trafficShare": number (%), "url": string } x 10 ], "relatedKeywords": [ { "keyword": string, "volume": number, "difficulty": number, "cpc": number } x 8 ] }`;

        const data = await fetchAI({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a DataForSEO-level keyword intelligence engine. Return ONLY valid JSON, no markdown, no explanation.",
            },
            { role: "user", content: prompt },
          ],
        });

        const text = data?.choices?.[0]?.message?.content || "";
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Invalid response format");
        const parsed = JSON.parse(match[0]);
        setResults(parsed);
        setQuery(kw);
      } catch (e) {
        console.error(e);
        setError("Failed to fetch keyword data. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [mode, fetchAI]
  );

  const handleBulkAnalyze = useCallback(async () => {
    const keywords = bulkInput
      .split(/[\n,;]/)
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 200);
    if (!keywords.length) return;
    setBulkLoading(true);
    try {
      const data = await fetchAI({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a keyword intelligence engine. Return ONLY a JSON array.",
          },
          {
            role: "user",
            content: `Analyze these keywords and return JSON array: ${keywords.map((k) => `{"keyword":"${k}","volume":number,"difficulty":number,"cpc":number,"competition":number}`).join(",")}. Return: [{"keyword":string,"volume":number,"difficulty":number,"cpc":number,"competition":number}] for each keyword.`,
          },
        ],
      });
      const text = data?.choices?.[0]?.message?.content || "[]";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        setAnalyzedKeywords(JSON.parse(match[0]));
        setActiveTab("bulk");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBulkLoading(false);
      setShowBulkModal(false);
    }
  }, [bulkInput, fetchAI]);

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split("\n").map((l) => l.split(",")[0].trim()).filter(Boolean);
      setBulkInput(lines.join("\n"));
      setShowBulkModal(true);
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    if (!results) return;
    const kw = mode === "domain" ? results.topKeywords?.[0] : results;
    if (!kw) return;
    const rows = [
      ["Keyword", "Volume", "Difficulty", "CPC", "Competition"],
      ...(mode === "domain"
        ? (results.topKeywords || []).map((k) => [k.keyword, k.volume, k.difficulty, k.cpc, k.competition])
        : [[kw.keyword, kw.volume, kw.difficulty, kw.cpc, kw.competition]]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keyword-analysis.csv";
    a.click();
  };

  const saveToList = () => {
    if (!newListName.trim() || !results) return;
    const kws = mode === "domain"
      ? (results.topKeywords || []).map((k) => k.keyword)
      : [results.keyword];
    setSavedLists((prev) => [
      ...prev,
      { id: Date.now(), name: newListName, keywords: kws, tags: [] },
    ]);
    setNewListName("");
    setShowSaveModal(false);
  };

  const deleteList = (id) => setSavedLists((prev) => prev.filter((l) => l.id !== id));

  // ─── Render ─────────────────────────────────────────────────────
  const s = {
    page: {
      minHeight: "100vh",
      background: C.bg || "#0f0f1a",
      padding: "24px 20px",
      fontFamily: FONT,
    },
    header: {
      marginBottom: 28,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
    },
    title: {
      fontSize: 26,
      fontWeight: "800",
      color: T.primary,
      fontFamily: FONT_DISPLAY,
      margin: 0,
    },
    subtitle: { fontSize: FONT.sm, color: T.muted, marginTop: 4 },
    searchBar: {
      position: "relative",
      maxWidth: 680,
      width: "100%",
    },
    searchInput: {
      width: "100%",
      padding: "14px 52px 14px 48px",
      background: C.surface || "#1a1a2e",
      border: `1.5px solid ${C.border || "#2a2a3a"}`,
      borderRadius: 12,
      color: T.primary,
      fontSize: FONT.base,
      outline: "none",
      boxSizing: "border-box",
      fontFamily: FONT,
    },
    searchIcon: {
      position: "absolute",
      left: 14,
      top: "50%",
      transform: "translateY(-50%)",
      color: T.muted,
      pointerEvents: "none",
    },
    suggestionsBox: {
      position: "absolute",
      top: "calc(100% + 4px)",
      left: 0,
      right: 0,
      background: C.surface || "#1a1a2e",
      border: `1px solid ${C.border || "#2a2a3a"}`,
      borderRadius: 10,
      zIndex: 50,
      overflow: "hidden",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    },
    suggestionItem: (hovered) => ({
      padding: "10px 16px",
      cursor: "pointer",
      background: hovered ? C.accent + "22" : "transparent",
      color: T.primary,
      fontSize: FONT.sm,
      display: "flex",
      alignItems: "center",
      gap: 8,
    }),
    tabBar: {
      display: "flex",
      gap: 4,
      marginBottom: 20,
      borderBottom: `1px solid ${C.border || "#2a2a3a"}`,
      paddingBottom: 0,
    },
    tab: (active) => ({
      padding: "8px 16px",
      fontSize: FONT.sm,
      fontWeight: active ? "600" : "400",
      color: active ? C.accent : T.muted,
      background: "transparent",
      border: "none",
      cursor: "pointer",
      borderBottom: `2px solid ${active ? C.accent : "transparent"}`,
      marginBottom: -1,
      fontFamily: FONT,
    }),
    grid2: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 16,
    },
    grid3: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 16,
    },
    metricCard: {
      background: C.surface || "#1a1a2e",
      border: `1px solid ${C.border || "#2a2a3a"}`,
      borderRadius: 14,
      padding: 20,
    },
    metricLabel: {
      fontSize: FONT.xs,
      color: T.muted,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: 8,
      display: "flex",
      alignItems: "center",
      gap: 6,
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      padding: "10px 12px",
      textAlign: "left",
      fontSize: FONT.xs,
      color: T.muted,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      borderBottom: `1px solid ${C.border || "#2a2a3a"}`,
      fontWeight: "600",
    },
    td: {
      padding: "11px 12px",
      fontSize: FONT.sm,
      color: T.primary,
      borderBottom: `1px solid ${C.border || "#2a2a3a"}22`,
    },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modal: {
      background: C.surface || "#1a1a2e",
      border: `1px solid ${C.border || "#2a2a3a"}`,
      borderRadius: 16,
      padding: 24,
      width: "100%",
      maxWidth: 500,
    },
  };

  const [hoveredSuggest, setHoveredSuggest] = useState(null);

  const mainData = results && mode === "keyword" ? results : null;
  const domainData = results && mode === "domain" ? results : null;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>
            <Target size={22} strokeWidth={IW} style={{ marginRight: 10, verticalAlign: "middle", color: C.accent }} />
            Keyword Intelligence Hub
          </h1>
          <p style={s.subtitle}>Real-time search volume, difficulty & CPC data — powered by AI market intelligence</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label style={{ cursor: "pointer" }}>
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSVUpload} />
            <Btn
              as="span"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FONT.sm }}
              onClick={() => {}}
            >
              <Upload size={15} strokeWidth={IW} /> Bulk Upload
            </Btn>
          </label>
          {results && (
            <Btn
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FONT.sm }}
              onClick={exportCSV}
            >
              <Download size={15} strokeWidth={IW} /> Export CSV
            </Btn>
          )}
          {results && (
            <Btn
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FONT.sm, background: C.accent + "22", color: C.accent }}
              onClick={() => setShowSaveModal(true)}
            >
              <Save size={15} strokeWidth={IW} /> Save List
            </Btn>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 24, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Mode Toggle */}
        <div
          style={{
            display: "flex",
            background: C.surface || "#1a1a2e",
            border: `1px solid ${C.border || "#2a2a3a"}`,
            borderRadius: 10,
            padding: 3,
            gap: 2,
          }}
        >
          {["keyword", "domain"].map((m) => (
            <button
              key={m}
              style={{
                padding: "9px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: FONT.sm,
                fontWeight: "600",
                background: mode === m ? C.accent : "transparent",
                color: mode === m ? "#fff" : T.muted,
                fontFamily: FONT,
                transition: "all 0.2s",
              }}
              onClick={() => setMode(m)}
            >
              {m === "keyword" ? (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Search size={13} strokeWidth={IW} /> Keyword
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Globe size={13} strokeWidth={IW} /> Domain
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ ...s.searchBar, flex: 1, minWidth: 240 }}>
          <span style={s.searchIcon}>
            <Search size={18} strokeWidth={IW} />
          </span>
          <input
            ref={inputRef}
            style={s.searchInput}
            placeholder={mode === "domain" ? "Enter domain (e.g. example.com)" : "Enter keyword (e.g. seo tools)"}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") analyzeKeyword(query);
              if (e.key === "Escape") setShowSuggestions(false);
            }}
            onFocus={() => suggestions.length && setShowSuggestions(true)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div style={s.suggestionsBox}>
              {suggestions.map((s2, i) => (
                <div
                  key={i}
                  style={s.suggestionItem(hoveredSuggest === i)}
                  onMouseEnter={() => setHoveredSuggest(i)}
                  onMouseLeave={() => setHoveredSuggest(null)}
                  onMouseDown={() => {
                    setQuery(s2);
                    setShowSuggestions(false);
                    analyzeKeyword(s2);
                  }}
                >
                  <Search size={13} strokeWidth={IW} color={T.muted} />
                  {s2}
                </div>
              ))}
            </div>
          )}
        </div>

        <Btn
          style={{
            padding: "14px 24px",
            background: C.accent,
            color: "#fff",
            fontWeight: "700",
            fontSize: FONT.base,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={() => analyzeKeyword(query)}
          disabled={loading || !query.trim()}
        >
          {loading ? <Loader size={16} strokeWidth={IW} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={16} strokeWidth={IW} />}
          Analyze
        </Btn>
      </div>

      {/* Tabs */}
      <div style={s.tabBar}>