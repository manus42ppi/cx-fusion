import React, { useState, useEffect } from "react";
import { Globe, Zap, Search, Users, BarChart2, Clock } from "lucide-react";
import { C, T, FONT, IW } from "../constants/colors.js";
import { Card } from "../components/ui/index.jsx";
import AnalysisHeader from "../components/ui/AnalysisHeader.jsx";
import { useApp } from "../context/AppContext.jsx";
import { cleanDomain, analyzeDomain } from "../utils/api.js";

const EXAMPLES = ["apple.com", "notion.so", "shopify.com", "spiegel.de", "zalando.de"];

const FEATURES = [
  { icon: Zap,       label: "Performance-Score", sub: "TTFB, Komprimierung, Security" },
  { icon: Search,    label: "SEO & Backlinks",    sub: "PageRank + Common Crawl" },
  { icon: Globe,     label: "Tech-Stack",         sub: "CMS, Analytics, CDN, Frameworks" },
  { icon: Users,     label: "Traffic-Schätzung",  sub: "KI-basiert mit Quellen-Split" },
  { icon: BarChart2, label: "Geografische Daten", sub: "Top-Länder & Märkte" },
  { icon: Clock,     label: "Domain-Historie",    sub: "Alter, Registrar, Archiv-Trend" },
];

export default function AnalyzePage() {
  const { goNav, persistReport, pendingDomain, setPendingDomain } = useApp();
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [step,    setStep]    = useState("");

  useEffect(() => {
    if (pendingDomain) {
      const d = pendingDomain;
      setPendingDomain(null);
      setInput(d);
      run(d);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDomain]);

  async function run(raw) {
    const domain = cleanDomain(raw || input);
    if (!domain) return;
    setLoading(true);
    setError(null);

    const steps = [
      "Verbinde mit Domain…",
      "Lade Performance-Daten…",
      "Analysiere Technologien…",
      "Prüfe Backlinks & Archiv…",
      "KI generiert Insights…",
    ];
    let i = 0;
    const ticker = setInterval(() => setStep(steps[Math.min(i++, steps.length - 1)]), 1400);

    try {
      const data = await analyzeDomain(domain);
      persistReport(domain, data);
      clearInterval(ticker);
      goNav("report", { report: data });
    } catch (e) {
      clearInterval(ticker);
      setError("Analyse fehlgeschlagen: " + e.message);
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 60px" }}>
      <AnalysisHeader
        icon={Globe}
        iconColor={C.accent}
        iconBg={C.accentLight}
        title="Website-Analyse"
        subtitle="Vollständige Domain-Analyse — Performance · SEO · Tech-Stack · KI-Insights"
        value={input}
        onChange={v => { setInput(v); setError(null); }}
        onAnalyze={() => run()}
        loading={loading}
        loadingText={step || "Analysieren…"}
        error={error}
        examples={EXAMPLES}
        btnLabel="Analysieren"
      />

      {/* Feature grid — only shown when idle */}
      {!loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}>
          {FEATURES.map(({ icon: Ico, label, sub }) => (
            <div key={label} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 14px", borderRadius: T.rMd,
              background: C.surface, border: `1px solid ${C.border}`,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: T.rSm, flexShrink: 0,
                background: C.accentLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 1,
              }}>
                <Ico size={13} color={C.accent} strokeWidth={IW} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{label}</div>
                <div style={{ fontSize: 11, color: C.textSoft, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
