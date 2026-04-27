import React, { useState } from "react";
import {
  Users, Plus, Globe, Trash2, Search, Calendar,
  TrendingUp, TrendingDown, Minus, ChevronRight, X,
  BookText, Clock, History, ChevronDown, ChevronUp,
  BarChart2, FileText,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { cleanDomain, fmtNum, fmtDate } from "../utils/api.js";
import { useApp } from "../context/AppContext.jsx";

function fmtK(n) {
  if (n == null || isNaN(n)) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mio.`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} K`;
  return String(n);
}

const TREND_ICONS  = { wachsend: TrendingUp, stabil: Minus, rückläufig: TrendingDown };
const TREND_COLORS = { wachsend: C.success, stabil: C.warning, rückläufig: "#ef4444" };

function ReportBox({ type, report, onOpen, onAnalyze }) {
  const isWebsite = type === "website";
  const icon = isWebsite ? Globe : BookText;
  const Icon = icon;
  const label = isWebsite ? "Website-Analyse" : "Content-Audit";
  const accent = isWebsite ? C.accent : "#7c3aed";
  const accentBg = isWebsite ? C.accentLight : "#ede9fe";

  const hasReport = !!report;
  const metric = isWebsite
    ? (fmtK(report?.ai?.trafficEstimate?.monthly) || null)
    : (report?.articleCount ? `${report.articleCount} Art.` : null);
  const metricSub = isWebsite ? "Traffic/Mo" : "Artikel";

  return (
    <div style={{
      flex: 1, padding: "14px 16px", borderRadius: T.rMd,
      background: hasReport ? accentBg + "60" : C.bg,
      border: `1px solid ${hasReport ? accent + "30" : C.border}`,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: T.rSm, flexShrink: 0,
          background: hasReport ? accent + "20" : C.surface,
          border: `1px solid ${hasReport ? accent + "30" : C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={13} color={hasReport ? accent : C.textSoft} strokeWidth={IW} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: hasReport ? accent : C.textSoft }}>{label}</div>
        {hasReport && metric && (
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: accent, lineHeight: 1 }}>{metric}</div>
            <div style={{ fontSize: 9, color: accent + "80" }}>{metricSub}</div>
          </div>
        )}
      </div>

      {hasReport && report.savedAt && (
        <div style={{ fontSize: 10, color: C.textMute, display: "flex", alignItems: "center", gap: 3 }}>
          <Clock size={9} strokeWidth={IW} />
          {fmtDate(report.savedAt)}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
        {hasReport && (
          <button
            onClick={onOpen}
            style={{
              flex: 1, padding: "6px 10px", borderRadius: T.rSm,
              background: accent, color: "#fff",
              border: "none", cursor: "pointer", fontFamily: FONT,
              fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}
          >
            <ChevronRight size={11} strokeWidth={IW} /> Öffnen
          </button>
        )}
        <button
          onClick={onAnalyze}
          style={{
            flex: hasReport ? 0 : 1, padding: "6px 10px", borderRadius: T.rSm,
            background: hasReport ? "transparent" : accentBg,
            color: accent, border: `1px solid ${accent + "40"}`,
            cursor: "pointer", fontFamily: FONT,
            fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            whiteSpace: "nowrap",
          }}
        >
          <Search size={11} strokeWidth={IW} /> {hasReport ? "Neu" : "Analysieren"}
        </button>
      </div>
    </div>
  );
}

function HistoryPanel({ history }) {
  if (!history?.length) return (
    <div style={{ padding: "10px 0", fontSize: 11, color: C.textMute, textAlign: "center" }}>
      Noch keine Report-Historie
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {history.map(entry => {
        const isWebsite = entry.type === "website";
        const accent = isWebsite ? C.accent : "#7c3aed";
        const Icon = isWebsite ? Globe : BookText;
        const label = isWebsite ? "Website" : "Content";
        const metricParts = [];
        if (isWebsite) {
          if (entry.summary?.traffic) metricParts.push(`${fmtK(entry.summary.traffic)} Traffic`);
          if (entry.summary?.score)   metricParts.push(`Score ${entry.summary.score}`);
        } else {
          if (entry.summary?.articles) metricParts.push(`${entry.summary.articles} Art.`);
          if (entry.summary?.tone)     metricParts.push(entry.summary.tone);
        }

        return (
          <div key={entry.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "7px 10px", borderRadius: T.rSm,
            background: C.bg, border: `1px solid ${C.border}`,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: T.rSm, flexShrink: 0,
              background: accent + "15", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={11} color={accent} strokeWidth={IW} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: accent }}>{label}-Report</span>
              {metricParts.length > 0 && (
                <span style={{ fontSize: 10, color: C.textMute, marginLeft: 6 }}>{metricParts.join(" · ")}</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: C.textMute, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}>
              <Calendar size={9} strokeWidth={IW} />
              {fmtDate(entry.savedAt)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ClientsPage() {
  const { clients, addClient, removeClient, reports, contentReports, clientHistory, setActiveReport, goNav } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "" });
  const [formErr, setFormErr] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [openHistory, setOpenHistory] = useState({});

  function handleAdd(e) {
    e.preventDefault();
    const name   = form.name.trim();
    const domain = cleanDomain(form.domain);
    if (!name)   return setFormErr("Name erforderlich");
    if (!domain) return setFormErr("Domain erforderlich");
    addClient(name, domain);
    setForm({ name: "", domain: "" });
    setFormErr("");
    setShowForm(false);
  }

  function openWebsiteReport(client) {
    const cached = reports[client.domain];
    if (cached) {
      setActiveReport({ domain: client.domain, ...cached });
      goNav("report");
    } else {
      goNav("analyze", { domain: client.domain });
    }
  }

  function openContentReport(client) {
    const cached = contentReports[client.domain];
    goNav("content", { domain: client.domain, report: cached || null });
  }

  function handleDelete(id) {
    if (deleteConfirm === id) {
      removeClient(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  }

  function toggleHistory(id) {
    setOpenHistory(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 60px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: T.rMd, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={22} color={C.accent} strokeWidth={IW} />
          </div>
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Kunden</h1>
            <p style={{ fontSize: 13, color: C.textSoft, margin: 0 }}>
              {clients.length > 0
                ? `${clients.length} gespeicherte Domain${clients.length !== 1 ? "s" : ""}`
                : "Kundendomains verwalten und schnell analysieren"}
            </p>
          </div>
        </div>
        <Btn icon={Plus} onClick={() => { setShowForm(true); setFormErr(""); }}>
          Kunde hinzufügen
        </Btn>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card style={{ padding: 20, marginBottom: 20, borderTop: `3px solid ${C.accent}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Neuer Kunde</div>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <X size={16} color={C.textSoft} strokeWidth={IW} />
            </button>
          </div>
          <form onSubmit={handleAdd}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, marginBottom: 6 }}>Kundenname *</div>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="z.B. Müller GmbH"
                  autoFocus
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: T.rMd,
                    border: `1px solid ${C.border}`, background: C.bg,
                    fontFamily: FONT, fontSize: 13, color: C.text, outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, marginBottom: 6 }}>Domain *</div>
                <input
                  value={form.domain}
                  onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                  placeholder="beispiel.de"
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: T.rMd,
                    border: `1px solid ${C.border}`, background: C.bg,
                    fontFamily: FONT, fontSize: 13, color: C.text, outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            {formErr && (
              <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{formErr}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn type="submit" icon={Plus}>Speichern</Btn>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Abbrechen</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Clients list */}
      {clients.length === 0 ? (
        <Card style={{ padding: 64, textAlign: "center" }}>
          <Users size={44} color={C.textSoft} strokeWidth={IW} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.textMid, marginBottom: 8 }}>Noch keine Kunden</div>
          <p style={{ fontSize: 13, color: C.textSoft, maxWidth: 340, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Speichere Kundendomains hier, um schnell Website-Analyse und Content-Audit starten zu können.
          </p>
          <Btn icon={Plus} onClick={() => setShowForm(true)}>Ersten Kunden hinzufügen</Btn>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clients.map(client => {
            const webReport     = reports[client.domain];
            const contentReport = contentReports?.[client.domain];
            const history       = clientHistory?.[client.domain] || [];
            const ai            = webReport?.ai || {};
            const TrendIcon     = TREND_ICONS[ai.trendSignal] || Minus;
            const trendColor    = TREND_COLORS[ai.trendSignal] || C.textSoft;
            const hasAnyReport  = !!(webReport || contentReport);
            const isHistOpen    = !!openHistory[client.id];

            return (
              <Card key={client.id} style={{ padding: 0, overflow: "hidden" }}>

                {/* Main row */}
                <div style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 16 }}>

                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: T.rMd, flexShrink: 0, marginTop: 2,
                    background: hasAnyReport ? C.accentLight : C.bg,
                    border: `1px solid ${hasAnyReport ? C.accent + "30" : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Globe size={20} color={hasAnyReport ? C.accent : C.textSoft} strokeWidth={IW} />
                  </div>

                  {/* Name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{client.name}</div>
                    <div style={{ fontSize: 12, color: C.textSoft, fontFamily: "monospace", marginTop: 1 }}>{client.domain}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {ai.category     && <Badge color={C.info}    bg={C.infoBg}>{ai.category}</Badge>}
                      {ai.audienceType && <Badge color={C.warning} bg={C.warningBg}>{ai.audienceType}</Badge>}
                      {ai.trendSignal  && (
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <TrendIcon size={11} color={trendColor} strokeWidth={IW} />
                          <span style={{ fontSize: 10, fontWeight: 600, color: trendColor }}>{ai.trendSignal}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(client.id)}
                    title={deleteConfirm === client.id ? "Nochmal klicken zum Bestätigen" : "Kunde entfernen"}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30, borderRadius: T.rSm, flexShrink: 0,
                      background: deleteConfirm === client.id ? "#ef444420" : "transparent",
                      border: `1px solid ${deleteConfirm === client.id ? "#ef4444" : C.border}`,
                      color: deleteConfirm === client.id ? "#ef4444" : C.textSoft,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} strokeWidth={IW} />
                  </button>
                </div>

                {/* Report boxes */}
                <div style={{
                  padding: "0 20px 16px",
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
                }}>
                  <ReportBox
                    type="website"
                    report={webReport}
                    onOpen={() => openWebsiteReport(client)}
                    onAnalyze={() => goNav("analyze", { domain: client.domain })}
                  />
                  <ReportBox
                    type="content"
                    report={contentReport}
                    onOpen={() => openContentReport(client)}
                    onAnalyze={() => goNav("content", { domain: client.domain })}
                  />
                </div>

                {/* History toggle */}
                {history.length > 0 && (
                  <>
                    <button
                      onClick={() => toggleHistory(client.id)}
                      style={{
                        width: "100%", padding: "8px 20px",
                        background: C.bg, border: "none",
                        borderTop: `1px solid ${C.border}`,
                        cursor: "pointer", fontFamily: FONT,
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: 11, color: C.textSoft, fontWeight: 600,
                      }}
                    >
                      <History size={12} strokeWidth={IW} />
                      {history.length} Report{history.length !== 1 ? "s" : ""} in der Historie
                      {isHistOpen
                        ? <ChevronUp size={12} strokeWidth={IW} style={{ marginLeft: "auto" }} />
                        : <ChevronDown size={12} strokeWidth={IW} style={{ marginLeft: "auto" }} />}
                    </button>
                    {isHistOpen && (
                      <div style={{ padding: "12px 20px 16px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
                        <HistoryPanel history={history} />
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
