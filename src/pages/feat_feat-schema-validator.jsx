import React, { useState } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import AnalysisProgress from "../components/ui/AnalysisProgress.jsx";
import {
  CheckCircle, AlertTriangle, XCircle, Code2, Shield,
  ChevronDown, ChevronUp, Zap, Globe, Search,
} from "lucide-react";

const ENDPOINTS = ["/schema-validate", "https://socialflow-pro.pages.dev/schema-validate"];

async function callValidate(domain) {
  for (const url of ENDPOINTS) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
        signal: AbortSignal.timeout(65000),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    } catch (e) {
      if (url === ENDPOINTS[ENDPOINTS.length - 1]) throw e;
    }
  }
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const color = score >= 75 ? C.success : score >= 40 ? "#d97706" : "#dc2626";
  const label = score >= 75 ? "Gut" : score >= 40 ? "Ausbaufähig" : "Kritisch";
  const r = 32, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={80} height={80}>
        <circle cx={40} cy={40} r={r} fill="none" stroke={C.border} strokeWidth={7} />
        <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform="rotate(-90 40 40)" />
        <text x={40} y={44} textAnchor="middle" fontSize={15} fontWeight={800} fill={color}
          fontFamily={FONT}>{score}</text>
      </svg>
      <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</span>
    </div>
  );
}

