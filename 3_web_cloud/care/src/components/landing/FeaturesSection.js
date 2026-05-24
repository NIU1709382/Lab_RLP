// src/components/landing/FeaturesSection.jsx

// ─── Icones ────────────────────────────────────────────────────────────────────
const IconShield = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const IconHeart  = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);
const IconBell   = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);
const IconPill   = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v2"/><circle cx="17" cy="17" r="5"/><path d="m14.5 19.5 5-5"/></svg>);
const IconMic    = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>);
const IconGlobe  = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>);

export default function FeaturesSection({ dark }) {
  const features = [
    { icon: <IconShield />, title: "Detecció de caigudes",      desc: "Detecta caigudes a l'instant i avisa la família via Telegram o app mòbil.",     color: "blue" },
    { icon: <IconPill />,   title: "Dispensació de medicació",  desc: "Recorda i apropa la dosi exacta a l'hora programada. Sense oblits.",            color: "teal" },
    { icon: <IconMic />,    title: "Conversa natural",          desc: "Parla amb Care-E com si fos una persona. Escolta, respon i fa companyia.",      color: "sky" },
    { icon: <IconHeart />,  title: "Reconeixement facial",      desc: "Reconeix l'usuari i el saluda pel nom amb expressió càlida i amigable.",        color: "pink" },
    { icon: <IconBell />,   title: "Alertes a la família",      desc: "Dashboard on la família programa horaris i rep notificacions d'emergència.",    color: "amber" },
    { icon: <IconGlobe />,  title: "Navegació autònoma",        desc: "Es mou per la llar evitant obstacles, catifes i mobles. Sempre on cal.",        color: "green" },
  ];

  // Color maps per feature card
  const colorMap = {
    blue:  { bg: dark ? "bg-blue-950/50"  : "bg-blue-50",  icon: dark ? "bg-blue-900/60 text-blue-300"  : "bg-blue-100 text-blue-600",  border: dark ? "border-blue-800/40"  : "border-blue-100" },
    teal:  { bg: dark ? "bg-teal-950/50"  : "bg-teal-50",  icon: dark ? "bg-teal-900/60 text-teal-300"  : "bg-teal-100 text-teal-600",  border: dark ? "border-teal-800/40"  : "border-teal-100" },
    sky:   { bg: dark ? "bg-sky-950/50"   : "bg-sky-50",   icon: dark ? "bg-sky-900/60 text-sky-300"    : "bg-sky-100 text-sky-600",    border: dark ? "border-sky-800/40"   : "border-sky-100" },
    pink:  { bg: dark ? "bg-pink-950/50"  : "bg-pink-50",  icon: dark ? "bg-pink-900/60 text-pink-300"  : "bg-pink-100 text-pink-600",  border: dark ? "border-pink-800/40"  : "border-pink-100" },
    amber: { bg: dark ? "bg-amber-950/50" : "bg-amber-50", icon: dark ? "bg-amber-900/60 text-amber-300": "bg-amber-100 text-amber-600", border: dark ? "border-amber-800/40": "border-amber-100" },
    green: { bg: dark ? "bg-green-950/50" : "bg-green-50", icon: dark ? "bg-green-900/60 text-green-300": "bg-green-100 text-green-600", border: dark ? "border-green-800/40": "border-green-100" },
  };

  return (
    <section id="features" className={`py-20 sm:py-28 ${dark ? "bg-slate-900" : "bg-slate-50"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className={`text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full ${
            dark ? "bg-sky-950 text-sky-400 border border-sky-800" : "bg-sky-50 text-sky-600 border border-sky-200"
          }`}>
            Funcionalitats
          </span>
          <h2 className="mt-5 text-3xl sm:text-4xl font-bold mb-3 font-jakarta"
            style={{letterSpacing: "-0.02em" }}>
            Tot el necessari per<br />
            <span className={dark ? "text-sky-400" : "text-sky-500"}>cuidar de veritat.</span>
          </h2>
          <p className={`max-w-xl mx-auto text-base ${dark ? "text-slate-400" : "text-slate-500"}`}>
            Cada funció de Care-E respon a un problema real del dia a dia de les persones grans que viuen soles.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const c = colorMap[f.color];
            return (
              <div key={f.title} className={`rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${c.bg} ${c.border}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${c.icon}`}>
                  {f.icon}
                </div>
                <h3 className={`font-semibold text-base mb-2 ${dark ? "text-white" : "text-slate-800"} font-jakarta`}>
                  {f.title}
                </h3>
                <p className={`text-sm leading-relaxed ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}