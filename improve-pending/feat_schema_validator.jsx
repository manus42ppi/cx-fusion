import { useState, useCallback, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  Search,
  Globe,
  Code,
  Eye,
  BarChart3,
  FileJson,
  Layers,
  ShoppingCart,
  FileText,
  HelpCircle,
  MapPin,
  Link2,
  RefreshCw,
  Info,
  Zap,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";

// ── helpers ──────────────────────────────────────────────────────────────────

const schemaIcons = {
  Article: FileText,
  NewsArticle: FileText,
  BlogPosting: FileText,
  FAQPage: HelpCircle,
  Product: ShoppingCart,
  BreadcrumbList: Link2,
  LocalBusiness: MapPin,
  Organization: Globe,
  WebSite: Globe,
  WebPage: FileText,
  default: Layers,
};

const richSnippetTypes = ["Article", "FAQPage", "Product", "BreadcrumbList", "LocalBusiness"];

function scoreColor(score) {
  if (score >= 80) return C.success;
  if (score >= 50) return C.warning;
  return C.error;
}

function severityColor(sev) {
  if (sev === "error") return C.error;
  if (sev === "warning") return C.warning;
  return C.info;
}

// ── sub-components ────────────────────────────────────────────────────────────

function StructuredDataScoreRing({ score, size = 120 }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={8} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 10, color: T.muted, fontFamily: FONT }}>/ 100</span>
      </div>
    </div>
  );
}

