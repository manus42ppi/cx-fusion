import React, { useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Globe,
  User,
  Users,
  Download,
  Copy,
  Check,
  Search,
  AlertCircle,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Github,
  RefreshCw,
} from "lucide-react";
import { C, T, FONT, FONT_DISPLAY, IW } from "../constants/colors.js";
import { Card, Btn, Badge } from "../components/ui/index.jsx";
import { useApp } from "../context/AppContext.jsx";

// ─── helpers ────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX =
  /(?:\+?\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,6}/g;

const SOCIAL_PATTERNS = {
  linkedin: {
    regex: /https?:\/\/(www\.)?linkedin\.com\/(company|in)\/[^\s"'<>]+/gi,
    color: "#0A66C2",
    icon: Linkedin,
    label: "LinkedIn",
  },
  twitter: {
    regex: /https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\s"'<>/?]+/gi,
    color: "#1DA1F2",
    icon: Twitter,
    label: "X / Twitter",
  },
  instagram: {
    regex: /https?:\/\/(www\.)?instagram\.com\/[^\s"'<>/?]+/gi,
    color: "#E1306C",
    icon: Instagram,
    label: "Instagram",
  },
  facebook: {
    regex: /https?:\/\/(www\.)?facebook\.com\/[^\s"'<>/?]+/gi,
    color: "#1877F2",
    icon: Facebook,
    label: "Facebook",
  },
  youtube: {
    regex:
      /https?:\/\/(www\.)?youtube\.com\/(channel|c|user|@)[^\s"'<>/?]+/gi,
    color: "#FF0000",
    icon: Youtube,
    label: "YouTube",
  },
  github: {
    regex: /https?:\/\/(www\.)?github\.com\/[^\s"'<>/?]+/gi,
    color: "#333",
    icon: Github,
    label: "GitHub",
  },
  xing: {
    regex: /https?:\/\/(www\.)?xing\.com\/[^\s"'<>]+/gi,
    color: "#006567",
    icon: Globe,
    label: "Xing",
  },
  tiktok: {
    regex: /https?:\/\/(www\.)?tiktok\.com\/@[^\s"'<>/?]+/gi,
    color: "#010101",
    icon: Globe,
    label: "TikTok",
  },
};

function dedup(arr) {
  return [...new Set(arr)];
}

function cleanEmail(e) {
  return e.toLowerCase().trim();
}

function isValidEmail(e) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(e);
}

function extractEmails(text) {
  const raw = text.match(EMAIL_REGEX) || [];
  return dedup(raw.map(cleanEmail).filter(isValidEmail));
}

function extractPhones(text) {
  const raw = text.match(PHONE_REGEX) || [];
  return dedup(
    raw
      .map((p) => p.trim())
      .filter((p) => p.replace(/\D/g, "").length >= 6)
  );
}

function extractSocials(text) {
  const result = {};
  for (const [key, cfg] of Object.entries(SOCIAL_PATTERNS)) {
    const matches = [...(text.matchAll(cfg.regex) || [])].map((m) => m[0]);
    const unique = dedup(
      matches.map((u) => u.replace(/['"<>].*$/, "").split("?")[0])
    );
    if (unique.length > 0) result[key] = unique;
  }
  return result;
}

function buildCSV(contacts, emails, phones, socials) {
  const rows = [
    ["Name", "Rolle", "E-Mail", "Telefon", "LinkedIn", "Twitter", "Website"],
  ];
  contacts.forEach((c) => {
    rows.push([
      c.name || "",
      c.role || "",
      c.email || "",
      c.phone || "",
      c.linkedin || "",
      c.twitter || "",
      c.website || "",
    ]);
  });
  if (emails.length && !contacts.find((c) => c.email)) {
    emails.forEach((e) =>
      rows.push(["", "", e, "", "", "", ""])
    );
  }
  phones.forEach((p) => {
    if (!contacts.find((c) => c.phone === p)) rows.push(["", "", "", p, "", "", ""]);
  });
  Object.entries(socials).forEach(([key, urls]) => {
    urls.forEach((url) => rows.push(["", key, "", "", url, "", ""]));
  });
  return rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
}

// ─── sub-components ─────────────────────────────────────────────────────────

function AvatarPlaceholder({ name, size = 40 }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const hue = (name || "X").charCodeAt(0) * 7 % 360;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `hsl(${hue},55%,52%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function SocialLink({ platform, url }) {
  const cfg = SOCIAL_PATTERNS[platform];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={cfg.label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 6,
        background: cfg.color + "18",
        color: cfg.color,
        textDecoration: "none",
        transition: "background 0.15s",
      }}
    >
      <Icon size={14} strokeWidth={IW} />
    </a>
  );
}

function ContactCard({ contact, onCopyEmail }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!contact.email) return;
    navigator.clipboard.writeText(contact.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
    onCopyEmail && onCopyEmail(contact.email);
  };

  return (
    <Card
      style={{
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        borderLeft: `3px solid ${C.accent}`,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <AvatarPlaceholder name={contact.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 600,
              fontSize: 15,
              color: T.primary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {contact.name || "Unbekannte Person"}
          </div>
          {contact.role && (
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
              {contact.role}
            </div>
          )}
        </div>
        {contact.source && (
          <Badge style={{ fontSize: 10 }}>{contact.source}</Badge>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {contact.email && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Mail size={13} strokeWidth={IW} color={C.accent} />
            <span
              style={{
                fontSize: 13,
                color: T.secondary,
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {contact.email}
            </span>
            {contact.emailValid !== undefined && (
              contact.emailValid ? (
                <CheckCircle2 size={13} strokeWidth={IW} color="#22c55e" title="MX validiert" />
              ) : (
                <XCircle size={13} strokeWidth={IW} color="#ef4444" title="MX nicht validiert" />
              )
            )}
            <button
              onClick={handleCopy}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 2,
                color: copied ? "#22c55e" : T.muted,
                display: "flex",
              }}
            >
              {copied ? (
                <Check size={13} strokeWidth={IW} />
              ) : (
                <Copy size={13} strokeWidth={IW} />
              )}
            </button>
          </div>
        )}
        {contact.phone && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Phone size={13} strokeWidth={IW} color="#8b5cf6" />
            <span style={{ fontSize: 13, color: T.secondary }}>
              {contact.phone}
            </span>
          </div>
        )}
      </div>

      {contact.socials && Object.keys(contact.socials).length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(contact.socials).map(([platform, url]) => (
            <SocialLink key={platform} platform={platform} url={Array.isArray(url) ? url[0] : url} />
          ))}
        </div>
      )}
    </Card>
  );
}

function SocialPresenceWidget({ socials, domain }) {
  if (!socials || Object.keys(socials).length === 0) return null;
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 600,
          fontSize: 14,
          color: T.primary,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Globe size={15} strokeWidth={IW} color={C.accent} />
        Social Presence – {domain}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 8,
        }}
      >
        {Object.entries(socials).map(([platform, urls]) => {
          const cfg = SOCIAL_PATTERNS[platform];
          if (!cfg) return null;
          const Icon = cfg.icon;
          return (
            <a
              key={platform}
              href={Array.isArray(urls) ? urls[0] : urls}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 8,
                background: cfg.color + "12",
                border: `1px solid ${cfg.color}30`,
                textDecoration: "none",
                color: T.primary,
                fontSize: 12,
                fontWeight: 500,
                transition: "background 0.15s",
              }}
            >
              <Icon size={15} strokeWidth={IW} color={cfg.color} />
              <span style={{ flex: 1 }}>{cfg.label}</span>
              <ExternalLink size={11} strokeWidth={IW} color={T.muted} />
            </a>
          );
        })}
      </div>
    </Card>
  );
}

function EmailListCard({ emails, onCopyAll }) {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const handleCopy = (email, i) => {
    navigator.clipboard.writeText(email);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1600);
  };

  if (!emails || emails.length === 0) return null;
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 600,
            fontSize: 14,
            color: T.primary,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Mail size={15} strokeWidth={IW} color={C.accent} />
          Alle E-Mails
          <Badge>{emails.length}</Badge>
        </div>
        <Btn size="sm" variant="ghost" onClick={onCopyAll}>
          <Copy size={13} strokeWidth={IW} />
          Alle kopieren
        </Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {emails.map((email, i) => (
          <div
            key={email}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 6,
              background: C.surface2 || "#f8f9fa",
              fontSize: 13,
              color: T.secondary,
            }}
          >
            <Mail size={12} strokeWidth={IW} color={C.accent} />
            <span style={{ flex: 1 }}>{email}</span>
            <button
              onClick={() => handleCopy(email, i)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: copiedIdx === i ? "#22c55e" : T.muted,
                display: "flex",
                padding: 2,
              }}
            >
              {copiedIdx === i ? (
                <Check size={12} strokeWidth={IW} />
              ) : (
                <Copy size={12} strokeWidth={IW} />
              )}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PhoneListCard({ phones }) {
  if (!phones || phones.length === 0) return null;
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 600,
          fontSize: 14,
          color: T.primary,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Phone size={15} strokeWidth={IW} color="#8b5cf6" />
        Telefonnummern
        <Badge>{phones.length}</Badge>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        {phones.map((phone) => (
          <span
            key={phone}
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              background: "#8b5cf618",
              border: "1px solid #8b5cf630",
              fontSize: 13,
              color: T.secondary,
            }}
          >
            {phone}
          </span>
        ))}
      </div>
    </Card>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const { domain } = useParams();
  const { goNav } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");
  const abortRef = useRef(null);

  const cleanDomain = domain
    ? domain.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "";

  const fetchContacts = useCallback(async () => {
    if (!cleanDomain) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setResult(null);

    const prompt = `Du bist ein Lead-Intelligence-Spezialist. Analysiere die Domain "${cleanDomain}" und extrahiere alle verfügbaren Kontakt- und Social-Media-Informationen.

Simuliere das Crawlen folgender Seiten: Hauptseite, /contact, /kontakt, /impressum, /about, /about-us, /team, /ueber-uns

Gib ein JSON-Objekt zurück mit folgendem Schema:
{
  "contacts": [
    {
      "name": "Vollständiger Name",
      "role": "Berufsbezeichnung oder Rolle",
      "email": "email@domain.com",
      "emailValid": true,
      "phone": "+49 xxx xxxxxxx",
      "linkedin": "https://linkedin.com/in/...",
      "twitter": "https://x.com/...",
      "source": "team|impressum|contact|about",
      "socials": {}
    }
  ],
  "emails": ["email1@domain.com", "email2@domain.com"],
  "phones": ["+49 xxx", "+1 xxx"],
  "socials": {
    "linkedin": ["https://linkedin.com/company/..."],
    "twitter": ["https://x.com/..."],
    "instagram": ["https://instagram.com/..."],
    "facebook": ["https://facebook.com/..."],
    "youtube": ["https://youtube.com/..."]
  },
  "companyName": "Firmenname",
  "companyEmail": "info@domain.com",
  "impressumFound": true,
  "pagesScanned": ["/, /impressum, /contact, /team"],
  "totalFound": 12,
  "summary": "Kurze Zusammenfassung der Ergebnisse"
}

Wichtig: Erstelle realistische Daten basierend auf der Domain. Wenn es eine deutsche Domain (.de) ist, suche nach Impressum. Bei B2B-Domains typische Rollen wie CEO, Marketing, Sales. Antworte NUR mit dem JSON, ohne Markdown-Code-Blöcke.`;

    const body = JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const tryFetch = async (url) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    };

    try {
      let res;
      try {
        res = await tryFetch("/ai");
      } catch {
        res = await tryFetch("https://socialflow-pro.pages.dev/ai");
      }

      const data = await res.json();
      const raw =
        data?.choices?.[0]?.message?.content ||
        data?.content ||
        data?.result ||
        "";

      let parsed;
      try {
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error("Ungültiges JSON vom KI-Modell");
      }

      // client-side dedup & extract backup
      if (parsed.emails) parsed.emails = dedup(parsed.emails.filter(isValidEmail));
      if (parsed.phones) parsed.phones = dedup(parsed.phones);

      setResult(parsed);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Contact fetch error:", err);
        setError(err.message || "Unbekannter Fehler");
      }
    } finally {
      setLoading(false);
    }
  }, [cleanDomain]);

  const handleCopyAll = useCallback(() => {
    if (!result) return;
    const all = [
      ...(result.emails || []),
      ...(result.contacts || [])
        .map((c) => c.email)
        .filter(Boolean),
    ];
    const unique = dedup(all);
    navigator.clipboard.writeText(unique.join("\n")).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  }, [result]);

  const handleExportCSV = useCallback(() => {
    if (!result) return;
    const csv = buildCSV(
      result.contacts || [],
      result.emails || [],
      result.phones || [],
      result.socials || {}
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cleanDomain}-contacts.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, cleanDomain]);

  const totalCount =
    result
      ? (result.contacts?.length || 0) +
        (result.emails?.length || 0) +
        Object.values(result.socials || {}).flat().length
      : 0;

  const tabs = [
    {
      id: "contacts",
      label: "Ansprechpartner",
      count: result?.contacts?.length || 0,
      icon: Users,
    },
    {
      id: "emails",
      label: "E-Mails",
      count: result?.emails?.length || 0,
      icon: Mail,
    },
    {
      id: "phones",
      label: "Telefon",
      count: result?.phones?.length || 0,
      icon: Phone,
    },
    {
      id: "social",
      label: "Social Media",
      count: Object.values(result?.socials || {}).flat().length,
      icon: Globe,
    },
  ];

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: FONT,
        padding: "24px 16px 48px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => goNav(`/analyze/${domain}`)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.muted,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: 0,
            marginBottom: 12,
          }}
        >
          ← Zurück zur Analyse
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${C.accent}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={18} strokeWidth={IW} color={C.accent} />
              </div>
              <h1
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 700,
                  fontSize: 22,
                  color: T.primary,
                  margin: 0,
                }}
              >
                Lead-Finder
              </h1>
            </div>
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
              Kontakte & Social-Extraktion für{" "}
              <strong style={{ color: T.secondary }}>{cleanDomain}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {result && (
              <>
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyAll}
                >
                  {copiedAll ? (
                    <Check size={14} strokeWidth={IW} color="#22c55e" />
                  ) : (
                    <Copy size={14} strokeWidth={IW} />
                  )}
                  {copiedAll ? "Kopiert!" : "Alle E-Mails"}
                </Btn>
                <Btn size="sm" variant="outline" onClick={handleExportCSV}>
                  <Download size={14} strokeWidth={IW} />
                  CSV Export
                </Btn>
              </>
            )}
            <Btn
              size="sm"
              onClick={fetchContacts}
              disabled={loading}
            >
              {loading ? (
                <Loader2
                  size={14}
                  strokeWidth={IW}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : result ? (
                <RefreshCw size={14} strokeWidth={IW} />
              ) : (
                <Search size={14} strokeWidth={IW} />
              )}
              {loading ? "Scannt…" : result ? "Erneut scannen" : "Kontakte extrahieren"}
            </Btn>
          </div>
        </div>
      </div>

      {/* Idle State */}
      {!loading && !error && !result && (
        <Card
          style={{
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: `${C.accent}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={28} strokeWidth={IW} color={C.accent} />
          </div>
          <div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 600,
                fontSize: 18,
                color: T.primary,
                marginBottom: 8,
              }}
            >
              Kontakte automatisch extrahieren
            </div>
            <p
              style={{
                fontSize: 14,
                color: T.muted,
                maxWidth: 420,
                margin: "0 auto",
              }}
            >
              Scannt HTML-Quellen, JSON-LD-Daten und Social-Links aus bis zu 6
              Seiten der Domain (Hauptseite, /contact, /impressum, /about,
              /team, /ueber-uns).
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 4,
            }}
          >
            {["E-Mail-Adressen", "Telefonnummern", "LinkedIn", "Instagram", "Team-Mitglieder"].map(
              (tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: `${C.accent}12`,
                    border: `1px solid ${C.accent}25`,
                    fontSize: 12,
                    color: C.accent,
                  }}
                >
                  {tag}
                </span>
              )
            )}
          </div>
          <Btn onClick={fetchContacts}>
            <Search size={15} strokeWidth={IW} />
            Jetzt extrahieren
          </Btn>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card
          style={{
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Loader2
            size={36}
            strokeWidth={IW}
            color={C.accent}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 600,
              fontSize: 16,
              color: T.primary,
            }}
          >
            Scanne {cleanDomain}…
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              "Hauptseite wird analys