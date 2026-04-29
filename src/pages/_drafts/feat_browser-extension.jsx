import { useState, useEffect, useRef } from "react";
import {
  Chrome,
  Firefox,
  Puzzle,
  Zap,
  BarChart2,
  Globe,
  Shield,
  Download,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Star,
  Users,
  TrendingUp,
  Code,
  Calendar,
  Target,
  Copy,
  Eye,
  BookmarkPlus,
  GitCompare,
  Layers,
  Key,
  Link,
  ChevronRight,
  AlertCircle,
  Loader,
  Check,
  ExternalLink,
  Award,
  Activity,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";

const AI_URL = "/ai";
const AI_FALLBACK = "https://socialflow-pro.pages.dev/ai";

async function callAI(prompt) {
  const body = { messages: [{ role: "user", content: prompt }] };
  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("primary");
    const d = await res.json();
    return d.choices?.[0]?.message?.content || d.content || "";
  } catch {
    try {
      const res = await fetch(AI_FALLBACK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      return d.choices?.[0]?.message?.content || d.content || "";
    } catch (e) {
      console.error("AI call failed:", e);
      throw e;
    }
  }
}

// ─── SEO Score Ring ────────────────────────────────────────────────────────────
function SEOScoreRing({ score = 0, size = 80 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 70 ? C.success : score >= 40 ? C.warning : C.danger || "#ef4444";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={T.border}
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: size * 0.22,
            fontWeight: 700,
            color: T.primary,
          }}
        >
          {score}
        </span>
        <span style={{ fontSize: size * 0.13, color: T.muted }}>SEO</span>
      </div>
    </div>
  );
}

// ─── Extension Popup Card Preview ─────────────────────────────────────────────
function ExtensionPopupCard({ data, loading, domain }) {
  if (loading) {
    return (
      <div
        style={{
          background: T.surface,
          borderRadius: 16,
          border: `1px solid ${T.border}`,
          width: 320,
          padding: 20,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: C.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={16} color="#fff" strokeWidth={IW} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: T.primary, fontSize: 13 }}>
              cx-fusion
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>
              Analysiere {domain || "…"}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "20px 0",
            color: T.muted,
            fontSize: 13,
          }}
        >
          <Loader
            size={16}
            color={C.accent}
            strokeWidth={IW}
            style={{ animation: "spin 1s linear infinite" }}
          />
          Analysiere Seite…
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      style={{
        background: T.surface,
        borderRadius: 16,
        border: `1px solid ${T.border}`,
        width: 320,
        padding: 20,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${C.accent}, ${C.accent2 || C.accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={14} color="#fff" strokeWidth={IW} />
          </div>
          <span style={{ fontWeight: 700, color: T.primary, fontSize: 13 }}>
            cx-fusion
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: T.muted,
            background: T.bg,
            borderRadius: 6,
            padding: "2px 8px",
            border: `1px solid ${T.border}`,
          }}
        >
          {data.domain}
        </div>
      </div>

      {/* Score Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
          padding: 12,
          background: T.bg,
          borderRadius: 12,
        }}
      >
        <SEOScoreRing score={data.seoScore} size={72} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <TrendingUp size={12} color={C.success} strokeWidth={IW} />
            <span style={{ fontSize: 11, color: T.muted }}>
              Traffic/Monat
            </span>
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 18,
              fontWeight: 700,
              color: T.primary,
            }}
          >
            {data.traffic}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
            }}
          >
            <Calendar size={12} color={T.muted} strokeWidth={IW} />
            <span style={{ fontSize: 11, color: T.muted }}>
              Domain seit {data.domainAge}
            </span>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            color: T.muted,
            marginBottom: 6,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Code size={11} color={T.muted} strokeWidth={IW} />
          Tech-Stack
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {(data.techStack || []).map((t, i) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 20,
                background: `${C.accent}20`,
                color: C.accent,
                border: `1px solid ${C.accent}40`,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* CTA Row */}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: 8,
            background: C.accent,
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <ExternalLink size={12} color="#fff" strokeWidth={IW} />
          Vollanalyse
        </button>
        <button
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            background: T.bg,
            color: T.muted,
            fontSize: 12,
            border: `1px solid ${T.border}`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <BookmarkPlus size={12} strokeWidth={IW} />
        </button>
        <button
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            background: T.bg,
            color: T.muted,
            fontSize: 12,
            border: `1px solid ${T.border}`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <GitCompare size={12} strokeWidth={IW} />
        </button>
      </div>
    </div>
  );
}

