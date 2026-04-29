import React, { useState, useEffect, useRef, useCallback } from "react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import {
  Bell,
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  Globe,
  Settings,
  ChevronRight,
  ChevronDown,
  X,
  Plus,
  Trash2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Link2,
  Zap,
  Clock,
  Filter,
  Mail,
  Webhook,
  Check,
  BarChart2,
  Calendar,
  ExternalLink,
  Eye,
  Loader,
  Search,
  Sliders,
} from "lucide-react";

const AI_URL = "/ai";
const AI_FALLBACK = "https://socialflow-pro.pages.dev/ai";

async function callAI(messages) {
  const body = JSON.stringify({ messages });
  try {
    const r = await fetch(AI_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    if (r.ok) return await r.json();
  } catch (_) {}
  try {
    const r = await fetch(AI_FALLBACK, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    if (r.ok) return await r.json();
  } catch (e) {
    console.error("AI call failed", e);
  }
  return null;
}

const SEVERITY = {
  critical: { label: "Kritisch", color: C.error || "#E53E3E", bg: "#FFF5F5" },
  warning: { label: "Warnung", color: C.warning || "#D69E2E", bg: "#FFFFF0" },
  info: { label: "Info", color: C.info || "#3182CE", bg: "#EBF8FF" },
};

const METRIC_TYPES = [
  { id: "traffic", label: "Traffic-Veränderung", icon: TrendingDown, unit: "%" },
  { id: "ranking", label: "Ranking-Bewegung", icon: BarChart2, unit: "Position" },
  { id: "backlinks_lost", label: "Verlorene Backlinks", icon: Link2, unit: "Links" },
  { id: "backlinks_new", label: "Neue Backlinks", icon: Link2, unit: "Links" },
  { id: "broken_links", label: "Broken Links", icon: AlertTriangle, unit: "Links" },
  { id: "performance", label: "Performance-Einbruch", icon: Zap, unit: "ms" },
];

const MOCK_DOMAINS = [
  { id: 1, domain: "example-shop.de", status: "red", lastCheck: "vor 2 Std.", alerts: 3, rules: 5 },
  { id: 2, domain: "agency-client.com", status: "yellow", lastCheck: "vor 1 Std.", alerts: 1, rules: 4 },
  { id: 3, domain: "blog-portal.de", status: "green", lastCheck: "vor 30 Min.", alerts: 0, rules: 3 },
  { id: 4, domain: "ecommerce-brand.eu", status: "red", lastCheck: "vor 3 Std.", alerts: 2, rules: 6 },
  { id: 5, domain: "local-business.de", status: "green", lastCheck: "vor 45 Min.", alerts: 0, rules: 2 },
  { id: 6, domain: "saas-product.io", status: "yellow", lastCheck: "vor 1.5 Std.", alerts: 1, rules: 4 },
];

const MOCK_ALERTS = [
  { id: 1, domainId: 1, domain: "example-shop.de", severity: "critical", type: "traffic", title: "Traffic-Einbruch -42%", desc: "Organischer Traffic ist um 42% gefallen im Vergleich zur Vorwoche.", ts: "2025-01-15 09:23", read: false, urls: ["/produkte", "/kategorie/schuhe"] },
  { id: 2, domainId: 4, domain: "ecommerce-brand.eu", severity: "critical", type: "broken_links", title: "23 neue Broken Links", desc: "23 interne Links führen zu 404-Seiten nach letztem Deploy.", ts: "2025-01-15 08:11", read: false, urls: ["/sale/2024", "/brands/xyz"] },
  { id: 3, domainId: 2, domain: "agency-client.com", severity: "warning", type: "ranking", title: "Ranking-Verlust: 5 Keywords", desc: "5 Keywords sind aus den Top-10 herausgefallen.", ts: "2025-01-15 07:45", read: false, urls: [] },
  { id: 4, domainId: 1, domain: "example-shop.de", severity: "warning", type: "performance", title: "LCP-Anstieg auf 4.2s", desc: "Largest Contentful Paint überschreitet 4 Sekunden auf Mobilgeräten.", ts: "2025-01-14 22:30", read: true, urls: ["/", "/produkte"] },
  { id: 5, domainId: 4, domain: "ecommerce-brand.eu", severity: "warning", type: "backlinks_lost", title: "12 Backlinks verloren", desc: "12 externe Backlinks wurden in den letzten 24h entfernt.", ts: "2025-01-14 18:00", read: true, urls: [] },
  { id: 6, domainId: 6, domain: "saas-product.io", severity: "info", type: "backlinks_new", title: "8 neue Backlinks", desc: "8 neue Backlinks von autorisierten Domains.", ts: "2025-01-14 14:20", read: true, urls: [] },
  { id: 7, domainId: 1, domain: "example-shop.de", severity: "critical", type: "ranking", title: "Top-Keyword auf Position 18", desc: "'online schuhe kaufen' fiel von Position 4 auf 18.", ts: "2025-01-14 10:05", read: true, urls: [] },
];

const MOCK_HISTORY = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const count = Math.floor(Math.random() * 5);
  return { date: date.toISOString().slice(0, 10), count, critical: Math.floor(Math.random() * 2), warning: Math.floor(Math.random() * 2), info: Math.floor(Math.random() * 2) };
});

