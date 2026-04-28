import React, { useState, useEffect, useMemo, memo } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Badge } from "../components/ui/index.jsx";
import {
  CheckCircle, Clock, Layers, Globe, Shield, BarChart2,
  Search, Zap, GitCompare, Briefcase, FileText, Bot, Star,
  Link, Download, Eye, AlertTriangle, RefreshCw,
} from "lucide-react";

const ICON_MAP = {
  Globe, Shield, BarChart2, Search, Zap, Layers, Star, CheckCircle,
  Link, Download, Eye, Bot, GitCompare, Briefcase, FileText,
};

const PAGE_ICONS = {
  "AnalyzePage": Globe,
  "ReportPage": BarChart2,
  "ContentPage": FileText,
  "ComparePage": GitCompare,
  "ClientsPage": Briefcase,
  "BatchPage": Layers,
  "ImprovePage": Bot,
};

const IMPACT_COLOR = { high: C.accent, medium: "#d97706", low: C.textMute };
const EFFORT_LABEL = { low: "Wenig Aufwand", medium: "Mittlerer Aufwand", high: "Hoher Aufwand" };
const EFFORT_COLOR = { low: C.success, medium: "#d97706", high: "#dc2626" };

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

const FeatureCard = memo(function FeatureCard({ feat, isNew }) {
  const [open, setOpen] = useState(false);
  const Icon = PAGE_ICONS[feat.page?.split(" ")[0]] || CheckCircle;
  const CATEGORY_COLOR = {
    Analyse: C.accent, SEO: "#7c3aed", CRM: "#059669", System: "#d97706",
  };
  const catColor = CATEGORY_COLOR[feat.category] || C.textMute;

  return (
    <div style={{
      borderRadius: T.rMd,
      background: isNew ? C.accentLight + "60" : C.surface,
      border: `1px solid ${isNew ? C.accent + "40" : C.border}`,
      overflow: "hidden", transition: "box-shadow 0.15s",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left", fontFamily: FONT,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: T.rMd, flexShrink: 0,
          background: isNew ? C.accent + "15" : C.bg,
          border: `1px solid ${isNew ? C.accent + "30" : C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} color={isNew ? C.accent : C.textMid} strokeWidth={IW} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{feat.label || feat.name}</span>
            {isNew && (
              <span style={{ fontSize: 9, fontWeight: 800, color: C.accent, background: C.accentLight, border: `1px solid ${C.accent}30`, padding: "1px 7px", borderRadius: 99, letterSpacing: ".05em" }}>NEU</span>
            )}
            <span style={{ fontSize: 10, fontWeight: 600, color: catColor, background: catColor + "12", padding: "1px 8px", borderRadius: 99 }}>
              {feat.category}
            </span>
            {feat.since && (
              <span style={{ fontSize: 10, color: C.textMute, marginLeft: "auto" }}>seit {feat.since}</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: open ? "normal" : "nowrap" }}>
            {feat.desc || feat.category || ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <CheckCircle size={14} color={C.success} strokeWidth={IW} />
          <span style={{ fontSize: 10, color: C.textMute }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px 64px", borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.7, margin: "12px 0 10px" }}>
            {feat.desc}
          </p>
          {feat.highlights?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {feat.highlights.map(h => (
                <span key={h} style={{
                  fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 99,
                  background: C.bg, border: `1px solid ${C.border}`, color: C.textMid,
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <CheckCircle size={9} color={C.success} strokeWidth={IW} /> {h}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const GapCard = memo(function GapCard({ gap, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius: T.rMd, border: `1px solid ${C.border}`, background: C.surface, overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px", border: "none", background: "none", cursor: "pointer",
        textAlign: "left", fontFamily: FONT,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textMute, width: 24, textAlign: "right", flexShrink: 0 }}>#{idx + 1}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{gap.name}</span>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: IMPACT_COLOR[gap.impact] + "18", color: IMPACT_COLOR[gap.impact] }}>
          {gap.impact === "high" ? "Hoher Impact" : gap.impact === "medium" ? "Mittlerer Impact" : "Niedriger Impact"}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: EFFORT_COLOR[gap.effort] + "18", color: EFFORT_COLOR[gap.effort] }}>
          {EFFORT_LABEL[gap.effort] || gap.effort}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px 50px", borderTop: `1px solid ${C.border}` }}>
          {(gap.why || gap.desc) && (
            <p style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.7, margin: "10px 0 8px" }}>
              {gap.why || gap.desc}
            </p>
          )}
          {gap.competitorHas?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: C.textMute, fontWeight: 600 }}>Haben es bereits:</span>
              {gap.competitorHas.map(c => (
                <span key={c} style={{ fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 99, background: C.accent + "12", color: C.accent, border: `1px solid ${C.accent}25` }}>{c}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default function FeaturesPage() {
  const [manifest, setManifest] = useState(null);
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("implemented");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [mRes, fRes] = await Promise.all([
          fetch("/features-manifest"),
          fetch("/improve-status"),
        ]);
        const [m, f] = await Promise.all([mRes.json(), fRes.json()]);
        setManifest(m);
        setFeatures(f.lastFeatures);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const implemented = useMemo(() => manifest?.currentFeatures ?? [], [manifest]);
  const newFeatures = useMemo(() => implemented.filter(f => f.addedAt), [implemented]);
  const coreFeatures = useMemo(() => implemented.filter(f => !f.addedAt), [implemented]);
  const gaps = useMemo(() => features?.topGaps ?? [], [features]);
  const quickWins = useMemo(() => features?.quickWins ?? [], [features]);

  const TABS = [
    { id: "implemented", label: `Implementiert (${implemented.length})`, icon: CheckCircle },
    { id: "gaps",        label: `Marktlücken (${gaps.length})`,         icon: AlertTriangle },
    { id: "quickwins",   label: `Quick Wins (${quickWins.length})`,      icon: Zap },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 60px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: T.rMd, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Layers size={22} color={C.accent} strokeWidth={IW} />
        </div>
        <div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Feature-Übersicht</h1>
          <p style={{ fontSize: 13, color: C.textSoft, margin: 0 }}>Alle implementierten Features · Marktlücken · Roadmap</p>
        </div>
        {loading && <RefreshCw size={16} color={C.textMute} strokeWidth={IW} style={{ marginLeft: "auto", animation: "spin 1.2s linear infinite" }} />}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 24 }}>
        {[
          { label: "Implementiert", value: implemented.length, color: C.success, icon: CheckCircle },
          { label: "Davon KI-generiert", value: newFeatures.length, color: C.accent, icon: Bot },
          { label: "Marktlücken", value: gaps.length, color: "#d97706", icon: AlertTriangle },
          { label: "Quick Wins offen", value: quickWins.length, color: "#7c3aed", icon: Zap },
        ].map(({ label, value, color, icon: Ico }) => (
          <div key={label} style={{ padding: "12px 14px", borderRadius: T.rMd, background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <Ico size={11} color={color} strokeWidth={IW} />
              <span style={{ fontSize: 9, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: FONT_DISPLAY }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderRadius: T.rMd, border: `1px solid ${C.border}`, overflow: "hidden", width: "fit-content" }}>
        {TABS.map(({ id, label, icon: Ico }, i) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", fontSize: 12, fontWeight: 600, fontFamily: FONT,
            border: "none", borderRight: i < TABS.length - 1 ? `1px solid ${C.border}` : "none",
            cursor: "pointer",
            background: tab === id ? C.accent : C.surface,
            color: tab === id ? "#fff" : C.textMid,
          }}>
            <Ico size={12} strokeWidth={IW} /> {label}
          </button>
        ))}
      </div>

      {/* Tab: Implementiert */}
      {tab === "implemented" && (
        <div>
          {newFeatures.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Bot size={11} strokeWidth={IW} /> KI-generierte Features
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {newFeatures.map(f => <FeatureCard key={f.id} feat={f} isNew />)}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
              Kern-Features
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {coreFeatures.map(f => <FeatureCard key={f.id} feat={f} isNew={false} />)}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Marktlücken */}
      {tab === "gaps" && (
        <div>
          {gaps.length === 0
            ? <div style={{ padding: 40, textAlign: "center", color: C.textMute, fontSize: 13 }}>Keine Marktlücken-Daten — bitte Feature-Analyse in "Autonome Verbesserung" starten.</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gaps.map((g, i) => <GapCard key={g.id || i} gap={g} idx={i} />)}
              </div>
          }
        </div>
      )}

      {/* Tab: Quick Wins */}
      {tab === "quickwins" && (
        <div>
          {quickWins.length === 0
            ? <div style={{ padding: 40, textAlign: "center", color: C.textMute, fontSize: 13 }}>Keine Quick-Win-Daten — bitte Feature-Analyse starten.</div>
            : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {quickWins.map(qw => (
                  <div key={qw.id} style={{ padding: 16, borderRadius: T.rMd, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#14532d", marginBottom: 6 }}>{qw.name}</div>
                    <div style={{ fontSize: 11, color: "#166534", lineHeight: 1.5 }}>{qw.description}</div>
                    {qw.uiHint && <div style={{ marginTop: 8, fontSize: 10, color: "#15803d", fontStyle: "italic" }}>💡 {qw.uiHint}</div>}
                  </div>
                ))}
              </div>
          }
        </div>
      )}

    </div>
  );
}
