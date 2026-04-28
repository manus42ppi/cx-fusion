import React from "react";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import Login from "./components/Login.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import { C, FONT, CSS } from "./constants/colors.js";
import AnalyzePage from "./pages/AnalyzePage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import ComparePage from "./pages/ComparePage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";
import ContentPage from "./pages/ContentPage.jsx";
import ImprovePage from "./pages/ImprovePage.jsx";
import FeaturesPage from "./pages/FeaturesPage.jsx";
// ─── AUTO_IMPORTS_START ───────────────────────────────────────────────────────
import FeatSchemaValidatorPage from "./pages/feat_feat-schema-validator.jsx";
// ─── AUTO_IMPORTS_END ─────────────────────────────────────────────────────────
import BatchPage from "./pages/BatchPage.jsx";

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
// ─── AUTO_ROUTES_START ────────────────────────────────────────────────────────
    "feat-schema-validator": <FeatSchemaValidatorPage />,
// ─── AUTO_ROUTES_END ──────────────────────────────────────────────────────────
    batch:     <BatchPage />,
  };
  return pages[nav] || <DashboardPage />;
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
