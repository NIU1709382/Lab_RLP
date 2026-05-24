// src/components/dashboard/DashboardHeader.jsx
"use client";

export default function DashboardHeader({ dark, setOpen, isReallyOnline }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bon dia" : hour < 20 ? "Bona tarda" : "Bona nit";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Hamburguesa — només mòbil */}
        <button
          className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            dark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
          }`}
          onClick={() => setOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div>
          <h1 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>
            {greeting}! 👋
          </h1>
          <p className={`text-sm mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
            Aquí tens el resum d'avui de Care-E.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isReallyOnline ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}
          style={isReallyOnline ? { boxShadow: "0 0 6px #22c55e" } : {}} />
        <span className={`text-sm font-medium ${
          isReallyOnline
            ? dark ? "text-green-400" : "text-green-600"
            : dark ? "text-slate-400" : "text-slate-500"
        }`}>
          {isReallyOnline ? "En línia" : "Desconnectat"}
        </span>
      </div>
    </div>
  );
}