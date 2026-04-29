import { useState, useRef, useCallback } from "react";
import {
  FileText, Upload, Palette, Globe, User, Building2,
  ToggleLeft, ToggleRight, Eye, Download, Link2, Lock,
  Save, FolderOpen, Trash2, Plus, GripVertical, ChevronDown,
  ChevronUp, Loader2, AlertCircle, CheckCircle2, Star,
  BarChart3, TrendingUp, Search, Zap, ExternalLink, Copy,
  RefreshCw, Shield, Mail, Calendar, MessageSquare, X
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";

const TEMPLATES = [
  { id: "executive", label: "Executive Summary", desc: "Kurz & prägnant für Entscheider", icon: Star, modules: ["seo", "traffic", "recommendations"] },
  { id: "full", label: "Full Audit", desc: "Vollständige Analyse aller Bereiche", icon: FileText, modules: ["seo", "traffic", "performance", "keywords", "backlinks", "recommendations"] },
  { id: "seo", label: "SEO-Focus", desc: "Tiefer Einblick in SEO & Keywords", icon: Search, modules: ["seo", "keywords", "backlinks", "recommendations"] },
  { id: "traffic", label: "Traffic-Focus", desc: "Traffic-Quellen & Wachstum", icon: TrendingUp, modules: ["traffic", "performance", "recommendations"] },
];

const ALL_MODULES = [
  { id: "seo", label: "SEO-Score", icon: Search, color: "#6366f1" },
  { id: "traffic", label: "Traffic-Analyse", icon: TrendingUp, color: "#10b981" },
  { id: "performance", label: "Performance", icon: Zap, color: "#f59e0b" },
  { id: "keywords", label: "Keywords", icon: BarChart3, color: "#3b82f6" },
  { id: "backlinks", label: "Backlinks", icon: ExternalLink, color: "#8b5cf6" },
  { id: "recommendations", label: "Empfehlungen", icon: Star, color: "#ef4444" },
];

const MOCK_DATA = {
  seo: { score: 84, issues: 7, passed: 43, title: "SEO-Score", trend: "+6%" },
  traffic: { monthly: "24.8K", organic: "18.2K", paid: "6.6K", trend: "+12%" },
  performance: { lcp: "1.8s", cls: "0.04", fid: "12ms", score: 91 },
  keywords: { total: 1240, top10: 87, opportunities: 34 },
  backlinks: { total: 2847, domains: 312, toxic: 8, trend: "+23" },
};

const defaultBranding = { agencyName: "", website: "", primaryColor: "#6366f1", secondaryColor: "#10b981", logo: null };
const defaultClient = { name: "", project: "", date: new Date().toISOString().slice(0, 10), intro: "" };

export default function ReportBuilder() {
  const { goNav } = useApp();

  const [branding, setBranding] = useState(defaultBranding);
  const [client, setClient] = useState(defaultClient);
  const [selectedTemplate, setSelectedTemplate] = useState("full");
  const [activeModules, setActiveModules] = useState(["seo", "traffic", "performance", "keywords", "backlinks", "recommendations"]);
  const [dragOver, setDragOver] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [tab, setTab] = useState("branding");
  const [shareLink, setShareLink] = useState("");
  const [sharePassword, setSharePassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState([
    { id: 1, name: "Monats-Report", template: "full", modules: ALL_MODULES.map(m => m.id), created: "2024-01-15" },
    { id: 2, name: "Quick SEO Check", template: "seo", modules: ["seo", "keywords", "recommendations"], created: "2024-01-20" },
  ]);
  const [templateName, setTemplateName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [loading, setLoading] = useState({ pdf: false, link: false, ai: false });
  const [success, setSuccess] = useState({ pdf: false, link: false });
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [error, setError] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fileRef = useRef();

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const applyTemplate = (tpl) => {
    setSelectedTemplate(tpl.id);
    setActiveModules(tpl.modules);
  };

  const toggleModule = (id) => {
    setActiveModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleDragStart = (id) => setDragItem(id);
  const handleDragOver = (e, id) => { e.preventDefault(); setDragOver(id); };
  const handleDrop = (targetId) => {
    if (!dragItem || dragItem === targetId) { setDragItem(null); setDragOver(null); return; }
    setActiveModules(prev => {
      const arr = [...prev];
      const fromIdx = arr.indexOf(dragItem);
      const toIdx = arr.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, dragItem);
      return arr;
    });
    setDragItem(null);
    setDragOver(null);
  };

  const getAiIntro = async () => {
    if (!client.name || !client.project) { setError("Bitte Kundenname und Projekt angeben."); return; }
    setLoading(l => ({ ...l, ai: true }));
    setError("");
    try {
      const prompt = `Erstelle einen professionellen, persönlichen Einleitungstext (max. 3 Sätze) für einen digitalen Performance-Report. Agentur: "${branding.agencyName || "unsere Agentur"}", Kunde: "${client.name}", Projekt: "${client.project}". Ton: professionell, wertschätzend, ergebnisorientiert. Nur den Text, keine Anführungszeichen.`;
      let res = await fetch("/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }) }).catch(() => null);
      if (!res || !res.ok) res = await fetch("https://socialflow-pro.pages.dev/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }) });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || data?.content || "";
      setClient(c => ({ ...c, intro: text }));
      setAiSuggestion(text);
    } catch (e) {
      console.error(e);
      setError("KI-Vorschlag konnte nicht generiert werden.");
    } finally {
      setLoading(l => ({ ...l, ai: false }));
    }
  };

  const generatePDF = async () => {
    setLoading(l => ({ ...l, pdf: true }));
    setError("");
    await new Promise(r => setTimeout(r, 2200));
    setLoading(l => ({ ...l, pdf: false }));
    setSuccess(s => ({ ...s, pdf: true }));
    setTimeout(() => setSuccess(s => ({ ...s, pdf: false })), 3000);
  };

  const generateShareLink = async () => {
    setLoading(l => ({ ...l, link: true }));
    setError("");
    await new Promise(r => setTimeout(r, 1600));
    const id = Math.random().toString(36).slice(2, 10);
    setShareLink(`https://report.cx-fusion.io/r/${id}`);
    setLoading(l => ({ ...l, link: false }));
    setSuccess(s => ({ ...s, link: true }));
    setTimeout(() => setSuccess(s => ({ ...s, link: false })), 3000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const saveTemplate = () => {
    if (!templateName) return;
    setSavedTemplates(prev => [...prev, {
      id: Date.now(), name: templateName, template: selectedTemplate,
      modules: activeModules, created: new Date().toISOString().slice(0, 10)
    }]);
    setTemplateName("");
    setShowSaveForm(false);
  };

  const deleteTemplate = (id) => setSavedTemplates(prev => prev.filter(t => t.id !== id));

  const loadTemplate = (tpl) => {
    setSelectedTemplate(tpl.template);
    setActiveModules(tpl.modules);
    setTab("branding");
  };

  const orderedModules = [...activeModules.map(id => ALL_MODULES.find(m => m.id === id)).filter(Boolean),
    ...ALL_MODULES.filter(m => !activeModules.includes(m.id))];

  const tabs = [
    { id: "branding", label: "Branding", icon: Palette },
    { id: "template", label: "Template", icon: FileText },
    { id: "modules", label: "Module", icon: ToggleRight },
    { id: "client", label: "Kunde", icon: User },
    { id: "templates", label: "Gespeichert", icon: FolderOpen },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px", fontFamily: FONT }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, #10b981)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={20} color="#fff" strokeWidth={IW} />
              </div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: T.primary, margin: 0 }}>
                White-Label Report Builder
              </h1>
              <Badge color={C.accent}>Pro</Badge>
            </div>
            <p style={{ color: T.secondary, fontSize: 14, margin: 0 }}>
              Gebrandete Client-Reports ohne cx-fusion-Branding · PDF-Export & Share-Links
            </p>
          </div>
          <Btn onClick={() => goNav("/dashboard")} style={{ gap: 8 }}>
            Zum Dashboard
          </Btn>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: `${C.error}18`, border: `1px solid ${C.error}40`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: C.error, fontSize: 14 }}>
            <AlertCircle size={16} strokeWidth={IW} />
            {error}
            <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.error }}><X size={14} strokeWidth={IW} /></button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "start" }}>

          {/* LEFT PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Tab Nav */}
            <Card style={{ padding: 6 }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    flex: 1, minWidth: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "8px 6px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                    background: tab === t.id ? C.accent : "transparent",
                    color: tab === t.id ? "#fff" : T.secondary, transition: "all 0.15s"
                  }}>
                    <t.icon size={15} strokeWidth={IW} />
                    {t.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* BRANDING TAB */}
            {tab === "branding" && (
              <Card style={{ padding: 20 }}>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: T.primary, margin: "0 0 16px" }}>
                  Agentur-Branding
                </h3>

                {/* Logo Upload */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.secondary, marginBottom: 8 }}>Logo</label>
                  <div onClick={() => fileRef.current?.click()} style={{
                    border: `2px dashed ${C.border}`, borderRadius: 10, padding: "20px 16px", textAlign: "center",
                    cursor: "pointer", background: C.surface, transition: "border-color 0.2s"
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" style={{ maxHeight: 60, maxWidth: "100%", objectFit: "contain" }} />
                    ) : (
                      <>
                        <Upload size={24} color={T.muted} strokeWidth={IW} style={{ marginBottom: 6 }} />
                        <div style={{ fontSize: 13, color: T.muted }}>Logo hochladen</div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>PNG, SVG, JPG</div>
                      </>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />
                </div>

                {/* Agency Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.secondary, marginBottom: 6 }}>Agentur-Name</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 12px" }}>
                    <Building2 size={14} color={T.muted} strokeWidth={IW} />
                    <input value={branding.agencyName} onChange={e => setBranding(b => ({ ...b, agencyName: e.target.value }))}
                      placeholder="Meine Agentur GmbH"
                      style={{ flex: 1, background: "none", border: "none", outline: "none", padding: "10px 0", fontSize: 14, color: T.primary, fontFamily: FONT }} />
                  </div>
                </div>

                {/* Website */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.secondary, marginBottom: 6 }}>Website</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 12px" }}>
                    <Globe size={14} color={T.muted} strokeWidth={IW} />
                    <input value={branding.website} onChange={e => setBranding(b => ({ ...b, website: e.target.value }))}
                      placeholder="https://agentur.de"
                      style={{ flex: 1, background: "none", border: "none", outline: "none", padding: "10px 0", fontSize: 14, color: T.primary, fontFamily: FONT }} />
                  </div>
                </div>

                {/* Colors */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { key: "primaryColor", label: "Primärfarbe" },
                    { key: "secondaryColor", label: "Sekundärfarbe" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.secondary, marginBottom: 6 }}>{label}</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
                        <input type="color" value={branding[key]} onChange={e => setBranding(b => ({ ...b, [key]: e.target.value }))}
                          style={{ width: 28, height: 28, border: "none", borderRadius: 6, cursor: "pointer", background: "none", padding: 0 }} />
                        <span style={{ fontSize: 12, color: T.secondary, fontFamily: "monospace" }}>{branding[key]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* TEMPLATE TAB */}
            {tab === "template" && (
              <Card style={{ padding: 20 }}>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: T.primary, margin: "0 0 16px" }}>
                  Report-Vorlage
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {TEMPLATES.map(tpl => (
                    <div key={tpl.id} onClick={() => applyTemplate(tpl)} style={{
                      display: "flex", alignItems: "flex-start", gap: 12, padding: "14px", borderRadius: 10, cursor: "pointer",
                      border: `2px solid ${selectedTemplate === tpl.id ? C.accent : C.border}`,
                      background: selectedTemplate === tpl.id ? `${C.accent}10` : C.surface,
                      transition: "all 0.15s"
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: selectedTemplate === tpl.id ? C.accent : C.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <tpl.icon size={18} color={selectedTemplate === tpl.id ? "#fff" : T.muted} strokeWidth={IW} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.primary, marginBottom: 2 }}>{tpl.label}</div>
                        <div style={{ fontSize: 12, color: T.secondary }}>{tpl.desc}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                          {tpl.modules.map(m => {
                            const mod = ALL_MODULES.find(x => x.id === m);
                            return mod ? <span key={m} style={{ fontSize: 10, fontWeight: 600, background: `${mod.color}20`, color: mod.color, padding: "2px 6px", borderRadius: 4 }}>{mod.label}</span> : null;
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* MODULES TAB */}
            {tab === "modules" && (
              <Card style={{ padding: 20 }}>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: T.primary, margin: "0 0 6px" }}>
                  Module konfigurieren
                </h3>
                <p style={{ fontSize: 12, color: T.secondary, margin: "0 0 14px" }}>Drag & Drop zum Sortieren</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {orderedModules.map(mod => {
                    const isActive = activeModules.includes(mod.id);
                    const isDragTarget = dragOver === mod.id;
                    return (
                      <div key={mod.id}
                        draggable={isActive}
                        onDragStart={() => handleDragStart(mod.id)}
                        onDragOver={e => isActive && handleDragOver(e, mod.id)}
                        onDrop={() => isActive && handleDrop(mod.id)}
                        onDragEnd={() => { setDragItem(null); setDragOver(null); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                          borderRadius: 10, border: `1.5px solid ${isDragTarget ? C.accent : C.border}`,
                          background: isDragTarget ? `${C.accent}10` : isActive ? C.surface : `${C.border}30`,
                          opacity: isActive ? 1 : 0.5, transition: "all 0.15s",
                          cursor: isActive ? "grab" : "default"
                        }}
                      >
                        {isActive && <GripVertical size={14} color={T.muted} strokeWidth={IW} style={{ cursor: "grab", flexShrink: 0 }} />}
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: `${mod.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <mod.icon size={15} color={mod.color} strokeWidth={IW} />
                        </div>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: T.primary }}>{mod.label}</span>
                        <button onClick={() => toggleModule(mod.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                          {isActive
                            ? <ToggleRight size={22} color={C.accent} strokeWidth={IW} />
                            : <ToggleLeft size={22} color={T.muted} strokeWidth={IW} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* CLIENT TAB */}
            {tab === "client" && (
              <Card style={{ padding: 20 }}>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: T.primary, margin: "0 0 16px" }}>
                  Kunden-Info
                </h3>
                {[
                  { key: "name", label: "Kundenname", icon: User, placeholder: "Mustermann GmbH" },
                  { key: "project", label: "Projekt / Domain", icon: Globe, placeholder: "mustermann.de" },
                  { key: "date", label: "Report-Datum", icon: Calendar, placeholder: "", type: "date" },
                ].map(({ key, label, icon: Icon, placeholder, type }) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.secondary, marginBottom: 6 }}>{label}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 12px" }}>
                      <Icon size={14} color={T.muted} strokeWidth={IW} />
                      <input type={type || "text"} value={client[key]} onChange={e => setClient(c => ({ ...c, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={{ flex: 1, background: "none", border: "none", outline: "none", padding: "10px 0", fontSize: 14, color: T.primary, fontFamily: FONT }} />
                    </div>
                  </div>
                ))}

                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.secondary }}>Einleitungstext</label>
                    <button onClick={getAiIntro} disabled={loading.ai} style={{
                      display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
                      color: loading.ai ? T.muted : C.accent, background: `${C.accent}15`,
                      border: `1px solid ${C.accent}40`, borderRadius: 6, padding: "4px 10px", cursor: loading.ai ? "not-allowed" : "pointer"
                    }}>
                      {loading.ai ? <Loader2 size={12} strokeWidth={IW} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={12} strokeWidth={IW} />}
                      KI-Vorschlag
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px" }}>
                    <MessageSquare size={14} color={T.muted} strokeWidth={IW} style={{ marginTop: 2, flexShrink: 0 }} />
                    <textarea value={client.intro} onChange={e => setClient(c => ({ ...c, intro: e.target.value }))}
                      placeholder="Persönliche Einleitung für den Kunden..."
                      rows={4}
                      style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: T.primary, fontFamily: FONT, resize: "vertical", lineHeight: 1.5 }} />
                  </div>
                </div>
              </Card>
            )}

            {/* SAVED TEMPLATES TAB */}
            {tab === "templates" && (
              <Card style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: T.primary, margin: 0 }}>Gespeicherte Templates</h3>
                  <button onClick={() => setShowSaveForm(s => !s)} style={{
                    display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
                    color: C.accent, background: `${C.accent}15`, border: `1px solid ${C.accent}40`,
                    borderRadius: 6, padding: "5px 10px", cursor: "pointer"
                  }}>
                    <Plus size={13} strokeWidth={IW} /> Speichern
                  </button>
                </div>

                {showSaveForm && (
                  <div style={{ marginBottom: 16, padding: 14, background: `${C.accent}08`, borderRadius: 10, border: `1px solid ${C.accent}30` }}>
                    <input value={templateName} onChange={e => setTemplateName(e.target.value)}
                      placeholder="Template-Name..."
                      style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: T.primary, fontFamily: FONT, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn onClick={saveTemplate} style={{ flex: 1, fontSize: 12 }}>Speichern</Btn>
                      <button onClick={() => setShowSaveForm(false)} style={{ padding: "6px 12px", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", color: T.secondary, fontSize: 12 }}>Abbrechen</button>
                    </div>
                  </div>
                )}

                {savedTemplates.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 16px", color: T.muted, fontSize: 13 }}>
                    <FolderOpen size={32} strokeWidth={IW} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div>Noch keine Templates gespeichert</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "