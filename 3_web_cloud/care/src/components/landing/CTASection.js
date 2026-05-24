// src/components/landing/CTASection.jsx

export default function CTASection({ dark, setAuthMode }) {
  return (
    <section className={`py-20 sm:py-28 ${dark ? "bg-slate-900" : "bg-sky-50"}`}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-6 ${
          dark ? "bg-sky-500/20 border border-sky-500/30" : "bg-white border border-sky-100 shadow-md"
        }`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={dark ? "#38bdf8" : "#0ea5e9"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-jakarta"
          style={{letterSpacing: "-0.02em" }}>
          Cuida les persones que<br />
          <span className={dark ? "text-sky-400" : "text-sky-500"}>t'importen.</span>
        </h2>
        
        <p className={`mb-8 text-base max-w-md mx-auto ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Registra't i accedeix al dashboard per gestionar Care-E des de qualsevol dispositiu, en qualsevol moment.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => setAuthMode("register")}
            className={`btn-primary px-8 py-3.5 rounded-2xl text-sm font-semibold transition-colors ${
              dark ? "border-slate-700 hover:bg-slate-700" : "border-slate-200 hover:bg-sky-400"
            }`}>
            Crear compte gratuït
          </button>
          <button onClick={() => setAuthMode("login")}
            className={`px-8 py-3.5 rounded-2xl text-sm font-semibold border transition-colors ${
              dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-300"
            }`}>
            Ja tinc compte
          </button>
        </div>
      </div>
    </section>
  );
}