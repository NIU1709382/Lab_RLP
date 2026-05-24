// src/components/landing/HowItWorksSection.jsx

export default function HowItWorksSection({ dark }) {
  const steps = [
    { n: "1", emoji: "⚙️", title: "Configura des del web", desc: "La família programa medicació, horaris i contactes d'emergència en minuts des del dashboard." },
    { n: "2", emoji: "🤖", title: "Care-E s'encarrega",    desc: "El robot patrulla, reconeix l'usuari, dispensa pastilles i manté conversa en tot moment." },
    { n: "3", emoji: "📱", title: "Rep alertes al mòbil",  desc: "Si hi ha una caiguda o una emergència, reps una notificació immediata al teu telèfon." },
  ];

  return (
    <section className={`py-20 sm:py-28 subtle-grid ${dark ? "bg-slate-950" : "bg-white"}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className={`text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full ${
            dark ? "bg-sky-950 text-sky-400 border border-sky-800" : "bg-sky-50 text-sky-600 border border-sky-200"
          }`}>
            Com funciona
          </span>
          <h2 className="mt-5 text-3xl sm:text-4xl font-bold font-jakarta"
            style={{letterSpacing: "-0.02em" }}>
            Simple per a la família.<br />
            <span className={dark ? "text-sky-400" : "text-sky-500"}>Intel·ligent per al robot.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map(({ n, emoji, title, desc }) => (
            <div key={n} className={`relative p-6 rounded-2xl border text-center ${
              dark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100 shadow-sm"
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl ${
                dark ? "bg-slate-800" : "bg-slate-50 border border-slate-100"
              }`}>
                {emoji}
              </div>
              <div className={`text-xs font-bold tracking-widest mb-2 ${dark ? "text-sky-500" : "text-sky-500"}`}>
                PAS {n}
              </div>
              <h3 className={`font-semibold text-base mb-2 ${dark ? "text-white" : "text-slate-800"} font-jakarta`}>
                {title}
              </h3>
              <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}