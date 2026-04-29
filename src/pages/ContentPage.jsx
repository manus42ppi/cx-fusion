import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen, Search, RefreshCw, AlertCircle, CheckCircle,
  TrendingUp, TrendingDown, Minus, Tag, Smile, Frown,
  Meh, Zap, Globe, Calendar, FileText, BarChart2,
  ChevronRight, ChevronDown, ChevronUp, Info, AlertTriangle, Clock,
  Shield, Image, Link, Monitor, Smartphone,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import AnalysisHeader from "../components/ui/AnalysisHeader.jsx";
import { cleanDomain } from "../utils/api.js";
import { useApp } from "../context/AppContext.jsx";
import { logError } from "../utils/improve.js";
import { fetchWithProxy } from "../utils/cors-proxy.js";
import { canAttempt, recordSuccess, recordFailure } from "../utils/circuit-breaker.js";

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseJSON(text) {
  try {
    const m = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    return JSON.parse(m ? m[1] : text);
  } catch { return null; }
}

async function aiCall(messages, system) {
  const payload = { system, messages, model: "claude-sonnet-4-6", max_tokens: 4096 };
  const endpoints = ["/ai", "https://socialflow-pro.pages.dev/ai"];
  let lastErr = "KI-Endpunkt nicht erreichbar.";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(90000),
      });
      if (!res.ok) { lastErr = `HTTP ${res.status} (${url})`; continue; }
      const data = await res.json();
      if (data?.error) throw new Error(data.error.message || "KI-Fehler");
      return data?.content?.[0]?.text || "";
    } catch (e) {
      lastErr = e.message || String(e);
    }
  }
  throw new Error(lastErr);
}

async function fetchFeed(domain) {
  try {
    const r = await fetch(`/rss?domain=${domain}`);
    if (!r.ok) return { feedUrl: null, items: [] };
    const data = await r.json();
    return { feedUrl: data?.feedUrl || null, items: Array.isArray(data?.items) ? data.items : [] };
  } catch { return { feedUrl: null, items: [] }; }
}

async function fetchWebContent(domain) {
  try {
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
        if (data?.pages?.length > 0) return data.pages;
      } catch {}
    }
    return [];
  } catch { return []; }
}

const TONE_META = {
  sachlich:        { color: "#6366f1", bg: "#eef2ff", label: "Sachlich" },
  informativ:      { color: "#0891b2", bg: "#e0f2fe", label: "Informativ" },
  professionell:   { color: "#1d4ed8", bg: "#dbeafe", label: "Professionell" },
  technisch:       { color: "#7c3aed", bg: "#ede9fe", label: "Technisch" },
  analytisch:      { color: "#059669", bg: "#d1fae5", label: "Analytisch" },
  humorvoll:       { color: "#f59e0b", bg: "#fef3c7", label: "Humorvoll" },
  emotional:       { color: "#ec4899", bg: "#fce7f3", label: "Emotional" },
  meinungsstark:   { color: "#dc2626", bg: "#fee2e2", label: "Meinungsstark" },
  unterhaltend:    { color: "#f97316", bg: "#ffedd5", label: "Unterhaltend" },
  werblich:        { color: "#84cc16", bg: "#f7fee7", label: "Werblich" },
};

const SENTIMENT_COLOR = { positiv: C.success, neutral: C.warning, negativ: "#ef4444" };
const SENTIMENT_ICON  = { positiv: Smile, neutral: Meh, negativ: Frown };

function ToneBadge({ tone }) {
  const m = TONE_META[tone?.toLowerCase()] || { color: C.accent, bg: C.accentLight, label: tone };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
      color: m.color, background: m.bg, border: `1px solid ${m.color}30`,
    }}>{m.label}</span>
  );
}

function ScoreBar({ value, color, label }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.textMid }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: C.border }}>
        <div style={{ height: 6, borderRadius: 3, background: color, width: `${value}%`, transition: "width .4s" }} />
      </div>
    </div>
  );
}

