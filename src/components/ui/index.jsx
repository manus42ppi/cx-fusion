import React from "react";
import { C, T, FONT, IW } from "../../constants/colors.js";

export function Sp({ h = 0, w = 0 }) {
  return <div style={{ height: h || undefined, width: w || undefined, flexShrink: 0 }} />;
}

export function Card({ children, style, onClick, hover }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: T.rLg,
        boxShadow: hov && hover ? T.shadowLg : T.shadowXs,
        transition: "box-shadow 0.18s, transform 0.18s",
        transform: hov && hover ? "translateY(-1px)" : "none",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "md", style, disabled, icon: Icon }) {
  const [hov, setHov] = React.useState(false);
  const pad = size === "sm" ? "6px 12px" : size === "lg" ? "11px 22px" : "9px 16px";
  const fs  = size === "sm" ? 13 : size === "lg" ? 15 : 14;
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT,
    fontWeight: 600, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s", borderRadius: T.rMd, opacity: disabled ? 0.5 : 1,
    fontSize: fs, padding: pad, whiteSpace: "nowrap",
  };
  const variants = {
    primary: {
      background: hov ? C.accentHov : C.accent,
      color: "#fff",
      boxShadow: hov ? T.shadowSm : T.shadowXs,
    },
    ghost: {
      background: hov ? C.accentLight : "transparent",
      color: C.accent,
      border: `1px solid ${C.border}`,
    },
    danger: {
      background: hov ? "#b91c1c" : C.red,
      color: "#fff",
    },
    surface: {
      background: hov ? C.surfaceHigh : C.surface,
      color: C.textMid,
      border: `1px solid ${C.border}`,
      boxShadow: T.shadowXs,
    },
  };
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {Icon && <Icon size={size === "sm" ? 13 : 15} strokeWidth={IW} />}
      {children}
    </button>
  );
}

export function Badge({ children, color, bg, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600, padding: "3px 8px",
      borderRadius: 99, color: color || C.accent,
      background: bg || C.accentLight, fontFamily: FONT,
      ...style,
    }}>
      {children}
    </span>
  );
}

export function TIn({ value, onChange, placeholder, style, onKeyDown, prefix }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", ...style }}>
      {prefix && (
        <span style={{
          position: "absolute", left: 12, color: C.textSoft,
          fontSize: 14, pointerEvents: "none", userSelect: "none",
          display: "flex", alignItems: "center",
        }}>
          {prefix}
        </span>
      )}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: C.surface,
          border: `1px solid ${focused ? C.accent : C.border}`,
          borderRadius: T.rMd,
          color: C.text,
          fontFamily: FONT,
          fontSize: 14,
          padding: prefix ? "10px 14px 10px 38px" : "10px 14px",
          outline: "none",
          transition: "border-color 0.15s",
          boxShadow: focused ? `0 0 0 3px ${C.accentGlow}` : T.shadowXs,
        }}
      />
    </div>
  );
}

export function ScoreRing({ score, size = 64, label }) {
  const r     = (size - 8) / 2;
  const circ  = 2 * Math.PI * r;
  const valid = score != null && !isNaN(score);
  const dash  = valid ? ((score / 100) * circ) : 0;
  const color = !valid ? C.border : score >= 80 ? C.success : score >= 55 ? C.warning : C.red;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={4} />
        {valid && (
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={4} strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        )}
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
          fill={valid ? color : C.textSoft} fontSize={size * 0.22} fontWeight={700} fontFamily={FONT}>
          {valid ? score : "–"}
        </text>
      </svg>
      {label && <span style={{ fontSize: 11, color: C.textSoft, fontFamily: FONT, fontWeight: 500 }}>{label}</span>}
    </div>
  );
}

export function Divider({ style }) {
  return <div style={{ height: 1, background: C.border, ...style }} />;
}

export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${C.border}`,
      borderTop: `2px solid ${C.accent}`,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

export function MetricCard({ label, value, sub, icon: Icon, color, style }) {
  const col = color || C.accent;
  return (
    <Card style={{ padding: "18px 20px", ...style }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: C.textSoft, fontWeight: 500, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{
            width: 38, height: 38, borderRadius: T.rMd, flexShrink: 0,
            background: col + "18",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={17} color={col} strokeWidth={IW} />
          </div>
        )}
      </div>
    </Card>
  );
}

export function SectionTitle({ children, sub, action, style }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, ...style }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{children}</div>
        {sub && <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}
