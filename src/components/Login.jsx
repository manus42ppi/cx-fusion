import React, { useState } from "react";
import { Globe, Shield, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW, CSS } from "../constants/colors.js";
import { DEMO_USERS } from "../constants/demo.js";

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [showDemo, setShowDemo] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const user = DEMO_USERS.find(u => u.email === email.trim().toLowerCase() && u.password === password);
    if (user) { onLogin(user); }
    else { setError("E-Mail oder Passwort ungültig."); }
  }

  function loginAs(user) {
    onLogin(user);
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT, padding: 24,
    }}>
      <style>{CSS}</style>

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <img src="/ppitalk-logo-color.png" alt="ppi talk" style={{ height: 40, marginBottom: 12 }} />
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: C.accentLight, borderRadius: 99, padding: "4px 14px",
            border: `1px solid ${C.accent}30`,
          }}>
            <Globe size={12} color={C.accent} strokeWidth={IW} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: ".04em" }}>CX FUSION · WEB INTELLIGENCE</span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: C.surface, borderRadius: T.rLg,
          border: `1px solid ${C.border}`,
          boxShadow: "0 8px 32px rgba(0,0,0,.08)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "28px 32px 24px" }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>
              Willkommen zurück
            </h1>
            <p style={{ fontSize: 13, color: C.textSoft, margin: "0 0 24px" }}>
              Melde dich an, um fortzufahren.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, letterSpacing: ".04em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  E-Mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="deine@email.com"
                  autoFocus
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: T.rMd,
                    border: `1px solid ${C.border}`, background: C.bg,
                    fontFamily: FONT, fontSize: 14, color: C.text,
                    outline: "none", boxSizing: "border-box", transition: "border-color .15s",
                  }}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, letterSpacing: ".04em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Passwort
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    style={{
                      width: "100%", padding: "10px 38px 10px 12px", borderRadius: T.rMd,
                      border: `1px solid ${C.border}`, background: C.bg,
                      fontFamily: FONT, fontSize: 14, color: C.text,
                      outline: "none", boxSizing: "border-box", transition: "border-color .15s",
                    }}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", padding: 4,
                    }}
                  >
                    {showPw
                      ? <EyeOff size={15} color={C.textSoft} strokeWidth={IW} />
                      : <Eye size={15} color={C.textSoft} strokeWidth={IW} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  marginBottom: 14, padding: "9px 12px", borderRadius: T.rMd,
                  background: "#fef2f2", border: "1px solid #fecaca",
                  fontSize: 13, color: "#dc2626",
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: "100%", padding: "11px 0", borderRadius: T.rMd,
                  background: C.accent, color: "#fff",
                  border: "none", cursor: "pointer", fontFamily: FONT,
                  fontSize: 14, fontWeight: 700, transition: "opacity .15s",
                }}
                onMouseEnter={e => e.target.style.opacity = ".88"}
                onMouseLeave={e => e.target.style.opacity = "1"}
              >
                Anmelden
              </button>
            </form>
          </div>

          {/* Demo accounts */}
          <div style={{ borderTop: `1px solid ${C.border}`, background: C.bg }}>
            <button
              onClick={() => setShowDemo(v => !v)}
              style={{
                width: "100%", padding: "12px 32px",
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: FONT, fontSize: 12, color: C.textSoft,
              }}
            >
              <Shield size={13} strokeWidth={IW} color={C.accent} />
              <span style={{ fontWeight: 600 }}>DEMO-ZUGÄNGE</span>
              <span style={{ marginLeft: "auto", color: C.textMute }}>
                {showDemo ? <ChevronUp size={13} strokeWidth={IW} /> : <ChevronDown size={13} strokeWidth={IW} />}
              </span>
            </button>
            {showDemo && (
              <div style={{ padding: "0 32px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                {DEMO_USERS.map(u => (
                  <button
                    key={u.id}
                    onClick={() => loginAs(u)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: T.rMd,
                      background: C.surface, border: `1px solid ${C.border}`,
                      cursor: "pointer", fontFamily: FONT, textAlign: "left",
                      transition: "all .15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentLight; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: u.color + "20", border: `1px solid ${u.color}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: u.color,
                    }}>
                      {u.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: C.textMute }}>{u.email}</div>
                    </div>
                    <div style={{
                      marginLeft: "auto", fontSize: 10, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 99,
                      background: u.color + "15", color: u.color,
                    }}>
                      {u.role.toUpperCase()}
                    </div>
                  </button>
                ))}
                <div style={{ fontSize: 11, color: C.textMute, textAlign: "center", marginTop: 4 }}>
                  Passwort: <code style={{ fontFamily: "monospace" }}>demo2026</code>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: C.textMute }}>
          © 2026 ppi talk GmbH · Web Intelligence Platform
        </div>
      </div>
    </div>
  );
}