function ConsistencyRing({ score }) {
  const color = score >= 75 ? C.success : score >= 50 ? C.warning : "#ef4444";
  const label = score >= 75 ? "Konsistent" : score >= 50 ? "Gemischt" : "Inkonsistent";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        border: `5px solid ${color}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: color + "12",
      }}>
        <div style={{ fontSize: 24, fontWeight: 900, color, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 8, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".05em" }}>/ 100</div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color }}>{label}</div>
    </div>
  );
}

// ─── Article Overlay ─────────────────────────────────────────────────────────

function ArticleOverlay({ article, url, domain, onClose }) {
  const [view, setView]       = useState("reader"); // "iframe" | "reader" — reader default (iframes often blocked)
  const [content, setContent] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const iframeRef = useRef(null);

  const targetUrl = url || null;
  const openUrl   = targetUrl || `https://${domain}`;

  // Fetch reader content via CORS proxy (used as fallback or explicit reader mode)
  useEffect(() => {
    if (!targetUrl || view !== "reader") return;
    if (content) return; // already fetched
    setFetching(true);
    (async () => {
      const cbKey = `reader:${targetUrl}`;
      if (!canAttempt(cbKey)) {
        logError("cors_reader_circuit_open", "Circuit breaker open — skipping reader fetch", { url: targetUrl });
        setFetching(false); return;
      }
      try {
        const r = await fetchWithProxy(targetUrl);
        const html = (await r.text())
          .replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
        const m = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
          || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        const clean = (m?.[1] || html)
          .replace(/<img[^>]*>/gi, "")
          .replace(/<a([^>]*)href="([^"]*)"([^>]*)>/gi, '<a href="$2" target="_blank" rel="noopener">')
          .replace(/<(?!\/?(?:h[1-6]|p|ul|ol|li|strong|em|b|i|br|a|blockquote)\b)[^>]+>/gi, " ")
          .replace(/\s{2,}/g, " ").trim();
        if (clean.length > 200) { setContent(clean.slice(0, 20000)); recordSuccess(cbKey); }
        else throw new Error("Content too short");
      } catch (e) {
        const open = recordFailure(cbKey);
        logError("cors_reader_failed", e.message, { url: targetUrl, circuitOpen: open });
      }
      setFetching(false);
    })();
  }, [targetUrl, view]);

  // Detect iframe X-Frame-Options block (fires load but page is empty/error)
  const handleIframeLoad = () => {
    try {
      // If we can access contentDocument it wasn't blocked (same-origin or allowed)
      const doc = iframeRef.current?.contentDocument;
      if (!doc || doc.body?.innerHTML?.length < 10) setIframeBlocked(true);
    } catch {
      // Cross-origin: we can't read it but that doesn't mean it's blocked
      setIframeBlocked(false);
    }
  };
  const handleIframeError = () => {
    setIframeBlocked(true); setView("reader");
    logError("iframe_blocked", "iframe refused to load", { url: targetUrl });
  };;

  const sentMeta = { positiv: { color: C.success, label: "Positiv" }, neutral: { color: C.warning, label: "Neutral" }, negativ: { color: "#ef4444", label: "Negativ" } };
  const sm = sentMeta[article.sentiment] || sentMeta.neutral;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: T.rLg, width: "100%", maxWidth: 1000,
          height: "90vh", boxShadow: "0 24px 80px rgba(0,0,0,.35)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <ToneBadge tone={article.tone} />
              <span style={{ fontSize: 11, fontWeight: 700, color: sm.color, background: sm.color + "15", padding: "2px 9px", borderRadius: 99 }}>{sm.label}</span>
              {article.isOutlier && <span style={{ fontSize: 11, color: "#92400e", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><AlertTriangle size={11} color="#f59e0b" strokeWidth={IW} /> Ausreißer</span>}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {article.title}
            </div>
          </div>

          {/* View toggle + open button + close */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {targetUrl && (
              <div style={{ display: "flex", borderRadius: T.rSm, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {["iframe", "reader"].map(v => (
                  <button key={v} onClick={() => setView(v)} style={{
                    padding: "5px 12px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: FONT,
                    background: view === v ? C.accent : C.bg,
                    color: view === v ? "#fff" : C.textMid,
                  }}>{v === "iframe" ? "Webseite" : "Leseansicht"}</button>
                ))}
              </div>
            )}
            <a href={openUrl} target="_blank" rel="noopener" style={{
              fontSize: 11, color: C.accent, textDecoration: "none", fontWeight: 600, fontFamily: FONT,
              padding: "5px 12px", borderRadius: T.rSm, border: `1px solid ${C.accent}40`,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <Globe size={11} strokeWidth={IW} /> Im Browser
            </a>
            <button onClick={onClose} style={{ background: C.border, border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMid, fontSize: 16 }}>×</button>
          </div>
        </div>

        {article.isOutlier && article.outlierReason && (
          <div style={{ padding: "8px 20px", background: "#fffbeb", borderBottom: "1px solid #fde68a", fontSize: 12, color: "#92400e", flexShrink: 0 }}>
            {article.outlierReason}
          </div>
        )}

        {/* Content area */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {!targetUrl ? (
            /* No URL — only domain available */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: C.textSoft, gap: 12 }}>
              <Globe size={40} color={C.border} strokeWidth={1.2} />
              <div style={{ fontSize: 14 }}>Kein direkter Artikel-Link — nur Domain-Scraping verfügbar.</div>
              <a href={`https://${domain}`} target="_blank" rel="noopener" style={{ color: C.accent, fontSize: 13, fontWeight: 600 }}>
                → {domain} öffnen
              </a>
            </div>
          ) : view === "iframe" ? (
            /* Iframe view — shows the real webpage */
            <iframe
              ref={iframeRef}
              src={targetUrl}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              title={article.title}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          ) : (
            /* Reader view — CORS-proxied cleaned HTML */
            <div style={{ height: "100%", overflowY: "auto", padding: "28px 36px" }}>
              {fetching ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.textSoft, fontSize: 13, justifyContent: "center", paddingTop: 60 }}>
                  <RefreshCw size={16} color={C.accent} strokeWidth={IW} style={{ animation: "spin 1s linear infinite" }} />
                  Leseansicht wird geladen…
                </div>
              ) : content ? (
                <div
                  dangerouslySetInnerHTML={{ __html: content }}
                  style={{ fontSize: 15, lineHeight: 1.8, color: C.text, fontFamily: FONT, maxWidth: 680, margin: "0 auto" }}
                />
              ) : (
                <div style={{ color: C.textSoft, fontSize: 13, textAlign: "center", paddingTop: 60 }}>
                  Leseansicht konnte nicht geladen werden (CORS-Blockierung).
                  <br />
                  <a href={targetUrl} target="_blank" rel="noopener" style={{ color: C.accent, fontSize: 12, marginTop: 8, display: "inline-block" }}>
                    → Direkt auf der Website öffnen
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SEO-Audit helpers ────────────────────────────────────────────────────────

async function aiAuditSeo(domain, pages, aiCallFn) {
  // Limit to 8 pages, 300 chars each to stay within token budget
  const sample = pages.slice(0, 8);
  const pageTexts = sample.map(p =>
    `URL: ${p.url}\nTitel: ${p.title || "(fehlt)"}\nDesc: ${p.desc || "(fehlt)"}\nText: ${p.text.slice(0, 300)}`
  ).join("\n---\n");

  const raw = await aiCallFn(
    [{ role: "user", content: `SEO-Audit für ${domain}. Genau 8 Checks, jeder kurz und präzise. Nur JSON zurückgeben.\n\nSeiten (${sample.length}):\n${pageTexts}` }],
    `Du bist SEO-Experte. Antworte NUR mit diesem JSON (keine Erklärungen, kein Markdown):\n{"score":75,"summary":"2 Sätze","checks":[{"category":"Meta","title":"kurz","status":"warning","description":"kurz","affectedUrls":["url"],"fix":"kurz"}],"topIssues":["issue1","issue2","issue3"],"strengths":["s1","s2"]}`
  );

  // Try direct parse first
  let parsed = null;
  try { parsed = JSON.parse(raw.trim()); } catch {}

  // Try extracting JSON block
  if (!parsed) {
    const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
    try { parsed = JSON.parse(m?.[1] || m?.[0] || ""); } catch {}
  }

  // Try recovering truncated JSON by closing open structures
  if (!parsed && raw.includes('"score"')) {
    let attempt = raw.replace(/,?\s*$/, "");
    // Close open arrays/objects
    const opens = (attempt.match(/\[/g) || []).length - (attempt.match(/\]/g) || []).length;
    const objs  = (attempt.match(/\{/g) || []).length - (attempt.match(/\}/g) || []).length;
    attempt += "]".repeat(Math.max(0, opens)) + "}".repeat(Math.max(0, objs));
    try { parsed = JSON.parse(attempt); } catch {}
  }

  if (!parsed) {
    throw new Error("SEO-Audit-Antwort konnte nicht verarbeitet werden.");
  }
  return parsed;
}

const SEO_STATUS = {
  ok:      { color: "#16a34a", bg: "#dcfce7", icon: CheckCircle   },
  warning: { color: "#d97706", bg: "#fef3c7", icon: AlertTriangle },
  error:   { color: "#dc2626", bg: "#fee2e2", icon: AlertCircle   },
};
const SEO_CAT_ICON = { Meta: FileText, Inhalt: BarChart2, Performance: Zap, Struktur: Globe, Links: Link, Bilder: Image };

function SeoScoreRing({ score }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 88, height: 88, borderRadius: "50%", border: `6px solid ${color}`,
        background: color + "12", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 9, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".05em" }}>/ 100</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color }}>
        {score >= 80 ? "Gut" : score >= 60 ? "Verbesserbar" : "Kritisch"}
      </div>
    </div>
  );
}

function SeoCheckCard({ check, idx }) {
  const [open, setOpen] = useState(idx < 2);
  const sm = SEO_STATUS[check.status] || SEO_STATUS.warning;
  const Ico = sm.icon;
  const CatIco = SEO_CAT_ICON[check.category] || FileText;
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "12px 4px", background: "none", border: "none",
        cursor: "pointer", textAlign: "left", fontFamily: FONT,
      }}>
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

function computeDuplicates(pages) {
  if (!pages?.length) return [];
  const dupes = [];
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const a = pages[i].text || "";
      const b = pages[j].text || "";
      if (a.length < 100 || b.length < 100) continue;
      const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 4));
      const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 4));
      const inter = [...wordsA].filter(w => wordsB.has(w)).length;
      const union = new Set([...wordsA, ...wordsB]).size;
      const score = union ? Math.round((inter / union) * 100) : 0;
      if (score > 35) dupes.push({ a: pages[i], b: pages[j], score });
    }
  }
  return dupes.sort((x, y) => y.score - x.score).slice(0, 5);
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ContentPage() {
  const { activeReport, persistContentReport, pendingDomain, contentReports } = useApp();
  // Wenn von ClientsPage über "Öffnen" navigiert → gespeicherten Report sofort zeigen
  const preloaded = pendingDomain ? (contentReports?.[pendingDomain] ?? null) : null;
  const [domain, setDomain]   = useState(pendingDomain || activeReport?.domain || "");
  const [result, setResult]   = useState(preloaded);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [phase, setPhase]     = useState("");
  const [elapsed, setElapsed]           = useState(0);
  const [articleOverlay, setArticleOverlay] = useState(null);
  const [activeTab, setActiveTab]   = useState("content");
  const [seoResult, setSeoResult]   = useState(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoError, setSeoError]     = useState("");
  const [serpMobile, setSerpMobile] = useState(false);
  const elapsedRef = useRef(null);

  async function triggerSeoAudit(pages, domain) {
    if (!pages?.length) { setSeoError("Keine gescrapten Seiten verfügbar — bitte erst analysieren."); return; }
    setSeoLoading(true); setSeoError("");
    try {
      const audit = await aiAuditSeo(domain, pages, aiCall);
      setSeoResult(audit);
    } catch (e) {
      const msg = e.message || "SEO-Audit fehlgeschlagen.";
      setSeoError(msg);
      logError("seo_audit_error", msg, { domain });
    } finally {
      setSeoLoading(false);
    }
  }

  useEffect(() => {
    if (loading) {
      setElapsed(0);
      elapsedRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      clearInterval(elapsedRef.current);
    }
    return () => clearInterval(elapsedRef.current);
  }, [loading]);

  async function analyze() {
    const d = cleanDomain(domain);
    if (!d) return;
    setLoading(true); setError(""); setResult(null);
    setActiveTab("content"); setSeoResult(null); setSeoError("");

    try {
      // 1. Fetch RSS feed + real page content in parallel
      setPhase("Seiteninhalte abrufen…");
      const [feed, webPages] = await Promise.all([
        fetchFeed(d),
        fetchWebContent(d),
      ]);

      // 2. AI content analysis
      setPhase("Inhalte mit KI analysieren…");
      const hasFeed = feed.items.length > 0;
      const hasWebContent = webPages.length > 0;

      let contentBlock = "";
      if (hasFeed) {
        const articleSample = feed.items.slice(0, 25).map((a, i) =>
          `${i + 1}. [IDX:${i}] "${a.title}"${a.desc ? ` — ${a.desc.slice(0, 180)}` : ""}${a.date ? ` (${a.date})` : ""}${a.link ? ` | URL: ${a.link}` : ""}`
        ).join("\n");
        contentBlock = `RSS-FEED (${feed.items.length} Artikel):\n${articleSample}`;
      }
      if (hasWebContent) {
        const pageTexts = webPages.map(p =>
          `[Seite: ${p.url}]\nTitel: ${p.title}\nBeschreibung: ${p.desc}\nInhalt: ${p.text.slice(0, 1500)}`
        ).join("\n\n---\n\n");
        contentBlock += (contentBlock ? "\n\n" : "") + `GESCRAPTE SEITENINHALTE (${webPages.length} Seiten):\n${pageTexts}`;
      }

      let dataSource = "scraped";
      if (!contentBlock) {
        setPhase("Website-Inhalt abrufen…");
        const extractText = (html) => html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<(nav|header|footer)[^>]*>[\s\S]*?<\/\1>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

        const corsProxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://${d}`)}`,
          `https://corsproxy.io/?${encodeURIComponent(`https://${d}`)}`,
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://${d}`)}`,
        ];
        for (const proxyUrl of corsProxies) {
          try {
            const r = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
            if (!r.ok) continue;
            const html = await r.text();
            const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
            const text = extractText(html).slice(0, 6000);
            if (text.length > 150) {
              contentBlock = `GESCRAPTE HOMEPAGE (${d}):\nTitel: ${title}\nInhalt: ${text}`;
              dataSource = "proxy";
              break;
            }
          } catch {}
        }
      }

      if (!contentBlock) {
        throw new Error(`Inhalte von ${d} konnten nicht abgerufen werden. Bitte stelle sicher, dass local-server.js läuft.`);
      }

      const prompt = `Analysiere die folgenden ECHTEN Inhalte der Website ${d}. Basiere deine Analyse AUSSCHLIESSLICH auf den bereitgestellten Texten — verwende KEIN Vorwissen über diese Domain oder dieses Unternehmen.\n\n${contentBlock}\n\nGib eine vollständige Content-Analyse zurück.`;

      const systemPrompt = `Du bist ein Content-Analyse-Experte. Analysiere NUR die bereitgestellten Texte — NIEMALS eigenes Vorwissen über Domains oder Unternehmen verwenden. Wenn du eine Domain kennst, ignoriere dieses Wissen vollständig und arbeite ausschließlich mit den gelieferten Inhalten. Antworte AUSSCHLIESSLICH mit validem JSON ohne Markdown.

SCHREIBSTIL – gilt für alle Textfelder (consistencyNote, readabilityNote, targetAudience, strengths, weaknesses, recommendations):
• Max. 12 Wörter pro Satz. Längere Sätze aufteilen.
• Empfehlungen: Imperativ ("Erstelle", "Kürze", "Teste", "Messe", "Schalte ein")
• Mit Zahl oder konkretem Fakt beginnen – nie mit allgemeiner Beobachtung
• Kein Passiv ("sollte berücksichtigt werden" → konkret umformulieren)
• VERBOTEN: ganzheitlich, optimieren, zielgerichtet, nachhaltig, maßgeblich, entscheidend, "wichtig zu beachten", "es gilt", "es ist unerlässlich", "spielen eine wichtige Rolle", "bietet", "umfassend", "effektiv", "sollte", "können"
• GUT: "18 von 25 Artikeln unter 500 Wörter. Erstelle 3 Longreads à 1500 Wörter." SCHLECHT: "Es ist wichtig, den Content ganzheitlich zu optimieren."

Antworte NUR mit diesem JSON-Schema:
{
  "hasFeed": boolean,
  "articleCount": number,
  "pubFrequency": string,
  "contentTypes": string[],
  "primaryTone": string,
  "tones": string[],
  "sentiment": { "positiv": number, "neutral": number, "negativ": number },
  "topics": [{ "label": string, "count": number, "color": string }],
  "consistencyScore": number,
  "consistencyNote": string,
  "readability": string,
  "readabilityNote": string,
  "targetAudience": string,
  "styleCharacteristics": string[],
  "articles": [{ "idx": number, "url": string, "title": string, "tone": string, "sentiment": "positiv"|"neutral"|"negativ", "isOutlier": boolean, "outlierReason": string|null }],
  "outliers": [{ "title": string, "reason": string }],
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": string[]
}`;

      const raw = await aiCall([{ role: "user", content: prompt }], systemPrompt);

      const parsed = parseJSON(raw);
      if (!parsed) throw new Error("KI-Antwort konnte nicht verarbeitet werden.");

      // ── Option B: Sharpening pass – refine text fields only ────────────────
      try {
        const textFields = {
          consistencyNote:   parsed.consistencyNote,
          readabilityNote:   parsed.readabilityNote,
          targetAudience:    parsed.targetAudience,
          strengths:         parsed.strengths,
          weaknesses:        parsed.weaknesses,
          recommendations:   parsed.recommendations,
        };
        const sharpenRaw = await aiCall(
          [{ role: "user", content: `Überarbeite diese Analysetexte nach STRIKTEN Regeln. Gib exakt dieselbe JSON-Struktur zurück.\n\n${JSON.stringify(textFields)}\n\nREGELN:\n1. Max. 12 Wörter/Satz – teile auf\n2. Empfehlungen: Imperativ ("Erstelle", "Kürze", "Teste", "Messe")\n3. Mit konkretem Wert/Fakt beginnen\n4. Kein Passiv\n5. VERBOTEN: ganzheitlich, optimieren, zielgerichtet, nachhaltig, maßgeblich, entscheidend, wichtig zu beachten, es gilt, es ist unerlässlich, spielen eine wichtige Rolle, bietet, umfassend, effektiv, sollte` }],
          "Du bist ein Text-Editor. Antworte NUR mit gültigem JSON. Keine Erklärungen."
        );
        const sharpened = parseJSON(sharpenRaw);
        if (sharpened) {
          if (sharpened.consistencyNote)       parsed.consistencyNote     = sharpened.consistencyNote;
          if (sharpened.readabilityNote)       parsed.readabilityNote     = sharpened.readabilityNote;
          if (sharpened.targetAudience)        parsed.targetAudience      = sharpened.targetAudience;
          if (sharpened.strengths?.length)     parsed.strengths           = sharpened.strengths;
          if (sharpened.weaknesses?.length)    parsed.weaknesses          = sharpened.weaknesses;
          if (sharpened.recommendations?.length) parsed.recommendations   = sharpened.recommendations;
        }
      } catch {} // sharpening optional – scheitert lautlos

      // articles: feed.items as fallback; ...parsed overrides with AI-analyzed articles (with tone/sentiment)
      const resultData = { domain: d, feedUrl: feed.feedUrl, hasFeed, hasWebContent, webPageCount: webPages.length, dataSource, feedItems: feed.items, webPages, articles: feed.items, ...parsed };
      setResult(resultData);
      persistContentReport(d, resultData);
    } catch (e) {
      const msg = e.message || "Analyse fehlgeschlagen.";
      setError(msg);
      logError("analyze_error", msg, { domain: cleanDomain(domain) });
    } finally {
      setLoading(false); setPhase("");
    }
  }

  const r = result;

  return (
    <>
    {articleOverlay && (
      <ArticleOverlay
        article={articleOverlay.article}
        url={articleOverlay.url}
        domain={result?.domain}
        onClose={() => setArticleOverlay(null)}
      />
    )}
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 60px" }}>

      <AnalysisHeader
        icon={BookOpen}
        iconColor="#d97706"
        iconBg="#fef3c7"
        title="Content-Audit"
        subtitle="Tonalität · Sentiment · Konsistenz · SEO-Audit"
        value={domain}
        onChange={v => { setDomain(v); setError(""); }}
        onAnalyze={analyze}
        loading={loading}
        loadingText="Content analysieren"
        loadingSteps={[
          "RSS-Feed abrufen…",
          "Seiteninhalte extrahieren…",
          "Tonalität & Sentiment prüfen…",
          "Themen-Cluster berechnen…",
          "KI analysiert Lesbarkeit & SEO…",
        ]}
        error={error}
        examples={["spiegel.de", "zeit.de", "heise.de", "t3n.de", "chip.de"]}
        btnLabel="Analysieren"
      />

      {/* Tabs */}
      {r && (
        <div style={{ display: "flex", marginBottom: 20, borderBottom: `2px solid ${C.border}` }}>
          {[
            { id: "content", label: "Content-Analyse" },
            { id: "seo",     label: "SEO-Audit" },
          ].map(({ id, label }) => (
            <button key={id}
              onClick={() => {
                setActiveTab(id);
                if (id === "seo" && !seoResult && !seoLoading) triggerSeoAudit(r.webPages, r.domain);
              }}
              style={{
                padding: "10px 22px", background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: activeTab === id ? 700 : 500,
                color: activeTab === id ? C.accent : C.textMid, fontFamily: FONT,
                borderBottom: `2px solid ${activeTab === id ? C.accent : "transparent"}`,
                marginBottom: -2, transition: "all .15s",
              }}>{label}
            </button>
          ))}
        </div>
      )}

      {/* Results — Content tab */}
      {r && activeTab === "content" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Scan scope banner */}
          {(() => {
            const items = r.feedItems || [];
            const dates = items.map(a => a.date).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d)).sort((a, b) => a - b);
            const oldest = dates[0];
            const newest = dates[dates.length - 1];
            const fmtD = d => d?.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
            const dateRange = oldest && newest && oldest.getTime() !== newest.getTime()
              ? `${fmtD(oldest)} – ${fmtD(newest)}`
              : oldest ? fmtD(oldest) : null;

            return (
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                borderRadius: T.rMd, fontSize: 12, flexWrap: "wrap",
                background: r.hasFeed ? "#f0fdf4" : "#fffbeb",
                border: `1px solid ${r.hasFeed ? "#bbf7d0" : "#fde68a"}`,
                color: r.hasFeed ? "#166534" : "#92400e",
              }}>
                {r.hasFeed ? <CheckCircle size={13} strokeWidth={IW} /> : <Info size={13} strokeWidth={IW} />}
                <span style={{ fontWeight: 600 }}>
                  {r.hasFeed ? "RSS-Feed" : r.hasWebContent ? "Web-Scraping" : "Kein Feed"}
                </span>
                <span style={{ opacity: .5 }}>·</span>
                {r.hasFeed ? (
                  <span>{items.length || r.articleCount || 0} Artikel gescannt</span>
                ) : (
                  <span>{r.webPageCount || 0} Seiten gescannt</span>
                )}
                {dateRange && <>
                  <span style={{ opacity: .5 }}>·</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={11} strokeWidth={IW} /> {dateRange}
                  </span>
                </>}
                {r.hasFeed && r.feedUrl && <>
                  <span style={{ opacity: .5 }}>·</span>
                  <a href={r.feedUrl} target="_blank" rel="noopener" style={{ color: "inherit", opacity: .7, fontSize: 11, textDecoration: "none" }}>{r.feedUrl}</a>
                </>}
              </div>
            );
          })()}

          {/* Row 1: Ton + Konsistenz + Lesbarkeit */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

            {/* Tonalität */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
                Tonalität & Stil
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {r.tones?.map(t => <ToneBadge key={t} tone={t} />)}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, marginBottom: 6 }}>Zielgruppe</div>
              <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.6 }}>{r.targetAudience || "–"}</div>
              {r.styleCharacteristics?.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, marginBottom: 6, marginTop: 12 }}>Stil-Merkmale</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {r.styleCharacteristics.map(s => (
                      <span key={s} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: C.bg, border: `1px solid ${C.border}`, color: C.textMid }}>{s}</span>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* Konsistenz */}
            <Card style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
                Konsistenz-Score
              </div>
              <ConsistencyRing score={r.consistencyScore ?? 0} />
              {r.consistencyNote && (
                <p style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.6, marginTop: 12, maxWidth: 200 }}>
                  {r.consistencyNote}
                </p>
              )}
            </Card>

            {/* Lesbarkeit + Content-Typen */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
                Lesbarkeit
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 99, marginBottom: 8,
                background: r.readability === "einfach" ? "#f0fdf4" : r.readability === "komplex" ? "#fef2f2" : "#fffbeb",
                border: `1px solid ${r.readability === "einfach" ? "#bbf7d0" : r.readability === "komplex" ? "#fecaca" : "#fde68a"}`,
                color: r.readability === "einfach" ? "#166534" : r.readability === "komplex" ? "#dc2626" : "#92400e",
                fontSize: 13, fontWeight: 700,
              }}>
                {r.readability === "einfach" ? "✓" : r.readability === "komplex" ? "⚠" : "◎"} {r.readability}
              </div>
              {r.readabilityNote && <p style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.6 }}>{r.readabilityNote}</p>}

              {r.contentTypes?.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8, marginTop: 14 }}>
                    Content-Typen
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {r.contentTypes.map(t => (
                      <span key={t} style={{ fontSize: 11, padding: "2px 9px", borderRadius: 4, background: C.accentLight, color: C.accent, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </>
              )}

              {r.pubFrequency && (
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textSoft }}>
                  <Calendar size={12} strokeWidth={IW} />
                  {r.pubFrequency}
                </div>
              )}
            </Card>
          </div>

          {/* Row 2: Sentiment + Themen */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* Sentiment */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
                Sentiment-Verteilung
              </div>
              {r.sentiment && Object.entries(r.sentiment).map(([key, val]) => {
                const Icon = SENTIMENT_ICON[key] || Meh;
                const col  = SENTIMENT_COLOR[key] || C.textSoft;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <Icon size={16} color={col} strokeWidth={IW} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: C.textMid, textTransform: "capitalize" }}>{key}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{val}%</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 4, background: C.border }}>
                        <div style={{ height: 7, borderRadius: 4, background: col, width: `${val}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: T.rMd, background: C.bg, border: `1px solid ${C.border}`, fontSize: 11, color: C.textSoft }}>
                {r.sentiment?.positiv > 60
                  ? "Überwiegend positiver Ton — fördert Vertrauen und Engagement."
                  : r.sentiment?.negativ > 40
                  ? "Hoher Negativanteil — kritisch/alarmistisch, kann abschrecken."
                  : "Ausgewogener Mix — sachliche Berichterstattung."}
              </div>
            </Card>

            {/* Themen-Cluster */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
                Themen-Cluster
              </div>
              {r.topics?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {r.topics.slice(0, 8).map(({ label, count, color }, i) => {
                    const max = Math.max(...r.topics.map(t => t.count || 0), 1);
                    return (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color || C.accent, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: C.textMid, width: 240, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.border }}>
                          <div style={{ height: 6, borderRadius: 3, background: color || C.accent, width: `${Math.round((count / max) * 100)}%`, transition: "width .4s" }} />
                        </div>
                        <span style={{ fontSize: 11, color: C.textSoft, width: 24, textAlign: "right", flexShrink: 0 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: C.textSoft, fontSize: 12 }}>Keine Themen-Daten verfügbar.</p>
              )}
            </Card>
          </div>

          {/* Row 3: Artikel-Liste */}
          {r.articles?.length > 0 && (
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
                Artikel-Analyse ({r.articles.length} analysiert)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {r.articles.slice(0, 20).map((a, i) => {
                  const sentCol = SENTIMENT_COLOR[a.sentiment] || C.textSoft;
                  const SIcon   = SENTIMENT_ICON[a.sentiment]  || Meh;
                  const normalize = s => (s || "").toLowerCase().replace(/[^a-z0-9äöüß]/g, "");
                  const articleUrl = (a.url && a.url.startsWith("http") ? a.url : null)
                    ?? (a.idx != null ? r.feedItems?.[a.idx]?.link : null)
                    ?? r.feedItems?.find(f => normalize(f.title) === normalize(a.title))?.link
                    ?? r.feedItems?.find(f => normalize(f.title).includes(normalize(a.title).slice(0, 20)))?.link
                    ?? r.webPages?.find(p => normalize(p.title || "") === normalize(a.title))?.url
                    ?? r.webPages?.find(p => normalize(a.title).slice(0, 20).length > 5 && normalize(p.title || "").includes(normalize(a.title).slice(0, 20)))?.url
                    ?? null;
                  return (
                    <div
                      key={i}
                      onClick={() => setArticleOverlay({ article: a, url: articleUrl })}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 4px", borderBottom: `1px solid ${C.border}`,
                        cursor: "pointer", borderRadius: 6, margin: "0 -4px",
                        transition: "background .12s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ fontSize: 11, color: C.textMute, minWidth: 20, textAlign: "right" }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: a.isOutlier ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {a.isOutlier && <AlertTriangle size={11} color="#f59e0b" strokeWidth={IW} style={{ marginRight: 5 }} />}
                          {a.title}
                        </div>
                        {a.isOutlier && a.outlierReason && (
                          <div style={{ fontSize: 11, color: "#92400e", marginTop: 2 }}>{a.outlierReason}</div>
                        )}
                      </div>
                      <ToneBadge tone={a.tone} />
                      <SIcon size={14} color={sentCol} strokeWidth={IW} style={{ flexShrink: 0 }} />
                      <ChevronRight size={13} color={C.textMute} strokeWidth={IW} style={{ flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Row 4: Ausreißer */}
          {r.outliers?.length > 0 && (
            <Card style={{ padding: 20, borderLeft: `3px solid #f59e0b` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={16} color="#d97706" strokeWidth={IW} />
                <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: ".07em" }}>
                  Ausreißer — {r.outliers.length} Artikel weichen vom Norm ab
                </div>
              </div>
              {r.outliers.map((o, i) => (
                <div key={i} style={{
                  padding: "12px 14px", borderRadius: T.rMd,
                  background: "#fffbeb", border: "1px solid #fde68a", marginBottom: 8,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{o.title}</div>
                  <div style={{ fontSize: 12, color: "#92400e" }}>{o.reason}</div>
                </div>
              ))}
            </Card>
          )}

          {/* Row 5: Stärken + Schwächen + Empfehlungen */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.success, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle size={13} strokeWidth={IW} /> Content-Stärken
              </div>
              {r.strengths?.map((s, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>
                  {s}
                </div>
              ))}
            </Card>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={13} strokeWidth={IW} /> Schwächen
              </div>
              {r.weaknesses?.map((s, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>
                  {s}
                </div>
              ))}
            </Card>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={13} strokeWidth={IW} /> Empfehlungen
              </div>
              {r.recommendations?.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#d97706", flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </Card>
          </div>

          {/* Disclaimer */}
          <div style={{ padding: "10px 14px", borderRadius: T.rMd, background: C.bg, border: `1px solid ${C.border}`, fontSize: 11, color: C.textMute }}>
            <strong style={{ color: C.textSoft }}>KI-Analyse:</strong> Alle Bewertungen basieren auf{" "}
            {r.hasFeed ? `${r.articles?.length} RSS-Artikeln` : r.hasWebContent ? `${r.webPageCount} gescrapten Seiten` : "verfügbaren Seitendaten"} und sind subjektive Einschätzungen von Claude AI. Keine Garantie auf Vollständigkeit.
          </div>
        </div>
      )}

      {/* Results — SEO tab */}
      {r && activeTab === "seo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {seoLoading && (
            <Card style={{ padding: 40, textAlign: "center" }}>
              <RefreshCw size={28} color={C.accent} strokeWidth={IW} style={{ margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
              <div style={{ fontSize: 14, color: C.textSoft }}>SEO-Audit läuft… ({r.webPages?.length || 0} Seiten)</div>
            </Card>
          )}
          {seoError && (
            <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderRadius: T.rMd, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13 }}>
              <AlertCircle size={16} strokeWidth={IW} style={{ flexShrink: 0 }} />{seoError}
            </div>
          )}
          {seoResult && (() => {
            const sr = seoResult;
            const errs  = sr.checks?.filter(c => c.status === "error")   || [];
            const warns = sr.checks?.filter(c => c.status === "warning") || [];
            const oks   = sr.checks?.filter(c => c.status === "ok")      || [];
            return (
              <>
                {/* Score + summary */}
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16 }}>
                  <Card style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <SeoScoreRing score={sr.score || 0} />
                  </Card>
                  <Card style={{ padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
                      SEO-Score — {r.domain} · {r.webPages?.length || 0} Seiten
                    </div>
                    <div style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.7, marginBottom: 12 }}>{sr.summary}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {errs.length > 0  && <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "3px 12px", borderRadius: 99 }}>{errs.length} Fehler</span>}
                      {warns.length > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "3px 12px", borderRadius: 99 }}>{warns.length} Warnungen</span>}
                      {oks.length > 0   && <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "3px 12px", borderRadius: 99 }}>{oks.length} OK</span>}
                    </div>
                  </Card>
                </div>

                {/* Top issues + strengths */}
                {(sr.topIssues?.length > 0 || sr.strengths?.length > 0) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {sr.topIssues?.length > 0 && (
                      <Card style={{ padding: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Wichtigste Probleme</div>
                        {sr.topIssues.map((issue, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
                            <AlertTriangle size={12} color="#dc2626" strokeWidth={IW} style={{ flexShrink: 0, marginTop: 2 }} />
                            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{issue}</div>
                          </div>
                        ))}
                      </Card>
                    )}
                    {sr.strengths?.length > 0 && (
                      <Card style={{ padding: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Stärken</div>
                        {sr.strengths.map((s, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
                            <CheckCircle size={12} color="#16a34a" strokeWidth={IW} style={{ flexShrink: 0, marginTop: 2 }} />
                            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{s}</div>
                          </div>
                        ))}
                      </Card>
                    )}
                  </div>
                )}

                {/* All checks */}
                <Card style={{ padding: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>
                    Alle Prüfungen ({sr.checks?.length || 0})
                  </div>
                  {sr.checks?.map((check, i) => <SeoCheckCard key={i} check={check} idx={i} />)}
                </Card>
              </>
            );
          })()}
          {/* SERP-Vorschau */}
          {r.webPages?.length > 0 && (
            <Card style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em" }}>
                  SERP-Vorschau
                </div>
                <div style={{ display: "flex", gap: 4, background: C.bg, borderRadius: T.rSm, padding: 3, border: `1px solid ${C.border}` }}>
                  {[{ id: false, icon: Monitor, label: "Desktop" }, { id: true, icon: Smartphone, label: "Mobil" }].map(({ id, icon: Ico, label }) => (
                    <button key={String(id)} onClick={() => setSerpMobile(id)} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 4, border: "none", cursor: "pointer",
                      background: serpMobile === id ? C.surface : "transparent",
                      color: serpMobile === id ? C.text : C.textSoft,
                      fontFamily: FONT, fontSize: 11, fontWeight: serpMobile === id ? 700 : 400,
                      boxShadow: serpMobile === id ? T.shadowXs : "none",
                    }}>
                      <Ico size={11} strokeWidth={IW} />{label}
                    </button>
                  ))}
                </div>
              </div>
              {r.webPages.slice(0, 6).map((p, i) => {
                const titleMax = serpMobile ? 55 : 60;
                const descMax  = serpMobile ? 120 : 160;
                const titleOver = (p.title || "").length > titleMax;
                const descOver  = (p.desc  || "").length > descMax;
                return (
                  <div key={i} style={{ borderBottom: `1px solid ${C.border}`, padding: "14px 0" }}>
                    <div style={{ fontSize: 12, color: "#006621", marginBottom: 2 }}>{p.url}</div>
                    <div style={{ fontSize: serpMobile ? 16 : 18, color: "#1a0dab", lineHeight: 1.3, marginBottom: 4, display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
                      <span style={{ color: titleOver ? "#dc2626" : "#1a0dab" }}>
                        {(p.title || "(kein Titel)").slice(0, titleMax + 15)}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: titleOver ? "#dc2626" : "#16a34a", background: titleOver ? "#fee2e2" : "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>
                        {(p.title || "").length}/{titleMax}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#545454", lineHeight: 1.5, maxWidth: serpMobile ? 340 : 520 }}>
                      {p.desc ? (
                        <>
                          <span style={{ color: descOver ? "#dc2626" : "inherit" }}>
                            {p.desc.slice(0, descMax + 20)}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 6, color: descOver ? "#dc2626" : "#16a34a", background: descOver ? "#fee2e2" : "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>
                            {p.desc.length}/{descMax}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: "#dc2626", fontStyle: "italic" }}>⚠ Keine Meta-Description vorhanden</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          {/* Duplicate-Content-Erkennung */}
          {r.webPages?.length > 1 && (() => {
            const dupes = computeDuplicates(r.webPages);
            return (
              <Card style={{ padding: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
                  Content-Duplikate ({dupes.length > 0 ? `${dupes.length} gefunden` : "keine gefunden"})
                </div>
                {dupes.length === 0 ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#16a34a" }}>
                    <CheckCircle size={14} color="#16a34a" strokeWidth={IW} />
                    Kein erheblicher Duplicate Content erkannt.
                  </div>
                ) : dupes.map((d, i) => (
                  <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 99,
                        color: d.score > 70 ? "#dc2626" : "#d97706",
                        background: d.score > 70 ? "#fee2e2" : "#fef3c7",
                      }}>{d.score}% Ähnlichkeit</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.textMute, fontFamily: "monospace" }}>{d.a.url}</div>
                    <div style={{ fontSize: 11, color: C.textSoft, margin: "3px 0" }}>↕ vs.</div>
                    <div style={{ fontSize: 11, color: C.textMute, fontFamily: "monospace" }}>{d.b.url}</div>
                  </div>
                ))}
              </Card>
            );
          })()}

          {!seoLoading && !seoError && !seoResult && (
            <Card style={{ padding: 40, textAlign: "center" }}>
              <Shield size={36} color={C.textSoft} strokeWidth={IW} style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 14, color: C.textMid }}>SEO-Audit wird geladen…</div>
            </Card>
          )}
        </div>
      )}

      {/* Empty state */}
      {!r && !loading && !error && (
        <Card style={{ padding: 52, textAlign: "center" }}>
          <BookOpen size={44} color={C.textSoft} strokeWidth={IW} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.textMid, marginBottom: 8 }}>Content-Audit starten</div>
          <p style={{ fontSize: 13, color: C.textSoft, maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
            Gib eine Domain ein und erhalte eine KI-Analyse der Tonalität, des Sentiments, der Themen-Cluster, der Konsistenz und mehr — inklusive Ausreißer-Erkennung.
          </p>
        </Card>
      )}
    </div>
    </>
  );
}
