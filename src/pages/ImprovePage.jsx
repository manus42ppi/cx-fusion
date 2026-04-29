import React, { useState, useEffect, useRef, memo, useMemo } from "react";
import {
  Bot, RefreshCw, AlertTriangle, CheckCircle, Zap,
  ChevronDown, ChevronUp, BarChart2, Clock,
  History, TrendingUp, Package, FileCode,
  Rocket, Target, Globe, Archive,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn } from "../components/ui/index.jsx";

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_FEAT_CURRENT  = "cxf_feat_current";
const LS_FEAT_HISTORY  = "cxf_feat_history";
const LS_BUG_CURRENT   = "cxf_bug_current";
const LS_BUG_HISTORY   = "cxf_bug_history";
const MAX_HISTORY      = 5;

function lsGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function saveResult(currentKey, historyKey, data) {
  lsSet(currentKey, data);
  const history = lsGet(historyKey) || [];
  // Avoid exact duplicate (same generatedAt)
  const filtered = history.filter(h => h.generatedAt !== data.generatedAt);
  lsSet(historyKey, [data, ...filtered].slice(0, MAX_HISTORY));
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_META = {
  P1: { color: "#dc2626", bg: "#fee2e2", label: "Kritisch" },
  P2: { color: "#d97706", bg: "#fef3c7", label: "Wichtig" },
  P3: { color: "#2563eb", bg: "#dbeafe", label: "Optional" },
};

const SEVERITY_META = {
  high:   { color: "#dc2626", bg: "#fee2e2", label: "Hoch" },
  medium: { color: "#d97706", bg: "#fef3c7", label: "Mittel" },
  low:    { color: "#16a34a", bg: "#dcfce7", label: "Niedrig" },
};

const IMPACT_META = {
  high:   { color: "#7c3aed", bg: "#ede9fe", label: "Hoher Impact" },
  medium: { color: "#d97706", bg: "#fef3c7", label: "Mittlerer Impact" },
  low:    { color: "#6b7280", bg: "#f3f4f6", label: "Niedriger Impact" },
};

const EFFORT_META = {
  low:    { color: "#16a34a", label: "Wenig Aufwand" },
  medium: { color: "#d97706", label: "Mittlerer Aufwand" },
  high:   { color: "#dc2626", label: "Hoher Aufwand" },
};

function fmtCountdown(ms) {
  if (ms <= 0) return "gleich";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtDate(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;
  return (
    <div style={{ position: "relative", marginTop: 10 }}>
      <pre style={{
        background: "#0f172a", color: "#e2e8f0", borderRadius: T.rMd,
        padding: "14px 16px", fontSize: 11.5, lineHeight: 1.65,
        overflowX: "auto", fontFamily: "monospace", margin: 0, maxHeight: 420, overflowY: "auto",
      }}>{code}</pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
        style={{
          position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 700,
          padding: "3px 10px", borderRadius: T.rSm, border: "none", cursor: "pointer",
          background: copied ? "#16a34a" : "#334155", color: "#e2e8f0", fontFamily: FONT,
        }}
      >{copied ? "✓ Kopiert" : "Kopieren"}</button>
    </div>
  );
}

const BugSuggestionCard = memo(function BugSuggestionCard({ s, idx }) {
  const [open, setOpen] = useState(idx === 0);
  const pm = PRIORITY_META[s.priority] || PRIORITY_META.P3;
  return (
    <Card style={{ padding: 0, overflow: "hidden", marginBottom: 10 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: FONT }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, color: pm.color, background: pm.bg, flexShrink: 0 }}>{pm.label}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.title}</div>
          {s.file && s.file !== "-" && <div style={{ fontSize: 11, color: C.textMute, fontFamily: "monospace", marginTop: 2 }}>{s.file}</div>}
        </div>
        {open ? <ChevronUp size={14} color={C.textSoft} strokeWidth={IW} /> : <ChevronDown size={14} color={C.textSoft} strokeWidth={IW} />}
      </button>
      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${C.border}` }}>
          {s.problem && s.problem !== "-" && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#fee2e2", borderRadius: T.rMd, fontSize: 12, color: "#7f1d1d" }}>
              <strong>Problem:</strong> {s.problem}
            </div>
          )}
          {s.description && <div style={{ marginTop: 10, fontSize: 13, color: C.textSoft, lineHeight: 1.6 }}>{s.description}</div>}
          {s.solution && s.solution !== "-" && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: "#dcfce7", borderRadius: T.rMd, fontSize: 12, color: "#14532d" }}>
              <strong>Lösung:</strong> {s.solution}
            </div>
          )}
          <CodeBlock code={s.code} />
        </div>
      )}
    </Card>
  );
});

const FeatureGapCard = memo(function FeatureGapCard({ gap, idx }) {
  const [open, setOpen] = useState(idx === 0);
  const im = IMPACT_META[gap.impact] || IMPACT_META.medium;
  const ef = EFFORT_META[gap.effort] || EFFORT_META.medium;
  return (
    <Card style={{ padding: 0, overflow: "hidden", marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: FONT }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, minWidth: 22, color: C.textMute }}>#{gap.priority || idx + 1}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{gap.name}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, color: im.color, background: im.bg }}>{im.label}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: ef.color }}>{ef.label}</span>
          </div>
        </div>
        {open ? <ChevronUp size={14} color={C.textSoft} strokeWidth={IW} /> : <ChevronDown size={14} color={C.textSoft} strokeWidth={IW} />}
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.textSoft, marginTop: 10, lineHeight: 1.6 }}>{gap.why}</div>
          {gap.competitorHas?.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: C.textMute }}>Haben es:</span>
              {gap.competitorHas.map(c => (
                <span key={c} style={{ fontSize: 10, fontWeight: 600, color: C.textMid, background: C.surfaceHigh, padding: "1px 7px", borderRadius: 99, border: `1px solid ${C.border}` }}>{c}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
});

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({ history, onRestore, label }) {
  const [open, setOpen] = useState(false);
  if (!history?.length) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 7, width: "100%",
          padding: "8px 14px", borderRadius: T.rMd,
          background: C.surface, border: `1px solid ${C.border}`,
          cursor: "pointer", fontFamily: FONT, fontSize: 12, color: C.textMid, fontWeight: 600,
        }}
      >
        <Archive size={13} strokeWidth={IW} color={C.textSoft} />
        Archiv – letzte {history.length} {label}
        <div style={{ marginLeft: "auto" }}>
          {open ? <ChevronUp size={13} strokeWidth={IW} color={C.textSoft} /> : <ChevronDown size={13} strokeWidth={IW} color={C.textSoft} />}
        </div>
      </button>
      {open && (
        <div style={{ marginTop: 4, borderRadius: T.rMd, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          {history.map((item, i) => (
            <button
              key={i}
              onClick={() => onRestore(item)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 14px", background: i % 2 === 0 ? C.surface : C.bg,
                border: "none", borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                cursor: "pointer", fontFamily: FONT, textAlign: "left",
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentLight}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.surface : C.bg}
            >
              <div style={{ width: 28, height: 28, borderRadius: T.rSm, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: C.accent }}>#{i + 1}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{fmtDate(item.generatedAt)}</div>
                {item.summary && <div style={{ fontSize: 11, color: C.textSoft, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.summary}</div>}
              </div>
              {item._fallback && <span style={{ fontSize: 9, fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "1px 6px", borderRadius: 99, flexShrink: 0 }}>Fallback</span>}
              <span style={{ fontSize: 10, color: C.accent, fontWeight: 600, flexShrink: 0 }}>Laden →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ImprovePage() {
  const [tab, setTab]               = useState("features");
  const [bugStatus, setBugStatus]   = useState("idle");
  const [bugResult, setBugResult]   = useState(null);
  const [bugHistory, setBugHistory] = useState([]);
  const [featStatus, setFeatStatus] = useState("idle");
  const [featResult, setFeatResult] = useState(null);
  const [featHistory, setFeatHistory] = useState([]);
  const [serverStatus, setServerStatus] = useState(null);
  const [countdown, setCountdown]   = useState(null);
  const [applyStatus, setApplyStatus] = useState({});
  const [errMsg, setErrMsg]         = useState("");
  const tickRef = useRef(null);
  const pollRef = useRef(null);

  // ── Load persisted results on mount ──────────────────────────────────────
  useEffect(() => {
    const savedFeat = lsGet(LS_FEAT_CURRENT);
    const savedFeatHist = lsGet(LS_FEAT_HISTORY) || [];
    const savedBug = lsGet(LS_BUG_CURRENT);
    const savedBugHist = lsGet(LS_BUG_HISTORY) || [];

    if (savedFeat) { setFeatResult(savedFeat); setFeatStatus("done"); }
    if (savedFeatHist.length) setFeatHistory(savedFeatHist);
    if (savedBug)  { setBugResult(savedBug);   setBugStatus("done"); }
    if (savedBugHist.length) setBugHistory(savedBugHist);
  }, []);

  // ── Poll server status (log count, last run times, test status) ──────────
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/improve-status");
        if (!res.ok) return;
        const data = await res.json();
        setServerStatus(data);
        // If KV has newer data than localStorage, use it
        if (data.lastFeatures?.generatedAt) {
          const local = lsGet(LS_FEAT_CURRENT);
          if (!local || data.lastFeatures.generatedAt > (local.generatedAt || "")) {
            setFeatResult(data.lastFeatures);
            setFeatStatus("done");
            saveResult(LS_FEAT_CURRENT, LS_FEAT_HISTORY, data.lastFeatures);
            setFeatHistory(lsGet(LS_FEAT_HISTORY) || []);
          }
        }
        if (data.lastReport?.generatedAt) {
          const local = lsGet(LS_BUG_CURRENT);
          if (!local || data.lastReport.generatedAt > (local.generatedAt || "")) {
            setBugResult(data.lastReport);
            setBugStatus("done");
            saveResult(LS_BUG_CURRENT, LS_BUG_HISTORY, data.lastReport);
            setBugHistory(lsGet(LS_BUG_HISTORY) || []);
          }
        }
      } catch {}
    }
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 60000); // light poll every 60s
    return () => clearInterval(pollRef.current);
  }, []);

  // ── Countdown ticker ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!serverStatus?.nextAutoRun) return;
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => setCountdown(serverStatus.nextAutoRun - Date.now()), 1000);
    return () => clearInterval(tickRef.current);
  }, [serverStatus?.nextAutoRun]);

  // ── Run Research (direct await – no fire-and-forget) ─────────────────────
  async function runResearch() {
    setFeatStatus("loading");
    setErrMsg("");
    try {
      const res = await fetch("/improve-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(90000),
      });
      const data = await res.json();
      if (data.error && !data.topGaps) {
        setErrMsg(data.error);
        setFeatStatus("error");
      } else {
        saveResult(LS_FEAT_CURRENT, LS_FEAT_HISTORY, data);
        setFeatResult(data);
        setFeatHistory(lsGet(LS_FEAT_HISTORY) || []);
        setFeatStatus("done");
      }
    } catch (e) {
      setErrMsg(e.name === "TimeoutError" ? "Zeitüberschreitung – bitte nochmal versuchen (Claude braucht ~30s)" : "Fehler: " + e.message);
      setFeatStatus("error");
    }
  }

  // ── Run Bug Analysis ──────────────────────────────────────────────────────
  async function runBugAnalysis() {
    setBugStatus("loading");
    setErrMsg("");
    try {
      const res = await fetch("/improve-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(90000),
      });
      const data = await res.json();
      if (data.error && !data.patterns) {
        setErrMsg(data.error);
        setBugStatus("error");
      } else {
        saveResult(LS_BUG_CURRENT, LS_BUG_HISTORY, data);
        setBugResult(data);
        setBugHistory(lsGet(LS_BUG_HISTORY) || []);
        setBugStatus("done");
      }
    } catch (e) {
      setErrMsg(e.name === "TimeoutError" ? "Zeitüberschreitung – bitte nochmal versuchen" : "Fehler: " + e.message);
      setBugStatus("error");
    }
  }

  async function applyFeature(fileName) {
    setApplyStatus(s => ({ ...s, [fileName]: "loading" }));
    try {
      const res  = await fetch("/improve-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: fileName }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setApplyStatus(s => ({ ...s, [fileName]: "done" }));
    } catch (e) { setApplyStatus(s => ({ ...s, [fileName]: "error: " + e.message })); }
  }

  const statItems = useMemo(() => [
    { icon: BarChart2, label: "Geloggte Fehler",      value: serverStatus?.logCount ?? "–",     sub: "seit Server-Start",                color: C.accent },
    { icon: Clock,     label: "Nächster Auto-Lauf",   value: countdown != null ? fmtCountdown(countdown) : "Manuell", sub: serverStatus?.nextAutoRun ? "1× täglich automatisch" : "Kein Auto-Schedule", color: "#d97706" },
    { icon: History,   label: "Letzter Fehler-Scan",  value: bugResult?.generatedAt ? fmtDate(bugResult.generatedAt).slice(0,5) : "–",  sub: bugResult?.generatedAt ? fmtDate(bugResult.generatedAt) : "noch keiner", color: C.success },
    { icon: Target,    label: "Letzter Feature-Scan", value: featResult?.generatedAt ? fmtDate(featResult.generatedAt).slice(0,5) : "–", sub: featResult?.generatedAt ? fmtDate(featResult.generatedAt) : "noch keiner", color: "#7c3aed" },
  ], [serverStatus, countdown, bugResult, featResult]);

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px 60px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: T.rMd, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={22} color={C.accent} strokeWidth={IW} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Autonome Verbesserung</h1>
          <p style={{ fontSize: 13, color: C.textSoft, margin: 0 }}>KI-Diagnose · Markt-Analyse · Feature-Entwicklung — Ergebnisse werden persistent gespeichert</p>
        </div>
        {serverStatus?.tests?.ts && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
            borderRadius: T.rMd, fontSize: 11, fontWeight: 700,
            background: serverStatus.tests.failed > 0 ? "#fee2e2" : "#dcfce7",
            border: `1px solid ${serverStatus.tests.failed > 0 ? "#fca5a5" : "#86efac"}`,
            color: serverStatus.tests.failed > 0 ? "#7f1d1d" : "#14532d",
          }}>
            {serverStatus.tests.failed > 0
              ? <><AlertTriangle size={11} strokeWidth={IW} /> {serverStatus.tests.failed} Test(s) rot</>
              : <><CheckCircle size={11} strokeWidth={IW} /> {serverStatus.tests.passed} Tests grün</>}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
        {statItems.map(({ icon: Ico, label, value, sub, color }) => (
          <div key={label} style={{ padding: "12px 14px", borderRadius: T.rMd, background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <Ico size={12} color={color} strokeWidth={IW} />
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 9, color: C.textMute, marginTop: 3 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderRadius: T.rMd, border: `1px solid ${C.border}`, overflow: "hidden", width: "fit-content" }}>
        {[
          { id: "features", label: "Feature-Entwicklung", icon: Rocket },
          { id: "bugs",     label: "Fehler & Fixes",      icon: AlertTriangle },
        ].map(({ id, label, icon: Ico }) => (
          <button key={id} onClick={() => { setTab(id); setErrMsg(""); }} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 18px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: FONT,
            background: tab === id ? C.accent : C.surface,
            color: tab === id ? "#fff" : C.textMid,
            borderRight: id === "features" ? `1px solid ${C.border}` : "none",
          }}>
            <Ico size={13} strokeWidth={IW} /> {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {errMsg && (featStatus === "error" || bugStatus === "error") && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: T.rMd, background: "#fee2e2", border: "1px solid #fca5a5", fontSize: 12, color: "#7f1d1d" }}>
          <AlertTriangle size={12} strokeWidth={IW} style={{ marginRight: 6 }} />{errMsg}
        </div>
      )}

      {/* ─── TAB: Feature-Entwicklung ────────────────────────────────────────── */}
      {tab === "features" && (
        <>
          {/* How it works */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 20 }}>
            {[
              { icon: Globe,  label: "Markt-Scan & Gap-Analyse", desc: "Aktuelle Trends + Vergleich mit SimilarWeb, SEMrush, Ahrefs — identifiziert Top-Prioritäten" },
              { icon: Rocket, label: "Persistenz & Archiv",      desc: `Ergebnisse bleiben nach dem Scan gespeichert · Archiv der letzten ${MAX_HISTORY} Läufe` },
            ].map(({ icon: Ico, label, desc }) => (
              <div key={label} style={{ padding: "12px 14px", borderRadius: T.rMd, background: C.surface, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <Ico size={13} color={C.accent} strokeWidth={IW} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{label}</div>
                </div>
                <div style={{ fontSize: 10, color: C.textSoft, lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Action card */}
          <Card style={{ padding: 18, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Markt-Analyse + Feature-Generierung starten</div>
                <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>
                  {featResult?.generatedAt
                    ? `Letzter Scan: ${fmtDate(featResult.generatedAt)} · ${featResult.topGaps?.length ?? 0} Lücken · ${featResult._fallback ? "⚠ Fallback-Daten" : "✓ KI-Analyse"}`
                    : "Claude analysiert Competitors und identifiziert Feature-Lücken (~30s)"}
                </div>
              </div>
              <Btn onClick={runResearch} disabled={featStatus === "loading"} icon={featStatus === "loading" ? RefreshCw : Zap}>
                {featStatus === "loading" ? "Läuft…" : (featResult ? "Neu scannen" : "Jetzt analysieren")}
              </Btn>
            </div>

            {/* Loading indicator */}
            {featStatus === "loading" && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textSoft, marginBottom: 6 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <RefreshCw size={11} strokeWidth={IW} style={{ animation: "spin 1.2s linear infinite" }} />
                    Claude analysiert Marktlücken (~30–60s) — bitte warten
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: C.border, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${C.accent}, #7c3aed)`, animation: "progressIndeterminate 2s ease-in-out infinite", width: "40%" }} />
                </div>
              </div>
            )}
          </Card>

          {/* Archive */}
          <HistoryPanel
            history={featHistory}
            label="Scans"
            onRestore={item => { setFeatResult(item); setFeatStatus("done"); setErrMsg(""); }}
          />

          {/* Results */}
          {featStatus === "done" && featResult && (
            <>
              {/* Meta badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "7px 14px", borderRadius: T.rMd, background: featResult._fallback ? "#fef3c7" : "#ede9fe", border: `1px solid ${featResult._fallback ? "#fde68a" : "#c4b5fd"}`, fontSize: 12, color: featResult._fallback ? "#92400e" : "#5b21b6", fontWeight: 600 }}>
                <Bot size={12} strokeWidth={IW} />
                {featResult._fallback ? "⚠ Fallback-Daten (KI nicht erreichbar)" : "KI-Analyse"}
                {" · "}{fmtDate(featResult.generatedAt)}
                {featResult.topGaps?.length > 0 && ` · ${featResult.topGaps.length} Lücken`}
              </div>

              {/* Market trends */}
              {featResult.marketTrends?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Aktuelle Markt-Trends</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {featResult.marketTrends.map((t, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: C.accentLight, border: `1px solid ${C.accent}30`, fontSize: 12, color: C.accent, fontWeight: 500 }}>
                        <TrendingUp size={11} strokeWidth={IW} /> {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feature gaps */}
              {featResult.topGaps?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
                    Feature-Lücken im Vergleich zu Konkurrenten ({featResult.topGaps.length})
                  </div>
                  {featResult.topGaps.map((gap, i) => <FeatureGapCard key={i} gap={gap} idx={i} />)}
                </div>
              )}

              {/* Quick wins */}
              {featResult.quickWins?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Quick Wins</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
                    {featResult.quickWins.map((w, i) => (
                      <div key={i} style={{ padding: "12px 14px", borderRadius: T.rMd, background: "#dcfce7", border: "1px solid #bbf7d0" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#14532d", marginBottom: 4 }}>{w.name}</div>
                        <div style={{ fontSize: 11, color: "#166534", lineHeight: 1.5 }}>{w.description}</div>
                        {w.uiHint && <div style={{ fontSize: 10, color: "#15803d", marginTop: 6, fontStyle: "italic" }}>{w.uiHint}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {featResult.summary && (
                <Card style={{ padding: "14px 18px", marginBottom: 20, background: C.accentLight, border: `1px solid ${C.accent}30` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>Fazit</div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{featResult.summary}</div>
                </Card>
              )}

              {/* Next feature */}
              {featResult.nextFeature && (
                <Card style={{ padding: 20, borderTop: `3px solid ${C.accent}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: T.rMd, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileCode size={18} color={C.accent} strokeWidth={IW} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{featResult.nextFeature.name}</div>
                      <div style={{ fontSize: 11, color: C.textSoft }}>{featResult.nextFeature.description}</div>
                    </div>
                    {featResult.pendingFile && (
                      <div style={{ marginLeft: "auto" }}>
                        <Btn
                          onClick={() => applyFeature(featResult.pendingFile)}
                          loading={applyStatus[featResult.pendingFile] === "loading"}
                          icon={applyStatus[featResult.pendingFile] === "done" ? CheckCircle : Rocket}
                        >
                          {applyStatus[featResult.pendingFile] === "done" ? "Übernommen ✓" : applyStatus[featResult.pendingFile]?.startsWith("error") ? "Fehler – retry" : "In src/pages/ übernehmen"}
                        </Btn>
                      </div>
                    )}
                  </div>
                  {applyStatus[featResult.pendingFile] === "done" && (
                    <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: T.rMd, background: "#dcfce7", fontSize: 12, color: "#14532d", fontWeight: 600 }}>
                      ✓ Datei gespeichert — jetzt in App.jsx und Sidebar einbinden!
                    </div>
                  )}
                  {featResult.generatedCode
                    ? <CodeBlock code={featResult.generatedCode} />
                    : <div style={{ fontSize: 13, color: C.textSoft, padding: "20px 0", textAlign: "center" }}>Code wird beim nächsten Scan generiert…</div>
                  }
                </Card>
              )}
            </>
          )}

          {featStatus === "idle" && (
            <Card style={{ padding: 48, textAlign: "center" }}>
              <Package size={40} color={C.textSoft} strokeWidth={IW} style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: C.textMid, marginBottom: 6 }}>Noch keine Feature-Analyse</div>
              <div style={{ fontSize: 12, color: C.textSoft }}>Klicke "Jetzt analysieren" — Ergebnis wird lokal gespeichert und bleibt bis zum nächsten Scan erhalten.</div>
            </Card>
          )}
        </>
      )}

      {/* ─── TAB: Fehler & Fixes ─────────────────────────────────────────────── */}
      {tab === "bugs" && (
        <>
          <Card style={{ padding: 18, marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Fehler-Diagnose starten</div>
              <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>
                {bugResult?.generatedAt
                  ? `Letzter Scan: ${fmtDate(bugResult.generatedAt)} · ${serverStatus?.logCount ?? 0} Fehler geloggt${bugResult._fallback ? " · ⚠ Fallback" : ""}`
                  : "Analysiert geloggte Fehler und gibt konkrete Fix-Vorschläge (~30s)"}
              </div>
            </div>
            <Btn onClick={runBugAnalysis} loading={bugStatus === "loading"} icon={bugStatus === "loading" ? RefreshCw : Zap}>
              {bugStatus === "loading" ? "Analysiere…" : (bugResult ? "Neu scannen" : "Diagnose starten")}
            </Btn>
          </Card>

          {/* Archive */}
          <HistoryPanel
            history={bugHistory}
            label="Diagnosen"
            onRestore={item => { setBugResult(item); setBugStatus("done"); setErrMsg(""); }}
          />

          {bugStatus === "done" && bugResult && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "7px 14px", borderRadius: T.rMd, background: bugResult._fallback ? "#fef3c7" : C.accentLight, border: `1px solid ${bugResult._fallback ? "#fde68a" : C.accent + "30"}`, fontSize: 12, color: bugResult._fallback ? "#92400e" : C.accent, fontWeight: 600 }}>
                <Bot size={12} strokeWidth={IW} />
                {bugResult._fallback ? "⚠ Fallback-Daten" : "KI-Diagnose"}
                {" · "}{fmtDate(bugResult.generatedAt)}
                {bugResult.logCount != null && ` · ${bugResult.logCount} Ereignisse`}
              </div>

              {bugResult.patterns?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
                    Erkannte Fehler-Muster ({bugResult.patterns.length})
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                    {bugResult.patterns.map((p, i) => {
                      const sm = SEVERITY_META[p.severity] || SEVERITY_META.low;
                      return (
                        <div key={i} style={{ padding: "12px 14px", borderRadius: T.rMd, background: C.surface, border: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 20, fontWeight: 900, color: sm.color, fontFamily: FONT_DISPLAY }}>{p.count}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: sm.color, background: sm.bg, padding: "1px 7px", borderRadius: 99 }}>{sm.label}</span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{p.type}</div>
                          <div style={{ fontSize: 11, color: C.textSoft, marginTop: 3, lineHeight: 1.4 }}>{p.description}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {bugResult.suggestions?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
                    Code-Fix-Vorschläge ({bugResult.suggestions.length})
                  </div>
                  {bugResult.suggestions.map((s, i) => <BugSuggestionCard key={i} s={s} idx={i} />)}
                </div>
              )}

              {bugResult.summary && (
                <Card style={{ padding: "14px 18px", marginTop: 20, background: C.accentLight, border: `1px solid ${C.accent}30` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>Fazit</div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{bugResult.summary}</div>
                </Card>
              )}

              {!bugResult.patterns?.length && (
                <Card style={{ padding: 40, textAlign: "center" }}>
                  <CheckCircle size={36} color={C.success} strokeWidth={IW} style={{ margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.textMid }}>Keine kritischen Fehler-Muster</div>
                  <div style={{ fontSize: 12, color: C.textSoft, marginTop: 6 }}>Die App läuft stabil.</div>
                </Card>
              )}
            </>
          )}

          {bugStatus === "idle" && (
            <Card style={{ padding: 48, textAlign: "center" }}>
              <AlertTriangle size={40} color={C.textSoft} strokeWidth={IW} style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: C.textMid }}>Noch keine Diagnose</div>
              <div style={{ fontSize: 12, color: C.textSoft, marginTop: 6 }}>Starte die Diagnose – Ergebnis wird gespeichert und bleibt bis zum nächsten Scan erhalten.</div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
