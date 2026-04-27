// ── CX FUSION DESIGN TOKENS ─────────────────────────────────────────────────
// Zentrale Designsprache für SocialFlow Pro.
// Alle Farb-, Schatten- und Radius-Werte sind hier definiert.
// Komponenten greifen auf C.xxx zu – Änderungen hier wirken überall.

export const FONT = "'Inter', system-ui, sans-serif";
export const FONT_DISPLAY = "'Inter', system-ui, sans-serif";
export const IW = 1.67; // Standard icon stroke-width (CX Fusion)

// ── Raw Tokens (CX Fusion Figma) ────────────────────────────────────────────
export const T = {
  // Brand palette
  brand25:  '#F6F9FE',
  brand50:  '#F0F5FE',
  brand100: '#E6EFFE',
  brand200: '#D6E5FD',
  brand300: '#BBD3FB',
  brand500: '#4284F5',
  brand600: '#075DF2',   // Primary action
  brand700: '#0550D4',
  // Neutral gray
  gray50:  '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E9EAEB',
  gray300: '#D5D7DA',
  gray400: '#A4A7AE',
  gray500: '#717680',
  gray600: '#535862',
  gray700: '#414651',
  gray800: '#252B37',
  gray900: '#181D27',
  // Base
  white:  '#FFFFFF',
  appBg:  '#F2F4F7',
  // Status
  success500: '#17B26A',
  successBg:  '#DCFCE7',
  successText:'#166534',
  warning500: '#F59E0B',
  warningBg:  '#FEF3C7',
  warningText:'#92400E',
  error600:   '#D92D20',
  errorBg:    '#FEE2E2',
  // Shadows (CX Fusion spec)
  shadowXs: '0px 1px 2px rgba(10,13,18,.05)',
  shadowSm: '0px 1px 3px rgba(10,13,18,.10),0px 1px 2px rgba(10,13,18,.06)',
  shadowLg: '0px 12px 16px -4px rgba(10,13,18,.08),0px 4px 6px -2px rgba(10,13,18,.03)',
  // Border radius
  rSm: 6,
  rMd: 8,
  rLg: 12,
};

// ── C: Semantisches Farb-Mapping (abwärtskompatibel) ────────────────────────
// Alle Komponenten nutzen C.xxx. Durch Änderung dieser Werte
// ändert sich das gesamte Design zentral.
export const C = {
  // ── Hintergründe ────────────────────────────────────────────────────────
  bg:          T.appBg,        // Seiten-Hintergrund
  surface:     T.white,        // Karten / Oberflächen
  sidebar:     T.brand25,      // Icon-Rail Hintergrund (CX: brand-25)
  sidebarMid:  T.white,        // Nav-Panel Hintergrund (CX: white)

  // ── Rahmen / Trennlinien ────────────────────────────────────────────────
  border:      T.gray200,
  borderLight: T.gray100,

  // ── Text-Hierarchie ─────────────────────────────────────────────────────
  text:        T.gray900,      // Primärtext
  textMid:     T.gray700,      // Sekundärtext
  textSoft:    T.gray500,      // Tertiärtext
  textMute:    T.gray400,      // Deaktiviert / Platzhalter

  // ── Brand / Primäraktion ────────────────────────────────────────────────
  accent:      T.brand600,     // Hauptfarbe (Buttons, Links, Icons aktiv)
  accentHov:   T.brand700,     // Hover-Zustand
  accentLight: T.brand100,     // Heller Hintergrund für Brand-Elemente
  accentGlow:  'rgba(7,93,242,0.08)',

  // ── Semantische Farben ──────────────────────────────────────────────────
  success:     T.success500,
  successBg:   T.successBg,
  successText: T.successText,
  warning:     T.warning500,
  warningBg:   T.warningBg,
  warningText: T.warningText,
  red:         T.error600,
  redLight:    T.errorBg,

  // ── Info / "Purple" → jetzt Brand-Blue ──────────────────────────────────
  info:        T.brand500,
  infoBg:      T.brand100,
  purple:      T.brand600,
  purpleBg:    T.brand100,
  purpleGlow:  'rgba(7,93,242,0.10)',

  // ── KI-Farben ───────────────────────────────────────────────────────────
  ai1:         T.brand600,
  ai2:         T.brand500,

  // ── Glas-Effekte (Kompatibilität) ───────────────────────────────────────
  glass:       'rgba(255,255,255,0.7)',
  glassStroke: 'rgba(255,255,255,0.9)',

  // ── CX Fusion Ergänzungen ───────────────────────────────────────────────
  rail:        T.brand25,
  panel:       T.white,
  panelBorder: T.gray200,
  brandSoft:   T.brand200,
  grayHover:   T.gray50,
  surfaceHigh: T.gray50,

  // Aliases für alte dark-theme Namen
  danger:      T.error600,
  dangerBg:    T.errorBg,
  gradient:    `linear-gradient(135deg, ${T.brand600} 0%, ${T.brand500} 100%)`,
  gradientHov: `linear-gradient(135deg, ${T.brand700} 0%, ${T.brand600} 100%)`,
};

// ── Global CSS (Keyframes, Scrollbar, Font-Import) ───────────────────────────
export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes glow    { 0%,100%{box-shadow:0 0 8px rgba(7,93,242,.2)} 50%{box-shadow:0 0 18px rgba(7,93,242,.4)} }
  * { box-sizing:border-box; } body { margin:0; }
  ::-webkit-scrollbar      { width:4px; height:4px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:#D5D7DA; border-radius:99px }
  ::-webkit-scrollbar-thumb:hover { background:#A4A7AE }
`;
