import React from "react";
import { Globe, Search, RefreshCw, ArrowRight } from "lucide-react";
import { C, T, FONT, IW } from "../../constants/colors.js";
import { Card, Btn } from "./index.jsx";

/**
 * Shared domain-input header for all single-domain analysis pages.
 * Props:
 *   icon        – Lucide icon component
 *   iconColor   – accent color for icon/button
 *   iconBg      – background for icon box
 *   title       – page title
 *   subtitle    – page subtitle
 *   value       – domain input value
 *   onChange    – (val: string) => void
 *   onAnalyze   – () => void — called on button click or Enter
 *   loading     – bool
 *   loadingText – string shown while loading (e.g. "KI analysiert… (12s)")
 *   error       – error string or null
 *   examples    – string[] of example chips
 *   btnLabel    – button label (default "Analysieren")
 *   placeholder – input placeholder (default "domain.de eingeben…")
 *   extra       – optional JSX rendered below input row
 */
export default function AnalysisHeader({
  icon: Icon,
  iconColor = C.accent,
  iconBg = C.accentLight,
  title,
  subtitle,
  value,
  onChange,
  onAnalyze,
  loading = false,
  loadingText = "Analysieren…",
  error = null,
  examples = [],
  btnLabel = "Analysieren",
  placeholder = "domain.de eingeben…",
  extra = null,
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: T.rMd, flexShrink: 0,
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {Icon && <Icon size={22} color={iconColor} strokeWidth={IW} />}
        </div>
        <div>
          <h1 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 13, color: C.textSoft, margin: 0, marginTop: 1 }}>{subtitle}</p>}
        </div>
      </div>

      {/* Search card */}
      <Card style={{ padding: 18 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Globe
              size={14} color={C.textSoft} strokeWidth={IW}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
            <input
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && onAnalyze()}
              placeholder={placeholder}
              autoFocus
              style={{
                width: "100%", padding: "10px 12px 10px 34px", borderRadius: T.rMd,
                border: `1px solid ${C.border}`, background: C.bg,
                fontFamily: FONT, fontSize: 14, color: C.text, outline: "none",
                boxSizing: "border-box", transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = iconColor}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <button
            onClick={onAnalyze}
            disabled={!value.trim() || loading}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "0 20px", borderRadius: T.rMd, border: "none",
              background: (!value.trim() || loading) ? C.border : iconColor,
              color: (!value.trim() || loading) ? C.textSoft : "#fff",
              cursor: (!value.trim() || loading) ? "not-allowed" : "pointer",
              fontFamily: FONT, fontSize: 14, fontWeight: 700,
              whiteSpace: "nowrap", transition: "all 0.15s", height: 42,
            }}
          >
            {loading
              ? <><RefreshCw size={14} strokeWidth={IW} style={{ animation: "spin 0.8s linear infinite" }} />{loadingText}</>
              : <><ArrowRight size={14} strokeWidth={IW} />{btnLabel}</>
            }
          </button>
        </div>

        {/* Example chips */}
        {examples.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: C.textMute }}>Beispiele:</span>
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => { onChange(ex); }}
                disabled={loading}
                style={{
                  padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.textMid, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: FONT, transition: "all 0.12s",
                }}
                onMouseEnter={e => { if (!loading) { e.target.style.borderColor = iconColor; e.target.style.color = iconColor; e.target.style.background = iconBg; }}}
                onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.textMid; e.target.style.background = C.surface; }}
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {extra}
      </Card>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 10, padding: "10px 14px", borderRadius: T.rMd,
          background: "#fef2f2", border: "1px solid #fecaca",
          color: "#dc2626", fontSize: 13,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
