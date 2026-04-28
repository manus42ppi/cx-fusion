import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
  loadClientsSync, loadClients, saveClients,
  loadReportsSync, loadReports,
  loadContentReportsSync, loadContentReports,
  loadClientHistorySync, loadClientHistory,
  saveReport, saveContentReport,
  uid,
} from "../utils/api.js";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// Map Clerk user → internal user format
function mapClerkUser(clerkUser) {
  const fullName = clerkUser.fullName || "";
  const email = clerkUser.primaryEmailAddress?.emailAddress || "";
  const initials = fullName
    ? fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase();
  return {
    id: clerkUser.id,
    name: fullName || email.split("@")[0] || "User",
    email,
    role: clerkUser.publicMetadata?.role || "analyst",
    initials,
    imageUrl: clerkUser.imageUrl || null,
    color: "#0057D9",
  };
}

export function AppProvider({ children }) {
  // ── Clerk auth ────────────────────────────────────────────────────────────
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  // Demo login bypass (no Clerk account needed)
  const [demoUser, setDemoUser] = useState(null);

  // Resolved user: Clerk user > demo user > null
  const user = isSignedIn && clerkUser ? mapClerkUser(clerkUser) : demoUser;

  const handleLogout = useCallback(async () => {
    if (isSignedIn) {
      await signOut();
    }
    setDemoUser(null);
  }, [isSignedIn, signOut]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [nav, setNav] = useState("dashboard");

  // ── Data state (fast localStorage init, then KV hydration) ───────────────
  const [clients, setClients]               = useState(() => loadClientsSync());
  const [reports, setReports]               = useState(() => loadReportsSync());
  const [contentReports, setContentReports] = useState(() => loadContentReportsSync());
  const [clientHistory, setClientHistory]   = useState(() => loadClientHistorySync());

  const [activeReport,    setActiveReport]    = useState(null);
  const [compareDomains,  setCompareDomains]  = useState([]);
  const [pendingDomain,   setPendingDomain]   = useState(null);

  // Hydrate from KV on mount
  useEffect(() => {
    loadClients().then(data => setClients(data));
    loadReports().then(data => setReports(data));
    loadContentReports().then(data => setContentReports(data));
    loadClientHistory().then(data => setClientHistory(data));
  }, []);

  const goNav = useCallback((page, data) => {
    setNav(page);
    if (data?.report)  setActiveReport(data.report);
    if (data?.domains) setCompareDomains(data.domains);
    if (data?.domain)  setPendingDomain(data.domain);
    else               setPendingDomain(null);
  }, []);

  const addClient = useCallback((name, domain) => {
    const c = { id: uid(), name, domain, addedAt: new Date().toISOString() };
    setClients(prev => {
      const next = [c, ...prev];
      saveClients(next);
      return next;
    });
    return c;
  }, []);

  const removeClient = useCallback((id) => {
    setClients(prev => {
      const next = prev.filter(c => c.id !== id);
      saveClients(next);
      return next;
    });
  }, []);

  const persistReport = useCallback((domain, data) => {
    saveReport(domain, data);
    setReports(prev => ({ ...prev, [domain]: { ...data, savedAt: new Date().toISOString() } }));
    loadClientHistory().then(h => setClientHistory(h));
  }, []);

  const persistContentReport = useCallback((domain, data) => {
    saveContentReport(domain, data);
    setContentReports(prev => ({ ...prev, [domain]: { ...data, savedAt: new Date().toISOString() } }));
    loadClientHistory().then(h => setClientHistory(h));
  }, []);

  return (
    <Ctx.Provider value={{
      // Auth
      isLoaded,
      user,
      demoUser,
      setDemoUser,
      handleLogout,
      // Navigation
      nav, goNav,
      // Clients
      clients, addClient, removeClient,
      // Reports
      activeReport, setActiveReport,
      compareDomains, setCompareDomains,
      pendingDomain, setPendingDomain,
      reports, persistReport,
      contentReports, persistContentReport,
      clientHistory,
    }}>
      {children}
    </Ctx.Provider>
  );
}
