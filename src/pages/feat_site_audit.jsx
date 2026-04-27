import React, { useState } from "react";
import {
  Globe, Search, RefreshCw, CheckCircle, AlertTriangle,
  AlertCircle, Info, ChevronDown, ChevronUp, FileText, Image,
  Link, Shield, Zap, BarChart2,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { cleanDomain } from "../utils/api.js";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function fetchPages(domain) {
  const endpoints = ["/content", "https://socialflow-pro.pages.dev/content"];
  for (const url of endpoints) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) continue;
      const data = await r.json();
      if (data?.pages?.length) return data.pages;
    } catch {}
  }
  return [];
}

async function aiAudit(domain, pages) {
  const pageTexts = pages.map(p =>
    `URL: ${p.url}\nTitel: ${p.title}\nBeschreibung: ${p.desc || "(fehlt)"}\nInhalt-Vorschau: ${p.text.slice(0, 800)}`
  ).join("\n\n---\n\n");

  const payload = {
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `Du bist ein SEO- und On-Page-Audit-Experte. Analysiere die gegebenen Seiten-Daten und identifiziere konkrete Probleme.
Antworte NUR mit validem JSON ohne Markdown.
Schema:
{
  "score": number,
  "summary": string,
  "checks": [
    {
      "category": "Meta" | "Inhalt" | "Performance" | "Struktur" | "Links" | "Bilder",
      "title": string,
      "status": "ok" | "warning" | "error",
      "description": string,
      "affectedUrls": string[],
      "fix": string
    }
  ],
  "topIssues": string[],
  "strengths": string[]
}`,
    messages: [{
      role: "user",
      content: `Führe einen vollständigen On-Page SEO-Audit für die Domain ${domain} durch.\n\nGescannte Seiten (${pages.length}):\n\n${pageTexts}\n\nPrüfe: Title-Tags, Meta-Descriptions, H1-Struktur, Keyword-Dichte, interne Verlinkung, Bildalt-Texte, URL-Struktur, Ladegeschwindigkeit-Hinweise, Duplicate Content, Content-Qualität.`,
    }],
  };

  const endpoints = ["/ai", "https://socialflow-pro.pages.dev/ai"];
  for (const url of endpoints) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(90000),
      });
      if (!r.ok) continue;
      const data = await r.json();
      if (data?.error) throw new Error(data.error.message);
      const text = data?.content?.[0]?.text || "{}";
      const m = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/s);
      return JSON.parse(m ? m[1] : text);
    } catch {}
  }
  throw new Error("KI-Audit fehlgeschlagen");
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const STATUS_META = {
  ok:      { color: "#16a34a", bg: "#dcfce7", icon: CheckCircle,    label: "OK" },
  warning: { color: "#d97706", bg: "#fef3c7", icon: AlertTriangle,  label: "Warnung" },
  error:   { color: "#dc2626", bg: "#fee2e2", icon: AlertCircle,    label: "Fehler" },
};

const CATEGORY_ICON = {
  Meta: FileText, Inhalt: BarChart2, Performance: Zap,
  Struktur: Globe, Links: Link, Bilder: Image, Sicherheit: Shield,
};

function ScoreRing({ score }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  const label = score >= 80 ? "Gut" : score >= 60 ? "Verbesserbar" : "Kritisch";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 96, height: 96, borderRadius: "50%",
        border: `6px solid ${color}`,
        background: color + "12",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 30, fontWeight: 900, color, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 9, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".05em" }}>/ 100</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
    </div>
  );
}

