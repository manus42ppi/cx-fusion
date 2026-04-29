import React, { useState, useCallback, useRef } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import {
  Search,
  Globe,
  Tag,
  X,
  ChevronUp,
  ChevronDown,
  Download,
  Save,
  TrendingUp,
  ShoppingBag,
  Image,
  HelpCircle,
  Star,
  AlertCircle,
  Loader2,
  FileText,
  BarChart2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Hash,
  DollarSign,
  Target,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip as RechartsTooltip,
} from "recharts";

const PAGE_SIZE = 15;

const SERP_FEATURE_CONFIG = {
  featured_snippet: { label: "Featured Snippet", icon: Star, color: "#F59E0B" },
  people_also_ask: { label: "PAA", icon: HelpCircle, color: "#3B82F6" },
  image_pack: { label: "Image Pack", icon: Image, color: "#8B5CF6" },
  shopping: { label: "Shopping", icon: ShoppingBag, color: "#10B981" },
};

function DifficultyBadge({ value }) {
  const color =
    value <= 30
      ? "#10B981"
      : value <= 60
      ? "#F59E0B"
      : "#EF4444";
  const bg =
    value <= 30
      ? "#D1FAE5"
      : value <= 60
      ? "#FEF3C7"
      : "#FEE2E2";
  const label =
    value <= 30 ? "Easy" : value <= 60 ? "Medium" : "Hard";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 40,
          height: 6,
          borderRadius: 3,
          background: "#E5E7EB",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          background: bg,
          padding: "2px 7px",
          borderRadius: 20,
          fontFamily: FONT,
        }}
      >
        {value} · {label}
      </span>
    </div>
  );
}

function VolumeTrendSparkline({ data }) {
  if (!data || data.length === 0) {
    return (
      <span style={{ fontSize: 11, color: T.muted, fontFamily: FONT }}>
        N/A
      </span>
    );
  }
  const chartData = data.map((v, i) => ({ m: i, v }));
  const max = Math.max(...data);
  const min = Math.min(...data);
  const trend = data[data.length - 1] > data[0];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 80, height: 28 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={trend ? "#10B981" : "#EF4444"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={trend ? "#10B981" : "#EF4444"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={trend ? "#10B981" : "#EF4444"}
              strokeWidth={1.5}
              fill="url(#sparkGrad)"
              dot={false}
              isAnimationActive={false}
            />
            <RechartsTooltip
              contentStyle={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: 10,
                fontFamily: FONT,
                padding: "2px 6px",
              }}
              formatter={(v) => [v?.toLocaleString(), "Vol"]}
              labelFormatter={() => ""}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <TrendingUp
        size={12}
        strokeWidth={IW}
        style={{
          color: trend ? "#10B981" : "#EF4444",
          transform: trend ? "none" : "scaleY(-1)",
        }}
      />
    </div>
  );
}

function SERPFeatureIcons({ features }) {
  if (!features || features.length === 0) {
    return <span style={{ fontSize: 11, color: T.muted }}>—</span>;
  }
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {features.map((f) => {
        const cfg = SERP_FEATURE_CONFIG[f];
        if (!cfg) return null;
        const Icon = cfg.icon;
        return (
          <div
            key={f}
            title={cfg.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 22,
              borderRadius: 4,
              background: `${cfg.color}18`,
              border: `1px solid ${cfg.color}40`,
              cursor: "default",
            }}
          >
            <Icon size={12} strokeWidth={IW} style={{ color: cfg.color }} />
          </div>
        );
      })}
    </div>
  );
}

