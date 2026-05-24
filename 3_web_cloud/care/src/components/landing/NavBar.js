// src/components/landing/Navbar.jsx
"use client";

import { useState, useEffect } from "react";

// Icones pròpies del Navbar
const IconSun = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>);
const IconMoon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);

export default function Navbar({ dark, toggleDark, setAuthMode }) {
  const [scrolled, setScrolled] = useState(false);

  // Escolta l'scroll per canviar el fons del Navbar
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? dark
            ? "bg-slate-950/95 backdrop-blur-md border-b border-slate-800"
            : "bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0">
            <img
              src="/favicon.ico"
              alt="Icono"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <span className={`font-bold text-base tracking-tight ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>
              Care-E
            </span>
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                dark ? "bg-sky-950 text-sky-400 border border-sky-800" : "bg-sky-50 text-sky-600 border border-sky-200"
              }`}
            >
              Beta
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleDark} className="p-2">
            {dark ? <IconSun /> : <IconMoon />}
          </button>
          
          <button
            onClick={() => setAuthMode("login")}
            className={`hidden sm:block px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            Iniciar sessió
          </button>
          
          <button
            onClick={() => setAuthMode("register")}
            className={`hidden sm:block px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            Registrar-se
          </button>
        </div>
      </div>
    </nav>
  );
}