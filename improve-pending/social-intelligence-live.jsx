import { useState, useCallback, useRef } from "react";
import {
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Music2,
  Facebook,
  Globe,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Heart,
  FileText,
  Download,
  Plus,
  X,
  Zap,
  BarChart2,
  Clock,
  Star,
  ChevronRight,
  Eye,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";

const PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin, color: "#0A66C2" },
  { key: "twitter", label: "Twitter/X", Icon: Twitter, color: "#000000" },
  { key: "instagram", label: "Instagram", Icon: Instagram, color: "#E1306C" },
  { key: "youtube", label: "YouTube", Icon: Youtube, color: "#FF0000" },
  { key: "tiktok", label: "TikTok", Icon: Music2, color: "#010101" },
  { key: "facebook", label: "Facebook", Icon: Facebook, color: "#1877F2" },
];

const AI_URL_PRIMARY = "/ai";
const AI_URL_FALLBACK = "https://socialflow-pro.pages.dev/ai";

async function callAI(payload) {
  try {
    const res = await fetch(AI_URL_PRIMARY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("primary");
    return await res.json();
  } catch {
    const res = await fetch(AI_URL_FALLBACK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("AI unavailable");
    return await res.json();
  }
}

function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function ScoreRing({ score, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? C.success : score >= 40 ? C.warning : C.danger;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={8} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fill: T.primary,
          fontSize: size * 0.22,
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          transform: "rotate(90deg)",
          transformOrigin: `${size / 2}px ${size / 2}px`,
        }}
      >
        {score}
      </text>
    </svg>
  );
}

function HeatmapCell({ value, max }) {
  const intensity = max > 0 ? value / max : 0;
  const bg =
    intensity === 0
      ? C.surface
      : intensity < 0.3
      ? `${C.accent}33`
      : intensity < 0.6
      ? `${C.accent}77`
      : intensity < 0.85
      ? `${C.accent}BB`
      : C.accent;
  return (
    <div
      title={`${value} posts`}
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        background: bg,
        border: `1px solid ${C.border}`,
        cursor: "default",
        transition: "background 0.3s",
      }}
    />
  );
}

function ActivityTimeline({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count));
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((day, di) => (
              <HeatmapCell key={di} value={day.count} max={max} />
            ))}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontSize: 11,
          color: T.muted,
        }}
      >
        <span>30 Tage zurück</span>
        <span>Heute</span>
      </div>
    </div>
  );
}

function PlatformMetricsCard({ platform, data, onRefresh }) {
  const plat = PLATFORMS.find((p) => p.key === platform);
  if (!plat) return null;
  const { Icon, color, label } = plat;
  const engColor =
    data.engagementRate >= 3 ? C.success : data.engagementRate >= 1 ? C.warning : C.danger;

  return (
    <Card style={{ padding: 20, position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 4,
          height: "100%",
          background: color,
          borderRadius: "4px 0 0 4px",
        }}
      />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${color}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={20} strokeWidth={IW} color={color} />
          </div>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, color: T.primary, fontSize: 15 }}>
              {label}
            </div>
            {data.handle && (
              <a
                href={data.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: C.accent, textDecoration: "none" }}
              >
                {data.handle}
              </a>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Badge
            label={data.verified ? "Verifiziert" : "Gefunden"}
            color={data.verified ? C.success : C.warning}
          />
          <button
            onClick={onRefresh}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: T.muted }}
          >
            <RefreshCw size={14} strokeWidth={IW} />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Follower", value: fmtNum(data.followers), icon: <Users size={14} strokeWidth={IW} /> },
          { label: "Following", value: fmtNum(data.following), icon: <Eye size={14} strokeWidth={IW} /> },
          { label: "Posts", value: fmtNum(data.posts), icon: <FileText size={14} strokeWidth={IW} /> },
          {
            label: "Engagement",
            value: `${data.engagementRate.toFixed(2)}%`,
            icon: <Heart size={14} strokeWidth={IW} />,
            color: engColor,
          },
        ].map(({ label, value, icon, color: vc }) => (
          <div
            key={label}
            style={{
              background: C.surface,
              borderRadius: 8,
              padding: "10px 12px",
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.muted, marginBottom: 4 }}>
              {icon}
              <span style={{ fontSize: 11 }}>{label}</span>
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 700,
                fontSize: 18,
                color: vc || T.primary,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
          <Activity size={12} strokeWidth={IW} />
          Posting-Aktivität (30 Tage)
        </div>
        <ActivityTimeline data={data.heatmap} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 10,
          fontSize: 12,
          color: T.muted,
        }}
      >
        <Clock size={12} strokeWidth={IW} />
        Letzter Post: {data.lastActivity}
      </div>
    </Card>
  );
}

