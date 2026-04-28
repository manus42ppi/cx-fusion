import React, { useState } from "react";
import { SignIn } from "@clerk/clerk-react";
import { Globe, Shield, BarChart2, Search, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW, CSS } from "../constants/colors.js";
import { DEMO_USERS } from "../constants/demo.js";

// ── Clerk appearance ──────────────────────────────────────────────────────────
const clerkAppearance = {
  variables: {
    colorPrimary:         T.brand600,
    colorBackground:      T.white,
    colorText:            T.gray900,
    colorTextSecondary:   T.gray500,
    colorInputBackground: T.white,
    colorInputText:       T.gray900,
    colorDanger:          T.error600,
    borderRadius:         "8px",
    spacingUnit:          "14px",
    fontFamily:           FONT,
  },
  elements: {
    rootBox:              { width: "100%" },
    card: {
      background:   T.white,
      border:       `1px solid ${T.gray200}`,
      boxShadow:    T.shadowLg,
      borderRadius: "12px",
      width:        "100%",
    },
    headerTitle:          { color: T.gray900, fontSize: "20px", fontWeight: "700" },
    headerSubtitle:       { color: T.gray500 },
    socialButtonsBlockButton: {
      background: T.white,
      border:     `1px solid ${T.gray300}`,
      color:      T.gray700,
      boxShadow:  T.shadowXs,
    },
    socialButtonsBlockButtonText: { color: T.gray700, fontWeight: "600" },
    dividerText:          { color: T.gray400, fontSize: "12px", fontWeight: "600" },
    dividerLine:          { background: T.gray200 },
    formFieldLabel:       { color: T.gray600, fontSize: "12px", fontWeight: "600", letterSpacing: ".04em" },
    formFieldInput: {
      background: T.white,
      border:     `1px solid ${T.gray300}`,
      color:      T.gray900,
      fontSize:   "14px",
    },
    formButtonPrimary: {
      background: T.brand600,
      boxShadow:  `0 2px 8px rgba(7,93,242,0.20)`,
      fontWeight: "600",
      fontSize:   "14px",
    },
    footerActionLink:     { color: T.brand600 },
    footerActionText:     { color: T.gray500 },
    alertText:            { color: T.error600 },
    logoBox:              { display: "none" },
    logoImage:            { display: "none" },
  },
};

export default function Login({ onLogin }) {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: T.appBg, display: "flex", fontFamily: FONT }}>
      <style>{CSS}</style>

      {/* ── Left: Branding ───────────────────────────────────────────────────── */}
      <div style={{
        flex: "0 0 400px", background: T.brand600,
        display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "48px 40px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />

        {/* Logo */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <div style={{ width: 40, height: 40, borderRadius: T.rMd, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe size={20} color="#fff" strokeWidth={IW} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: FONT_DISPLAY, letterSpacing: "-.01em" }}>CX Fusion</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", fontWeight: 600, letterSpacing: ".06em" }}>WEB INTELLIGENCE</div>
            </div>
          </div>

          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 14px", lineHeight: 1.2, letterSpacing: "-.02em" }}>
            Deine Web-<br />Intelligence-<br />Plattform
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)", lineHeight: 1.6, margin: 0 }}>
            Analysiere Websites, prüfe SEO und gewinne KI-gestützte Insights – alles an einem Ort.
          </p>
        </div>

        {/* Feature highlights */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { I: Search,   label: "Website-Analyse & Tech-Stack" },
            { I: BarChart2, label: "Traffic & Performance-Daten" },
            { I: FileText, label: "Content-Audit & SEO-Analyse" },
          ].map(({ I, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: T.rSm, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <I size={16} color="#fff" strokeWidth={IW} />
              </div>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,.8)", fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)" }}>
          © 2026 ppi talk GmbH · Web Intelligence Platform
        </div>
      </div>

      {/* ── Right: Login ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 440, animation: "fadeUp .35s ease" }}>
          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: T.gray900, margin: "0 0 6px", letterSpacing: "-.01em" }}>
              Willkommen zurück
            </h2>
            <p style={{ fontSize: 14, color: T.gray500, margin: 0 }}>
              Melde dich an oder erstelle einen Account
            </p>
          </div>

          {/* Clerk SignIn (handles login + sign-up) */}
          <SignIn routing="virtual" appearance={clerkAppearance} />

          {/* Demo Credentials */}
          <div style={{ marginTop: 16, background: T.white, borderRadius: T.rLg, border: `1px solid ${T.gray200}`, boxShadow: T.shadowXs, overflow: "hidden" }}>
            <button
              onClick={() => setShowDemo(s => !s)}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 6, padding: "12px 16px", color: T.gray600,
                fontSize: 13, fontWeight: 600, fontFamily: FONT, transition: "background .1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.gray50}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={14} strokeWidth={IW} color={T.brand600} />
                Demo-Zugänge (ohne Account)
              </span>
              {showDemo ? <ChevronUp size={14} color={T.gray400} /> : <ChevronDown size={14} color={T.gray400} />}
            </button>

            {showDemo && (
              <div style={{ padding: "0 12px 12px", borderTop: `1px solid ${T.gray100}` }}>
                <div style={{ fontSize: 12, color: T.gray400, padding: "10px 4px 8px" }}>
                  Klicken zum Sofort-Login — kein Account nötig
                </div>
                {DEMO_USERS.map(u => (
                  <div
                    key={u.id}
                    onClick={() => onLogin(u)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "9px 12px", borderRadius: T.rMd, cursor: "pointer", marginBottom: 4,
                      background: T.gray50, border: `1px solid ${T.gray200}`, transition: "all .12s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.brand25; e.currentTarget.style.borderColor = T.brand300; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.gray50; e.currentTarget.style.borderColor = T.gray200; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: u.color + "20", border: `1px solid ${u.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: u.color, flexShrink: 0 }}>
                        {u.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.gray800 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: T.gray500 }}>{u.email}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: u.color + "15", color: u.color }}>
                      {u.role.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
