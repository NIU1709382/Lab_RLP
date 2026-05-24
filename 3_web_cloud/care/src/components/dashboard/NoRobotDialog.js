"use client";

export default function NoRobotDialog({ dark }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`max-w-md w-full text-center p-10 rounded-3xl border ${
        dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
      }`}>
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6`}>
          <img src="/favicon.ico" alt="Care-E" class="w-18 h-18 object-contain"></img></div>
        <h2 className={`text-xl font-bold mb-2 ${dark ? "text-white" : "text-slate-900"} font-jakarta`}
          >
          Cap Care-E connectat
        </h2>
        <p className={`text-sm leading-relaxed mb-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
          No hem trobat cap Care-E associat al teu compte. Configura el teu robot per començar a monitorar.
        </p>
        <div className={`text-xs px-4 py-3 rounded-xl ${
          dark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500 border border-slate-100"
        }`}>
          Contacta amb el teu proveïdor o afegeix un robot des de la configuració.
        </div>
      </div>
    </div>
  );
}