import React, { useState } from "react";
import { Globe, Plus, Trash2, TrendingUp, TrendingDown, Minus, Search, ExternalLink, Clock, X } from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge, SectionTitle, Divider } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import { fmtDate, fmtNum, loadReports } from "../utils/api.js";

const TREND_ICON  = { wachsend: TrendingUp, stabil: Minus, rückläufig: TrendingDown };
const TREND_COLOR = { wachsend: C.success,  stabil: C.warning, rückläufig: "#ef4444" };

function calcGrade(rep) {
  const behavior = rep?.ai?.behavior || {};
  const perf = rep?.tech?.perf || {};
  const scores = [];
  if (perf.perfScore != null)       scores.push(perf.perfScore);
  if (perf.secScore != null)        scores.push((perf.secScore / 6) * 100);
  if (behavior.bounceRate != null)  scores.push(100 - behavior.bounceRate);
  if (rep?.whois?.createdDate)      scores.push(Math.min(((Date.now() - new Date(rep.whois.createdDate)) / (1e3*60*60*24*365.25)) * 8, 100));
  if (rep?.pagerank?.rank != null)  scores.push(rep.pagerank.rank * 10);
  if (!scores.length) return null;
  const s = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return s >= 80 ? "A" : s >= 65 ? "B" : s >= 50 ? "C" : s >= 35 ? "D" : "F";
}
function gradeColor(g) {
  return g === "A" ? C.success : g === "B" ? C.info : g === "C" ? C.warning : "#ef4444";
}

export default function DashboardPage() {
  const { clients, addClient, removeClient, goNav } = useApp();
  const [newDomain, setNewDomain] = useState("");
  const [newName,   setNewName]   = useState("");
  const [showAdd,   setShowAdd]   = useState(false);

  const inp = (v, set) => (
    <input value={v} onChange={e => set(e.target.value)}
      style={{
        width: "100%", background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: T.rMd, color: C.text, fontSize: 13, padding: "8px 12px",
        fontFamily: FONT, outline: "none", boxShadow: "inset 0 1px 2px rgba(0,0,0,.04)",
        transition: "border-color 0.15s",
      }}
      onFocus={e => e.target.style.borderColor = C.accent}
      onBlur={e => e.target.style.borderColor = C.border}
    />
  );

  function handleAdd() {
    if (!newDomain.trim()) return;
    addClient(newName.trim() || newDomain.trim(), newDomain.trim());
    setNewDomain(""); setNewName(""); setShowAdd(false);
  }

  const savedReports = loadReports();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: C.textSoft, marginTop: 3 }}>Kunden und gespeicherte Analysen</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => goNav("analyze")} icon={Search}>Neue Analyse</Btn>
          <Btn variant="surface" icon={Plus} onClick={() => setShowAdd(v => !v)}>Kunde hinzufügen</Btn>
        </div>
      </div>

      {/* Add Client Form */}
      {showAdd && (
        <Card style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Neuen Kunden anlegen</span>
            <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSoft, display: "flex" }}>
              <X size={16} strokeWidth={IW} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 5, fontWeight: 500 }}>Kundenname</div>
              {inp(newName, setNewName)}
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 5, fontWeight: 500 }}>Domain</div>
              {inp(newDomain, setNewDomain)}
            </div>
            <Btn onClick={handleAdd} disabled={!newDomain.trim()}>Hinzufügen</Btn>
          </div>
        </Card>
      )}

      {/* Client Grid */}
      <SectionTitle sub={`${clients.length} Kunden`}>Kunden</SectionTitle>
      {clients.length === 0 ? (
        <Card style={{ padding: 48, textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: C.accentLight, display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 14px",
          }}>
            <Globe size={22} color={C.accent} strokeWidth={IW} />
          </div>
          <p style={{ color: C.textSoft, fontSize: 14, marginBottom: 14 }}>
            Noch keine Kunden. Füge einen hinzu oder starte direkt eine Analyse.
          </p>
          <Btn onClick={() => goNav("analyze")} icon={Search}>Jetzt analysieren</Btn>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 14, marginBottom: 28 }}>
          {clients.map(c => {
            const rep = savedReports[c.domain];
            return (
              <Card key={c.id} hover style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: T.rMd,
                      background: C.accentLight,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Globe size={16} color={C.accent} strokeWidth={IW} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: C.textSoft }}>{c.domain}</div>
                    </div>
                  </div>
                  <button onClick={() => removeClient(c.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.textMute, display: "flex" }}>
                    <Trash2 size={13} strokeWidth={IW} />
                  </button>
                </div>

                {rep && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                    {rep.ai?.trafficEstimate?.monthly && (
                      <Badge color={C.success} bg={C.successBg}>
                        <TrendingUp size={10} strokeWidth={IW} />
                        ~{fmtNum(rep.ai.trafficEstimate.monthly)}/Mo
                      </Badge>
                    )}
                    {(() => { const g = calcGrade(rep); return g ? (
                      <span style={{
                        fontSize: 11, fontWeight: 800, fontFamily: FONT_DISPLAY,
                        color: gradeColor(g), background: gradeColor(g) + "18",
                        padding: "1px 7px", borderRadius: 4, border: `1px solid ${gradeColor(g)}30`,
                      }}>{g}</span>
                    ) : null; })()}
                    {rep.ai?.trendSignal && (() => {
                      const Icon = TREND_ICON[rep.ai.trendSignal] || Minus;
                      const col = TREND_COLOR[rep.ai.trendSignal] || C.textSoft;
                      return <Icon size={12} color={col} strokeWidth={IW} />;
                    })()}
                  </div>
                )}

                {rep && (
                  <div style={{ fontSize: 11, color: C.textMute, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={10} strokeWidth={IW} />
                    Analyse: {fmtDate(rep.savedAt)}
                  </div>
                )}

                <Divider style={{ marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn size="sm" icon={Search} onClick={() => goNav("analyze")} style={{ flex: 1 }}>Analysieren</Btn>
                  {rep && (
                    <Btn size="sm" variant="surface" icon={ExternalLink} onClick={() => goNav("report", { report: rep })}>
                      Report
                    </Btn>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Reports */}
      {Object.keys(savedReports).length > 0 && (
        <>
          <SectionTitle sub="Zuletzt analysierte Domains">Letzte Reports</SectionTitle>
          <Card style={{ overflow: "hidden" }}>
            {Object.entries(savedReports).slice(0, 8).map(([domain, rep], i, arr) => (
              <div
                key={domain}
                onClick={() => goNav("report", { report: rep })}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 18px", cursor: "pointer",
                  borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: T.rSm,
                  background: C.accentLight,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Globe size={14} color={C.accent} strokeWidth={IW} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: 1 }}>{domain}</span>
                {rep.ai?.trafficEstimate?.monthly && (
                  <Badge color={C.info} bg={C.infoBg}>
                    ~{fmtNum(rep.ai.trafficEstimate.monthly)}/Mo
                  </Badge>
                )}
                {rep.ai?.category && (
                  <span style={{ fontSize: 12, color: C.textSoft }}>{rep.ai.category}</span>
                )}
                {rep.ai?.trendSignal && (() => {
                  const Icon = TREND_ICON[rep.ai.trendSignal] || Minus;
                  const col = TREND_COLOR[rep.ai.trendSignal] || C.textSoft;
                  return <Icon size={13} color={col} strokeWidth={IW} />;
                })()}
                <span style={{ fontSize: 12, color: C.textMute }}>{fmtDate(rep.savedAt)}</span>
                <ExternalLink size={13} color={C.textMute} strokeWidth={IW} />
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
