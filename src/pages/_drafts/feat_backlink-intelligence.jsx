import React, { useState, useEffect, useCallback, useRef } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import {
  Link2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Search,
  RefreshCw,
  Shield,
  Globe,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  FileJson,
  FileText,
  X,
  Info,
  Zap,
  BarChart2,
  PieChart,
  CheckCircle,
  XCircle,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callAI(prompt) {
  const body = { messages: [{ role: "user", content: prompt }] };
  try {
    const res = await fetch("/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
  } catch {}
  const res2 = await fetch("https://socialflow-pro.pages.dev/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res2.json();
}

function generateMockData(domain) {
  const tlds = [".com", ".de", ".net", ".org", ".io", ".co.uk", ".fr", ".nl"];
  const anchorTexts = [
    domain.split(".")[0],
    "click here",
    "learn more",
    "SEO tools",
    "digital marketing",
    "best practices",
    "read more",
    "visit website",
    "brand name",
    "content strategy",
    "backlink analysis",
    "link building",
    "authority links",
    "domain authority",
    "organic traffic",
  ];

  const referringDomains = Array.from({ length: 48 }, (_, i) => {
    const tld = tlds[Math.floor(Math.random() * tlds.length)];
    const da = Math.floor(Math.random() * 90) + 5;
    const isToxic = da < 15 && Math.random() > 0.6;
    return {
      id: i,
      domain: `site${i + 1}${tld}`,
      da,
      anchor: anchorTexts[Math.floor(Math.random() * anchorTexts.length)],
      linkType: ["dofollow", "nofollow", "ugc", "sponsored"][
        Math.floor(Math.random() * (i < 30 ? 2 : 4))
      ],
      firstSeen: new Date(
        Date.now() - Math.floor(Math.random() * 365) * 864e5
      ).toISOString(),
      lastSeen: new Date(
        Date.now() - Math.floor(Math.random() * 7) * 864e5
      ).toISOString(),
      links: Math.floor(Math.random() * 20) + 1,
      toxic: isToxic,
      toxicReasons: isToxic
        ? ["Low DA", "Spam patterns", "Irrelevant niche"].slice(
            0,
            Math.floor(Math.random() * 2) + 1
          )
        : [],
    };
  });

  const timeline = Array.from({ length: 30 }, (_, i) => ({
    day: i,
    label: new Date(Date.now() - (29 - i) * 864e5).toLocaleDateString(
      "de-DE",
      { day: "2-digit", month: "2-digit" }
    ),
    gained: Math.floor(Math.random() * 12),
    lost: Math.floor(Math.random() * 5),
  }));

  const tldCounts = {};
  referringDomains.forEach((d) => {
    const tld = d.domain.split(".").slice(-1)[0].replace(/[^a-z.]/g, "");
    const key = "." + tld;
    tldCounts[key] = (tldCounts[key] || 0) + 1;
  });

  const anchorCounts = {};
  referringDomains.forEach((d) => {
    anchorCounts[d.anchor] = (anchorCounts[d.anchor] || 0) + d.links;
  });

  const linkTypeCounts = { dofollow: 0, nofollow: 0, ugc: 0, sponsored: 0 };
  referringDomains.forEach((d) => {
    linkTypeCounts[d.linkType] = (linkTypeCounts[d.linkType] || 0) + d.links;
  });

  const toxicCount = referringDomains.filter((d) => d.toxic).length;
  const avgDA = Math.round(
    referringDomains.reduce((s, d) => s + d.da, 0) / referringDomains.length
  );
  const totalLinks = referringDomains.reduce((s, d) => s + d.links, 0);
  const toxicScore = Math.round((toxicCount / referringDomains.length) * 100);

  return {
    referringDomains,
    timeline,
    tldCounts,
    anchorCounts,
    linkTypeCounts,
    summary: {
      totalLinks,
      referringDomainsCount: referringDomains.length,
      avgDA,
      toxicScore,
      newLast30: timeline.reduce((s, d) => s + d.gained, 0),
      lostLast30: timeline.reduce((s, d) => s + d.lost, 0),
    },
  };
}

// ── sub-components ────────────────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, sub, color, alert }) {
  return (
    <Card
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        borderLeft: `3px solid ${color}`,
        position: "relative",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            background: color + "22",
            borderRadius: 8,
            padding: 7,
            display: "flex",
          }}
        >
          <Icon size={18} color={color} strokeWidth={IW} />
        </div>
        <span style={{ ...FONT, fontSize: 12, color: T.muted }}>{label}</span>
        {alert && (
          <AlertTriangle
            size={14}
            color={C.warning}
            strokeWidth={IW}
            style={{ marginLeft: "auto" }}
          />
        )}
      </div>
      <span style={{ ...FONT_DISPLAY, fontSize: 28, color: T.primary }}>
        {value}
      </span>
      {sub && (
        <span style={{ ...FONT, fontSize: 11, color: T.muted }}>{sub}</span>
      )}
    </Card>
  );
}

