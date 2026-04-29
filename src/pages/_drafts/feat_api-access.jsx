import { useState, useEffect, useCallback, useRef } from "react";
import {
  Key,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  Code2,
  Zap,
  Globe,
  Shield,
  ChevronDown,
  ChevronUp,
  Play,
  Webhook,
  BarChart3,
  AlertCircle,
  ArrowUpRight,
  Eye,
  EyeOff,
  Terminal,
  BookOpen,
  Layers,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";

const TIERS = [
  { id: "free", label: "Free", calls: 1000, color: C.textMuted, price: "0€" },
  { id: "starter", label: "Starter", calls: 10000, color: C.accent, price: "29€" },
  { id: "pro", label: "Pro", calls: 100000, color: C.success || "#22c55e", price: "99€" },
  { id: "agency", label: "Agency", calls: 1000000, color: "#a855f7", price: "299€" },
];

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/domain/analyze", desc: "Full domain analysis", params: ["domain"] },
  { method: "GET", path: "/api/v1/traffic", desc: "Traffic estimation & sources", params: ["domain", "period"] },
  { method: "GET", path: "/api/v1/seo", desc: "SEO metrics & backlinks", params: ["domain"] },
  { method: "GET", path: "/api/v1/tech-stack", desc: "Technology stack detection", params: ["domain"] },
  { method: "GET", path: "/api/v1/performance", desc: "Core Web Vitals & scores", params: ["domain", "device"] },
  { method: "POST", path: "/api/v1/batch", desc: "Batch analysis (up to 50 domains)", params: ["domains[]"] },
  { method: "GET", path: "/api/v1/usage", desc: "Your API usage stats", params: [] },
  { method: "POST", path: "/api/v1/webhooks", desc: "Register async webhook", params: ["url", "events[]"] },
];

const CODE_SNIPPETS = {
  js: (key) => `// JavaScript (fetch)
const response = await fetch(
  'https://api.cx-fusion.com/v1/domain/analyze?domain=example.com',
  {
    headers: {
      'Authorization': 'Bearer ${key}',
      'Content-Type': 'application/json'
    }
  }
);
const data = await response.json();
console.log(data);`,
  python: (key) => `# Python (requests)
import requests

response = requests.get(
    'https://api.cx-fusion.com/v1/domain/analyze',
    params={'domain': 'example.com'},
    headers={
        'Authorization': f'Bearer ${key}',
        'Content-Type': 'application/json'
    }
)
data = response.json()
print(data)`,
  curl: (key) => `# cURL
curl -X GET \\
  'https://api.cx-fusion.com/v1/domain/analyze?domain=example.com' \\
  -H 'Authorization: Bearer ${key}' \\
  -H 'Content-Type: application/json'`,
  php: (key) => `<?php
// PHP (cURL)
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.cx-fusion.com/v1/domain/analyze?domain=example.com',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ${key}',
        'Content-Type: application/json',
    ],
]);
$response = json_decode(curl_exec($ch), true);
curl_close($ch);
print_r($response);`,
};

function generateKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const prefix = "cxf_";
  let result = prefix;
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function RingChart({ used, total, color }) {
  const pct = Math.min((used / total) * 100, 100);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
      <circle cx={64} cy={64} r={r} fill="none" stroke={C.border} strokeWidth={12} />
      <circle
        cx={64}
        cy={64}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x={64} y={58} textAnchor="middle" fill={T.primary} fontSize={18} fontFamily={FONT_DISPLAY} fontWeight={700}>
        {Math.round(pct)}%
      </text>
      <text x={64} y={76} textAnchor="middle" fill={T.muted} fontSize={10} fontFamily={FONT}>
        used
      </text>
    </svg>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 4,
        color: copied ? (C.success || "#22c55e") : T.muted,
        display: "flex",
        alignItems: "center",
        transition: "color 0.2s",
      }}
    >
      {copied ? <Check size={14} strokeWidth={IW} /> : <Copy size={14} strokeWidth={IW} />}
    </button>
  );
}

