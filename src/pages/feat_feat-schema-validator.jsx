import React, { useState } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn } from "../components/ui/index.jsx";
import AnalysisHeader from "../components/ui/AnalysisHeader.jsx";
import { CheckCircle, AlertTriangle, XCircle, Search, Code2, RefreshCw, Shield } from "lucide-react";

const AI_URL = "/ai";
const AI_FALLBACK = "https://socialflow-pro.pages.dev/ai";

async function aiCall(messages, maxTokens = 2500) {
  const body = JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, messages });
  for (const url of [AI_URL, AI_FALLBACK]) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(60000) });
      if (!r.ok) continue;
      const d = await r.json();
      const text = d?.content?.[0]?.text || "";
      if (text) return text;
    } catch {}
  }
  throw new Error("KI nicht erreichbar");
}

function ScoreRing({ score }) {
  const color = score >= 80 ? C.success : score >= 50 ? "#d97706" : "#dc2626";
  const r = 28, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={36} cy={36} r={r} fill="none" stroke={C.border} strokeWidth={6} />
      <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      <text x={36} y={40} textAnchor="middle" fontSize={14} fontWeight={800} fill={color}
        style={{ transform: "rotate(90deg)", transformOrigin: "36px 36px" }}>{score}</text>
    </svg>
  );
}

const ST = {
  valid:   { color: C.success, bg: C.success + "15", icon: CheckCircle,   label: "Gültig" },
  warning: { color: "#d97706", bg: "#fef3c7",         icon: AlertTriangle, label: "Warnung" },
  error:   { color: "#dc2626", bg: "#fee2e2",         icon: XCircle,       label: "Fehler" },
};

export default function FeatSchemaValidatorPage() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    const d = domain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!d) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const raw = await aiCall([{ role: "user", content: `Analysiere Schema.org Structured Data von "${d}". Antworte NUR mit JSON (kein Markdown):
{"domain":string,"overallScore":number,"summary":string,"pages":[{"url":string,"schemaTypes":string[],"status":"valid"|"warning"|"error","issues":[{"type":string,"message":string,"field":string}],"richSnippetPreview":string}],"recommendations":string[]}
Simuliere 4-5 typische Seiten (Homepage, Produkt, Blog, FAQ). Nutze realistische Schema-Typen und häufige Fehler.` }]);
      const json = raw.match(/\{[\s\S]*\}/s)?.[0];
      if (!json) throw new Error("Keine gültige Antwort");
      setResult(JSON.parse(json));
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px 60px" }}>
      <AnalysisHeader
        icon={Code2}
        iconColor={C.accent}
        iconBg={C.accentLight}
        title="Structured Data Validator"
        subtitle="Schema.org-Validierung · Rich-Snippet-Vorschau · Google-Empfehlungen"
        value={domain}
        onChange={v => { setDomain(v); setError(""); }}
        onAnalyze={analyze}
        loading={loading}
        loadingText="Validiere…"
        error={error}
        examples={["shopify.com", "wikipedia.org", "airbnb.com", "github.com"]}
        btnLabel="Validieren"
      />

      {result && <>
        <Card style={{ padding: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
          <ScoreRing score={result.overallScore ?? 0} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{result.domain}</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4 }}>{result.summary}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["valid","warning","error"].map(s => {
              const count = result.pages?.filter(p => p.status === s).length ?? 0;
              const Ico = ST[s].icon;
              return <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: T.rMd, background: ST[s].bg, fontSize: 11, fontWeight: 600, color: ST[s].color }}><Ico size={11} strokeWidth={IW} /> {count} {ST[s].label}</div>;
            })}
          </div>
        </Card>

        {result.pages?.map((page, i) => {
          const st = ST[page.status] || ST.warning;
          const Ico = st.icon;
          return (
            <Card key={i} style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Ico size={14} color={st.color} strokeWidth={IW} />
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.url}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {page.schemaTypes?.map(t => <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: C.accentLight, color: C.accent, border: `1px solid ${C.accent}30` }}>{t}</span>)}
                </div>
              </div>
              {page.richSnippetPreview && (
                <div style={{ padding: "8px 12px", borderRadius: T.rSm, background: "#f8f9fa", border: "1px solid #e2e8f0", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textMute, textTransform: "uppercase", marginBottom: 4 }}>Rich-Snippet-Vorschau</div>
                  <div style={{ fontSize: 11, color: "#1a73e8", fontWeight: 600 }}>{page.url}</div>
                  <div style={{ fontSize: 11, color: C.textSoft, marginTop: 2 }}>{page.richSnippetPreview}</div>
                </div>
              )}
              {page.issues?.map((issue, j) => (
                <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 10px", borderRadius: T.rSm, background: st.bg, fontSize: 11, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: st.color, flexShrink: 0 }}>{issue.type}</span>
                  <span style={{ color: C.textSoft }}>{issue.message}</span>
                  {issue.field && <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 10, color: C.textMute }}>{issue.field}</span>}
                </div>
              ))}
            </Card>
          );
        })}

        {result.recommendations?.length > 0 && (
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Shield size={13} color={C.accent} strokeWidth={IW} /> Empfehlungen
            </div>
            {result.recommendations.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: C.textSoft, marginBottom: 5 }}>
                <span style={{ color: C.accent, fontWeight: 700 }}>{i + 1}.</span> {r}
              </div>
            ))}
          </Card>
        )}
      </>}
    </div>
  );
}
