// src/components/landing/HeroSection.jsx
import Robot from "@/components/landing/Robot";

export default function HeroSection({ dark, setAuthMode }) {
  return (
    <section className={`relative min-h-screen flex items-center overflow-hidden subtle-grid ${dark ? "" : ""}`}>
      {/* Soft ambient blob */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none animate-soft-pulse"
        style={{ background: dark ? "radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)" : "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)" }}/>
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: dark ? "radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 70%)" : "radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)" }}/>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Text */}
          <div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-7 animate-fade-up delay-0 ${
              dark ? "bg-sky-950/70 border border-sky-800/60 text-sky-300" : "bg-sky-50 border border-sky-200 text-sky-700"
            }`}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-blink" />
              Care-E online · UAB Escola d'Enginyeria
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5 animate-fade-up delay-100 font-jakarta"
              style={{ letterSpacing: "-0.02em" }}>
              El company perfecte<br />
              <span className={dark ? "text-sky-400" : "text-sky-500"}>per a les persones</span><br />
              que estimes.
            </h1>

            <p className={`text-base sm:text-lg leading-relaxed mb-8 max-w-lg animate-fade-up delay-200 ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Care-E és el robot domèstic que acompanya i protegeix les persones grans. Detecta caigudes, recorda la medicació i fa companyia — 24 hores al dia.
            </p>

            <div className="flex flex-wrap gap-3 animate-fade-up delay-300">
              <button onClick={() => setAuthMode("login")}
                className={`btn-primary px-7 py-3.5 rounded-2xl text-sm font-semibold transition-colors ${
                  dark ? "hover:bg-slate-800" : "hover:bg-sky-400"
                }`}>
                Accedir al Dashboard →
              </button>
              <a href="#features"
                className={`px-7 py-3.5 rounded-2xl text-sm font-semibold border transition-colors ${
                  dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-300"
                }`}>
                Descobrir funcions
              </a>
            </div>

            {/* Stats */}
            <div className={`flex gap-6 sm:gap-8 mt-10 pt-8 border-t animate-fade-up delay-400 ${dark ? "border-slate-800" : "border-slate-100"}`}>
              {[
                { n: "24/7", l: "Monitoratge continu" },
                { n: "<3s",  l: "Alerta de caiguda" },
                { n: "100%", l: "Veu natural" },
              ].map(({ n, l }) => (
                <div key={l}>
                  <div className={`text-xl font-bold mb-0.5 ${dark ? "text-sky-400" : "text-sky-600"} font-jakarta`}>{n}</div>
                  <div className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Robot */}
          <div className="relative flex justify-center order-first lg:order-last">
            <div className={`absolute inset-0 rounded-3xl pointer-events-none ${
              dark ? "bg-slate-900/40" : "bg-slate-50/60"
            }`} style={{ borderRadius: "40% 60% 60% 40% / 40% 40% 60% 60%", filter: "blur(0px)" }}/>
            <div className="relative animate-float w-full max-w-xs sm:max-w-sm py-6">
              <Robot dark={dark} />
            </div>
            {/* Status pill */}
            <div className={`absolute top-4 right-0 sm:right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              dark ? "bg-slate-900 border-slate-700 text-green-400" : "bg-white border-slate-200 text-green-600 shadow-sm"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              En línia
            </div>
            {/* Med reminder pill */}
            <div className={`absolute bottom-10 left-0 sm:left-2 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              dark ? "bg-slate-900 border-amber-800/40 text-amber-400" : "bg-white border-amber-200 text-amber-700 shadow-sm"
            }`}>
              💊 Medicació a les 14:00
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}