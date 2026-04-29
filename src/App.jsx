import React, { lazy, Suspense } from "react";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import Login from "./components/Login.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import { C, FONT, CSS } from "./constants/colors.js";

const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const AnalyzePage   = lazy(() => import("./pages/AnalyzePage.jsx"));
const ReportPage    = lazy(() => import("./pages/ReportPage.jsx"));
const ComparePage   = lazy(() => import("./pages/ComparePage.jsx"));
const ClientsPage   = lazy(() => import("./pages/ClientsPage.jsx"));
const ContentPage   = lazy(() => import("./pages/ContentPage.jsx"));
const ImprovePage   = lazy(() => import("./pages/ImprovePage.jsx"));
const FeaturesPage  = lazy(() => import("./pages/FeaturesPage.jsx"));
const FeatSchemaValidatorPage  = lazy(() => import("./pages/feat_feat-schema-validator.jsx"));
const SocialMediaStatsPage     = lazy(() => import("./pages/feat_social-media-stats.jsx"));
// ─── AUTO_IMPORTS_START ───────────────────────────────────────────────────────
// ─── AUTO_IMPORTS_END ─────────────────────────────────────────────────────────
const BatchPage = lazy(() => import("./pages/BatchPage.jsx"));

function PageFallback() {
  return (
    <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
    </div>
  );
}

function Router() {
  const { nav } = useApp();
  const pages = {
    dashboard: <DashboardPage />,
    analyze:   <AnalyzePage />,
    report:    <ReportPage />,
    compare:   <ComparePage />,
    clients:   <ClientsPage />,
    content:   <ContentPage />,
    improve:   <ImprovePage />,
    features:  <FeaturesPage />,
    "feat-schema-validator": <FeatSchemaValidatorPage />,
    "social-media-stats":    <SocialMediaStatsPage />,
// ─── AUTO_ROUTES_START ────────────────────────────────────────────────────────
// ─── AUTO_ROUTES_END ──────────────────────────────────────────────────────────
    batch:     <BatchPage />,
  };
  return (
    <Suspense fallback={<PageFallback />}>
      {pages[nav] || <DashboardPage />}
    </Suspense>
  );
}

function AppShell() {
  const { isLoaded, user, setDemoUser } = useApp();

  // Clerk still loading
  if (!isLoaded) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: FONT }}>
      <style>{CSS}</style>
      <div style={{ width: 28, height: 28, border: `3px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
    </div>
  );

  if (!user) return <Login onLogin={u => setDemoUser(u)} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <style>{CSS}</style>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
        <Router />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