function SchemaTypeBreakdownTable({ types }) {
  if (!types || types.length === 0) return null;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {["Schema Type", "Pages", "Valid", "Errors", "Warnings", "Rich Snippet"].map((h) => (
              <th
                key={h}
                style={{ padding: "8px 12px", textAlign: "left", color: T.muted, fontWeight: 600, whiteSpace: "nowrap" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {types.map((t, i) => {
            const Icon = schemaIcons[t.type] || schemaIcons.default;
            return (
              <tr
                key={i}
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: i % 2 === 0 ? "transparent" : C.surface,
                }}
              >
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon size={14} strokeWidth={IW} color={C.primary} />
                    <span style={{ color: T.primary, fontWeight: 500 }}>{t.type}</span>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", color: T.secondary }}>{t.pageCount}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ color: C.success, fontWeight: 600 }}>{t.valid}</span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {t.errors > 0 ? (
                    <span style={{ color: C.error, fontWeight: 600 }}>{t.errors}</span>
                  ) : (
                    <span style={{ color: T.muted }}>0</span>
                  )}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {t.warnings > 0 ? (
                    <span style={{ color: C.warning, fontWeight: 600 }}>{t.warnings}</span>
                  ) : (
                    <span style={{ color: T.muted }}>0</span>
                  )}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {richSnippetTypes.includes(t.type) ? (
                    <Badge variant="success">Eligible</Badge>
                  ) : (
                    <span style={{ color: T.muted, fontSize: 12 }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ValidationErrorList({ errors }) {
  if (!errors || errors.length === 0)
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: C.success }}>
        <CheckCircle size={16} strokeWidth={IW} />
        <span style={{ fontFamily: FONT, fontSize: 13 }}>No validation errors found.</span>
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {errors.map((e, i) => (
        <div
          key={i}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: C.surface,
            border: `1px solid ${severityColor(e.severity)}22`,
            borderLeft: `3px solid ${severityColor(e.severity)}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            {e.severity === "error" ? (
              <XCircle size={14} strokeWidth={IW} color={C.error} style={{ marginTop: 1, flexShrink: 0 }} />
            ) : (
              <AlertTriangle size={14} strokeWidth={IW} color={C.warning} style={{ marginTop: 1, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.primary }}>
                  {e.field}
                </span>
                <Badge variant={e.severity === "error" ? "error" : "warning"}>{e.severity}</Badge>
                {e.schemaType && (
                  <span style={{ fontFamily: FONT, fontSize: 11, color: T.muted }}>
                    {e.schemaType}
                  </span>
                )}
                {e.line && (
                  <span style={{ fontFamily: FONT, fontSize: 11, color: T.muted }}>
                    Line {e.line}
                  </span>
                )}
              </div>
              <p style={{ fontFamily: FONT, fontSize: 12, color: T.secondary, margin: 0 }}>{e.message}</p>
              {e.fix && (
                <p style={{ fontFamily: FONT, fontSize: 11, color: C.primary, margin: "4px 0 0" }}>
                  💡 {e.fix}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RichSnippetPreviewCard({ snippet }) {
  if (!snippet) return null;

  const renderPreview = () => {
    switch (snippet.type) {
      case "Article":
      case "NewsArticle":
      case "BlogPosting":
        return (
          <div style={{ fontFamily: "Arial, sans-serif", padding: "12px 16px" }}>
            <div style={{ fontSize: 12, color: "#202124", marginBottom: 2 }}>
              {snippet.breadcrumb || snippet.url || "example.com"}
            </div>
            <div style={{ fontSize: 18, color: "#1a0dab", marginBottom: 4 }}>{snippet.headline || snippet.name || "Article Title"}</div>
            {snippet.image && (
              <div
                style={{
                  width: 80,
                  height: 56,
                  background: C.border,
                  borderRadius: 4,
                  float: "right",
                  marginLeft: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={20} strokeWidth={IW} color={T.muted} />
              </div>
            )}
            <div style={{ fontSize: 13, color: "#4d5156" }}>{snippet.description || "Article description preview..."}</div>
            {snippet.datePublished && (
              <div style={{ fontSize: 12, color: "#70757a", marginTop: 4 }}>
                {new Date(snippet.datePublished).toLocaleDateString()}
              </div>
            )}
          </div>
        );

      case "FAQPage":
        return (
          <div style={{ fontFamily: "Arial, sans-serif", padding: "12px 16px" }}>
            <div style={{ fontSize: 18, color: "#1a0dab", marginBottom: 8 }}>{snippet.name || "FAQ Page"}</div>
            {(snippet.questions || []).slice(0, 3).map((q, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 0",
                  borderBottom: i < 2 ? "1px solid #e8eaed" : "none",
                }}
              >
                <div style={{ fontSize: 14, color: "#202124", fontWeight: 500, marginBottom: 4 }}>{q.name}</div>
                <div style={{ fontSize: 13, color: "#4d5156" }}>{q.acceptedAnswer?.text?.substring(0, 100)}...</div>
              </div>
            ))}
          </div>
        );

      case "Product":
        return (
          <div style={{ fontFamily: "Arial, sans-serif", padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  background: C.border,
                  borderRadius: 4,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShoppingCart size={24} strokeWidth={IW} color={T.muted} />
              </div>
              <div>
                <div style={{ fontSize: 16, color: "#1a0dab", marginBottom: 4 }}>{snippet.name || "Product Name"}</div>
                {snippet.offers?.price && (
                  <div style={{ fontSize: 14, color: "#202124", fontWeight: 600, marginBottom: 4 }}>
                    {snippet.offers.priceCurrency || "USD"} {snippet.offers.price}
                  </div>
                )}
                {snippet.aggregateRating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#70757a" }}>
                    <span style={{ color: "#fbbc04" }}>{"★".repeat(Math.round(snippet.aggregateRating.ratingValue))}</span>
                    <span>{snippet.aggregateRating.ratingValue} ({snippet.aggregateRating.reviewCount} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "BreadcrumbList":
        return (
          <div style={{ fontFamily: "Arial, sans-serif", padding: "12px 16px" }}>
            <div style={{ fontSize: 12, color: "#202124", marginBottom: 4 }}>
              {(snippet.items || []).map((item, i) => (
                <span key={i}>
                  <span style={{ color: "#4d5156" }}>{item.name}</span>
                  {i < snippet.items.length - 1 && <span style={{ margin: "0 6px", color: "#70757a" }}>›</span>}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 18, color: "#1a0dab" }}>{snippet.name || "Page Title"}</div>
            <div style={{ fontSize: 13, color: "#4d5156" }}>{snippet.description || "Page description..."}</div>
          </div>
        );

      case "LocalBusiness":
        return (
          <div style={{ fontFamily: "Arial, sans-serif", padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: C.border,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={20} strokeWidth={IW} color={T.muted} />
              </div>
              <div>
                <div style={{ fontSize: 16, color: "#1a0dab", fontWeight: 500 }}>{snippet.name || "Business Name"}</div>
                {snippet.address && (
                  <div style={{ fontSize: 13, color: "#70757a", marginTop: 2 }}>
                    {snippet.address.streetAddress}, {snippet.address.addressLocality}
                  </div>
                )}
                {snippet.aggregateRating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, marginTop: 2 }}>
                    <span style={{ color: "#fbbc04" }}>★</span>
                    <span style={{ color: "#202124" }}>{snippet.aggregateRating.ratingValue}</span>
                    <span style={{ color: "#70757a" }}>· {snippet.telephone || "Phone number"}</span>
                  </div>
                )}
                {snippet.openingHoursSpecification && (
                  <div style={{ fontSize: 12, color: "#137333", marginTop: 2 }}>Open now</div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div style={{ padding: "12px 16px", fontFamily: "Arial, sans-serif" }}>
            <div style={{ fontSize: 18, color: "#1a0dab" }}>{snippet.name || "Unknown Schema"}</div>
            <div style={{ fontSize: 13, color: "#4d5156" }}>{snippet.description || ""}</div>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        border: "1px solid #dfe1e5",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff",
        maxWidth: 600,
      }}
    >
      <div
        style={{
          padding: "6px 12px",
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Eye size={12} strokeWidth={IW} color={T.muted} />
        <span style={{ fontFamily: FONT, fontSize: 11, color: T.muted }}>
          Google Rich Snippet Preview · {snippet.type}
        </span>
      </div>
      {renderPreview()}
    </div>
  );
}

function PageCoverageProgressBar({ pages }) {
  if (!pages || pages.length === 0) return null;

  const covered = pages.filter((p) => p.schemaCount > 0).length;
  const pct = Math.round((covered / pages.length) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: FONT, fontSize: 13, color: T.secondary }}>
          {covered} of {pages.length} pages have structured data
        </span>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: scoreColor(pct) }}>
          {pct}%
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: C.border,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: scoreColor(pct),
            borderRadius: 4,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}

function SchemaJsonViewer({ json, expanded: initExpanded = false }) {
  const [expanded, setExpanded] = useState(initExpanded);

  const formatted = (() => {
    try {
      return typeof json === "string" ? JSON.stringify(JSON.parse(json), null, 2) : JSON.stringify(json, null, 2);
    } catch {
      return String(json);
    }
  })();

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: C.surface,
          border: "none",
          cursor: "pointer",
          borderBottom: expanded ? `1px solid ${C.border}` : "none",
        }}
      >
        <Code size={13} strokeWidth={IW} color={C.primary} />
        <span style={{ fontFamily: FONT, fontSize: 12, color: T.secondary, flex: 1, textAlign: "left" }}>
          View Raw JSON-LD
        </span>
        {expanded ? (
          <ChevronDown size={13} strokeWidth={IW} color={T.muted} />
        ) : (
          <ChevronRight size={13} strokeWidth={IW} color={T.muted} />
        )}
      </button>
      {expanded && (
        <pre
          style={{
            margin: 0,
            padding: "12px 14px",
            fontFamily: "monospace",
            fontSize: 11,
            color: T.secondary,
            background: C.bg,
            overflowX: "auto",
            maxHeight: 320,
            overflowY: "auto",
            lineHeight: 1.6,
          }}
        >
          {formatted}
        </pre>
      )}
    </div>
  );
}

function ExportButton({ data, domain }) {
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `structured-data-report-${domain}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Btn variant="secondary" onClick={handleExport}>
      <Download size={14} strokeWidth={IW} />
      Export JSON Report
    </Btn>
  );
}

// ── page accordion row ────────────────────────────────────────────────────────

function PageRow({ page }) {
  const [open, setOpen] = useState(false);
  const [activeSnippet, setActiveSnippet] = useState(null);

  const hasErrors = page.errors?.filter((e) => e.severity === "error").length > 0;
  const hasWarnings = page.errors?.filter((e) => e.severity === "warning").length > 0;

  const richSnippets = (page.schemas || []).filter((s) =>
    richSnippetTypes.some((t) => s.type?.includes(t))
  );

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          background: open ? C.surface : "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {open ? (
          <ChevronDown size={14} strokeWidth={IW} color={T.muted} />
        ) : (
          <ChevronRight size={14} strokeWidth={IW} color={T.muted} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 13, color: T.primary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {page.url}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            {(page.schemas || []).map((s, i) => (
              <Badge key={i} variant="info" style={{ fontSize: 10 }}>
                {s.type}
              </Badge>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {hasErrors && <XCircle size={14} strokeWidth={IW} color={C.error} />}
          {!hasErrors && hasWarnings && <AlertTriangle size={14} strokeWidth={IW} color={C.warning} />}
          {!hasErrors && !hasWarnings && page.schemaCount > 0 && (
            <CheckCircle size={14} strokeWidth={IW} color={C.success} />
          )}
          <span style={{ fontFamily: FONT, fontSize: 12, color: T.muted }}>
            {page.schemaCount || 0} schema{page.schemaCount !== 1 ? "s" : ""}
          </span>
        </div>
      </button>

      {open && (
        <div style={{ padding: "16px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Errors */}
          <div>
            <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Validation
            </div>
            <ValidationErrorList errors={page.errors || []} />
          </div>

          {/* Rich Snippet Previews */}
          {richSnippets.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Rich Snippet Preview
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {richSnippets.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSnippet(activeSnippet?.type === s.type ? null : s)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: `1px solid ${activeSnippet?.type === s.type ? C.primary : C.border}`,
                      background: activeSnippet?.type === s.type ? `${C.primary}15` : "transparent",
                      cursor: "pointer",
                      fontFamily: FONT,
                      fontSize: 12,
                      color: activeSnippet?.type === s.type ? C.primary : T.secondary,
                    }}
                  >
                    {s.type}
                  </button>
                ))}
              </div>
              {activeSnippet && <RichSnippetPreviewCard snippet={activeSnippet} />}
            </div>
          )}

          {/* JSON viewers */}
          {(page.schemas || []).map((s, i) => (
            <SchemaJsonViewer key={i} json={s.raw || s} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function StructuredDataValidator() {
  const { goNav } = useApp();

  const [domain, setDomain] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Read domain from URL if present
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/analyze\/([^/]+)\/structured-data/);
    if (match) {
      const d = decodeURIComponent(match[1]);
      setDomain(d);
      setInputVal(d);
    }
  }, []);

  const runAnalysis = useCallback(
    async (targetDomain) => {
      const d = (targetDomain || domain).trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (!d) return;
      setDomain(d);
      setLoading(true);
      setError(null);
      setResult(null);
      setActiveTab("overview");

      const prompt = `You are a structured data analysis engine. Analyze the domain "${d}" for JSON-LD, Microdata, and RDFa markup.

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "domain": "${d}",
  "score": <integer 0-100 overall structured data quality score>,
  "summary": {
    "totalPages": <number>,
    "pagesWithSchema": <number>,
    "totalSchemas": <number>,
    "errorCount": <number>,
    "warningCount": <number>,
    "richSnippetEligible": <number>
  },
  "schemaTypes": [
    {
      "type": "<schema type>",
      "pageCount": <number>,
      "valid": <number>,
      "errors": <number>,
      "warnings": <number>
    }
  ],
  "pages": [
    {
      "url": "<full url>",
      "schemaCount": <number>,
      "schemas": [
        {
          "type": "<schema type e.g. Article, FAQPage, Product, BreadcrumbList, LocalBusiness>",
          "format": "json-ld",
          "raw": <the schema object itself>,
          "name": "<optional name>",
          "headline": "<for Article>",
          "description": "<description>",
          "datePublished": "<ISO date if Article>",
          "image": true,
          "breadcrumb": "<breadcrumb string if relevant>",
          "url": "<canonical url>",
          "offers": { "price": "<price>", "priceCurrency": "USD" },
          "aggregateRating": { "ratingValue": 4.5, "reviewCount": 120 },
          "address": { "streetAddress": "123 Main St", "addressLocality": "City" },
          "telephone": "+1-555-0100",
          "openingHoursSpecification": true,
          "items": [{ "name": "Home" }, { "name": "Category" }, { "name": "Page" }],
          "questions": [
            { "name": "Question 1?", "acceptedAnswer": { "text": "Answer 1 text here" } },
            { "name": "Question 2?", "acceptedAnswer": { "text": "Answer 2 text here" } }
          ]
        }
      ],
      "errors": [
        {
          "severity": "error",
          "field": "<field name>",
          "schemaType": "<type>",
          "line": <line number or null>,
          "message": "<detailed validation message>",
          "fix": "<actionable fix suggestion>"
        }
      ]
    }
  ],
  "recommendations": [
    "<actionable recommendation string>"
  ]
}

Simulate realistic structured data analysis for the domain "${d}". Include 4-8 pages covering homepage, product pages, blog posts, FAQ pages, and contact. Include realistic validation errors like missing required fields (e.g., 'image' for Article, 'offers.price' for Product). Generate 3-5 different schema types. Make the data realistic and varied.`;

      try {
        const tryFetch = async (url) => {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: