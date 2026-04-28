import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
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

const SESSION_KEY = "cxf_user";

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

export function AppProvider({ children }) {
  const [user, setUser]           = useState(() => loadSession());
  const [nav, setNav]             = useState("dashboard");

  // Fast initial state from localStorage, then KV hydration via useEffect
  const [clients, setClients]             = useState(() => loadClientsSync());
  const [reports, setReports]             = useState(() => loadReportsSync());
  const [contentReports, setContentReports] = useState(() => loadContentReportsSync());
  const [clientHistory, setClientHistory]   = useState(() => loadClientHistorySync());

  const [activeReport, setActiveReport] = useState(null);
  const [compareDomains, setCompareDomains] = useState([]);
  const [pendingDomain, setPendingDomain]   = useState(null);

  // Hydrate from KV on mount (source of truth across devices)
  useEffect(() => {
    loadClients().then(data => setClients(data));
    loadReports().then(data => setReports(data));
    loadContentReports().then(data => setContentReports(data));
    loadClientHistory().then(data => setClientHistory(data));
  }, []);

  const login = useCallback((u) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
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
      user, login, logout,
      nav, goNav,
      clients, addClient, removeClient,
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