// ── Status config ─────────────────────────────────────────────────────────────
const ST = {
  valid:   { color: C.success, bg: "#dcfce7", border: "#bbf7d0", icon: CheckCircle,   label: "Gültig" },
  warning: { color: "#d97706", bg: "#fef3c7", border: "#fde68a", icon: AlertTriangle, label: "Warnung" },
  error:   { color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", icon: XCircle,       label: "Fehler" },
};

const PRIORITY_COLOR = { high: "#dc2626", medium: "#d97706", low: C.textMute };

// ── Page Card ─────────────────────────────────────────────────────────────────
function PageCard({ page, rawSchemas }) {
  const [open, setOpen] = useState(false);
  const st = ST[page.status] || ST.warning;
  const Ico = st.icon;

  return (
    <Card style={{ padding: 0, overflow: "hidden", marginBottom: 10 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px", background: "none", border: "none",
          cursor: "pointer", fontFamily: FONT, textAlign: "left",
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: T.rSm, background: st.bg, border: `1px solid ${st.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Ico size={13} color={st.color} strokeWidth={IW} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.url}</div>
          <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
            {page.schemaTypes?.map(t => (
              <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 99, background: C.accentLight, color: C.accent, border: `1px solid ${C.accent}25` }}>{t}</span>
            ))}
            {(!page.schemaTypes || page.schemaTypes.length === 0) && (
              <span style={{ fontSize: 10, color: C.textMute, fontStyle: "italic" }}>Kein Schema gefunden</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
          {open ? <ChevronUp size={13} color={C.textMute} strokeWidth={IW} /> : <ChevronDown size={13} color={C.textMute} strokeWidth={IW} />}
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.border}` }}>
          {/* Rich snippet preview */}
          {page.richSnippetPreview && (
            <div style={{ margin: "12px 0 10px", padding: "10px 14px", borderRadius: T.rSm, background: "#f8faff", border: "1px solid #dbeafe" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>
                Rich-Snippet-Potenzial
              </div>
              <div style={{ fontSize: 12, color: "#1a73e8", fontWeight: 600, marginBottom: 2 }}>{page.url}</div>
              <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{page.richSnippetPreview}</div>
            </div>
          )}

          {/* Issues */}
          {page.issues?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {page.issues.map((issue, j) => (
                <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 10px", borderRadius: T.rSm, background: st.bg, border: `1px solid ${st.border}` }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: st.color, flexShrink: 0, marginTop: 1, textTransform: "uppercase" }}>{issue.type?.replace(/_/g, " ")}</span>
                  <span style={{ fontSize: 12, color: C.textMid, flex: 1, lineHeight: 1.5 }}>{issue.message}</span>
                  {issue.field && <code style={{ fontSize: 10, color: C.textMute, background: C.bg, padding: "2px 6px", borderRadius: 4, flexShrink: 0, fontFamily: "monospace" }}>{issue.field}</code>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.success, padding: "8px 0" }}>✓ Keine Probleme gefunden</div>
          )}

          {/* Real extracted JSON-LD (from backend extraction, not AI response) */}
          {rawSchemas?.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: 11, color: C.textMute, cursor: "pointer", userSelect: "none" }}>
                Gefundene JSON-LD Blöcke ({rawSchemas.length}) anzeigen
              </summary>
              {rawSchemas.map((s, k) => (
                <div key={k} style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.parseError ? "#dc2626" : C.accent, marginBottom: 3 }}>
                    Block {k + 1}: {s.type} {s.parseError ? "⚠ Syntaxfehler" : ""}
                  </div>
                  <pre style={{ padding: "8px 12px", borderRadius: T.rSm, background: "#0f172a", color: "#e2e8f0", fontSize: 10.5, lineHeight: 1.6, overflow: "auto", maxHeight: 260, fontFamily: "monospace", margin: 0 }}>
                    {s.raw ? JSON.stringify(s.raw, null, 2) : "(Syntaxfehler – kein gültiges JSON)"}
                  </pre>
                </div>
              ))}
            </details>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const LOADING_STEPS = [
  "Homepage abrufen…",
  "JSON-LD extrahieren…",
  "Unterseiten scannen…",
  "Schema.org validieren…",
  "Rich-Snippet-Potenzial prüfen…",
];

const EXAMPLES = ["shopify.com", "wikipedia.org", "airbnb.com", "github.com"];

export default function FeatSchemaValidatorPage() {
  const [domain, setDomain]   = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function analyze() {
    const d = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\/$/, "");
    if (!d) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await callValidate(d);
      setResult(data);
    } catch (e) {
      setError(e.message || "Analyse fehlgeschlagen");
    }
    setLoading(false);
  }

  const valid   = result?.pages?.filter(p => p.status === "valid").length  ?? 0;
  const warn    = result?.pages?.filter(p => p.status === "warning").length ?? 0;
  const errors  = result?.pages?.filter(p => p.status === "error").length  ?? 0;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px 60px", fontFamily: FONT }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: T.rMd, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Code2 size={22} color={C.accent} strokeWidth={IW} />
        </div>
        <div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Structured Data Validator</h1>
          <p style={{ fontSize: 13, color: C.textSoft, margin: 0 }}>Schema.org-Validierung · Rich-Snippet-Vorschau · Google-Empfehlungen</p>
        </div>
      </div>

      {/* Input Card */}
      <Card style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: T.rMd, border: `1px solid ${C.border}`, background: C.bg }}>
            <Globe size={15} color={C.textMute} strokeWidth={IW} />
            <input
              value={domain}
              onChange={e => { setDomain(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && !loading && analyze()}
              placeholder="domain.com"
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: C.text, fontFamily: FONT }}
              disabled={loading}
            />
          </div>
          <Btn onClick={analyze} loading={loading} icon={Search} disabled={!domain.trim() || loading}>
            Validieren
          </Btn>
        </div>

        {/* Example chips */}
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.textMute }}>Beispiele:</span>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => { setDomain(ex); setError(""); }}
              style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: C.surface, border: `1px solid ${C.border}`, color: C.textMid, cursor: "pointer", fontFamily: FONT }}>
              {ex}
            </button>
          ))}
        </div>
      </Card>

      {/* Progress */}
      <AnalysisProgress loading={loading} steps={LOADING_STEPS} accent={C.accent} label="Analysiere Structured Data" />

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: T.rMd, background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: 13, marginBottom: 16 }}>
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          {/* Score + Summary */}
          <Card style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <ScoreRing score={result.overallScore ?? 0} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>{result.domain}</div>
                <div style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.6, marginBottom: 12 }}>{result.summary}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: T.rMd, background: ST.valid.bg, border: `1px solid ${ST.valid.border}`, fontSize: 11, fontWeight: 600, color: ST.valid.color }}>
                    <CheckCircle size={11} strokeWidth={IW} /> {valid} Gültig
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: T.rMd, background: ST.warning.bg, border: `1px solid ${ST.warning.border}`, fontSize: 11, fontWeight: 600, color: ST.warning.color }}>
                    <AlertTriangle size={11} strokeWidth={IW} /> {warn} Warnung{warn !== 1 ? "en" : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: T.rMd, background: ST.error.bg, border: `1px solid ${ST.error.border}`, fontSize: 11, fontWeight: 600, color: ST.error.color }}>
                    <XCircle size={11} strokeWidth={IW} /> {errors} Fehler
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 11, color: C.textMute }}>
                    {result.pagesAnalyzed ?? result.pages?.length ?? 0} Seiten · {result.totalSchemasFound ?? 0} Schemas
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Pages */}
          {result.pages?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMute, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Analysierte Seiten</div>
              {result.pages.map((page, i) => {
                // Match real extracted schemas by URL
                const rawPage = result._pages_raw?.find(p => p.url === page.url) || result._pages_raw?.[i];
                return <PageCard key={i} page={page} rawSchemas={rawPage?.schemas} />;
              })}
            </div>
          )}

          {/* Missing opportunities */}
          {result.missingOpportunities?.length > 0 && (
            <Card style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={13} color="#d97706" strokeWidth={IW} /> Ungenutzte Schema-Potenziale
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.missingOpportunities.map((opp, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", borderRadius: T.rSm, background: C.bg, border: `1px solid ${C.border}` }}>
                    <code style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accentLight, padding: "2px 7px", borderRadius: 4, flexShrink: 0 }}>{opp.type}</code>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>{opp.reason}</div>
                    </div>
                    {opp.priority && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: PRIORITY_COLOR[opp.priority] || C.textMute, flexShrink: 0 }}>
                        {opp.priority === "high" ? "Hoch" : opp.priority === "medium" ? "Mittel" : "Niedrig"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={13} color={C.accent} strokeWidth={IW} /> Empfehlungen
              </div>
              {result.recommendations.map((rec, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, color: C.textSoft, marginBottom: 8, lineHeight: 1.55 }}>
                  <span style={{ color: C.accent, fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