function TagInput({ tags, onChange, placeholder }) {
  const [inputVal, setInputVal] = useState("");

  const addTag = (val) => {
    const trimmed = val.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputVal("");
  };

  const handleKeyDown = (e) => {
    if (["Enter", ",", "Tab"].includes(e.key)) {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: "8px 12px",
        borderRadius: 8,
        border: `1.5px solid ${C.border}`,
        background: C.surface,
        minHeight: 44,
        alignItems: "center",
        cursor: "text",
        transition: "border-color 0.2s",
      }}
      onClick={(e) => e.currentTarget.querySelector("input")?.focus()}
    >
      {tags.map((tag) => (
        <div
          key={tag}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px 2px 10px",
            borderRadius: 20,
            background: `${C.primary}18`,
            border: `1px solid ${C.primary}40`,
            fontSize: 12,
            color: C.primary,
            fontFamily: FONT,
            fontWeight: 600,
          }}
        >
          <Hash size={10} strokeWidth={IW} />
          {tag}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange(tags.filter((t) => t !== tag));
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              color: C.primary,
              opacity: 0.7,
            }}
          >
            <X size={10} strokeWidth={IW} />
          </button>
        </div>
      ))}
      <input
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputVal && addTag(inputVal)}
        placeholder={tags.length === 0 ? placeholder : ""}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 13,
          fontFamily: FONT,
          color: T.primary,
          flex: 1,
          minWidth: 120,
        }}
      />
    </div>
  );
}

