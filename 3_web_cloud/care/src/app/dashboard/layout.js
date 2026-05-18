// src/app/dashboard/layout.js
"use client";

import { useState, useEffect, createContext } from "react";
import Sidebar from "@/components/Sidebar";

export const ThemeContext   = createContext({ theme: "light", setTheme: () => {} });
export const SidebarContext = createContext({ open: false,    setOpen:  () => {} });

export default function DashboardLayout({ children }) {
  const [theme, setTheme]   = useState("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady]     = useState(false);  // ← afegeix això

  useEffect(() => {
    const saved = localStorage.getItem("care-theme");
    if (saved) setTheme(saved);
    setReady(true);  // ← marca que ja hem llegit
  }, []);

  useEffect(() => {
    if (!ready) return;  // ← no guardis fins que haguem llegit
    localStorage.setItem("care-theme", theme);
  }, [theme, ready]);


  const dark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <SidebarContext.Provider value={{ open: sidebarOpen, setOpen: setSidebarOpen }}>
        <div
          suppressHydrationWarning
          className={`flex h-screen overflow-hidden transition-colors duration-300 ${
            dark ? "bg-slate-950" : "bg-slate-50"
          }`}
        >
          <Sidebar />
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0">
            {children}
          </main>
        </div>
      </SidebarContext.Provider>
    </ThemeContext.Provider>
  );
}