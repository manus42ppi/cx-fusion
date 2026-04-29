import React, { useState, useCallback, useEffect, useRef } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import {
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Music2,
  Globe,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  BarChart2,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Award,
  Activity,
  Sparkles,
  ArrowUpRight,
  Minus,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin, color: "#0A66C2" },
  { key: "twitter", label: "X / Twitter", Icon: Twitter, color: "#000000" },
  { key: "instagram", label: "Instagram", Icon: Instagram, color: "#E1306C" },
  { key: "facebook", label: "Facebook", Icon: Facebook, color: "#1877F2" },
  { key: "youtube", label: "YouTube", Icon: Youtube, color: "#FF0000" },
  { key: "tiktok", label: "TikTok", Icon: Music2, color: "#010101" },
];

const PLATFORM_PATTERNS = {
  linkedin: /linkedin\.com\/(company|in|school)\/([^/?&#"'\s]+)/i,
  twitter: /(?:twitter\.com|x\.com)\/([^/?&#"'\s]+)/i,
  instagram: /instagram\.com\/([^/?&#"'\s]+)/i,
  facebook: /facebook\.com\/([^/?&#"'\s]+)/i,
  youtube: /youtube\.com\/(channel|user|c|@)([^/?&#"'\s]+)/i,
  tiktok: /tiktok\.com\/@([^/?&#"'\s]+)/i,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n) {
  if (!n && n !== 0) return "–";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86_400_000);
}

function activityLabel(days) {
  if (days === null) return "Unbekannt";
  if (days <= 7) return "Sehr aktiv";
  if (days <= 30) return "Aktiv";
  if (days <= 90) return "Wenig aktiv";
  return "Inaktiv";
}

function activityColor(days) {
  if (days === null) return T.secondary;
  if (days <= 7) return "#22c55e";
  if (days <= 30) return "#84cc16";
  if (days <= 90) return "#f59e0b";
  return "#ef4444";
}

async function callAI(prompt) {
  const body = { messages: [{ role: "user", content: prompt }] };
  try {
    const r = await fetch("/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error("primary");
    const d = await r.json();
    return d.content ?? d.choices?.[0]?.message?.content ?? "";
  } catch {
    try {
      const r = await fetch("https://socialflow-pro.pages.dev/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("fallback");
      const d = await r.json();
      return d.content ?? d.choices?.[0]?.message?.content ?? "";
    } catch (e) {
      console.error("AI call failed:", e);
      throw e;
    }
  }
}

// ─── SocialProfileDetector ───────────────────────────────────────────────────

async function detectProfiles(domain) {
  // We ask the AI to simulate HTML-parsing since we can't CORS-fetch arbitrary domains
  const prompt = `You are a web scraping and social media analysis assistant.
For the domain "${domain}", analyze its likely social media presence based on common industry patterns, company size signals, and publicly known data.

Return ONLY valid JSON in this exact shape (no markdown, no explanation):
{
  "profiles": {
    "linkedin": { "url": "https://...", "handle": "..." } | null,
    "twitter": { "url": "https://...", "handle": "..." } | null,
    "instagram": { "url": "https://...", "handle": "..." } | null,
    "facebook": { "url": "https://...", "handle": "..." } | null,
    "youtube": { "url": "https://...", "handle": "..." } | null,
    "tiktok": { "url": "https://...", "handle": "..." } | null
  },
  "metrics": {
    "linkedin": { "followers": <number|null>, "posts_per_month": <number|null>, "engagement_rate": <float|null>, "last_post": "<ISO date|null>" },
    "twitter": { "followers": <number|null>, "posts_per_month": <number|null>, "engagement_rate": <float|null>, "last_post": "<ISO date|null>" },
    "instagram": { "followers": <number|null>, "posts_per_month": <number|null>, "engagement_rate": <float|null>, "last_post": "<ISO date|null>" },
    "facebook": { "followers": <number|null>, "posts_per_month": <number|null>, "engagement_rate": <float|null>, "last_post": "<ISO date|null>" },
    "youtube": { "followers": <number|null>, "posts_per_month": <number|null>, "engagement_rate": <float|null>, "last_post": "<ISO date|null>" },
    "tiktok": { "followers": <number|null>, "posts_per_month": <number|null>, "engagement_rate": <float|null>, "last_post": "<ISO date|null>" }
  },
  "score": <0-100>,
  "company_type": "<B2B|B2C|Mixed>",
  "primary_platform": "<platform key>"
}`;

  const raw = await callAI(prompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response");
  return JSON.parse(jsonMatch[0]);
}

async function generateInsights(domain, data, competitorDomain, competitorData) {
  const hasCompetitor = !!competitorDomain && !!competitorData;
  const prompt = `You are a social media marketing strategist for cx-fusion.
Analyze this social media data for "${domain}" and generate actionable insights.

Domain data: ${JSON.stringify(data, null, 2)}
${hasCompetitor ? `Competitor "${competitorDomain}" data: ${JSON.stringify(competitorData, null, 2)}` : ""}

Return ONLY valid JSON (no markdown):
{
  "strengths": ["<string>", ...],
  "gaps": ["<string>", ...],
  "quick_wins": ["<string>", ...],
  "priority_platform": "<platform key>",
  "summary": "<2-3 sentence executive summary>"
}`;

  const raw = await callAI(prompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response");
  return JSON.parse(jsonMatch[0]);
}

// ─── SocialPresenceScoreRing ──────────────────────────────────────────────────

function SocialPresenceScoreRing({ score, size = 120 }) {
  const radius = (size - 16) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  const ringColor =
    score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={C.border}
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={8}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div
        style={{
          position: "relative",
          marginTop: -(size / 2 + 20),
          height: size,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            color: ringColor,
            lineHeight: 1,
          }}
        >
          {score}
        </span>
        <span style={{ fontSize: 11, color: T.secondary, marginTop: 2 }}>
          / 100
        </span>
      </div>
    </div>
  );
}

// ─── SocialMetricsCard ────────────────────────────────────────────────────────

function SocialMetricsCard({ platform, profile, metrics }) {
  const { Icon, label, color } = PLATFORMS.find((p) => p.key === platform);
  const days = daysSince(metrics?.last_post);
  const active = activityLabel(days);
  const aColor = activityColor(days);
  const hasProfile = !!profile;

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        opacity: hasProfile ? 1 : 0.5,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Platform accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: hasProfile ? color : C.border,
          borderRadius: "12px 12px 0 0",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: hasProfile ? color + "20" : C.border + "40",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              size={16}
              strokeWidth={IW}
              color={hasProfile ? color : T.secondary}
            />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: hasProfile ? T.primary : T.secondary,
              fontFamily: FONT,
            }}
          >
            {label}
          </span>
        </div>
        {hasProfile ? (
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: aColor,
              background: aColor + "18",
              borderRadius: 20,
              padding: "2px 8px",
            }}
          >
            {active}
          </div>
        ) : (
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: T.secondary,
              background: C.border + "60",
              borderRadius: 20,
              padding: "2px 8px",
            }}
          >
            Nicht gefunden
          </div>
        )}
      </div>

      {hasProfile ? (
        <>
          {/* Handle */}
          <a
            href={profile.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              color: color,
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            @{profile.handle}
          </a>

          {/* Metrics row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: FONT_DISPLAY,
                  color: T.primary,
                }}
              >
                {formatNumber(metrics?.followers)}
              </div>
              <div style={{ fontSize: 10, color: T.secondary, marginTop: 2 }}>
                Follower
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: FONT_DISPLAY,
                  color: T.primary,
                }}
              >
                {metrics?.engagement_rate != null
                  ? (metrics.engagement_rate * 100).toFixed(1) + "%"
                  : "–"}
              </div>
              <div style={{ fontSize: 10, color: T.secondary, marginTop: 2 }}>
                Engagement
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: FONT_DISPLAY,
                  color: T.primary,
                }}
              >
                {metrics?.posts_per_month ?? "–"}
              </div>
              <div style={{ fontSize: 10, color: T.secondary, marginTop: 2 }}>
                Posts/Mo
              </div>
            </div>
          </div>

          {/* Last post */}
          {metrics?.last_post && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                borderTop: `1px solid ${C.border}`,
                paddingTop: 8,
              }}
            >
              <Calendar size={11} strokeWidth={IW} color={T.secondary} />
              <span style={{ fontSize: 11, color: T.secondary }}>
                Letzter Post:{" "}
                {days === 0
                  ? "Heute"
                  : days === 1
                  ? "Gestern"
                  : `vor ${days} Tagen`}
              </span>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 0",
          }}
        >
          <span style={{ fontSize: 12, color: T.secondary }}>
            Kein Profil erkannt
          </span>
        </div>
      )}
    </div>
  );
}

// ─── SocialComparisonBar ──────────────────────────────────────────────────────

function SocialComparisonBar({
  platform,
  domain1,
  val1,
  domain2,
  val2,
  label,
}) {
  const { Icon, color } = PLATFORMS.find((p) => p.key === platform);
  const max = Math.max(val1 ?? 0, val2 ?? 0, 1);
  const pct1 = ((val1 ?? 0) / max) * 100;
  const pct2 = ((val2 ?? 0) / max) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 2,
        }}
      >
        <Icon size={13} strokeWidth={IW} color={color} />
        <span style={{ fontSize: 12, fontWeight: 600, color: T.secondary }}>
          {label}
        </span>
      </div>

      {/* Domain 1 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            color: T.primary,
            width: 90,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {domain1}
        </span>
        <div
          style={{
            flex: 1,
            height: 10,
            background: C.border,
            borderRadius: 5,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct1}%`,
              height: "100%",
              background: color,
              borderRadius: 5,
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            color: T.primary,
            fontWeight: 600,
            width: 48,
            textAlign: "right",
          }}
        >
          {formatNumber(val1)}
        </span>
      </div>

      {/* Domain 2 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            color: T.secondary,
            width: 90,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {domain2}
        </span>
        <div
          style={{
            flex: 1,
            height: 10,
            background: C.border,
            borderRadius: 5,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct2}%`,
              height: "100%",
              background: color + "80",
              borderRadius: 5,
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            color: T.secondary,
            fontWeight: 600,
            width: 48,
            textAlign: "right",
          }}
        >
          {formatNumber(val2)}
        </span>
      </div>
    </div>
  );
}

// ─── SocialInsightsBanner ─────────────────────────────────────────────────────

function SocialInsightsBanner({ insights, loading }) {
  if (loading) {
    return (
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: C.accent + "20",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Sparkles size={16} strokeWidth={IW} color={C.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 12,
              background: C.border,
              borderRadius: 6,
              width: "60%",
              marginBottom: 8,
            }}
          />
          <div
            style={{
              height: 10,
              background: C.border,
              borderRadius: 5,
              width: "85%",
            }}
          />
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${C.accent}10 0%, ${C.surface} 100%)`,
        border: `1px solid ${C.accent}40`,
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: C.accent + "20",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Sparkles size={16} strokeWidth={IW} color={C.accent} />
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.primary,
              fontFamily: FONT_DISPLAY,
            }}
          >
            KI-Empfehlungen
          </div>
          <div style={{ fontSize: 11, color: T.secondary, marginTop: 1 }}>
            Basierend auf Social-Media-Analyse
          </div>
        </div>
      </div>

      {/* Summary */}
      {insights.summary && (
        <p
          style={{
            fontSize: 13,
            color: T.primary,
            lineHeight: 1.6,
            margin: 0,
            fontFamily: FONT,
          }}
        >
          {insights.summary}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {/* Strengths */}
        {insights.strengths?.length > 0 && (
          <div
            style={{
              background: "#22c55e10",
              border: "1px solid #22c55e30",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <CheckCircle size={13} strokeWidth={IW} color="#22c55e" />
              <span
                style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}
              >
                Stärken
              </span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {insights.strengths.slice(0, 3).map((s, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 11,
                    color: T.primary,
                    marginBottom: 4,
                    paddingLeft: 10,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      color: "#22c55e",
                    }}
                  >
                    •
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gaps */}
        {insights.gaps?.length > 0 && (
          <div
            style={{
              background: "#ef444410",
              border: "1px solid #ef444430",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <AlertCircle size={13} strokeWidth={IW} color="#ef4444" />
              <span
                style={{ fontSize: 11, fontWeight: 700, color: "#ef4444" }}
              >
                Lücken
              </span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {insights.gaps.slice(0, 3).map((g, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 11,
                    color: T.primary,
                    marginBottom: 4,
                    paddingLeft: 10,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      color: "#ef4444",
                    }}
                  >
                    •
                  </span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Wins */}
        {insights.quick_wins?.length > 0 && (
          <div
            style={{
              background: "#f59e0b10",
              border: "1px solid #f59e0b30",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Zap size={13} strokeWidth={IW} color="#f59e0b" />
              <span
                style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}
              >
                Quick Wins
              </span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {insights.quick_wins.slice(0, 3).map((q, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 11,
                    color: T.primary,
                    marginBottom: 4,
                    paddingLeft: 10,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      color: "#f59e0b",
                    }}
                  >
                    •
                  </span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SocialPlatformGrid ───────────────────────────────────────────────────────

function SocialPlatformGrid({ profiles, metrics }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 12,
      }}
    >
      {PLATFORMS.map(({ key }) => (
        <SocialMetricsCard
          key={key}
          platform={key}
          profile={profiles?.[key]}
          metrics={metrics?.[key]}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SocialMediaIntelligence() {
  const { goNav } = useApp();

  const [domain, setDomain] = useState("");
  const [competitorDomain, setCompetitorDomain] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState(null);
  const [compData, setCompData] = useState(null);

  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  const inputRef = useRef(null);

  // ─── Analyze ──────────────────────────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setInsights(null);
    setCompData(null);

    try {
      const result = await detectProfiles(domain.trim());
      setData(result);
      setActiveTab("overview");

      // Auto-generate insights
      setInsightsLoading(true);
      try {
        const ins = await generateInsights(domain.trim(), result, null, null);
        setInsights(ins);
      } catch (e) {
        console.error("Insights generation failed:", e);
      } finally {
        setInsightsLoading(false);
      }
    } catch (e) {
      console.error("Social analysis failed:", e);
      setError("Analyse fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, [domain]);

  const handleCompare = useCallback(async () => {
    if (!competitorDomain.trim() || !data) return;
    setCompLoading(true);
    setCompError(null);
    setCompData(null);
    setInsights(null);

    try {
      const result = await detectProfiles(competitorDomain.trim());
      setCompData(result);

      // Regenerate insights with competitor
      setInsightsLoading(true);
      try {
        const ins = await generateInsights(
          domain.trim(),
          data,
          competitorDomain.trim(),
          result
        );
        setInsights(ins);
      } catch (e) {
        console.error("Insights generation failed:", e);
      } finally {
        setInsightsLoading(false);
      }
    } catch (e) {
      console.error("Competitor analysis failed:", e);
      setCompError("Wettbewerber-Analyse fehlgeschlagen.");
    } finally {
      setComp