function BacklinkSummaryBar({ summary, loading }) {
  if (loading)
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Card
            key={i}
            style={{ padding: 20, height: 110, opacity: 0.4, background: C.surface }}
          />
        ))}
      </div>
    );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 16,
      }}
    >
      <KPICard
        icon={Link2}
        label="Total Backlinks"
        value={summary.totalLinks.toLocaleString()}
        sub={`+${summary.newLast30} / -${summary.lostLast30} (30d)`}
        color={C.accent}
      />
      <KPICard
        icon={Globe}
        label="Referring Domains"
        value={summary.referringDomainsCount.toLocaleString()}
        sub="Unique root domains"
        color={C.success || "#22c55e"}
      />
      <KPICard
        icon={Shield}
        label="Avg. Domain Authority"
        value={summary.avgDA}
        sub="Weighted average DA"
        color={C.primary}
      />
      <KPICard
        icon={AlertTriangle}
        label="Toxic Score"
        value={`${summary.toxicScore}%`}
        sub="Based on link patterns"
        color={
          summary.toxicScore > 30
            ? C.error || "#ef4444"
            : summary.toxicScore > 15
            ? C.warning || "#f59e0b"
            : C.success || "#22c55e"
        }
        alert={summary.toxicScore > 30}
      />
    </div>
  );
}

function NewLostLinksTimeline({ timeline }) {
  const maxVal = Math.max(...timeline.map((d) => Math.max(d.gained, d.lost)), 1);
  const W = 600;
  const H = 120;
  const padL = 30;
  const padR = 10;
  const padT = 10;
  const padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const step = chartW / (timeline.length - 1);

  const gainedPath = timeline
    .map((d, i) => {
      const x = padL + i * step;
      const y = padT + chartH - (d.gained / maxVal) * chartH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const lostPath = timeline
    .map((d, i) => {
      const x = padL + i * step;
      const y = padT + chartH - (d.lost / maxVal) * chartH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const labels = timeline.filter((_, i) => i % 5 === 0);

  return (
    <Card style={{ padding: "20px 24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span style={{ ...FONT_DISPLAY, fontSize: 15, color: T.primary }}>
          New vs. Lost Links (30d)
        </span>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{ width: 12, height: 3, background: C.success || "#22c55e", borderRadius: 2 }}
            />
            <span style={{ ...FONT, fontSize: 12, color: T.muted }}>New</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{ width: 12, height: 3, background: C.error || "#ef4444", borderRadius: 2 }}
            />
            <span style={{ ...FONT, fontSize: 12, color: T.muted }}>Lost</span>
          </div>
        </div>
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ overflow: "visible" }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padL}
            x2={W - padR}
            y1={padT + t * chartH}
            y2={padT + t * chartH}
            stroke={C.border || "#333"}
            strokeWidth={0.5}
            strokeDasharray="4 4"
            opacity={0.4}
          />
        ))}
        <path
          d={gainedPath}
          fill="none"
          stroke={C.success || "#22c55e"}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path
          d={lostPath}
          fill="none"
          stroke={C.error || "#ef4444"}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {timeline.map((d, i) => (
          <React.Fragment key={i}>
            <circle
              cx={padL + i * step}
              cy={padT + chartH - (d.gained / maxVal) * chartH}
              r={3}
              fill={C.success || "#22c55e"}
            />
            <circle
              cx={padL + i * step}
              cy={padT + chartH - (d.lost / maxVal) * chartH}
              r={3}
              fill={C.error || "#ef4444"}
            />
          </React.Fragment>
        ))}
        {labels.map((d, i) => (
          <text
            key={i}
            x={padL + timeline.indexOf(d) * step}
            y={H - 5}
            textAnchor="middle"
            fontSize={9}
            fill={T.muted}
            fontFamily="inherit"
          >
            {d.label}
          </text>
        ))}
      </svg>
    </Card>
  );
}

