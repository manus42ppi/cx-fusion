import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  Users, Plus, Globe, Trash2, Search,
  TrendingUp, TrendingDown, Minus, ChevronRight, X,
  BookText, Clock, History, ChevronDown, ChevronUp,
  ExternalLink, BarChart2, Code2, AlertTriangle,
  CheckCircle, RefreshCw,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { cleanDomain, fmtDate, loadFullHistory, loadFullHistorySync } from "../utils/api.js";
import { useApp } from "../context/AppContext.jsx";

// ─── Report type registry ─────────────────────────────────────────────────────
// Add new report types HERE — the rest of the page auto-adapts.

const REPORT_TYPES = [
  {
    id:      "website",
    label:   "Website-Analyse",
    icon:    Globe,
    color:   "#0057D9",
    navTo:   "analyze",
    navResult: "report",
    metric:  r => {
      const t = r?.ai?.trafficEstimate?.monthly;
      if (!t) return null;
      if (t >= 1_000_000) return { value: (t / 1_000_000).toFixed(1) + " Mio.", sub: "Traffic/Mo" };
      if (t >= 1_000)     return { value: (t / 1_000).toFixed(1) + "K",          sub: "Traffic/Mo" };
      return { value: String(t), sub: "Traffic/Mo" };
    },
    summaryLine: e => {
      const t = e?.summary?.traffic;
      if (!t) return null;
      if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)} Mio. Traffic/Mo`;
      if (t >= 1_000)     return `${(t / 1_000).toFixed(1)}K Traffic/Mo`;
      return `${t} Traffic/Mo`;
    },
  },
  {
    id:      "content",
    label:   "Content-Audit",
    icon:    BookText,
    color:   "#7c3aed",
    navTo:   "content",
    metric:  r => {
      const n = r?.articleCount ?? r?.articles?.length;
      if (!n) return null;
      return { value: `${n}`, sub: "Artikel" };
    },
    summaryLine: e => {
      const n = e?.summary?.articles;
      const tone = e?.summary?.tone;
      if (n == null && !tone) return null;
      return [n != null ? `${n} Artikel` : null, tone].filter(Boolean).join(" · ");
    },
  },
  {
    id:      "schema",
    label:   "Structure-Audit",
    icon:    Code2,
    color:   "#059669",
    navTo:   "feat-schema-validator",
    metric:  r => {
      const pages = r?.pages;
      if (!pages?.length) return null;
      const ok  = pages.filter(p => p.status === "valid").length;
      const err = pages.filter(p => p.status === "error").length;
      const total = pages.length;
      return { value: `${ok}/${total}`, sub: err > 0 ? `${err} Fehler` : "Seiten OK" };
    },
    summaryLine: e => {
      const sc = e?.summary?.schemaCount;
      const ok = e?.summary?.validCount;
      if (sc == null) return null;
      return `${sc} Schema${sc !== 1 ? "s" : ""}${ok != null ? ` · ${ok} valide` : ""}`;
    },
  },
];

function fmtK(n) {
  if (n == null || isNaN(n)) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mio.`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const TREND_ICONS  = { wachsend: TrendingUp, stabil: Minus, rückläufig: TrendingDown };
const TREND_COLORS = { wachsend: C.success, stabil: "#d97706", rückläufig: "#ef4444" };

// ─── Single report type row ───────────────────────────────────────────────────

const ReportRow = memo(function ReportRow({ typeDef, report, onOpen, onAnalyze }) {
  const { label, icon: Icon, color, metric } = typeDef;
  const hasReport = !!report;
  const m = hasReport ? metric(report) : null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px", borderRadius: T.rMd,
      background: hasReport ? color + "08" : C.bg,
      border: `1px solid ${hasReport ? color + "25" : C.border}`,
    }}>
      {/* Type icon */}
      <div style={{
        width: 32, height: 32, borderRadius: T.rSm, flexShrink: 0,
        background: hasReport ? color + "15" : C.surface,
        border: `1px solid ${hasReport ? color + "25" : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={14} color={hasReport ? color : C.textSoft} strokeWidth={IW} />
      </div>

      {/* Label + date */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: hasReport ? color : C.textSoft }}>{label}</div>
        {hasReport && report.savedAt && (
          <div style={{ fontSize: 10, color: C.textMute, marginTop: 1 }}>
            {fmtDate(report.savedAt)}
          </div>
        )}
      </div>

      {/* Metric */}
      {hasReport && m && (
        <div style={{ textAlign: "right", flexShrink: 0, marginRight: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>{m.value}</div>
          <div style={{ fontSize: 9, color: color + "90", marginTop: 1 }}>{m.sub}</div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        {hasReport && (
          <button
            onClick={onOpen}
            title="Öffnen"
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "5px 12px", borderRadius: T.rSm,
              background: color, color: "#fff",
              border: "none", cursor: "pointer", fontFamily: FONT,
              fontSize: 11, fontWeight: 600,
            }}
          >
            <ChevronRight size={11} strokeWidth={IW} /> Öffnen
          </button>
        )}
        <button
          onClick={onAnalyze}
          title={hasReport ? "Neu analysieren" : "Analysieren"}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "5px 10px", borderRadius: T.rSm,
            background: hasReport ? "transparent" : color + "12",
            color: color, border: `1px solid ${color + "35"}`,
            cursor: "pointer", fontFamily: FONT,
            fontSize: 11, fontWeight: 600,
          }}
        >
          {hasReport
            ? <RefreshCw size={11} strokeWidth={IW} />
            : <><Search size={11} strokeWidth={IW} /> Analysieren</>
          }
        </button>
      </div>
    </div>
  );
});

// ─── History panel ────────────────────────────────────────────────────────────

const HistoryPanel = memo(function HistoryPanel({ domain, onOpen }) {
  const [entries, setEntries] = useState(() => loadFullHistorySync(domain));

  useEffect(() => {
    loadFullHistory(domain).then(setEntries);
  }, [domain]);

  if (!entries?.length) return (
    <div style={{ padding: "10px 0 4px", fontSize: 11, color: C.textMute, textAlign: "center" }}>
      Noch keine Historik – starte eine Analyse.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {entries.map((entry, idx) => {
        const typeDef = REPORT_TYPES.find(t => t.id === entry.type) || REPORT_TYPES[0];
        const { label, icon: Icon, color, summaryLine } = typeDef;
        const sum = summaryLine(entry);

        return (
          <div key={entry.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: T.rMd,
            background: idx === 0 ? color + "08" : C.surface,
            border: `1px solid ${idx === 0 ? color + "25" : C.border}`,
          }}>
            {/* Icon */}
            <div style={{
              width: 28, height: 28, borderRadius: T.rSm, flexShrink: 0,
              background: color + "15", border: `1px solid ${color}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={13} color={color} strokeWidth={IW} />
            </div>

            {/* Label + summary */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
                {idx === 0 && (
                  <span style={{ fontSize: 9, fontWeight: 800, color, background: color + "18", padding: "1px 6px", borderRadius: 99 }}>NEU</span>
                )}
              </div>
              {sum && <div style={{ fontSize: 10, color: C.textMute, marginTop: 1 }}>{sum}</div>}
            </div>

            {/* Date + open */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: C.textMute, display: "flex", alignItems: "center", gap: 3 }}>
                <Clock size={9} strokeWidth={IW} /> {fmtDate(entry.savedAt)}
              </div>
              <button
                onClick={() => onOpen(entry)}
                style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "3px 9px", borderRadius: T.rSm,
                  background: color, color: "#fff",
                  border: "none", cursor: "pointer", fontFamily: FONT,
                  fontSize: 10, fontWeight: 700,
                }}
              >
                <ExternalLink size={9} strokeWidth={IW} /> Laden
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { clients, addClient, removeClient, reports, contentReports, schemaReports, setActiveReport, goNav } = useApp();
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState({ name: "", domain: "" });
  const [formErr, setFormErr]           = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [openHistory, setOpenHistory]   = useState({});

  // Build report map per type for each domain
  function getReport(domain, typeId) {
    if (typeId === "website") return reports[domain];
    if (typeId === "content") return contentReports?.[domain];
    if (typeId === "schema")  return schemaReports?.[domain];
    return null;
  }

  const handleAdd = useCallback((e) => {
    e.preventDefault();
    const name   = form.name.trim();
    const domain = cleanDomain(form.domain);
    if (!name)   return setFormErr("Name erforderlich");
    if (!domain) return setFormErr("Domain erforderlich");
    addClient(name, domain);
    setForm({ name: "", domain: "" });
    setFormErr("");
    setShowForm(false);
  }, [form, addClient]);

  const handleOpen = useCallback((client, entry) => {
    const { type, data } = entry;
    if (type === "website") {
      setActiveReport({ domain: client.domain, ...data });
      goNav("report");
    } else if (type === "content") {
      goNav("content", { domain: client.domain, report: data });
    } else if (type === "schema") {
      // Navigate to schema validator — it will load from saved state
      goNav("feat-schema-validator");
    }
  }, [setActiveReport, goNav]);

  const handleAnalyze = useCallback((client, typeId) => {
    if (typeId === "website") {
      goNav("analyze", { domain: client.domain });
    } else if (typeId === "content") {
      goNav("content", { domain: client.domain });
    } else if (typeId === "schema") {
      goNav("feat-schema-validator");
    }
  }, [goNav]);

  const handleOpenCurrentReport = useCallback((client, typeId) => {
    const report = getReport(client.domain, typeId);
    if (!report) return;
    if (typeId === "website") {
      setActiveReport({ domain: client.domain, ...report });
      goNav("report");
    } else if (typeId === "content") {
      goNav("content", { domain: client.domain, report });
    } else if (typeId === "schema") {
      goNav("feat-schema-validator");
    }
  }, [reports, contentReports, schemaReports, setActiveReport, goNav]);

  const handleDelete = useCallback((id) => {
    if (deleteConfirm === id) {
      removeClient(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  }, [deleteConfirm, removeClient]);

  const toggleHistory = useCallback((id) => {
    setOpenHistory(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const totalReports = useMemo(() => {
    return clients.reduce((sum, c) => {
      return sum + REPORT_TYPES.filter(t => !!getReport(c.domain, t.id)).length;
    }, 0);
  }, [clients, reports, contentReports, schemaReports]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 60px" }}>

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
                ? `${clients.length} Domain${clients.length !== 1 ? "s" : ""} · ${totalReports} gespeicherte Reports`
                : "Kundendomains verwalten und schnell analysieren"}
            </p>
          </div>
        </div>
        <Btn icon={Plus} onClick={() => { setShowForm(true); setFormErr(""); }}>
          Kunde hinzufügen
        </Btn>
      </div>

      {/* Report types legend */}
      {clients.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {REPORT_TYPES.map(({ id, label, icon: Icon, color }) => (
            <div key={id} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
              background: color + "10", border: `1px solid ${color}25`, color,
            }}>
              <Icon size={11} strokeWidth={IW} /> {label}
            </div>
          ))}
          <div style={{ fontSize: 11, color: C.textMute, display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
            <History size={11} strokeWidth={IW} /> Bis zu 5 Reports pro Typ gespeichert
          </div>
        </div>
      )}

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
                  style={{ width: "100%", padding: "9px 12px", borderRadius: T.rMd, border: `1px solid ${C.border}`, background: C.bg, fontFamily: FONT, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, marginBottom: 6 }}>Domain *</div>
                <input
                  value={form.domain}
                  onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                  placeholder="beispiel.de"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: T.rMd, border: `1px solid ${C.border}`, background: C.bg, fontFamily: FONT, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
            {formErr && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{formErr}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn type="submit" icon={Plus}>Speichern</Btn>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Abbrechen</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Empty state */}
      {clients.length === 0 ? (
        <Card style={{ padding: 64, textAlign: "center" }}>
          <Users size={44} color={C.textSoft} strokeWidth={IW} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.textMid, marginBottom: 8 }}>Noch keine Kunden</div>
          <p style={{ fontSize: 13, color: C.textSoft, maxWidth: 360, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Speichere Kundendomains und starte Website-Analyse, Content-Audit und Structure-Audit — alle Reports werden automatisch hier gespeichert.
          </p>
          <Btn icon={Plus} onClick={() => setShowForm(true)}>Ersten Kunden hinzufügen</Btn>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clients.map(client => {
            const ai         = reports[client.domain]?.ai || {};
            const TrendIcon  = TREND_ICONS[ai.trendSignal] || Minus;
            const trendColor = TREND_COLORS[ai.trendSignal] || C.textSoft;
            const anyReport  = REPORT_TYPES.some(t => !!getReport(client.domain, t.id));
            const isHistOpen = !!openHistory[client.id];
            const reportCount = REPORT_TYPES.filter(t => !!getReport(client.domain, t.id)).length;

            return (
              <Card key={client.id} style={{ padding: 0, overflow: "hidden" }}>

                {/* ── Client header ─────────────────────────────────────────── */}
                <div style={{ padding: "14px 18px 12px", display: "flex", alignItems: "flex-start", gap: 14 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: T.rMd, flexShrink: 0,
                    background: anyReport ? C.accentLight : C.bg,
                    border: `1px solid ${anyReport ? C.accent + "30" : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, color: C.accent,
                  }}>
                    {client.name.slice(0, 1).toUpperCase()}
                  </div>

                  {/* Name, domain, tags */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{client.name}</div>
                      {reportCount > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: C.accent, background: C.accentLight, padding: "1px 6px", borderRadius: 99 }}>
                          {reportCount}/{REPORT_TYPES.length} Reports
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSoft, fontFamily: "monospace", marginTop: 1 }}>{client.domain}</div>
                    {(ai.category || ai.audienceType || ai.trendSignal) && (
                      <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                        {ai.category     && <Badge color={C.info}    bg={C.infoBg    || "#e0f2fe"}>{ai.category}</Badge>}
                        {ai.audienceType && <Badge color="#d97706"   bg="#fef3c7">{ai.audienceType}</Badge>}
                        {ai.trendSignal  && (
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <TrendIcon size={10} color={trendColor} strokeWidth={IW} />
                            <span style={{ fontSize: 10, fontWeight: 600, color: trendColor }}>{ai.trendSignal}</span>
                          </div>
                        )}
                      </div>
                    )}
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

                {/* ── Report rows ───────────────────────────────────────────── */}
                <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {REPORT_TYPES.map(typeDef => (
                    <ReportRow
                      key={typeDef.id}
                      typeDef={typeDef}
                      report={getReport(client.domain, typeDef.id)}
                      onOpen={() => handleOpenCurrentReport(client, typeDef.id)}
                      onAnalyze={() => handleAnalyze(client, typeDef.id)}
                    />
                  ))}
                </div>

                {/* ── History toggle ────────────────────────────────────────── */}
                <button
                  onClick={() => toggleHistory(client.id)}
                  style={{
                    width: "100%", padding: "8px 18px",
                    background: C.bg, border: "none",
                    borderTop: `1px solid ${C.border}`,
                    cursor: "pointer", fontFamily: FONT,
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 11, color: C.textSoft, fontWeight: 600,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface}
                  onMouseLeave={e => e.currentTarget.style.background = C.bg}
                >
                  <History size={11} strokeWidth={IW} color={C.accent} />
                  Report-Verlauf (max. 5 pro Typ)
                  <div style={{ marginLeft: "auto" }}>
                    {isHistOpen ? <ChevronUp size={12} strokeWidth={IW} /> : <ChevronDown size={12} strokeWidth={IW} />}
                  </div>
                </button>

                {isHistOpen && (
                  <div style={{ padding: "12px 18px 16px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
                    <HistoryPanel
                      domain={client.domain}
                      onOpen={entry => handleOpen(client, entry)}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
