import React, { createContext, useContext, useState, useCallback } from "react";
import { loadClients, saveClients, loadReports, saveReport, loadContentReports, saveContentReport, loadClientHistory, uid } from "../utils/api.js";

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
  const [clients, setClients]     = useState(() => loadClients());
  const [reports, setReports]     = useState(() => loadReports());
  const [contentReports, setContentReports] = useState(() => loadContentReports());
  const [clientHistory, setClientHistory]   = useState(() => loadClientHistory());
  const [activeReport, setActiveReport] = useState(null);
  const [compareDomains, setCompareDomains] = useState([]);
  const [pendingDomain, setPendingDomain]   = useState(null);

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
    setClientHistory(loadClientHistory());
  }, []);

  const persistContentReport = useCallback((domain, data) => {
    saveContentReport(domain, data);
    setContentReports(prev => ({ ...prev, [domain]: { ...data, savedAt: new Date().toISOString() } }));
    setClientHistory(loadClientHistory());
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