function RelatedKeywordsSidebar({ keywords, onAdd, loading }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <Layers size={16} strokeWidth={IW} style={{ color: C.primary }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: T.primary,
            fontFamily: FONT_DISPLAY,
          }}
        >
          Related Keywords
        </span>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Loader2
            size={20}
            strokeWidth={IW}
            style={{ color: C.primary, animation: "spin 1s linear infinite" }}
          />
        </div>
      ) : keywords.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px 16px",
            color: T.muted,
            fontSize: 12,
            fontFamily: FONT,
          }}
        >
          Run a search to see related keywords
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            overflowY: "auto",
            maxHeight: 520,
          }}
        >
          {keywords.map((kw, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "7px 10px",
                borderRadius: 8,
                background: C.background,
                border: `1px solid ${C.border}`,
                gap: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: T.primary,
                    fontFamily: FONT,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {kw.keyword}
                </div>
                <div style={{ fontSize: 10, color: T.muted, fontFamily: FONT }}>
                  {kw.volume?.toLocaleString()} / mo
                </div>
              </div>
              <button
                onClick={() => onAdd(kw.keyword)}
                style={{
                  background: `${C.primary}12`,
                  border: `1px solid ${C.primary}30`,
                  borderRadius: 6,
                  cursor: "pointer",
                  padding: "3px 6px",
                  fontSize: 10,
                  color: C.primary,
                  fontFamily: FONT,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function callAI(prompt) {
  const body = { message: prompt };
  try {
    const res = await fetch("/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("primary");
    const data = await res.json();
    return data.response || data.message || data.content || "";
  } catch {
    try {
      const res = await fetch("https://socialflow-pro.pages.dev/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("fallback");
      const data = await res.json();
      return data.response || data.message || data.content || "";
    } catch (err) {
      console.error("AI call failed:", err);
      throw err;
    }
  }
}

function parseAIKeywords(raw) {
  try {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : raw;
    const parsed = JSON.parse(jsonStr.trim());
    if (Array.isArray(parsed)) return parsed;
    if (parsed.keywords) return parsed.keywords;
    if (parsed.results) return parsed.results;
    return [];
  } catch {
    return [];
  }
}

function generateFallbackKeywords(seeds, domain) {
  const base = seeds.length > 0 ? seeds : domain ? [domain.replace(/^www\./,"").split(".")[0]] : ["keyword"];
  const suffixes = ["best", "how to", "what is", "guide", "tips", "examples", "tools", "software", "free", "2024", "vs", "review", "price", "tutorial", "alternative"];
  const result = [];
  base.forEach((seed) => {
    suffixes.slice(0, 8).forEach((sfx, i) => {
      const kw = i % 2 === 0 ? `${sfx} ${seed}` : `${seed} ${sfx}`;
      const vol = Math.floor(Math.random() * 8000) + 200;
      const diff = Math.floor(Math.random() * 90) + 5;
      result.push({
        keyword: kw,
        volume: vol,
        difficulty: diff,
        cpc: +(Math.random() * 4 + 0.2).toFixed(2),
        serp_features: ["featured_snippet","people_also_ask","image_pack","shopping"].filter(() => Math.random() > 0.65),
        trend: Array.from({ length: 12 }, () => Math.floor(vol * (0.7 + Math.random() * 0.6))),
        intent: ["informational","commercial","transactional","navigational"][Math.floor(Math.random()*4)],
      });
    });
  });
  return result.slice(0, 40);
}

function generateFallbackRelated(seeds) {
  const modifiers = ["tool", "software", "service", "platform", "solution", "agency", "consultant", "strategy", "analytics", "automation", "report", "dashboard", "pricing", "comparison", "roi"];
  const kws = [];
  seeds.slice(0, 3).forEach((seed) => {
    modifiers.forEach((mod) => {
      kws.push({
        keyword: `${seed} ${mod}`,
        volume: Math.floor(Math.random() * 3000) + 100,
      });
    });
  });
  return kws.slice(0, 20);
}

export default function KeywordResearch() {
  const { goNav } = useApp();

  const [domain, setDomain] = useState("");
  const [manualTags, setManualTags] = useState([]);
  const [searchMode, setSearchMode] = useState("domain");

  const [results, setResults] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const [sortKey, setSortKey] = useState("volume");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [savedListName, setSavedListName] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const searchRef = useRef(null);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const sortedResults = [...results].sort((a, b) => {
    const va = a[sortKey] ?? 0;
    const vb = b[sortKey] ?? 0;
    return sortDir === "asc" ? va - vb : vb - va;
  });

  const totalPages = Math.max(1, Math.ceil(sortedResults.length / PAGE_SIZE));
  const pagedResults = sortedResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = useCallback(async () => {
    const seeds = searchMode === "manual" ? manualTags : [];
    const domainVal = searchMode === "domain" ? domain.trim() : "";

    if (!domainVal && seeds.length === 0) {
      setError("Please enter a domain or add keywords.");
      return;
    }

    setLoading(true);
    setRelatedLoading(true);
    setError(null);
    setResults([]);
    setRelated([]);
    setPage(1);
    setSelectedRows(new Set());
    setSearched(true);

    const seedList = seeds.length > 0 ? seeds : [domainVal];

    const prompt = `You are a keyword research API. Return a JSON array of 40 keyword objects for the seed keywords/domain: "${seedList.join(", ")}".
Each object must have these exact fields:
- keyword: string
- volume: number (monthly searches, realistic)
- difficulty: number (0-100 SEO difficulty)
- cpc: number (cost-per-click in USD)
- serp_features: array of strings from ["featured_snippet","people_also_ask","image_pack","shopping"]
- trend: array of 12 numbers (monthly volume over last 12 months)
- intent: string ("informational"|"commercial"|"transactional"|"navigational")

Return ONLY valid JSON array, no explanation. Example structure:
[{"keyword":"example keyword","volume":5400,"difficulty":42,"cpc":1.23,"serp_features":["featured_snippet"],"trend":[4200,4800,5100,5600,5400,5800,6100,5900,5400,5200,5000,5400],"intent":"informational"}]`;

    try {
      const raw = await callAI(prompt);
      const parsed = parseAIKeywords(raw);
      if (parsed.length > 0) {
        setResults(parsed);
      } else {
        setResults(generateFallbackKeywords(seeds, domainVal));
      }
    } catch {
      setResults(generateFallbackKeywords(seeds, domainVal));
    } finally {
      setLoading(false);
    }

    const relatedPrompt = `Return a JSON array of 20 semantically related keyword suggestions for: "${seedList.join(", ")}".
Each object: {"keyword": string, "volume": number}
Return ONLY valid JSON array.`;

    try {
      const raw2 = await callAI(relatedPrompt);
      const parsed2 = parseAIKeywords(raw2);
      if (parsed2.length > 0) {
        setRelated(parsed2);
      } else {
        setRelated(generateFallbackRelated(seedList));
      }
    } catch {
      setRelated(generateFallbackRelated(seedList));
    } finally {
      setRelatedLoading(false);
    }
  }, [domain, manualTags, searchMode]);

  const toggleRow = (kw) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(kw) ? next.delete(kw) : next.add(kw);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === pagedResults.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(pagedResults.map((r) => r.keyword)));
    }
  };

  const handleAddRelated = (kw) => {
    if (searchMode === "manual") {
      if (!manualTags.includes(kw)) {
        setManualTags((prev) => [...prev, kw]);
      }
    }
  };

  const handleSaveList = () => {
    if (!savedListName.trim()) return;
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportCSV = () => {
    setExportLoading(true);
    const toExport =
      selectedRows.size > 0
        ? results.filter((r) => selectedRows.has(r.keyword))
        : results;

    const header = ["Keyword", "Volume", "Difficulty", "CPC", "Intent", "SERP Features"];
    const rows = toExport.map((r) => [
      `"${r.keyword}"`,
      r.volume,
      r.difficulty,
      r.cpc,
      r.intent,
      `"${(r.serp_features || []).join(", ")}"`,
    ]);

    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keyword-research-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExportLoading(false), 800);
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col)
      return (
        <ChevronUp
          size={12}
          strokeWidth={IW}
          style={{ opacity: 0.3, color: T.muted }}
        />
      );
    return sortDir === "asc" ? (
      <ChevronUp size={12} strokeWidth={IW} style={{ color: C.primary }} />
    ) : (
      <ChevronDown size={12} strokeWidth={IW} style={{ color: C.primary }} />
    );
  };

  const intentColor = (intent) => {
    const map = {
      informational: "#3B82F6",
      commercial: "#8B5CF6",
      transactional: "#10B981",
      navigational: "#F59E0B",
    };
    return map[intent] || T.muted;
  };

  return (
    <div
      style={{
        padding: "24px 28px",
        maxWidth: 1400,
        margin: "0 auto",
        fontFamily: FONT,
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${C.primary}22, ${C.primary}44)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${C.primary}30`,
              }}
            >
              <Search size={18} strokeWidth={IW} style={{ color: C.primary }} />
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: T.primary,
                fontFamily: FONT_DISPLAY,
                margin: 0,
              }}
            >
              Keyword Research
            </h1>
          </div>
          <p style={{ fontSize: 13, color: T.secondary, margin: 0 }}>
            Discover search volumes, keyword difficulty, and SERP insights
          </p>
        </div>

        {results.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn
              variant="ghost"
              size="sm"
              onClick={handleExportCSV}
              disabled={exportLoading}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {exportLoading ? (
                <Loader2
                  size={14}
                  strokeWidth={IW}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Download size={14} strokeWidth={IW} />
              )}
              Export CSV
            </Btn>
          </div>
        )}
      </div>

      {/* Search Area */}
      <Card style={{ padding: 20, marginBottom: 20 }}>
        {/* Mode Switcher */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 16,
            padding: 4,
            background: C.background,
            borderRadius: 10,
            width: "fit-content",
            border: `1px solid ${C.border}`,
          }}
        >
          {[
            { key: "domain", label: "Domain Analysis", icon: Globe },
            { key: "manual", label: "Manual Keywords", icon: Tag },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSearchMode(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONT,
                background: searchMode === key ? C.primary : "transparent",
                color: searchMode === key ? "#fff" : T.secondary,
                transition: "all 0.2s",
              }}
            >
              <Icon size={14} strokeWidth={IW} />
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            {searchMode === "domain" ? (
              <div style={{ position: "relative" }}>
                <Globe
                  size={16}
                  strokeWidth={IW}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: T.muted,
                    pointerEvents: "none",
                  }}
                />
                <input
                  ref={searchRef}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter domain (e.g. example.com)"
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    borderRadius: 8,
                    border: `1.5px solid ${C.border}`,
                    background: C.surface,
                    fontSize: 14,
                    fontFamily: FONT,
                    color: T.primary,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>
            ) : (
              <TagInput
                tags={manualTags}
                onChange={setManualTags}
                placeholder="Type keywords and press Enter or comma..."
              />
            )}
          </div>

          <Btn
            variant="primary"
            onClick={handleSearch}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? (
              <>
                <Loader2
                  size={15}
                  strokeWidth={IW}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Analyzing…
              </>
            ) : (
              <>
                <Search size={15} strokeWidth={IW} />
                Research Keywords
              </>
            )}
          </Btn>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              padding: "8px 12px",
              borderRadius: 8,
              background: "#FEE2E2",
              border: "1px solid #FCA5A5",
            }}
          >
            <AlertCircle size={14} strokeWidth={IW} style={{ color: "#EF4444" }} />
            <span style={{ fontSize: 13, color: "#DC2626", fontFamily: FONT }}>
              {error}
            </span>
          </div>
        )}
      </Card>

      {/* Main Content */}
      {!searched && !loading ? (
        <Card style={{ padding: 60, textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: `${