// src/components/landing/Footer.jsx

export default function Footer({ dark }) {
  return (
    <footer className={`border-t py-10 ${dark ? "border-slate-800 bg-slate-950" : "border-slate-100 bg-white"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className={`font-semibold text-sm ${dark ? "text-white" : "text-slate-800"} font-jakarta`}>
            Care-E
          </span>
        </div>
        <p className={`text-xs text-center ${dark ? "text-slate-600" : "text-slate-400"}`}>
          © 2025–26 UAB Escola d'Enginyeria · Robòtica, Llenguatge i Planificació
        </p>
        <p className={`text-xs ${dark ? "text-slate-600" : "text-slate-400"}`}>
          Bertrans · Cantero · Domene · Serra · Vidal
        </p>
      </div>
    </footer>
  );
}