// ─── API Key Connector ─────────────────────────────────────────────────────────
function APIKeyConnector({ onConnect }) {
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState("account"); // account | apikey
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setConnected(true);
    onConnect?.();
  };

  if (connected) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: `${C.success}15`,
          borderRadius: 12,
          border: `1px solid ${C.success}40`,
        }}
      >
        <CheckCircle size={18} color={C.success} strokeWidth={IW} />
        <span style={{ color: C.success, fontWeight: 600, fontSize: 14 }}>
          Erfolgreich verbunden
        </span>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          background: T.bg,
          borderRadius: 10,
          padding: 4,
        }}
      >
        {["account", "apikey"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: mode === m ? T.surface : "transparent",
              color: mode === m ? T.primary : T.muted,
              boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s",
            }}
          >
            {m === "account" ? "cx-fusion Account" : "API-Key"}
          </button>
        ))}
      </div>

      {mode === "account" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder="E-Mail-Adresse"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: T.bg,
              color: T.primary,
              fontSize: 14,
              fontFamily: FONT,
              outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="Passwort"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: T.bg,
              color: T.primary,
              fontSize: 14,
              fontFamily: FONT,
              outline: "none",
            }}
          />
          <Btn onClick={handleConnect} disabled={loading}>
            {loading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  justifyContent: "center",
                }}
              >
                <Loader size={14} strokeWidth={IW} />
                Verbinden…
              </span>
            ) : (
              "Mit Account verbinden"
            )}
          </Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <Key
              size={16}
              color={T.muted}
              strokeWidth={IW}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="cxf_xxxxxxxxxxxxxxxx"
              style={{
                width: "100%",
                padding: "10px 14px 10px 36px",
                borderRadius: 10,
                border: `1px solid ${T.border}`,
                background: T.bg,
                color: T.primary,
                fontSize: 14,
                fontFamily: FONT,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <Btn onClick={handleConnect} disabled={loading || !apiKey}>
            {loading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  justifyContent: "center",
                }}
              >
                <Loader size={14} strokeWidth={IW} />
                Validiere…
              </span>
            ) : (
              "API-Key aktivieren"
            )}
          </Btn>
          <div style={{ fontSize: 12, color: T.muted, textAlign: "center" }}>
            API-Key findest du unter{" "}
            <span style={{ color: C.accent, cursor: "pointer" }}>
              Einstellungen → Entwickler
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quick Compare Toggle ──────────────────────────────────────────────────────
function QuickCompareToggle({ currentDomain, savedDomains }) {
  const [enabled, setEnabled] = useState(false);
  const [selected, setSelected] = useState(savedDomains?.[0] || "");

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GitCompare size={16} color={C.accent} strokeWidth={IW} />
          <span style={{ fontWeight: 600, color: T.primary, fontSize: 14 }}>
            Quick-Compare
          </span>
        </div>
        <div
          onClick={() => setEnabled(!enabled)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: enabled ? C.accent : T.border,
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 3,
              left: enabled ? 23 : 3,
              width: 18,
              height: 18,
              borderRadius: 9,
              background: "#fff",
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>

      {enabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                background: `${C.accent}15`,
                borderRadius: 8,
                border: `1px solid ${C.accent}40`,
                fontSize: 12,
                fontWeight: 600,
                color: C.accent,
                textAlign: "center",
              }}
            >
              {currentDomain || "aktuelle Domain"}
            </div>
            <span style={{ color: T.muted, fontSize: 12, fontWeight: 600 }}>
              VS
            </span>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: T.bg,
                color: T.primary,
                fontSize: 12,
                fontFamily: FONT,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {(savedDomains || []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <Btn>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "center",
              }}
            >
              <GitCompare size={14} strokeWidth={IW} />
              Vergleich starten
            </span>
          </Btn>
        </div>
      )}
    </div>
  );
}