function SocialHealthScore({ score, breakdown, strengths, weaknesses }) {
  const color = score >= 70 ? C.success : score >= 40 ? C.warning : C.danger;
  const label = score >= 70 ? "Stark" : score >= 40 ? "Mittel" : "Schwach";

  return (
    <Card style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <Star size={18} strokeWidth={IW} color={C.accent} />
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: T.primary }}>
          Social Health Score
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
        <ScoreRing score={score} size={90} />
        <div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>Gesamtbewertung</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 28, color }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>{score}/100 Punkte</div>
        </div>
      </div>

      {breakdown && (
        <div style={{ marginBottom: 20 }}>
          {breakdown.map(({ label: l, score: s }) => (
            <div key={l} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: T.secondary,
                  marginBottom: 4,
                }}
              >
                <span>{l}</span>
                <span style={{ fontWeight: 600 }}>{s}/100</span>
              </div>
              <div
                style={{
                  height: 6,
                  background: C.border,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${s}%`,
                    background: s >= 70 ? C.success : s >= 40 ? C.warning : C.danger,
                    borderRadius: 3,
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: C.success,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <TrendingUp size={13} strokeWidth={IW} />
            Stärken
          </div>
          {strengths?.map((s, i) => (
            <div
              key={i}
              style={{
                fontSize: 12,
                color: T.secondary,
                padding: "4px 0",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
              }}
            >
              <CheckCircle size={12} strokeWidth={IW} color={C.success} style={{ marginTop: 1, flexShrink: 0 }} />
              {s}
            </div>
          ))}
        </div>
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: C.danger,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <TrendingDown size={13} strokeWidth={IW} />
            Schwächen
          </div>
          {weaknesses?.map((w, i) => (
            <div
              key={i}
              style={{
                fontSize: 12,
                color: T.secondary,
                padding: "4px 0",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
              }}
            >
              <AlertTriangle size={12} strokeWidth={IW} color={C.danger} style={{ marginTop: 1, flexShrink: 0 }} />
              {w}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function CompetitorSocialBenchmark({ mainDomain, mainData, competitors, onAddCompetitor, onRemoveCompetitor }) {
  const [input, setInput] = useState("");

  const metrics = ["followers", "engagementRate", "postsPerWeek", "healthScore"];
  const metricLabels = {
    followers: "Follower (∅)",
    engagementRate: "Engagement %",
    postsPerWeek: "Posts/Woche",
    healthScore: "Health Score",
  };

  return (
    <Card style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <BarChart2 size={18} strokeWidth={IW} color={C.accent} />
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: T.primary }}>
          Competitor Benchmark
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              onAddCompetitor(input.trim());
              setInput("");
            }
          }}
          placeholder="competitor.com hinzufügen..."
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: T.primary,
            fontSize: 13,
            fontFamily: FONT,
            outline: "none",
          }}
        />
        <Btn
          label="+"
          onClick={() => {
            if (input.trim()) {
              onAddCompetitor(input.trim());
              setInput("");
            }
          }}
          size="sm"
        />
      </div>

      {competitors.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "32px 0",
            color: T.muted,
            fontSize: 13,
            border: `1px dashed ${C.border}`,
            borderRadius: 10,
          }}
        >
          <Plus size={24} strokeWidth={IW} style={{ margin: "0 auto 8px", display: "block" }} />
          Füge Wettbewerber-Domains hinzu
        </div>
      )}

      {competitors.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    color: T.muted,
                    fontWeight: 600,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  Domain
                </th>
                {metrics.map((m) => (
                  <th
                    key={m}
                    style={{
                      textAlign: "right",
                      padding: "8px 10px",
                      color: T.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {metricLabels[m]}
                  </th>
                ))}
                <th style={{ width: 30, borderBottom: `1px solid ${C.border}` }} />
              </tr>
            </thead>
            <tbody>
              {[{ domain: mainDomain, ...mainData, isMain: true }, ...competitors].map((row, i) => (
                <tr
                  key={i}
                  style={{ background: row.isMain ? `${C.accent}11` : "transparent" }}
                >
                  <td
                    style={{
                      padding: "10px 10px",
                      color: row.isMain ? C.accent : T.primary,
                      fontWeight: row.isMain ? 700 : 400,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {row.isMain && <Star size={12} strokeWidth={IW} style={{ marginRight: 4, display: "inline" }} />}
                    {row.domain}
                  </td>
                  {metrics.map((m) => {
                    const all = [mainData, ...competitors].map((c) => c[m] || 0);
                    const max = Math.max(...all);
                    const isTop = (row[m] || 0) === max && max > 0;
                    return (
                      <td
                        key={m}
                        style={{
                          padding: "10px 10px",
                          textAlign: "right",
                          color: isTop ? C.success : T.secondary,
                          fontWeight: isTop ? 700 : 400,
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        {m === "engagementRate"
                          ? `${(row[m] || 0).toFixed(2)}%`
                          : m === "followers"
                          ? fmtNum(row[m] || 0)
                          : row[m] || 0}
                      </td>
                    );
                  })}
                  <td style={{ borderBottom: `1px solid ${C.border}`, textAlign: "center" }}>
                    {!row.isMain && (
                      <button
                        onClick={() => onRemoveCompetitor(row.domain)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: T.muted,
                          padding: 2,
                        }}
                      >
                        <X size={14} strokeWidth={IW} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function SocialGapAlert({ gaps }) {
  if (!gaps || gaps.length === 0) return null;
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <AlertTriangle size={18} strokeWidth={IW} color={C.warning} />
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: T.primary }}>
          Gap Alerts
        </span>
        <Badge label={String(gaps.length)} color={C.warning} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {gaps.map((g, i) => {
          const plat = PLATFORMS.find((p) => p.key === g.platform);
          const Icon = plat?.Icon || Globe;
          const iconColor = plat?.color || T.muted;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "10px 12px",
                background: `${C.warning}11`,
                border: `1px solid ${C.warning}44`,
                borderRadius: 8,
              }}
            >
              <Icon size={16} strokeWidth={IW} color={iconColor} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.primary, marginBottom: 2 }}>
                  {plat?.label || g.platform}
                </div>
                <div style={{ fontSize: 12, color: T.secondary }}>{g.message}</div>
              </div>
              <Badge
                label={g.severity === "high" ? "Kritisch" : g.severity === "medium" ? "Mittel" : "Niedrig"}
                color={g.severity === "high" ? C.danger : g.severity === "medium" ? C.warning : T.muted}
                style={{ marginLeft: "auto", flexShrink: 0 }}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ExportButton({ domain, analysisData, disabled }) {
  const [open, setOpen] = useState(false);

  function exportCSV() {
    if (!analysisData?.platforms) return;
    const rows = [
      ["Platform", "Handle", "Followers", "Following", "Posts", "Engagement%", "LastActivity"],
      ...Object.entries(analysisData.platforms).map(([k, v]) => [
        k,
        v.handle || "",
        v.followers,
        v.following,
        v.posts,
        v.engagementRate,
        v.lastActivity,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `social-intelligence-${domain}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function exportJSON() {
    if (!analysisData) return;
    const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `social-intelligence-${domain}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <Btn
        label="Export"
        icon={<Download size={15} strokeWidth={IW} />}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        variant="secondary"
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: "6px 0",
            zIndex: 100,
            minWidth: 160,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {[
            { label: "Als CSV exportieren", fn: exportCSV },
            { label: "Als JSON exportieren", fn: exportJSON },
          ].map(({ label, fn }) => (
            <button
              key={label}
              onClick={fn}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "9px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.primary,
                fontSize: 13,
                fontFamily: FONT,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.surface)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function generateMockHeatmap() {
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
    count: Math.random() > 0.4 ? Math.floor(Math.random() * 5) : 0,
  }));
}

export default function SocialIntelligenceLive() {
  const { goNav } = useApp();
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const abortRef = useRef(null);

  const analyze = useCallback(async () => {
    const d = domain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!d) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setAnalysisData(null);

    try {
      const prompt = `Du bist ein Social-Media-Analyse-Experte. Analysiere die Domain "${d}" und liefere eine realistische Social-Intelligence-Analyse.

Antworte NUR mit validem JSON in diesem exakten Format:
{
  "domain": "${d}",
  "detectedProfiles": ["linkedin", "twitter", "instagram", "youtube"],
  "platforms": {
    "linkedin": {
      "handle": "@${d.split(".")[0]}",
      "profileUrl": "https://linkedin.com/company/${d.split(".")[0]}",
      "followers": 12400,
      "following": 890,
      "posts": 340,
      "engagementRate": 2.4,
      "lastActivity": "vor 2 Tagen",
      "verified": true,
      "postsPerWeek": 3
    },
    "twitter": {
      "handle": "@${d.split(".")[0]}",
      "profileUrl": "https://twitter.com/${d.split(".")[0]}",
      "followers": 8900,
      "following": 1200,
      "posts": 2100,
      "engagementRate": 1.2,
      "lastActivity": "vor 5 Stunden",
      "verified": false,
      "postsPerWeek": 7
    },
    "instagram": {
      "handle": "@${d.split(".")[0]}",
      "profileUrl": "https://instagram.com/${d.split(".")[0]}",
      "followers": 5600,
      "following": 430,
      "posts": 180,
      "engagementRate": 4.1,
      "lastActivity": "vor 1 Tag",
      "verified": false,
      "postsPerWeek": 5
    }
  },
  "healthScore": {
    "overall": 68,
    "breakdown": [
      { "label": "Konsistenz", "score": 72 },
      { "label": "Reichweite", "score": 65 },
      { "label": "Engagement", "score": 70 },
      { "label": "Kanal-Abdeckung", "score": 55 }
    ],
    "strengths": [
      "Regelmäßige LinkedIn-Präsenz mit hoher Konsistenz",
      "Überdurchschnittliche Instagram-Engagement-Rate",
      "Gute Content-Vielfalt über Kanäle"
    ],
    "weaknesses": [
      "Kein aktiver YouTube-Kanal vorhanden",
      "TikTok-Präsenz fehlt komplett",
      "Twitter-Engagement unter Branchendurchschnitt"
    ]
  },