function CheckCard({ check, idx }) {
  const [open, setOpen] = useState(idx < 2);
  const sm = STATUS_META[check.status] || STATUS_META.warning;
  const Ico = sm.icon;
  const CatIco = CATEGORY_ICON[check.category] || FileText;
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "12px 4px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left", fontFamily: FONT,
        }}
      >
        <Ico size={15} color={sm.color} strokeWidth={IW} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, color: sm.color, background: sm.bg, flexShrink: 0 }}>
          {check.category}
        </span>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{check.title}</div>
        {open ? <ChevronUp size={13} color={C.textSoft} strokeWidth={IW} /> : <ChevronDown size={13} color={C.textSoft} strokeWidth={IW} />}
      </button>
      {open && (
        <div style={{ padding: "0 4px 14px 25px" }}>
          <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.6, marginBottom: 8 }}>{check.description}</div>
          {check.affectedUrls?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {check.affectedUrls.slice(0, 3).map(u => (
                <div key={u} style={{ fontSize: 11, color: C.textMute, fontFamily: "monospace", padding: "2px 0" }}>→ {u}</div>
              ))}
            </div>
          )}
          {check.fix && (
            <div style={{ padding: "8px 12px", borderRadius: T.rSm, background: "#dcfce7", fontSize: 12, color: "#14532d" }}>
              <strong>Fix:</strong> {check.fix}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SiteAudit() {
  const [domain, setDomain]   = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase]     = useState("");
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");

  const EXAMPLES = ["spiegel.de", "heise.de", "zalando.de", "ppimedia.de"];

  async function runAudit(raw) {
    const d = cleanDomain(raw || domain);
    if (!d) return;
    setLoading(true); setError(""); setResult(null);
    try {
      setPhase("Seiten scannen…");
      const pages = await fetchPages(d);
      if (pages.length === 0) throw new Error("Seiten konnten nicht abgerufen werden. Läuft local-server.js?");

      setPhase(`${pages.length} Seiten analysieren…`);
      const audit = await aiAudit(d, pages);

      setResult({ domain: d, pagesScanned: pages.length, ...audit });
    } catch (e) {
      setError(e.message || "Audit fehlgeschlagen");
    } finally {
      setLoading(false); setPhase("");
    }
  }

  const r = result;
  const errors   = r?.checks?.filter(c => c.status === "error")   || [];
  const warnings = r?.checks?.filter(c => c.status === "warning") || [];
  const oks      = r?.checks?.filter(c => c.status === "ok")      || [];

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px 60px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: T.rMd, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={22} color="#7c3aed" strokeWidth={IW} />
        </div>
        <div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Site-Audit</h1>
          <p style={{ fontSize: 13, color: C.textSoft, margin: 0 }}>On-Page SEO · Meta-Tags · Struktur · Content-Qualität</p>
        </div>
      </div>

      {/* Input */}
      <Card style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Globe size={14} color={C.textSoft} strokeWidth={IW} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && runAudit()}
              placeholder="domain.de eingeben…"
              style={{
                width: "100%", padding: "10px 12px 10px 34px", borderRadius: T.rMd,
                border: `1px solid ${C.border}`, background: C.bg,
                fontFamily: FONT, fontSize: 14, color: C.text, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <Btn onClick={() => runAudit()} loading={loading} icon={loading ? RefreshCw : Search}>
            {loading ? phase : "Audit starten"}
          </Btn>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => { setDomain(ex); runAudit(ex); }} style={{
              padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
              border: `1px solid ${C.border}`, background: C.surface,
              color: C.textMid, cursor: "pointer", fontFamily: FONT,
            }}>{ex}</button>
          ))}
        </div>
        {error && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: T.rMd, background: "#fee2e2", color: "#7f1d1d", fontSize: 13 }}>
            <AlertCircle size={13} strokeWidth={IW} style={{ marginRight: 6 }} />{error}
          </div>
        )}
      </Card>

      {/* Results */}
      {r && (
        <>
          {/* Score + summary */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, marginBottom: 20 }}>
            <Card style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ScoreRing score={r.score || 0} />
            </Card>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
                Zusammenfassung — {r.domain} · {r.pagesScanned} Seiten gescannt
              </div>
              <div style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.7, marginBottom: 14 }}>{r.summary}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {errors.length > 0   && <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "4px 12px", borderRadius: 99 }}>{errors.length} Fehler</span>}
                {warnings.length > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "4px 12px", borderRadius: 99 }}>{warnings.length} Warnungen</span>}
                {oks.length > 0      && <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "4px 12px", borderRadius: 99 }}>{oks.length} OK</span>}
              </div>
            </Card>
          </div>

          {/* Top issues + strengths */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {r.topIssues?.length > 0 && (
              <Card style={{ padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Wichtigste Probleme</div>
                {r.topIssues.map((issue, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
                    <AlertTriangle size={12} color="#dc2626" strokeWidth={IW} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{issue}</div>
                  </div>
                ))}
              </Card>
            )}
            {r.strengths?.length > 0 && (
              <Card style={{ padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Stärken</div>
                {r.strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
                    <CheckCircle size={12} color="#16a34a" strokeWidth={IW} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{s}</div>
                  </div>
                ))}
              </Card>
            )}
          </div>

          {/* All checks */}
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>
              Alle Prüfungen ({r.checks?.length || 0})
            </div>
            {r.checks?.map((check, i) => <CheckCard key={i} check={check} idx={i} />)}
          </Card>
        </>
      )}

      {/* Empty state */}
      {!r && !loading && (
        <Card style={{ padding: 52, textAlign: "center" }}>
          <Shield size={44} color={C.textSoft} strokeWidth={IW} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.textMid, marginBottom: 8 }}>On-Page SEO-Audit</div>
          <p style={{ fontSize: 13, color: C.textSoft, maxWidth: 380, margin: "0 auto" }}>
            Analysiert Meta-Tags, Content-Qualität, H1-Struktur, interne Links und mehr — direkt aus dem gescannten Seiteninhalt.
          </p>
        </Card>
      )}
    </div>
  );
}