// ─── Auto Save to Customers ────────────────────────────────────────────────────
function AutoSaveToCustomers({ domain, onSaved }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoSave, setAutoSave] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSaved(true);
    onSaved?.();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: T.bg,
          borderRadius: 10,
          border: `1px solid ${T.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={14} color={T.muted} strokeWidth={IW} />
          <span style={{ fontSize: 13, color: T.secondary }}>
            Auto-Speichern
          </span>
        </div>
        <div
          onClick={() => setAutoSave(!autoSave)}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: autoSave ? C.accent : T.border,
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              left: autoSave ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: 8,
              background: "#fff",
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>

      {saved ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: `${C.success}15`,
            borderRadius: 10,
            border: `1px solid ${C.success}40`,
          }}
        >
          <CheckCircle size={16} color={C.success} strokeWidth={IW} />
          <span style={{ color: C.success, fontWeight: 600, fontSize: 13 }}>
            {domain} gespeichert
          </span>
        </div>
      ) : (
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 10,
            border: `1px dashed ${C.accent}60`,
            background: `${C.accent}08`,
            color: C.accent,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: FONT,
          }}
        >
          {loading ? (
            <Loader size={14} strokeWidth={IW} />
          ) : (
            <BookmarkPlus size={14} strokeWidth={IW} />
          )}
          {loading ? "Speichere…" : "Zur Kundenverwaltung hinzufügen"}
        </button>
      )}
    </div>
  );
}

// ─── Extension Badge Preview ───────────────────────────────────────────────────
function ExtensionBadge({ score }) {
  const color =
    score >= 70 ? C.success : score >= 40 ? C.warning : C.danger || "#ef4444";
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${C.accent}, ${C.accent2 || "#7c3aed"})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <Zap size={20} color="#fff" strokeWidth={IW} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          background: color,
          color: "#fff",
          fontSize: 10,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 4px",
          border: "2px solid white",
          fontFamily: FONT_DISPLAY,
        }}
      >
        {score}
      </div>
    </div>
  );
}

// ─── Installation Wizard ───────────────────────────────────────────────────────
function InstallationWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [connected, setConnected] = useState(false);
  const steps = [
    {
      icon: Download,
      title: "Extension installieren",
      desc: "Füge cx-fusion deinem Browser hinzu",
    },
    {
      icon: Key,
      title: "Account verbinden",
      desc: "Logge dich ein oder nutze API-Key",
    },
    {
      icon: Zap,
      title: "Erste Analyse",
      desc: "Öffne eine beliebige Website",
    },
  ];

  return (
    <div>
      {/* Steps */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 24,
          position: "relative",
        }}
      >
        {steps.map((s, i) => (
          <div
            key={i}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background:
                  i < step
                    ? C.success
                    : i === step
                    ? C.accent
                    : T.border,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
                transition: "all 0.3s",
              }}
            >
              {i < step ? (
                <Check size={16} color="#fff" strokeWidth={IW} />
              ) : (
                <s.icon
                  size={16}
                  color={i === step ? "#fff" : T.muted}
                  strokeWidth={IW}
                />
              )}
            </div>
            <div
              style={{
                fontSize: 11,
                color: i <= step ? T.primary : T.muted,
                marginTop: 6,
                textAlign: "center",
                fontWeight: i === step ? 700 : 400,
              }}
            >
              {s.title}
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  top: 18,
                  left: `${(100 / steps.length) * (i + 0.5)}%`,
                  width: `${100 / steps.length}%`,
                  height: 2,
                  background: i < step ? C.success : T.border,
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div
        style={{
          padding: 20,
          background: T.bg,
          borderRadius: 14,
          marginBottom: 16,
          minHeight: 120,
        }}
      >
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p
              style={{ color: T.secondary, fontSize: 14, margin: 0, lineHeight: 1.6 }}
            >
              Installiere die cx-fusion Extension in wenigen Sekunden direkt aus
              dem offiziellen Browser-Store.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  background: "#1a73e8",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Chrome size={14} strokeWidth={IW} />
                Chrome Store
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  background: "#ff6611",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Globe size={14} strokeWidth={IW} />
                Firefox Add-ons
              </button>
            </div>
          </div>
        )}
        {step === 1 && (
          <APIKeyConnector onConnect={() => setConnected(true)} />
        )}
        {step === 2 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "8px 0",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: `${C.success}20`,
                display: "flex",
                alignItems: "