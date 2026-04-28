import React, { useState } from "react";
import {
  GitCompare, Search, ArrowRight, RefreshCw, Globe,
  TrendingUp, TrendingDown, Minus, AlertCircle,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import AnalysisProgress from "../components/ui/AnalysisProgress.jsx";
import { cleanDomain, analyzeDomain, fmtNum, fmtDate } from "../utils/api.js";
import { useApp } from "../context/AppContext.jsx";

function fmtDur(secs) {
  if (secs == null || isNaN(secs)) return "–";
  const m = Math.floor(secs / 60), s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s < 10 ? "0" : ""}${s}s` : `${s}s`;
}

function fmtK(n) {
  if (n == null || isNaN(n)) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mio.`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} K`;
  return String(n);
}

function KiBadge() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color: C.accent,
      background: C.accentLight, padding: "1px 5px",
      borderRadius: 3, letterSpacing: ".04em", verticalAlign: "middle", marginLeft: 4,
    }}>KI</span>
  );
}

export default function ComparePage() {
  const { persistReport } = useApp();
  const [domains, setDomains] = useState(["", ""]);
  const [reports, setReports] = useState([null, null]);
  const [loading, setLoading] = useState([false, false]);
  const [errors,  setErrors]  = useState(["", ""]);

  function setDomain(idx, val) {
    setDomains(prev => { const n = [...prev]; n[idx] = val; return n; });
  }

  async function analyzeOne(idx, forceDomain) {
    const domain = forceDomain || cleanDomain(domains[idx]);
    if (!domain) return;
    setLoading(prev => { const n = [...prev]; n[idx] = true; return n; });
    setErrors(prev => { const n = [...prev]; n[idx] = ""; return n; });
    try {
      const data = await analyzeDomain(domain);
      setReports(prev => { const n = [...prev]; n[idx] = { domain, ...data }; return n; });
      persistReport(domain, data);
    } catch (e) {
      setErrors(prev => { const n = [...prev]; n[idx] = e.message; return n; });
    } finally {
      setLoading(prev => { const n = [...prev]; n[idx] = false; return n; });
    }
  }

  const both = reports[0] && reports[1];

  // Metric row: left value | label (center) | right value
  function MetricRow({ label, getVal, format = v => v, higherBetter = true, ki = false }) {
    const vals = reports.map(r => r ? getVal(r) : null);
    const winner =
      vals[0] != null && vals[1] != null
        ? higherBetter
          ? vals[0] > vals[1] ? 0 : vals[1] > vals[0] ? 1 : null
          : vals[0] < vals[1] ? 0 : vals[1] < vals[0] ? 1 : null
        : null;

    const COLS = [C.text, C.text];
    if (winner === 0) COLS[0] = C.success;
    if (winner === 1) COLS[1] = C.success;

    return (
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto 1fr",
        gap: 12, alignItems: "center",
        padding: "10px 0", borderBottom: `1px solid ${C.border}`,
      }}>
        {/* Left value */}
        <div style={{ textAlign: "right" }}>
          {vals[0] != null ? (
            <span style={{ fontSize: 17, fontWeight: 800, fontFamily: FONT_DISPLAY, color: COLS[0] }}>
              {format(vals[0])}
              {winner === 0 && <span style={{ fontSize: 10, color: C.success, marginLeft: 4 }}>▲</span>}
            </span>
          ) : (
            <span style={{ fontSize: 14, color: C.textMute }}>–</span>
          )}
        </div>

        {/* Label */}
        <div style={{
          fontSize: 11, fontWeight: 600, color: C.textSoft,
          textTransform: "uppercase", letterSpacing: ".05em",
          whiteSpace: "nowrap", textAlign: "center", minWidth: 130,
        }}>
          {label}{ki && <KiBadge />}
        </div>

        {/* Right value */}
        <div style={{ textAlign: "left" }}>
          {vals[1] != null ? (
            <span style={{ fontSize: 17, fontWeight: 800, fontFamily: FONT_DISPLAY, color: COLS[1] }}>
              {winner === 1 && <span style={{ fontSize: 10, color: C.success, marginRight: 4 }}>▲</span>}
              {format(vals[1])}
            </span>
          ) : (
            <span style={{ fontSize: 14, color: C.textMute }}>–</span>
          )}
        </div>
      </div>
    );
  }

  const EXAMPLE_PAIRS = [
    ["spiegel.de", "faz.de"],
    ["rewe.de", "edeka.de"],
    ["zalando.de", "asos.de"],
  ];

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 24px 60px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: T.rMd, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GitCompare size={22} color={C.accent} strokeWidth={IW} />
        </div>
        <div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Domain-Vergleich</h1>
          <p style={{ fontSize: 13, color: C.textSoft, margin: 0 }}>Zwei Domains analysieren und direkt nebeneinander vergleichen</p>
        </div>
      </div>

      {/* Domain Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 44px 1fr", gap: 12, alignItems: "start", marginBottom: 28 }}>

        {/* Card helper rendered inline for each slot */}
        {[0, 1].reduce((acc, idx) => {
          const card = (
            <Card key={idx} style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                Domain {idx + 1}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={domains[idx]}
                  onChange={e => setDomain(idx, e.target.value)}
                  onKeyDown={e => e.key === "Enter" && analyzeOne(idx)}
                  placeholder={idx === 0 ? "beispiel.de" : "vergleich.de"}
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: T.rMd,
                    border: `1px solid ${C.border}`, background: C.bg,
                    fontFamily: FONT, fontSize: 13, color: C.text, outline: "none",
                  }}
                />
                <Btn onClick={() => analyzeOne(idx)} loading={loading[idx]} icon={loading[idx] ? RefreshCw : Search} size="sm">
                  {loading[idx] ? "…" : "Los"}
                </Btn>
              </div>
              <AnalysisProgress
                loading={loading[idx]}
                accent={C.accent}
                label={`Domain ${idx + 1} analysieren`}
                steps={["Verbinde mit Domain…","Performance messen…","Tech-Stack erkennen…","KI-Insights generieren…"]}
              />
              {errors[idx] && (
                <div style={{ marginTop: 8, fontSize: 12, color: C.danger, display: "flex", gap: 5 }}>
                  <AlertCircle size={13} strokeWidth={IW} />{errors[idx]}
                </div>
              )}
              {reports[idx] && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: C.success + "08", borderRadius: T.rMd, border: `1px solid ${C.success}20` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{reports[idx].domain}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    {reports[idx].ai?.category && <Badge color={C.info} bg={C.infoBg}>{reports[idx].ai.category}</Badge>}
                    {reports[idx].ai?.trendSignal && <Badge color={C.warning} bg={C.warningBg}>{reports[idx].ai.trendSignal}</Badge>}
                  </div>
                </div>
              )}
            </Card>
          );
          if (idx === 1) {
            acc.push(
              <div key="vs" style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 38 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: C.surface, border: `2px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: C.textSoft, letterSpacing: ".04em",
                }}>VS</div>
              </div>
            );
          }
          acc.push(card);
          return acc;
        }, [])}
      </div>

      {/* Quick suggestions */}
      {!both && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, marginBottom: 8 }}>Beispiel-Vergleiche:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EXAMPLE_PAIRS.map(([a, b]) => (
              <button key={a} onClick={() => {
                setDomains([a, b]);
                analyzeOne(0, cleanDomain(a));
                analyzeOne(1, cleanDomain(b));
              }} style={{
                padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.textMid, cursor: "pointer", fontFamily: FONT,
              }}>
                {a} vs {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {both && (
        <Card style={{ padding: 24 }}>
          {/* Domain headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto 1fr",
            gap: 12, marginBottom: 20, paddingBottom: 18,
            borderBottom: `2px solid ${C.border}`,
          }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY }}>{reports[0].domain}</div>
              {reports[0].ai?.summary && (
                <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4, lineHeight: 1.4 }}>
                  {reports[0].ai.summary.slice(0, 100)}…
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 44 }}>
              <GitCompare size={22} color={C.textSoft} strokeWidth={IW} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY }}>{reports[1].domain}</div>
              {reports[1].ai?.summary && (
                <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4, lineHeight: 1.4 }}>
                  {reports[1].ai.summary.slice(0, 100)}…
                </div>
              )}
            </div>
          </div>

          <MetricRow label="Traffic / Monat"       ki getVal={r => r.ai?.trafficEstimate?.monthly}               format={fmtK} />
          <MetricRow label="Absprungrate"           ki getVal={r => r.ai?.behavior?.bounceRate}                   format={v => `${v}%`} higherBetter={false} />
          <MetricRow label="Ø Session-Dauer"        ki getVal={r => r.ai?.behavior?.avgSessionDuration}           format={fmtDur} />
          <MetricRow label="Seiten / Besuch"        ki getVal={r => r.ai?.behavior?.pagesPerSession}              format={v => v.toFixed(1)} />
          <MetricRow label="Organ. Keywords"        ki getVal={r => r.ai?.seo?.organicKeywords}                   format={fmtK} />
          <MetricRow label="SEO-Wert / Monat"       ki getVal={r => r.ai?.seo?.seoValue}                         format={v => `${fmtK(v)} €`} />
          <MetricRow label="PageRank (0–10)"           getVal={r => r.pagerank?.rank}                             format={String} />
          <MetricRow label="Indexierte Seiten"         getVal={r => r.crawl?.indexedPages > 0 ? r.crawl.indexedPages : null} format={fmtNum} />
          <MetricRow label="Domain-Alter (J)"          getVal={r => r.whois?.createdDate ? parseFloat(((Date.now() - new Date(r.whois.createdDate)) / (1000*60*60*24*365.25)).toFixed(1)) : null} format={v => `${v} J`} />

          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: T.rMd, background: C.success + "08", border: `1px solid ${C.success}20`, fontSize: 12, color: C.textSoft, lineHeight: 1.6 }}>
            <strong style={{ color: C.success }}>▲</strong> markiert den besseren Wert je Metrik.
            Alle KI-Werte basieren auf öffentlichen Daten und sind Schätzungen.
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!both && (
        <Card style={{ padding: 52, textAlign: "center" }}>
          <GitCompare size={44} color={C.textSoft} strokeWidth={IW} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.textMid, marginBottom: 8 }}>Beide Domains analysieren</div>
          <p style={{ fontSize: 13, color: C.textSoft, maxWidth: 340, margin: "0 auto" }}>
            Trage oben zwei Domains ein und klicke jeweils auf "Los" — dann erscheint hier der direkte Vergleich.
          </p>
        </Card>
      )}
    </div>
  );
}