export default function DeveloperPage() {
  const { goNav } = useApp();

  const [keys, setKeys] = useState([
    { id: "k1", name: "Production", key: generateKey(), created: "2024-01-15", lastUsed: "2024-12-20", calls: 0, active: true },
    { id: "k2", name: "Staging", key: generateKey(), created: "2024-02-01", lastUsed: "2024-12-18", calls: 0, active: true },
  ]);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [activeTab, setActiveTab] = useState("keys");
  const [codeTab, setCodeTab] = useState("js");
  const [currentTier] = useState("starter");
  const [usedCalls] = useState(3247);
  const [expandedEndpoint, setExpandedEndpoint] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState(["analysis.complete", "batch.complete"]);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [addingKey, setAddingKey] = useState(false);
  const [regenerating, setRegenerating] = useState({});
  const [testLoading, setTestLoading] = useState({});
  const [testResults, setTestResults] = useState({});
  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [testDomain, setTestDomain] = useState("example.com");

  const tier = TIERS.find((t) => t.id === currentTier) || TIERS[1];
  const primaryKey = keys[0]?.key || "YOUR_API_KEY";

  const loadAiInsight = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `I'm using ${usedCalls} of ${tier.calls} API calls this month on the "${tier.label}" tier. Give me 2 concise tips to optimize my API usage and one recommendation about upgrading. Keep it under 80 words total.`,
            },
          ],
        }),
      }).catch(() =>
        fetch("https://socialflow-pro.pages.dev/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `I'm using ${usedCalls} of ${tier.calls} API calls this month on the "${tier.label}" tier. Give me 2 concise tips to optimize my API usage and one recommendation about upgrading. Keep it under 80 words total.`,
              },
            ],
          }),
        })
      );
      const data = await res.json();
      setAiInsight(data?.choices?.[0]?.message?.content || data?.content || "");
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  }, [usedCalls, tier]);

  const handleRegenerateKey = async (keyId) => {
    setRegenerating((p) => ({ ...p, [keyId]: true }));
    await new Promise((r) => setTimeout(r, 800));
    setKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, key: generateKey() } : k))
    );
    setRegenerating((p) => ({ ...p, [keyId]: false }));
  };

  const handleAddKey = async () => {
    if (!newKeyName.trim()) return;
    setAddingKey(true);
    await new Promise((r) => setTimeout(r, 600));
    setKeys((prev) => [
      ...prev,
      {
        id: `k${Date.now()}`,
        name: newKeyName.trim(),
        key: generateKey(),
        created: new Date().toISOString().split("T")[0],
        lastUsed: "—",
        calls: 0,
        active: true,
      },
    ]);
    setNewKeyName("");
    setAddingKey(false);
  };

  const handleDeleteKey = (keyId) => {
    setKeys((prev) => prev.filter((k) => k.id !== keyId));
  };

  const handleTestEndpoint = async (path) => {
    setTestLoading((p) => ({ ...p, [path]: true }));
    setTestResults((p) => ({ ...p, [path]: null }));
    try {
      await new Promise((r) => setTimeout(r, 900));
      setTestResults((p) => ({
        ...p,
        [path]: {
          status: 200,
          data: {
            domain: testDomain,
            endpoint: path,
            score: Math.floor(Math.random() * 40) + 60,
            data: { message: "Simulated response", timestamp: new Date().toISOString() },
          },
        },
      }));
    } catch (e) {
      console.error(e);
      setTestResults((p) => ({ ...p, [path]: { status: 500, error: "Request failed" } }));
    } finally {
      setTestLoading((p) => ({ ...p, [path]: false }));
    }
  };

  const handleSaveWebhook = async () => {
    setWebhookSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setWebhookSaving(false);
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 3000);
  };

  const tabs = [
    { id: "keys", label: "API Keys", icon: Key },
    { id: "usage", label: "Usage & Limits", icon: BarChart3 },
    { id: "docs", label: "API Docs", icon: BookOpen },
    { id: "snippets", label: "Code Examples", icon: Code2 },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
  ];

  const methodColor = (m) =>
    ({ GET: "#22c55e", POST: C.accent, PUT: "#f59e0b", DELETE: "#ef4444" }[m] || T.muted);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.accent}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Terminal size={20} color={C.accent} strokeWidth={IW} />
          </div>
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: T.primary, margin: 0 }}>
              Developer API
            </h1>
            <p style={{ fontFamily: FONT, fontSize: 13, color: T.muted, margin: 0 }}>
              Integrate cx-fusion data into your own tools & workflows
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              background: `${tier.color}15`, border: `1px solid ${tier.color}40`,
              borderRadius: 20, fontFamily: FONT, fontSize: 12, color: tier.color, fontWeight: 600,
            }}>
              <Zap size={12} strokeWidth={IW} />
              {tier.label} Plan — {(tier.calls - usedCalls).toLocaleString()} calls left
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: FONT, fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? C.accent : T.muted,
                borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent",
                marginBottom: -1, transition: "all 0.15s",
              }}
            >
              <Icon size={14} strokeWidth={IW} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* API KEYS TAB */}
      {activeTab === "keys" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Add new key */}
          <Card style={{ padding: 20 }}>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: T.primary, margin: "0 0 16px" }}>
              Create New API Key
            </h3>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddKey()}
                placeholder="Key name (e.g. Production, Client-ABC)"
                style={{
                  flex: 1, padding: "10px 14px", background: C.surface || C.bg,
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  fontFamily: FONT, fontSize: 13, color: T.primary, outline: "none",
                }}
              />
              <Btn
                onClick={handleAddKey}
                disabled={!newKeyName.trim() || addingKey}
                style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
              >
                {addingKey ? <RefreshCw size={14} strokeWidth={IW} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} strokeWidth={IW} />}
                Generate Key
              </Btn>
            </div>
          </Card>

          {/* Keys list */}
          {keys.map((k) => (
            <Card key={k.id} style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${C.accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Key size={16} color={C.accent} strokeWidth={IW} />
                  </div>
                  <div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: T.primary }}>{k.name}</div>
                    <div style={{ fontFamily: FONT, fontSize: 11, color: T.muted }}>Created {k.created} · Last used {k.lastUsed}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: k.active ? (C.success || "#22c55e") : C.textMuted }} />
                  <span style={{ fontFamily: FONT, fontSize: 11, color: k.active ? (C.success || "#22c55e") : T.muted }}>
                    {k.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 12,
              }}>
                <code style={{ fontFamily: "monospace", fontSize: 12, color: T.secondary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {visibleKeys[k.id] ? k.key : k.key.slice(0, 8) + "●".repeat(24) + k.key.slice(-8)}
                </code>
                <button
                  onClick={() => setVisibleKeys((p) => ({ ...p, [k.id]: !p[k.id] }))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex" }}
                >
                  {visibleKeys[k.id] ? <EyeOff size={14} strokeWidth={IW} /> : <Eye size={14} strokeWidth={IW} />}
                </button>
                <CopyButton text={k.key} />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleRegenerateKey(k.id)}
                  disabled={regenerating[k.id]}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
                    background: `${C.accent}10`, border: `1px solid ${C.accent}30`,
                    borderRadius: 6, cursor: "pointer", fontFamily: FONT, fontSize: 12,
                    color: C.accent, fontWeight: 500,
                  }}
                >
                  <RefreshCw size={12} strokeWidth={IW} style={regenerating[k.id] ? { animation: "spin 1s linear infinite" } : {}} />
                  Regenerate
                </button>
                {keys.length > 1 && (
                  <button
                    onClick={() => handleDeleteKey(k.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
                      background: "transparent", border: `1px solid ${C.border}`,
                      borderRadius: 6, cursor: "pointer", fontFamily: FONT, fontSize: 12,
                      color: T.muted,
                    }}
                  >
                    <Trash2 size={12} strokeWidth={IW} />
                    Delete
                  </button>
                )}
              </div>
            </Card>
          ))}

          {/* Security note */}
          <div style={{
            display: "flex", gap: 10, padding: "14px 16px",
            background: `${C.accent}08`, border: `1px solid ${C.accent}20`, borderRadius: 10,
          }}>
            <Shield size={16} color={C.accent} strokeWidth={IW} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontFamily: FONT, fontSize: 12, color: T.secondary, margin: 0, lineHeight: 1.6 }}>
              Keep your API keys secret. Never expose them in client-side code or public repositories.
              Use environment variables or a secure vault. Rotate keys regularly for security.
            </p>
          </div>
        </div>
      )}

      {/* USAGE TAB */}
      {activeTab === "usage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Ring chart */}
            <Card style={{ padding: 24 }}>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: T.primary, margin: "0 0 20px" }}>
                Monthly Usage
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <RingChart used={usedCalls} total={tier.calls} color={tier.color} />
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: T.primary }}>
                    {usedCalls.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 12, color: T.muted, marginBottom: 12 }}>
                    of {tier.calls.toLocaleString()} calls/mo
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 12, color: T.secondary }}>
                    Resets in <strong style={{ color: T.primary }}>8 days</strong>
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 12, color: T.secondary, marginTop: 4 }}>
                    Avg. <strong style={{ color: T.primary }}>162 calls/day</strong>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tier comparison */}
            <Card style={{ padding: 24 }}>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: T.primary, margin: "0 0 16px" }}>
                Plan Comparison
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TIERS.map((t) => {
                  const isCurrent = t.id === currentTier;
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                        borderRadius: 8, border: `1px solid ${isCurrent ? t.color : C.border}`,
                        background: isCurrent ? `${t.color}10` : "transparent",
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? t.color : T.secondary, flex: 1 }}>
                        {t.label}
                      </span>
                      <span style={{ fontFamily: FONT, fontSize: 11, color: T.muted }}>{t.calls.toLocaleString()} calls</span>
                      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 12, fontWeight: 600, color: T.primary }}>{t.price}/mo</span>
                      {isCurrent && <Badge style={{ fontSize: 10 }}>Current</Badge>}
                    </div>
                  );
                })}
              </div>
              <Btn style={{ width: "100%", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <ArrowUpRight size={14} strokeWidth={IW} />
                Upgrade Plan
              </Btn>
            </Card>
          </div>

          {/* AI Insight */}
          <Card style={{ padding: 20, border: `1px solid ${C.accent}30` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={16} color={C.accent} strokeWidth={IW} />
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: T.primary }}>AI Usage Advisor</span>
              </div>
              <Btn onClick={loadAiInsight} disabled={aiLoading} style={{ fontSize: 12, padding: "6px 12px" }}>
                {aiLoading ? "Analyzing…" : "Get Insights"}
              </Btn>
            </div>
            {aiInsight ? (
              <p style={{ fontFamily: FONT, fontSize: 13, color: T.secondary, margin: 0, lineHeight: 1.7 }}>{aiInsight}</p>
            ) : (
              <p style={{ fontFamily: FONT, fontSize: 12, color: T.muted, margin: 0 }}>
                Click "Get Insights" to receive AI-powered recommendations for optimizing your API usage.
              </p>
            )}
          </Card>

          {/* Rate limits info */}
          <Card style={{ padding: 20 }}>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: T.primary, margin: "0 0 16px" }}>
              Rate Limits
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Requests/second", value: "10", sub: "burst allowed" },
                { label: "Requests/minute", value: "200", sub: "rolling window" },
                { label: "Concurrent", value: "5", sub: "parallel requests" },
              ].map((stat) => (
                <div key={stat.label} style={{ padding: "14px 16px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: T.primary }}>{stat.value}</div>
                  <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: T.secondary }}>{stat.label}</div>
                  <div style={{ fontFamily: FONT, fontSize: 11, color: T.muted }}>{stat.sub}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* DOCS TAB */}
      {activeTab === "docs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontSize: 12, color: T.muted, marginBottom: 6 }}>Test with domain:</div>
              <input
                value={testDomain}
                onChange={(e) => setTestDomain(e.target.value)}
                placeholder="example.com"
                style={{
                  padding: "8px 12px", background: C.surface || C.bg,
                  border: `1px solid ${C.border}`, borderRadius: 7,
                  fontFamily: FONT, fontSize: 13, color: T.primary, outline: "none", width: 220,
                }}
              />
            </div>
            <div style={{ padding: "8px 14px", background: `${C.accent}10`, border: `1px solid ${C.accent}30`, borderRadius: 8, fontFamily: FONT, fontSize: 12, color: C.accent }}>
              Base URL: <strong>https://api.cx-fusion.com/v1</strong>
            </div>
          </div>

          {ENDPOINTS.map((ep, i) => {
            const isOpen = expandedEndpoint === ep.path;
            const result = testResults[ep.path];
            return (
              <Card key={ep.path} style={{ padding: 0, overflow: "hidden" }}>
                <button
                  onClick={() => setExpandedEndpoint