function DomainAvatar({ domain }) {
  const colors = [C.accent, C.primary, C.success || "#22c55e", "#8b5cf6", "#f59e0b"];
  const color = colors[domain.charCodeAt(0) % colors.length];
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: color + "22",
        border: `1px solid ${color}44`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ ...FONT, fontSize: 12, color, fontWeight: 700 }}>
        {domain[0].toUpperCase()}
      </span>
    </div>
  );
}

function ReferringDomainsTable({ domains }) {
  const [sortKey, setSortKey] = useState("da");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const perPage = 10;

  const sorted = [...domains].sort((a, b) => {
    const v = sortDir === "asc" ? 1 : -1;
    if (sortKey === "da") return v * (a.da - b.da);
    if (sortKey === "domain") return v * a.domain.localeCompare(b.domain);
    if (sortKey === "anchor") return v * a.anchor.localeCompare(b.anchor);
    if (sortKey === "links") return v * (a.links - b.links);
    if (sortKey === "firstSeen")
      return v * (new Date(a.firstSeen) - new Date(b.firstSeen));
    return 0;
  });

  const paginated = sorted.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(domains.length / perPage);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const SortIcon = ({ k }) =>
    sortKey === k ? (
      sortDir === "asc" ? (
        <ChevronUp size={12} strokeWidth={IW} />
      ) : (
        <ChevronDown size={12} strokeWidth={IW} />
      )
    ) : (
      <ChevronDown size={12} strokeWidth={IW} color={T.muted} />
    );

  const linkTypeColor = {
    dofollow: C.success || "#22c55e",
    nofollow: T.muted,
    ugc: "#8b5cf6",
    sponsored: C.warning || "#f59e0b",
  };

  const daColor = (da) =>
    da >= 60
      ? C.success || "#22c55e"
      : da >= 30
      ? C.warning || "#f59e0b"
      : C.error || "#ef4444";

  const thStyle = {
    ...FONT,
    fontSize: 11,
    color: T.muted,
    padding: "10px 12px",
    textAlign: "left",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    ...FONT,
    fontSize: 13,
    color: T.primary,
    padding: "12px 12px",
    borderTop: `1px solid ${C.border || "#333"}22`,
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "18px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...FONT_DISPLAY, fontSize: 15, color: T.primary }}>
          Referring Domains
        </span>
        <Badge>{domains.length} domains</Badge>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.surface }}>
              {[
                { k: "domain", l: "Domain" },
                { k: "da", l: "DA" },
                { k: "anchor", l: "Anchor Text" },
                { k: "links", l: "Links" },
                { k: "linkType", l: "Type" },
                { k: "firstSeen", l: "First Seen" },
              ].map(({ k, l }) => (
                <th
                  key={k}
                  style={thStyle}
                  onClick={() => toggleSort(k)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {l} <SortIcon k={k} />
                  </span>
                </th>
              ))}
              <th style={{ ...thStyle, cursor: "default" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((d) => (
              <tr
                key={d.id}
                style={{
                  background: d.toxic ? (C.error || "#ef4444") + "08" : "transparent",
                }}
              >
                <td style={tdStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <DomainAvatar domain={d.domain} />
                    <div>
                      <div style={{ ...FONT, fontSize: 13, color: T.primary, fontWeight: 600 }}>
                        {d.domain}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      ...FONT,
                      fontSize: 13,
                      fontWeight: 700,
                      color: daColor(d.da),
                    }}
                  >
                    {d.da}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      ...FONT,
                      fontSize: 12,
                      color: T.secondary,
                      background: C.surface,
                      padding: "2px 8px",
                      borderRadius: 4,
                      border: `1px solid ${C.border || "#333"}33`,
                    }}
                  >
                    {d.anchor}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{d.links}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      ...FONT,
                      fontSize: 11,
                      fontWeight: 600,
                      color: linkTypeColor[d.linkType],
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {d.linkType}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: T.muted, fontSize: 12 }}>
                  {new Date(d.firstSeen).toLocaleDateString("de-DE")}
                </td>
                <td style={tdStyle}>
                  {d.toxic ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: C.error || "#ef4444",
                        fontSize: 12,
                      }}
                    >
                      <XCircle size={14} strokeWidth={IW} />
                      Toxic
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: C.success || "#22c55e",
                        fontSize: 12,
                      }}
                    >
                      <CheckCircle size={14} strokeWidth={IW} />
                      Clean
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          borderTop: `1px solid ${C.border || "#333"}33`,
        }}
      >
        <span style={{ ...FONT, fontSize: 12, color: T.muted }}>
          Page {page + 1} of {totalPages}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Btn>
          <Btn
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Btn>
        </div>
      </div>
    </Card>
  );
}

