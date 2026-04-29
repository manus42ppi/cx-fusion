import React from "react";
import { LayoutDashboard, Globe, GitCompare, Briefcase, BookText, Bot, Layers, Code2, ListChecks, LogOut, Star } from "lucide-react";
import { C, T, FONT, IW } from "../../constants/colors.js";
import { useApp } from "../../context/AppContext.jsx";

const NAV_GROUPS = [
  {
    label: "Übersicht",
    color: null,
    items: [
      { id: "dashboard", label: "Übersicht",        icon: LayoutDashboard, desc: "Reports & gespeicherte Analysen" },
      { id: "clients",   label: "Kundenverwaltung",  icon: Briefcase,       desc: "Gespeicherte Kundendomains" },
    ],
  },
  {
    label: "Analyse",
    color: null,
    items: [
      { id: "analyze",  label: "Website-Analyse",    icon: Globe,      desc: "Vollständige Domain-Analyse" },
      { id: "content",  label: "Content-Audit",       icon: BookText,   desc: "Ton · Sentiment · SEO-Audit" },
      { id: "feat-schema-validator", label: "Structure-Audit", icon: Code2, desc: "Schema.org-Validierung & Rich-Snippet-Vorschau" },
      // ─── AUTO_NAV_START ─────────────────────────────────────────────────────
      { id: "social-media-stats", label: "Social Intelligence", icon: Star, desc: "Social-Media-Präsenz & Engagement analysieren" },
// ─── AUTO_NAV_END ───────────────────────────────────────────────────────
      { id: "compare",  label: "Website-Vergleich",  icon: GitCompare, desc: "Zwei Websites gegenüberstellen" },
      { id: "batch",    label: "Batch-Analyse",      icon: Layers,     desc: "Bis zu 50 Domains auf einmal" },
    ],
  },
  {
    label: "System",
    color: null,
    items: [
      { id: "improve",   label: "Verbesserung",      icon: Bot,         desc: "KI-Diagnose · Auto-Fixes" },
      { id: "features",  label: "Feature-Übersicht", icon: ListChecks,  desc: "Implementiert · Roadmap · Marktlücken" },
    ],
  },
];

function NavBtn({ id, label, Icon, desc, nav, goNav, active, accentColor, accentLight }) {
  const ac = accentColor || C.accent;
  const al = accentLight || C.accentLight;
  return (
    <button
      onClick={() => goNav(id)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "9px 10px", borderRadius: T.rMd,
        background: active ? al : "transparent",
        color: active ? ac : C.textMid,
        border: "none", cursor: "pointer", fontFamily: FONT,
        marginBottom: 3, transition: "all 0.15s",
        borderLeft: active ? `3px solid ${ac}` : "3px solid transparent",
        textAlign: "left",
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.surfaceHigh; e.currentTarget.style.color = C.text; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMid; } }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: T.rMd, flexShrink: 0,
        background: active ? ac + "20" : C.bg,
        border: `1px solid ${active ? ac + "30" : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        <Icon size={15} strokeWidth={IW} color={active ? ac : undefined} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, lineHeight: 1.2, color: "inherit" }}>{label}</div>
        <div style={{ fontSize: 10, color: active ? ac + "99" : C.textMute, marginTop: 2, lineHeight: 1.2 }}>{desc}</div>
      </div>
    </button>
  );
}

export default function Sidebar() {
  const { nav, goNav, user, handleLogout } = useApp();
  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      background: C.surface,
      borderRight: `1px solid ${C.border}`,
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0,
      boxShadow: "2px 0 12px rgba(0,0,0,.04)",
    }}>

      {/* Logo / Brand */}
      <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <img
            src="/ppitalk-logo-color.png"
            alt="ppi talk"
            style={{ height: 34, width: "auto", objectFit: "contain" }}
          />
          <span style={{
            fontSize: 10, fontWeight: 800, color: C.accent,
            background: C.accentLight, padding: "3px 8px",
            borderRadius: 5, letterSpacing: ".06em", whiteSpace: "nowrap",
          }}>PRO AI</span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: T.rMd,
          background: C.accentLight + "70",
          border: `1px solid ${C.accent}20`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, flexShrink: 0 }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, letterSpacing: ".02em" }}>
            Web Intelligence
          </div>
          <div style={{ marginLeft: "auto", fontSize: 9, color: C.textMute, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" }}>
            {typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.1.0"}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 10px", flex: 1, overflowY: "auto" }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <div style={{ margin: "10px 10px 8px", borderTop: `1px solid ${C.border}` }} />}
            <div style={{
              fontSize: 10, fontWeight: 700,
              color: group.color || C.textMute,
              padding: "4px 10px 6px", textTransform: "uppercase", letterSpacing: "0.08em",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              {group.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: group.color, display: "inline-block", flexShrink: 0 }} />}
              {group.label}
            </div>
            {group.items.map(({ id, label, icon: Icon, desc }) => (
              <NavBtn key={id} id={id} label={label} Icon={Icon} desc={desc} nav={nav} goNav={goNav}
                active={nav === id || (id === "analyze" && nav === "report")}
                accentColor={group.color || undefined}
                accentLight={group.color ? "#fef3c7" : undefined} />
            ))}
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      {user && (
        <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: user.imageUrl ? "transparent" : C.accentLight,
              border: `1px solid ${C.accent}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: C.accent, overflow: "hidden",
            }}>
              {user.imageUrl
                ? <img src={user.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (user.initials || user.name?.slice(0,2).toUpperCase() || "?")}
            </div>
            {/* Name + email */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name}
              </div>
              <div style={{ fontSize: 10, color: C.textMute, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </div>
            </div>
            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Abmelden"
              style={{
                width: 30, height: 30, borderRadius: T.rSm, flexShrink: 0,
                background: "transparent", border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.border; }}
            >
              <LogOut size={13} color={C.textSoft} strokeWidth={IW} />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "10px 14px 14px", borderTop: `1px solid ${C.border}` }}>
        <div style={{
          fontSize: 10, color: C.textMute, lineHeight: 1.9,
          padding: "8px 10px", background: C.bg, borderRadius: T.rSm,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontWeight: 700, color: C.textSoft, marginBottom: 3, fontSize: 10, textTransform: "uppercase", letterSpacing: ".04em" }}>
            Datenquellen
          </div>
          PSI · OpenPageRank · WHOIS<br />
          Common Crawl · Claude AI
        </div>
        <div style={{ marginTop: 8, textAlign: "center", fontSize: 9, color: C.textMute }}>
          © 2026 ppi talk GmbH
        </div>
      </div>
    </aside>
  );
}