// ─── DomainMonitoringOverview ──────────────────────────────────────────────
function DomainMonitoringOverview({ domains, onSelect, selectedId }) {
  const statusColors = { green: "#38A169", yellow: "#D69E2E", red: "#E53E3E" };
  const statusLabels = { green: "OK", yellow: "Warnung", red: "Kritisch" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
      {domains.map((d) => (
        <div
          key={d.id}
          onClick={() => onSelect(d)}
          style={{
            background: T.surface,
            border: `2px solid ${selectedId === d.id ? C.primary : T.border}`,
            borderRadius: 12,
            padding: "14px 16px",
            cursor: "pointer",
            transition: "all 0.15s",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: statusColors[d.status] }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Globe size={14} strokeWidth={IW} color={C.primary} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColors[d.status] }} />
              <span style={{ fontSize: 11, color: statusColors[d.status], fontWeight: 600 }}>{statusLabels[d.status]}</span>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.domain}</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
            <Clock size={10} strokeWidth={IW} style={{ display: "inline", marginRight: 3 }} />
            {d.lastCheck}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {d.alerts > 0 && (
              <span style={{ fontSize: 11, background: "#FFF5F5", color: "#E53E3E", borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>
                {d.alerts} Alerts
              </span>
            )}
            <span style={{ fontSize: 11, background: T.hover, color: T.muted, borderRadius: 6, padding: "2px 7px" }}>
              {d.rules} Regeln
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── AlertFeedPanel ────────────────────────────────────────────────────────
function AlertFeedPanel({ alerts, filterSeverity, filterDomain, onAlertClick }) {
  const filtered = alerts.filter((a) => {
    if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
    if (filterDomain && a.domain !== filterDomain) return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: T.muted }}>
        <Bell size={36} strokeWidth={IW} style={{ marginBottom: 12, opacity: 0.4 }} />
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Keine Alerts</div>
        <div style={{ fontSize: 13 }}>Für die gewählten Filter gibt es keine Einträge.</div>
      </div>
    );
  }

  const icons = { traffic: TrendingDown, ranking: BarChart2, broken_links: AlertTriangle, backlinks_lost: Link2, backlinks_new: Link2, performance: Zap };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {filtered.map((a) => {
        const sev = SEVERITY[a.severity];
        const Icon = icons[a.type] || Bell;
        return (
          <div
            key={a.id}
            onClick={() => onAlertClick(a)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "14px 16px",
              background: a.read ? T.surface : sev.bg,
              borderLeft: `3px solid ${a.read ? T.border : sev.color}`,
              cursor: "pointer",
              transition: "background 0.15s",
              borderRadius: 8,
              marginBottom: 6,
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: sev.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${sev.color}30` }}>
              <Icon size={15} strokeWidth={IW} color={sev.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{a.title}</span>
                <span style={{ fontSize: 11, background: sev.bg, color: sev.color, borderRadius: 4, padding: "1px 6px", fontWeight: 600, border: `1px solid ${sev.color}30` }}>{sev.label}</span>
                {!a.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: sev.color, display: "inline-block" }} />}
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 5 }}>{a.desc}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, background: T.hover, color: T.muted, borderRadius: 4, padding: "1px 6px" }}>{a.domain}</span>
                <span style={{ fontSize: 11, color: T.muted }}>
                  <Clock size={10} strokeWidth={IW} style={{ display: "inline", marginRight: 2 }} />
                  {a.ts}
                </span>
              </div>
            </div>
            <ChevronRight size={14} strokeWidth={IW} color={T.muted} style={{ flexShrink: 0, marginTop: 4 }} />
          </div>
        );
      })}
    </div>
  );
}

// ─── MonitoringRuleEditor ──────────────────────────────────────────────────
function MonitoringRuleEditor({ domain, onClose }) {
  const [rules, setRules] = useState([
    { id: 1, metric: "traffic", operator: "less", threshold: 20, severity: "critical", enabled: true },
    { id: 2, metric: "broken_links", operator: "greater", threshold: 5, severity: "warning", enabled: true },
    { id: 3, metric: "ranking", operator: "greater", threshold: 15, severity: "warning", enabled: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function addRule() {
    setRules((prev) => [...prev, { id: Date.now(), metric: "traffic", operator: "less", threshold: 10, severity: "warning", enabled: true }]);
  }

  function removeRule(id) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRule(id, field, value) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const sel = (value, onChange, options) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 12, color: T.text, cursor: "pointer" }}
    >
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Monitoring-Regeln</div>
          <div style={{ fontSize: 12, color: T.muted }}>{domain || "Alle Domains"}</div>
        </div>
        {onClose && <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted }}><X size={18} strokeWidth={IW} /></button>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {rules.map((r) => {
          const metricInfo = METRIC_TYPES.find((m) => m.id === r.metric) || METRIC_TYPES[0];
          return (
            <div key={r.id} style={{ background: T.bg, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}`, opacity: r.enabled ? 1 : 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => updateRule(r.id, "enabled", e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                </div>
                {sel(r.metric, (v) => updateRule(r.id, "metric", v), METRIC_TYPES.map((m) => ({ v: m.id, l: m.label })))}
                {sel(r.operator, (v) => updateRule(r.id, "operator", v), [{ v: "less", l: "fällt um >" }, { v: "greater", l: "steigt über" }, { v: "equals", l: "erreicht" }])}
                <input
                  type="number"
                  value={r.threshold}
                  onChange={(e) => updateRule(r.id, "threshold", e.target.value)}
                  style={{ width: 64, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 12, color: T.text }}
                />
                <span style={{ fontSize: 12, color: T.muted }}>{metricInfo.unit}</span>
                {sel(r.severity, (v) => updateRule(r.id, "severity", v), Object.entries(SEVERITY).map(([k, v]) => ({ v: k, l: v.label })))}
                <button onClick={() => removeRule(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, marginLeft: "auto" }}>
                  <Trash2 size={13} strokeWidth={IW} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Btn variant="ghost" onClick={addRule} style={{ flex: 1 }}>
          <Plus size={13} strokeWidth={IW} style={{ marginRight: 4 }} />
          Regel hinzufügen
        </Btn>
        <Btn variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader size={13} strokeWidth={IW} style={{ marginRight: 4, animation: "spin 1s linear infinite" }} /> : saved ? <Check size={13} strokeWidth={IW} style={{ marginRight: 4 }} /> : null}
          {saved ? "Gespeichert" : "Speichern"}
        </Btn>
      </div>
    </div>
  );
}

// ─── AlertDetailDrawer ─────────────────────────────────────────────────────
function AlertDetailDrawer({ alert, onClose }) {
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiAction, setAiAction] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!alert) return;
    setAiExplanation("");
    setAiAction("");
    setLoading(true);
    callAI([
      {
        role: "user",
        content: `Du bist ein SEO-Experte. Erkläre in 3-4 Sätzen warum folgendes Problem aufgetreten sein könnte und gib einen konkreten Aktionsvorschlag. Alert: "${alert.title}" auf Domain "${alert.domain}". Beschreibung: "${alert.desc}". Format: {"explanation": "...", "action": "..."}`
      }
    ]).then((res) => {
      try {
        const txt = res?.choices?.[0]?.message?.content || res?.content || "";
        const obj = JSON.parse(txt.replace(/```json|```/g, "").trim());
        setAiExplanation(obj.explanation || txt);
        setAiAction(obj.action || "");
      } catch {
        const txt = res?.choices?.[0]?.message?.content || res?.content || "";
        setAiExplanation(txt);
      }
    }).catch((e) => console.error(e)).finally(() => setLoading(false));
  }, [alert]);

  if (!alert) return null;
  const sev = SEVERITY[alert.severity];

  const chartData = Array.from({ length: 14 }, (_, i) => ({
    day: i,
    val: 100 - (i > 10 ? (i - 10) * 15 : 0) + Math.random() * 5,
  }));
  const maxVal = Math.max(...chartData.map((d) => d.val));
  const minVal = Math.min(...chartData.map((d) => d.val));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} />
      <div style={{ width: Math.min(480, window.innerWidth), background: T.surface, display: "flex", flexDirection: "column", overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.surface, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, background: sev.bg, color: sev.color, borderRadius: 4, padding: "2px 8px", fontWeight: 700, border: `1px solid ${sev.color}30` }}>{sev.label}</span>
                <span style={{ fontSize: 11, background: T.hover, color: T.muted, borderRadius: 4, padding: "2px 6px" }}>{alert.domain}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{alert.title}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                <Clock size={10} strokeWidth={IW} style={{ display: "inline", marginRight: 3 }} />
                {alert.ts}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 4 }}>
              <X size={18} strokeWidth={IW} />
            </button>
          </div>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Mini Chart */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <BarChart2 size={13} strokeWidth={IW} color={C.primary} />
              Historischer Verlauf (14 Tage)
            </div>
            <div style={{ height: 80, display: "flex", alignItems: "flex-end", gap: 3, background: T.bg, borderRadius: 8, padding: "10px 12px 6px" }}>
              {chartData.map((d, i) => {
                const pct = ((d.val - minVal) / (maxVal - minVal || 1)) * 60 + 10;
                const isLast = i >= 11;
                return (
                  <div
                    key={i}
                    style={{ flex: 1, height: `${pct}px`, borderRadius: "3px 3px 0 0", background: isLast ? sev.color : C.primary, opacity: isLast ? 1 : 0.4, transition: "height 0.3s" }}
                  />
                );
              })}
            </div>
          </div>

          {/* KI-Erklärung */}
          <div style={{ background: `${C.primary}0D`, border: `1px solid ${C.primary}30`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Zap size={13} strokeWidth={IW} />
              KI-Analyse: Warum ist das passiert?
            </div>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.muted, fontSize: 12 }}>
                <Loader size={13} strokeWidth={IW} style={{ animation: "spin 1s linear infinite" }} />
                Analysiere...
              </div>
            ) : aiExplanation ? (
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{aiExplanation}</div>
            ) : (
              <div style={{ fontSize: 12, color: T.muted }}>Keine KI-Erklärung verfügbar.</div>
            )}
          </div>

          {/* Aktionsvorschlag */}
          {aiAction && !loading && (
            <div style={{ background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#276749", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Check size={13} strokeWidth={IW} />
                Empfohlene Maßnahme
              </div>
              <div style={{ fontSize: 13, color: "#276749", lineHeight: 1.6, marginBottom: 10 }}>{aiAction}</div>
              <Btn variant="primary" style={{ fontSize: 12, padding: "6px 14px" }}>
                <ExternalLink size={12} strokeWidth={IW} style={{ marginRight: 5 }} />
                Zur Analyse
              </Btn>
            </div>
          )}

          {/* Betroffene URLs */}
          {alert.urls?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Betroffene URLs</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {alert.urls.map((url, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg, borderRadius: 6, padding: "7px 10px", fontSize: 12, color: C.primary }}>
                    <Link2 size={11} strokeWidth={IW} />
                    {url}
                    <ExternalLink size={11} strokeWidth={IW} style={{ marginLeft: "auto" }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AlertHistoryTimeline ──────────────────────────────────────────────────
function AlertHistoryTimeline({ filterType }) {
  const maxCount = Math.max(...MOCK_HISTORY.map((d) => d.count), 1);

  return (
    <div>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 64, marginBottom: 4 }}>
        {MOCK_HISTORY.map((d, i) => {
          const h = Math.max((d.count / maxCount) * 56, d.count > 0 ? 6 : 2);
          const color = d.critical > 0 ? SEVERITY.critical.color : d.warning > 0 ? SEVERITY.warning.color : d.info > 0 ? SEVERITY.info.color : T.border;
          return (
            <div
              key={i}
              title={`${d.date}: ${d.count} Alerts`}
              style={{ flex: 1, height: `${h}px`, borderRadius: 3, background: d.count > 0 ? color : T.border, opacity: d.count > 0 ? 0.85 : 0.3, cursor: d.count > 0 ? "pointer" : "default", transition: "opacity 0.15s" }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted }}>
        <span>vor 30 Tagen</span>
        <span>Heute</span>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        {Object.entries(SEVERITY).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.muted }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: v.color }} />
            {v.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NotificationSettings ─────────────────────────────────────────────────
function NotificationSettings() {
  const [email, setEmail] = useState("admin@example.com");
  const [webhook, setWebhook] = useState("");
  const [settings, setSettings] = useState({
    critical_email: true, critical_webhook: false