function AnchorTextCloud({ anchorCounts }) {
  const entries = Object.entries(anchorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  const max = entries[0]?.[1] || 1;
  const colors = [C.accent, C.primary, "#8b5cf6", C.success || "#22c55e", C.warning || "#f59e0b"];

  return (
    <Card style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ ...FONT_DISPLAY, fontSize: 15, color: T.primary }}>
          Top Anchor Texts
        </span>
        <Badge>Top 15</Badge>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          minHeight: 120,
          padding: "8px 0",
        }}
      >
        {entries.map(([text, count], i) => {
          const ratio = count / max;
          const fontSize = 11 + Math.round(ratio * 16);
          const color = colors[i % colors.length];
          return (
            <span
              key={text}
              style={{
                ...FONT,
                fontSize,
                color,
                fontWeight: ratio > 0.5 ? 700 : 400,
                padding: "3px 8px",
                background: color + "15",
                borderRadius: 6,
                border: `1px solid ${color}33`,
                cursor: "default",
                transition: "transform 0.15s",
              }}
              title={`${count} links`}
            >
              {text}
            </span>
          );
        })}
      </div>
    </Card>
  );
}

function DonutChart({ data, title, icon: Icon }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let cumAngle = -Math.PI / 2;
  const cx = 70;
  const cy = 70;
  const r = 55;
  const innerR = 33;

  function polarToCartesian(angle, radius) {
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }

  function arcPath(startAngle, endAngle, outerR, innerR) {
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    const o1 = polarToCartesian(startAngle, outerR);
    const o2 = polarToCartesian(endAngle, outerR);
    const i1 = polarToCartesian(endAngle, innerR);
    const i2 = polarToCartesian(startAngle, innerR);
    return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
  }

  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const path = arcPath(cumAngle, cumAngle + angle - 0.02, r, innerR);
    cumAngle += angle;
    return { ...d, path };
  });

  return (
    <Card style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        {Icon && <Icon size={16} color={T.muted} strokeWidth={IW} />}
        <span style={{ ...FONT_DISPLAY, fontSize: 15, color: T.primary }}>{title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <svg width={140} height={140} style={{ flexShrink: 0 }}>
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} />
          ))}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize={18}
            fontWeight={700}
            fill={T.primary}
            fontFamily="inherit"
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            fontSize={9}
            fill={T.muted}
            fontFamily="inherit"
          >
            total
          </text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {slices.map((s, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }}
                />
                <span style={{ ...FONT, fontSize: 12, color: T.secondary }}>{s.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ ...FONT, fontSize: 12, fontWeight: 600, color: T.primary }}>
                  {s.value}
                </span>
                <span style={{ ...FONT, fontSize: 11, color: T.muted }}>
                  ({Math.round((s.value / total) * 100)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function TLDDistributionChart({ tldCounts }) {
  const entries = Object.entries(tldCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const max = entries[0]?.[1] || 1;
  const colors = [C.accent, C.primary, "#8b5cf6", C.success || "#22c55e", C.warning || "#f59e0b", "#f43f5e", "#06b6d4", "#84cc16"];

  return (
    <Card style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <BarChart2 size={16} color={T.muted} strokeWidth={IW} />
        <span style={{ ...FONT_DISPLAY, fontSize: 15, color: T.primary }}>TLD Distribution</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {entries.map(([tld, count], i) => (
          <div key={tld} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                ...FONT,
                fontSize: 12,
                color: T.muted,
                width: 48,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {tld}
            </span>
            <div
              style={{
                flex: 1,
                height: 10,
                background: (C.border || "#333") + "33",
                borderRadius: 5,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(count / max) *