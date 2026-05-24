// src/components/dashboard/OfflineDialog.jsx
"use client";

export default function OfflineDialog({ dark, robot, handleRetry, retrying }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`max-w-md w-full text-center p-10 rounded-3xl border ${
        dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
      }`}>
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 ${
          dark ? "bg-slate-800" : "bg-slate-50 border border-slate-100"
        }`}>📡</div>
        <h2 className={`text-xl font-bold mb-2 font-jakarta ${dark ? "text-white" : "text-slate-900"}`}>
          Robot offline
        </h2>
        <p className={`text-sm leading-relaxed mb-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
          No es pot mostrar informació en directe. El <span className={`font-semibold ${dark ? "text-white" : "text-slate-800"}`}>CARE-E</span> no està responent.
        </p>
        <div className={`text-xs px-4 py-3 rounded-xl mb-4 ${
          dark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500 border border-slate-100"
        }`}>
          Última connexió: {robot?.updated_at
            ? new Date(robot.updated_at).toLocaleString("ca-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
            : "Desconegut"
          }
        </div>
        <button onClick={handleRetry} disabled={retrying}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:-translate-y-px transition-all disabled:opacity-70"
          style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: "0 4px 16px rgba(14,165,233,0.3)" }}>
          <span className={`inline-block ${retrying ? "animate-spin" : ""}`}>🔄</span>
          {retrying ? " Comprovant..." : " Tornar a intentar"}
        </button>
      </div>
    </div>
  );
}