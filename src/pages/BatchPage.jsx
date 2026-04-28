import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  Upload, Play, Download, AlertCircle, CheckCircle,
  RefreshCw, Globe, X, BarChart2, Zap, Shield,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import AnalysisProgress from "../components/ui/AnalysisProgress.jsx";

const COL_LABELS = {
  domain: "Domain",
  traffic: "Traffic/Mo",
  seoValue: "SEO-Wert",
  bounceRate: "Bounce",
  perfScore: "Perf.",
  rank: "PageRank",
  category: "Kategorie",
  trend: "Trend",
};

const TREND_COLOR = { wachsend: "#16a34a", stabil: "#d97706", "rückläufig": "#dc2626" };

function parseDomains(text) {
  return text
    .split(/[\n,;]+/)
    .map(d => d.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase())
    .filter(d => d && d.includes(".") && d.length > 3)
    .slice(0, 50);
}

async function analyzeDomain(domain) {
  const endpoints = ["/analyze", "https://socialflow-pro.pages.dev/analyze"];
  for (const url of endpoints) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
        signal: AbortSignal.timeout(60000),
      });
      if (!r.ok) continue;
      return await r.json();
    } catch {}
  }
  throw new Error("Analyse fehlgeschlagen");
}

export default function BatchPage() {
  const [input, setInput]         = useState("");
  const [domains, setDomains]     = useState([]);
  const [results, setResults]     = useState({});
  const [running, setRunning]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [dragOver, setDragOver]   = useState(false);
  const [cols, setCols]           = useState(["domain", "traffic", "seoValue", "bounceRate", "perfScore", "trend"]);
  const fileRef = useRef(null);
  const abortRef = useRef(false);

  function parseCsvFile(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const domains = [];
    for (const line of lines) {
      const cell = line.split(/[,;]/)[0].replace(/"/g, "").trim();
      if (cell.includes(".")) domains.push(cell);
    }
    return domains;
  }

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const found = parseCsvFile(text);
      setInput(found.join("\n"));
      setDomains(parseDomains(found.join("\n")));
    };
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleParse() {
    setDomains(parseDomains(input));
    setResults({});
  }

  async function runBatch() {
    const list = parseDomains(input);
    if (!list.length) return;
    setDomains(list); setResults({}); setRunning(true); setProgress(0);
    abortRef.current = false;

    for (let i = 0; i < list.length; i++) {
      if (abortRef.current) break;
      const domain = list[i];
      setResults(prev => ({ ...prev, [domain]: { status: "loading" } }));
      try {
        const data = await analyzeDomain(domain);
        const ai = data?.ai || {};
        const pr = data?.pagerank || {};
        const beh = ai?.behavior || {};
        const perf = data?.pagespeed || {};
        setResults(prev => ({
          ...prev,
          [domain]: {
            status: "ok",
            traffic: ai.trafficEstimate?.monthly,
            seoValue: ai.seo?.seoValue,
            bounceRate: beh.bounceRate,
            perfScore: perf?.score,
            rank: pr.rank,
            category: ai.category,
            trend: ai.trendSignal,
          },
        }));
      } catch (e) {
        setResults(prev => ({ ...prev, [domain]: { status: "error", error: e.message } }));
      }
      setProgress(i + 1);
    }
    setRunning(false);
  }

  function stopBatch() { abortRef.current = true; setRunning(false); }

  function exportCSV() {
    const header = cols.map(c => COL_LABELS[c] || c);
    const rows = domains.map(d => {
      const r = results[d] || {};
      return cols.map(c => {
        if (c === "domain") return d;
        return r[c] != null ? String(r[c]) : "–";
      });
    });
    const csv = [header, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `batch-analyse-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const parsedDomains = useMemo(() => parseDomains(input), [input]);
  const hasResults = useMemo(() => Object.keys(results).length > 0, [results]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 60px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: T.rMd, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart2 size={22} color="#0891b2" strokeWidth={IW} />
        </div>
        <div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Batch-Analyse</h1>
          <p style={{ fontSize: 13, color: C.textSoft, margin: 0 }}>Bis zu 50 Domains gleichzeitig analysieren · CSV-Export</p>
        </div>
      </div>

      {/* Input */}
      <Card style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* CSV Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              width: 160, height: 160, borderRadius: T.rMd, flexShrink: 0,
              border: `2px dashed ${dragOver ? C.accent : C.border}`,
              background: dragOver ? C.accentLight : C.bg,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              cursor: "pointer", gap: 8, transition: "all .15s",
            }}>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            <Upload size={28} color={dragOver ? C.accent : C.textMute} strokeWidth={IW} />
            <div style={{ fontSize: 11, color: C.textMute, textAlign: "center", lineHeight: 1.4 }}>
              CSV / TXT<br />hier ablegen<br />oder klicken
            </div>
          </div>

          {/* Textarea */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={"spiegel.de\nheise.de\nzalando.de\n…"}
              rows={6}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: T.rMd,
                border: `1px solid ${C.border}`, background: C.bg,
                fontFamily: "monospace", fontSize: 13, color: C.text,
                resize: "vertical", outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Btn onClick={running ? stopBatch : runBatch} loading={running} icon={running ? X : Play}
                style={{ background: running ? "#dc2626" : C.accent }}>
                {running ? `Stopp (${progress}/${domains.length})` : `${parsedDomains.length} Domains analysieren`}
              </Btn>
              {hasResults && (
                <Btn variant="ghost" icon={Download} onClick={exportCSV}>CSV exportieren</Btn>
              )}
              <span style={{ fontSize: 11, color: C.textMute, marginLeft: "auto" }}>
                {parsedDomains.length}/50 Domains
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress */}
      {running && (
        <div style={{ marginBottom: 16 }}>
          <AnalysisProgress
            loading={running}
            accent={C.accent}
            label={`${progress}/${domains.length} Domains`}
            steps={domains.slice(Math.max(0, progress - 1), progress + 3).map(d => `Analysiere ${d}…`)}
          />
          {/* Deterministic batch progress bar */}
          <div style={{ marginTop: 10, height: 5, borderRadius: 99, background: C.border }}>
            <div style={{ height: 5, borderRadius: 99, background: C.success, width: `${domains.length ? (progress / domains.length) * 100 : 0}%`, transition: "width .4s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10, color: C.textMute }}>
            <span>{domains[progress] || "Abschließen…"}</span>
            <span>{Math.round(domains.length ? (progress / domains.length) * 100 : 0)}%</span>
          </div>
        </div>
      )}

      {/* Results Table */}
      {hasResults && (
        <Card style={{ padding: 20 }}>
          {/* Column selector */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, marginRight: 4 }}>Spalten:</span>
            {Object.entries(COL_LABELS).filter(([k]) => k !== "domain").map(([id, label]) => (
              <button key={id} onClick={() => setCols(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id])}
                style={{
                  padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${cols.includes(id) ? C.accent : C.border}`,
                  background: cols.includes(id) ? C.accentLight : "transparent",
                  color: cols.includes(id) ? C.accent : C.textMid, cursor: "pointer", fontFamily: FONT,
                }}>{label}</button>
            ))}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {cols.map(c => (
                    <th key={c} style={{ textAlign: "left", padding: "7px 10px", color: C.textSoft, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>
                      {COL_LABELS[c] || c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {domains.map(d => {
                  const res = results[d];
                  return (
                    <tr key={d} style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {cols.map(c => {
                        let cell = "–";
                        let color = C.textMid;
                        if (c === "domain") {
                          cell = d;
                          color = C.text;
                        } else if (!res) {
                          cell = "…";
                          color = C.textMute;
                        } else if (res.status === "loading") {
                          cell = "⏳";
                          color = C.textMute;
                        } else if (res.status === "error") {
                          cell = c === "domain" ? d : "Fehler";
                          color = "#dc2626";
                        } else if (res[c] != null) {
                          if (c === "traffic")    cell = `~${(res[c] / 1000).toFixed(0)}k`;
                          else if (c === "seoValue") cell = `${res[c].toLocaleString("de-DE")} €`;
                          else if (c === "bounceRate") { cell = `${res[c]}%`; color = res[c] > 70 ? "#dc2626" : res[c] > 50 ? "#d97706" : "#16a34a"; }
                          else if (c === "perfScore")  { cell = String(res[c]); color = res[c] >= 80 ? "#16a34a" : res[c] >= 50 ? "#d97706" : "#dc2626"; }
                          else if (c === "trend")  { cell = res[c]; color = TREND_COLOR[res[c]] || C.textMid; }
                          else cell = String(res[c]);
                        }
                        return (
                          <td key={c} style={{ padding: "9px 10px", color, fontWeight: c === "domain" ? 600 : 400, fontFamily: c === "domain" ? "monospace" : FONT }}>
                            {res?.status === "loading" && c === "domain" ? (
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <RefreshCw size={11} color={C.accent} strokeWidth={IW} style={{ animation: "spin 1s linear infinite" }} />{d}
                              </span>
                            ) : cell}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!hasResults && !running && (
        <Card style={{ padding: 52, textAlign: "center" }}>
          <Globe size={44} color={C.textSoft} strokeWidth={IW} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.textMid, marginBottom: 8 }}>Domains eingeben oder CSV hochladen</div>
          <p style={{ fontSize: 13, color: C.textSoft, maxWidth: 380, margin: "0 auto" }}>
            Eine Domain pro Zeile oder kommasepariert — maximal 50 Domains pro Batch.
          </p>
        </Card>
      )}
    </div>
  );
}
