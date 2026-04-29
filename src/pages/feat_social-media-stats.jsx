import React, { useState, useCallback, useRef } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import {
  Linkedin, Twitter, Instagram, Facebook, Youtube, Music2,
  Globe, Search, Users, Calendar, Activity, Sparkles,
  AlertCircle, CheckCircle, Zap,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { key: "linkedin",  label: "LinkedIn",   Icon: Linkedin,  color: "#0A66C2" },
  { key: "twitter",   label: "X / Twitter", Icon: Twitter,   color: "#000000" },
  { key: "instagram", label: "Instagram",  Icon: Instagram, color: "#E1306C" },
  { key: "facebook",  label: "Facebook",   Icon: Facebook,  color: "#1877F2" },
  { key: "youtube",   label: "YouTube",    Icon: Youtube,   color: "#FF0000" },
  { key: "tiktok",    label: "TikTok",     Icon: Music2,    color: "#010101" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n) {
  if (!n && n !== 0) return "–";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function activityLabel(days) {
  if (days === null) return "Unbekannt";
  if (days <= 7)  return "Sehr aktiv";
  if (days <= 30) return "Aktiv";
  if (days <= 90) return "Wenig aktiv";
  return "Inaktiv";
}

function activityColor(days) {
  if (days === null) return C.textSoft;
  if (days <= 7)  return "#22c55e";
  if (days <= 30) return "#84cc16";
  if (days <= 90) return "#f59e0b";
  return "#ef4444";
}

async function callAI(prompt) {
  const res = await fetch("/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`AI call failed: ${res.status}`);
  const d = await res.json();
  // Anthropic API: content is an array of blocks → extract text
  // OpenAI-compat fallback: choices[0].message.content
  const raw = d.content?.[0]?.text ?? d.choices?.[0]?.message?.content ?? "";
  return typeof raw === "string" ? raw : JSON.stringify(raw);
}

function parseJSON(raw) {
  if (raw && typeof raw === "object") return raw;
  const m = String(raw).match(/\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON in AI response");
  return JSON.parse(m[0]);
}

async function detectProfiles(domain) {
  const raw = await callAI(`You are a social media intelligence tool.
For the domain "${domain}", return ONLY valid JSON (no markdown, no comments):
{
  "profiles": {
    "linkedin":  { "url": "https://...", "handle": "..." } or null,
    "twitter":   { "url": "https://...", "handle": "..." } or null,
    "instagram": { "url": "https://...", "handle": "..." } or null,
    "facebook":  { "url": "https://...", "handle": "..." } or null,
    "youtube":   { "url": "https://...", "handle": "..." } or null,
    "tiktok":    { "url": "https://...", "handle": "..." } or null
  },
  "metrics": {
    "linkedin":  { "followers": number|null, "posts_per_month": number|null, "engagement_rate": number|null, "last_post": "ISO-date"|null },
    "twitter":   { "followers": number|null, "posts_per_month": number|null, "engagement_rate": number|null, "last_post": "ISO-date"|null },
    "instagram": { "followers": number|null, "posts_per_month": number|null, "engagement_rate": number|null, "last_post": "ISO-date"|null },
    "facebook":  { "followers": number|null, "posts_per_month": number|null, "engagement_rate": number|null, "last_post": "ISO-date"|null },
    "youtube":   { "followers": number|null, "posts_per_month": number|null, "engagement_rate": number|null, "last_post": "ISO-date"|null },
    "tiktok":    { "followers": number|null, "posts_per_month": number|null, "engagement_rate": number|null, "last_post": "ISO-date"|null }
  },
  "score": 0-100,
  "company_type": "B2B" or "B2C" or "Mixed",
  "primary_platform": "linkedin" or "twitter" or "instagram" or "facebook" or "youtube" or "tiktok"
}`);
  return parseJSON(raw);
}

async function generateInsights(domain, data, competitorDomain, competitorData) {
  const raw = await callAI(`You are a social media marketing strategist.
Analyze this social media data for "${domain}" and give actionable recommendations.
Domain data: ${JSON.stringify(data)}
${competitorDomain ? `Competitor "${competitorDomain}": ${JSON.stringify(competitorData)}` : ""}
Return ONLY valid JSON (no markdown):
{
  "strengths": ["...", "...", "..."],
  "gaps":      ["...", "...", "..."],
  "quick_wins":["...", "...", "..."],
  "priority_platform": "...",
  "summary": "2-3 sentence executive summary in German"
}`);
  return parseJSON(raw);
}

// ─── SocialPresenceScoreRing ───────────────────────────────────────────────────

function ScoreRing({ score, size = 120 }) {
  const radius = (size - 16) / 2;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const ringColor = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={C.border} strokeWidth={8} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={ringColor} strokeWidth={8}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 26, fontFamily: FONT_DISPLAY, fontWeight: 700, color: ringColor, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 10, color: C.textSoft }}>/ 100</span>
        </div>
      </div>
      <span style={{ fontSize: 11, color: C.textSoft, fontWeight: 500 }}>Social Score</span>
    </div>
  );
}

// ─── SocialMetricsCard ────────────────────────────────────────────────────────

function SocialMetricsCard({ platform, profile, metrics }) {
  const { Icon, label, color } = PLATFORMS.find(p => p.key === platform);
  const days   = daysSince(metrics?.last_post);
  const active = activityLabel(days);
  const aColor = activityColor(days);
  const has    = !!profile;

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: T.rLg,
      padding: 16, display: "flex", flexDirection: "column", gap: 10,
      opacity: has ? 1 : 0.45, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: has ? color : C.border, borderRadius: `${T.rLg}px ${T.rLg}px 0 0`,
      }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: T.rMd,
            background: has ? color + "18" : C.border + "40",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={15} strokeWidth={IW} color={has ? color : C.textSoft} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: has ? C.text : C.textSoft, fontFamily: FONT }}>
            {label}
          </span>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 600, borderRadius: 20, padding: "2px 8px",
          color: has ? aColor : C.textSoft,
          background: has ? aColor + "18" : C.border + "60",
        }}>
          {has ? active : "Nicht gefunden"}
        </div>
      </div>

      {has ? (
        <>
          <a href={profile.url} target="_blank" rel="noopener noreferrer" style={{
            fontSize: 12, color, textDecoration: "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            @{profile.handle}
          </a>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[
              { val: formatNumber(metrics?.followers), lbl: "Follower" },
              { val: metrics?.engagement_rate != null ? (metrics.engagement_rate * 100).toFixed(1) + "%" : "–", lbl: "Engagement" },
              { val: metrics?.posts_per_month ?? "–", lbl: "Posts/Mo" },
            ].map(({ val, lbl }) => (
              <div key={lbl} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT_DISPLAY, color: C.text }}>{val}</div>
                <div style={{ fontSize: 10, color: C.textSoft, marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {metrics?.last_post && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
              <Calendar size={11} strokeWidth={IW} color={C.textSoft} />
              <span style={{ fontSize: 11, color: C.textSoft }}>
                Letzter Post: {days === 0 ? "Heute" : days === 1 ? "Gestern" : `vor ${days} Tagen`}
              </span>
            </div>
          )}
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0" }}>
          <span style={{ fontSize: 12, color: C.textSoft }}>Kein Profil erkannt</span>
        </div>
      )}
    </div>
  );
}

// ─── InsightsBanner ───────────────────────────────────────────────────────────

function InsightsBanner({ insights }) {
  if (!insights) return null;

  const sections = [
    { key: "strengths",   label: "Stärken",    Icon: CheckCircle, color: "#22c55e", bg: "#22c55e10", border: "#22c55e30", items: insights.strengths },
    { key: "gaps",        label: "Lücken",     Icon: AlertCircle, color: "#ef4444", bg: "#ef444410", border: "#ef444430", items: insights.gaps },
    { key: "quick_wins",  label: "Quick Wins", Icon: Zap,         color: "#f59e0b", bg: "#f59e0b10", border: "#f59e0b30", items: insights.quick_wins },
  ].filter(s => s.items?.length);

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 32, height: 32, borderRadius: T.rMd, background: C.accentLight,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Sparkles size={16} strokeWidth={IW} color={C.accent} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FONT_DISPLAY }}>KI-Empfehlungen</div>
          <div style={{ fontSize: 11, color: C.textSoft }}>Basierend auf Social-Media-Analyse</div>
        </div>
      </div>

      {insights.summary && (
        <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65, margin: "0 0 16px", fontFamily: FONT }}>
          {insights.summary}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
        {sections.map(({ key, label, Icon, color, bg, border, items }) => (
          <div key={key} style={{ background: bg, border: `1px solid ${border}`, borderRadius: T.rMd, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Icon size={13} strokeWidth={IW} color={color} />
              <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {items.slice(0, 3).map((item, i) => (
                <li key={i} style={{ fontSize: 11, color: C.text, marginBottom: 4, paddingLeft: 10, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── ComparisonSection ────────────────────────────────────────────────────────

function ComparisonBar({ platform, domain1, val1, domain2, val2, label }) {
  const { Icon, color } = PLATFORMS.find(p => p.key === platform);
  const max  = Math.max(val1 ?? 0, val2 ?? 0, 1);
  const pct1 = ((val1 ?? 0) / max) * 100;
  const pct2 = ((val2 ?? 0) / max) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <Icon size={12} strokeWidth={IW} color={color} />
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textSoft }}>{label}</span>
      </div>
      {[{ d: domain1, val: val1, pct: pct1, strong: true }, { d: domain2, val: val2, pct: pct2, strong: false }].map(({ d, val, pct, strong }) => (
        <div key={d} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: strong ? C.text : C.textSoft, width: 88, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d}</span>
          <div style={{ flex: 1, height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: strong ? color : color + "70", borderRadius: 4, transition: "width 0.6s ease" }} />
          </div>
          <span style={{ fontSize: 11, color: strong ? C.text : C.textSoft, fontWeight: 600, width: 44, textAlign: "right" }}>{formatNumber(val)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SocialMediaIntelligence() {
  useApp(); // keep context subscription

  const [domain,           setDomain]           = useState("");
  const [competitorDomain, setCompetitorDomain] = useState("");
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState(null);
  const [data,             setData]             = useState(null);
  const [compLoading,      setCompLoading]      = useState(false);
  const [compError,        setCompError]        = useState(null);
  const [compData,         setCompData]         = useState(null);
  const [insightsLoading,  setInsightsLoading]  = useState(false);
  const [insights,         setInsights]         = useState(null);
  const [analyzedDomain,   setAnalyzedDomain]   = useState("");

  const inputRef = useRef(null);

  const handleAnalyze = useCallback(async () => {
    const d = domain.trim();
    if (!d) return;
    setLoading(true);
    setError(null);
    setData(null);
    setCompData(null);
    setInsights(null);
    setAnalyzedDomain(d);

    try {
      const result = await detectProfiles(d);
      setData(result);

      setInsightsLoading(true);
      try {
        const ins = await generateInsights(d, result, null, null);
        setInsights(ins);
      } finally {
        setInsightsLoading(false);
      }
    } catch (e) {
      setError("Analyse fehlgeschlagen: " + (e.name === "TimeoutError" ? "Zeitüberschreitung (60s)" : e.message));
    } finally {
      setLoading(false);
    }
  }, [domain]);

  const handleCompare = useCallback(async () => {
    const cd = competitorDomain.trim();
    if (!cd || !data) return;
    setCompLoading(true);
    setCompError(null);
    setCompData(null);
    setInsights(null);

    try {
      const result = await detectProfiles(cd);
      setCompData(result);

      setInsightsLoading(true);
      try {
        const ins = await generateInsights(analyzedDomain, data, cd, result);
        setInsights(ins);
      } finally {
        setInsightsLoading(false);
      }
    } catch (e) {
      setCompError("Wettbewerber-Analyse fehlgeschlagen: " + e.message);
    } finally {
      setCompLoading(false);
    }
  }, [analyzedDomain, data, competitorDomain]);

  // Active platforms (where profile found) for comparison bars
  const activePlatforms = data
    ? PLATFORMS.filter(p => data.profiles?.[p.key])
    : [];

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 24px 60px", fontFamily: FONT }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: T.rMd, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Activity size={22} color={C.accent} strokeWidth={IW} />
        </div>
        <div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Social Intelligence</h1>
          <p style={{ fontSize: 13, color: C.textSoft, margin: 0 }}>Social-Media-Präsenz & Engagement analysieren</p>
        </div>
      </div>

      {/* Search bar */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: T.rMd,
            border: `1px solid ${C.border}`, background: C.bg,
          }}>
            <Globe size={15} color={C.textMute} strokeWidth={IW} />
            <input
              ref={inputRef}
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && handleAnalyze()}
              placeholder="domain.com"
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: C.text, fontFamily: FONT }}
              disabled={loading}
            />
          </div>
          <Btn onClick={handleAnalyze} loading={loading} icon={Search} disabled={!domain.trim() || loading}>
            Analysieren
          </Btn>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: T.rMd, background: C.redLight, border: `1px solid #fca5a5`, color: C.red, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Score + summary row */}
          <Card style={{ padding: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            {data.score != null && <ScoreRing score={data.score} size={110} />}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                {analyzedDomain}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.company_type && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: C.accentLight, color: C.accent }}>
                    {data.company_type}
                  </span>
                )}
                {data.primary_platform && (() => {
                  const p = PLATFORMS.find(x => x.key === data.primary_platform);
                  return p ? (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: p.color + "18", color: p.color }}>
                      Hauptkanal: {p.label}
                    </span>
                  ) : null;
                })()}
                {activePlatforms.length > 0 && (
                  <span style={{ fontSize: 11, color: C.textSoft, padding: "3px 6px" }}>
                    {activePlatforms.length} von {PLATFORMS.length} Plattformen aktiv
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Platform grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
            {PLATFORMS.map(({ key }) => (
              <SocialMetricsCard key={key} platform={key} profile={data.profiles?.[key]} metrics={data.metrics?.[key]} />
            ))}
          </div>

          {/* Competitor compare */}
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, marginBottom: 10 }}>WETTBEWERBER VERGLEICHEN</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: T.rMd,
                border: `1px solid ${C.border}`, background: C.bg,
              }}>
                <Users size={14} color={C.textMute} strokeWidth={IW} />
                <input
                  value={competitorDomain}
                  onChange={e => setCompetitorDomain(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !compLoading && handleCompare()}
                  placeholder="Wettbewerber-Domain eingeben"
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: C.text, fontFamily: FONT }}
                  disabled={compLoading}
                />
              </div>
              <Btn onClick={handleCompare} loading={compLoading} disabled={!competitorDomain.trim() || compLoading} variant="surface">
                Vergleichen
              </Btn>
            </div>
            {compError && <div style={{ marginTop: 8, fontSize: 12, color: C.red }}>{compError}</div>}
          </Card>

          {/* Comparison bars (shown when competitor loaded) */}
          {compData && activePlatforms.length > 0 && (
            <Card style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, marginBottom: 16 }}>FOLLOWER-VERGLEICH</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {activePlatforms.slice(0, 4).map(({ key, label }) => (
                  <ComparisonBar
                    key={key} platform={key} label={label}
                    domain1={analyzedDomain}   val1={data.metrics?.[key]?.followers}
                    domain2={competitorDomain} val2={compData.metrics?.[key]?.followers}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Insights loading */}
          {insightsLoading && (
            <Card style={{ padding: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: T.rMd, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={16} strokeWidth={IW} color={C.accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 11, background: C.border, borderRadius: 6, width: "55%", marginBottom: 7 }} />
                <div style={{ height: 10, background: C.border, borderRadius: 5, width: "80%" }} />
              </div>
            </Card>
          )}

          {/* AI Insights */}
          {!insightsLoading && insights && <InsightsBanner insights={insights} />}
        </>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <Card style={{ padding: 56, textAlign: "center" }}>
          <Activity size={44} color={C.textSoft} strokeWidth={IW} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: C.textMid, marginBottom: 8 }}>
            Social-Media-Präsenz analysieren
          </div>
          <p style={{ fontSize: 13, color: C.textSoft, maxWidth: 380, margin: "0 auto" }}>
            Domain eingeben um Social-Media-Profile zu erkennen und Engagement-Daten zu analysieren.
          </p>
        </Card>
      )}
    </div>
  );
}
