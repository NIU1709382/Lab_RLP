// src/app/page.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconShield = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const IconHeart  = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);
const IconBell   = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);
const IconPill   = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v2"/><circle cx="17" cy="17" r="5"/><path d="m14.5 19.5 5-5"/></svg>);
const IconMic    = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>);
const IconGlobe  = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>);
const IconSun    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>);
const IconMoon   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);


// ─── Robot SVG  (amigable, WALL-E, tons blau/àmbar) ──────────────────────────
const Robot = ({ dark }) => {
  const sky    = dark ? "#38bdf8" : "#0ea5e9";
  const amber  = dark ? "#fbbf24" : "#f59e0b";
  const body   = dark ? "#1e293b" : "#e2e8f0";
  const bodyD  = dark ? "#0f172a" : "#cbd5e1";
  const metal  = dark ? "#334155" : "#94a3b8";
  const screen = dark ? "#0c1a2e" : "#0f172a";

  return (
    <svg viewBox="0 0 300 380" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
      <defs>
        <filter id="eg"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="es"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="eyeg" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9"/>
          <stop offset="35%" stopColor={sky}/>
          <stop offset="100%" stopColor={dark ? "#0369a1" : "#075985"}/>
        </radialGradient>
        <radialGradient id="bodyg" cx="30%" cy="20%" r="80%">
          <stop offset="0%" stopColor={body}/>
          <stop offset="100%" stopColor={bodyD}/>
        </radialGradient>
      </defs>

      {/* Body shadow */}
      <ellipse cx="150" cy="360" rx="70" ry="10" fill={dark ? "#0f172a" : "#cbd5e1"} opacity="0.4"/>

      {/* Wheels */}
      <ellipse cx="100" cy="338" rx="28" ry="14" fill={bodyD} stroke={metal} strokeWidth="2"/>
      <ellipse cx="100" cy="338" rx="14" ry="7" fill={screen}/>
      <ellipse cx="100" cy="338" rx="4" ry="2.5" fill={metal} opacity="0.7"/>
      <ellipse cx="200" cy="338" rx="28" ry="14" fill={bodyD} stroke={metal} strokeWidth="2"/>
      <ellipse cx="200" cy="338" rx="14" ry="7" fill={screen}/>
      <ellipse cx="200" cy="338" rx="4" ry="2.5" fill={metal} opacity="0.7"/>

      {/* Body */}
      <rect x="65" y="175" width="170" height="152" rx="20" fill="url(#bodyg)"/>
      <rect x="65" y="175" width="170" height="152" rx="20" fill="none" stroke={metal} strokeWidth="1" opacity="0.5"/>
      {/* Body panel */}
      <rect x="85" y="195" width="130" height="72" rx="10" fill={screen} stroke={sky} strokeWidth="1.2" opacity="0.9"/>
      {/* Heartbeat line */}
      <polyline points="93,231 103,231 110,216 118,246 125,224 131,231 149,231 154,222 159,240 165,231 177,231" fill="none" stroke={sky} strokeWidth="1.8" filter="url(#es)" opacity="0.95"/>
      {/* Bottom status dots */}
      <circle cx="105" cy="290" r="5" fill="#22c55e" filter="url(#es)"/>
      <circle cx="120" cy="290" r="5" fill={sky} filter="url(#es)"/>
      <circle cx="135" cy="290" r="5" fill={amber} filter="url(#es)"/>

      {/* Arms */}
      <rect x="20" y="183" width="44" height="88" rx="14" fill="url(#bodyg)" stroke={metal} strokeWidth="1" opacity="0.8"/>
      <ellipse cx="42" cy="284" rx="16" ry="11" fill={bodyD} stroke={metal} strokeWidth="1.2"/>
      <rect x="236" y="183" width="44" height="88" rx="14" fill="url(#bodyg)" stroke={metal} strokeWidth="1" opacity="0.8"/>
      <ellipse cx="258" cy="284" rx="16" ry="11" fill={bodyD} stroke={metal} strokeWidth="1.2"/>

      {/* Neck */}
      <rect x="132" y="149" width="36" height="30" rx="5" fill={bodyD}/>
      <rect x="139" y="152" width="7" height="24" rx="3" fill={metal} opacity="0.4"/>
      <rect x="154" y="152" width="7" height="24" rx="3" fill={metal} opacity="0.4"/>

      {/* Head */}
      <rect x="72" y="50" width="156" height="103" rx="24" fill="url(#bodyg)"/>
      <rect x="72" y="50" width="156" height="103" rx="24" fill="none" stroke={metal} strokeWidth="1" opacity="0.5"/>
      {/* Head bottom ridge */}
      <rect x="72" y="128" width="156" height="8" rx="4" fill={bodyD} opacity="0.6"/>

      {/* Eye sockets */}
      <rect x="86" y="63" width="56" height="55" rx="14" fill={screen} stroke={sky} strokeWidth="1.5" filter="url(#es)"/>
      <rect x="158" y="63" width="56" height="55" rx="14" fill={screen} stroke={sky} strokeWidth="1.5" filter="url(#es)"/>
      {/* Eyes */}
      <circle cx="114" cy="90" r="20" fill="url(#eyeg)" filter="url(#eg)"/>
      <circle cx="186" cy="90" r="20" fill="url(#eyeg)" filter="url(#eg)"/>
      {/* Pupils */}
      <circle cx="114" cy="90" r="8" fill={screen}/>
      <circle cx="186" cy="90" r="8" fill={screen}/>
      {/* Shine */}
      <circle cx="108" cy="84" r="3.5" fill="white" opacity="0.7"/>
      <circle cx="180" cy="84" r="3.5" fill="white" opacity="0.7"/>

      {/* Smile */}
      <path d="M 108 128 Q 150 142 192 128" fill="none" stroke={metal} strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>

      {/* Antenna */}
      <line x1="150" y1="50" x2="150" y2="18" stroke={metal} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="150" cy="13" r="8" fill={amber} filter="url(#eg)"/>
      <circle cx="150" cy="13" r="3.5" fill="white" opacity="0.85"/>

      {/* Cheek blushes (amigable!) */}
      <ellipse cx="88" cy="108" rx="10" ry="6" fill={amber} opacity="0.18"/>
      <ellipse cx="212" cy="108" rx="10" ry="6" fill={amber} opacity="0.18"/>
    </svg>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [name, setName]         = useState("")
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const router   = useRouter()
  
  const switchMode = (mode) => {
    setAuthMode(mode)
    setEmail("")
    setPassword("")
    setName("")
    setError(null)
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      // Assegura que el tema està guardat abans de redirigir
      localStorage.setItem("care-theme", dark ? "dark" : "light");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) {
      setError(error.message)
    }  else {
      localStorage.setItem("care-theme", dark ? "dark" : "light");
      setError("Comprova el correu per confirmar el compte ✉️");
    }
    setLoading(false)
  };

  useEffect(() => {
    const saved = localStorage.getItem("care-theme");
    if (saved) setDark(saved === "dark");
  }, []);

  // quan l'usuari canvia el tema a la landing, guarda
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("care-theme", next ? "dark" : "light");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      authMode === "login" ? handleLogin() : handleRegister();
    }
  };
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const features = [
    { icon: <IconShield />, title: "Detecció de caigudes",      desc: "Detecta caigudes a l'instant i avisa la família via Telegram o app mòbil.",     color: "blue" },
    { icon: <IconPill />,   title: "Dispensació de medicació",  desc: "Recorda i apropa la dosi exacta a l'hora programada. Sense oblits.",            color: "teal" },
    { icon: <IconMic />,    title: "Conversa natural",          desc: "Parla amb Care-E com si fos una persona. Escolta, respon i fa companyia.",       color: "sky" },
    { icon: <IconHeart />,  title: "Reconeixement facial",      desc: "Reconeix l'usuari i el saluda pel nom amb expressió càlida i amigable.",         color: "pink" },
    { icon: <IconBell />,   title: "Alertes a la família",      desc: "Dashboard on la família programa horaris i rep notificacions d'emergència.",     color: "amber" },
    { icon: <IconGlobe />,  title: "Navegació autònoma",        desc: "Es mou per la llar evitant obstacles, catifes i mobles. Sempre on cal.",         color: "green" },
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

  const inputCls = `w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
    dark
      ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15"
  }`;

  return (
    <div suppressHydrationWarning
    className={`min-h-screen transition-colors duration-300 ${
      dark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
    }`}>
      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? dark
            ? "bg-slate-950/95 backdrop-blur-md border-b border-slate-800"
            : "bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm"
          : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0`}>
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
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                dark ? "bg-sky-950 text-sky-400 border border-sky-800" : "bg-sky-50 text-sky-600 border border-sky-200"
              }`}>Beta</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
          <button onClick={toggleDark}>
            {dark ? <IconSun /> : <IconMoon />}
          </button>
            <button onClick={() => switchMode("login")}
              className={`hidden sm:block px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-200"
              }`}>
              Iniciar sessió
            </button>
            <button onClick={() => switchMode("register")}
              className={`hidden sm:block px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-200"
              }`}>
              Registrar-se
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
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
                <button onClick={() => switchMode("register")}
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

      {/* FEATURES */}
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

      {/* HOW IT WORKS */}
      <section className={`py-20 sm:py-28 subtle-grid ${dark ? "bg-slate-950" : "bg-white"}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className={`text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full ${
              dark ? "bg-sky-950 text-sky-400 border border-sky-800" : "bg-sky-50 text-sky-600 border border-sky-200"
            }`}>Com funciona</span>
            <h2 className="mt-5 text-3xl sm:text-4xl font-bold font-jakarta"
              style={{letterSpacing: "-0.02em" }}>
              Simple per a la família.<br />
              <span className={dark ? "text-sky-400" : "text-sky-500"}>Intel·ligent per al robot.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { n: "1", emoji: "⚙️", title: "Configura des del web", desc: "La família programa medicació, horaris i contactes d'emergència en minuts des del dashboard." },
              { n: "2", emoji: "🤖", title: "Care-E s'encarrega",    desc: "El robot patrulla, reconeix l'usuari, dispensa pastilles i manté conversa en tot moment." },
              { n: "3", emoji: "📱", title: "Rep alertes al mòbil",  desc: "Si hi ha una caiguda o una emergència, reps una notificació immediata al teu telèfon." },
            ].map(({ n, emoji, title, desc }) => (
              <div key={n} className={`relative p-6 rounded-2xl border text-center ${
                dark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100 shadow-sm"
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl ${
                  dark ? "bg-slate-800" : "bg-slate-50 border border-slate-100"
                }`}>{emoji}</div>
                <div className={`text-xs font-bold tracking-widest mb-2 ${dark ? "text-sky-500" : "text-sky-500"}`}>
                  PAS {n}
                </div>
                <h3 className={`font-semibold text-base mb-2 ${dark ? "text-white" : "text-slate-800"} font-jakarta`}
                  >{title}</h3>
                <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
            <button onClick={() => switchMode("register")}
              className={`btn-primary px-8 py-3.5 rounded-2xl text-sm font-semibold transition-colors ${
                dark ? "border-slate-700 hover:bg-slate-700" : "border-slate-200 hover:bg-sky-400"
              }`}>
              Crear compte gratuït
            </button>
            <button onClick={() => switchMode("login")}
              className={`px-8 py-3.5 rounded-2xl text-sm font-semibold border transition-colors ${
                dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-300"
              }`}>
              Ja tinc compte
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`border-t py-10 ${dark ? "border-slate-800 bg-slate-950" : "border-slate-100 bg-white"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className={`font-semibold text-sm ${dark ? "text-white" : "text-slate-800"} font-jakarta`}
              >Care-E</span>
          </div>
          <p className={`text-xs text-center ${dark ? "text-slate-600" : "text-slate-400"}`}>
            © 2025–26 UAB Escola d'Enginyeria · Robòtica, Llenguatge i Planificació
          </p>
          <p className={`text-xs ${dark ? "text-slate-600" : "text-slate-400"}`}>
            Bertrans · Cantero · Domene · Serra · Vidal
          </p>
        </div>
      </footer>

      {/* AUTH MODAL */}
      {authMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          onClick={(e) => e.target === e.currentTarget && switchMode(null)}>
          <div className={`w-full max-w-md rounded-3xl p-7 border ${
            dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl"
          }`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <span className={`font-semibold ${dark ? "text-white" : "text-slate-800"} font-jakarta`}
                    >Care-E</span>
                </div>
                <h2 className={`text-xl font-bold ${dark ? "text-white" : "text-slate-900"} font-jakarta`}
                  >
                  {authMode === "login" ? "Benvingut de nou 👋" : "Crea el teu compte"}
                </h2>
              </div>
              <button onClick={() => switchMode(null)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-colors ${
                  dark ? "bg-slate-800 hover:bg-slate-700 text-slate-400" : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                }`}>✕</button>
            </div>

            {/* Toggle */}
            <div className={`flex rounded-xl p-1 mb-5 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
              {[["login", "Iniciar sessió"], ["register", "Registrar-se"]].map(([m, label]) => (
                <button key={m} onClick={() => switchMode(m)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    authMode === m
                      ? "bg-sky-500 text-white shadow-sm"
                      : dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            {/* Fields */}
            <div className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                    NOM COMPLET
                  </label>
                  <input
                    type="text"
                    placeholder="El teu nom"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  CORREU ELECTRÒNIC
                </label>
                <input
                  type="email"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (authMode === "login" ? handleLogin() : handleRegister())}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  CONTRASENYA
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (authMode === "login" ? handleLogin() : handleRegister())}
                  className={inputCls}
                />
              </div>
              {/* Missatge d'error o confirmació */}
              {error && (
                <p className={`text-xs px-3 py-2 rounded-xl ${
                  error.includes("Comprova")
                    ? dark ? "bg-green-950/60 text-green-400" : "bg-green-50 text-green-700"
                    : dark ? "bg-red-950/60 text-red-400"   : "bg-red-50 text-red-600"
                }`}>
                  {error}
                </p>
              )}
            </div>
            <button
              onClick={authMode === "login" ? handleLogin : handleRegister}
              disabled={loading}
              className="w-full mt-5 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: "0 4px 16px rgba(14,165,233,0.3)" }}
            >
              {loading
                ? "Carregant..."
                : authMode === "login" ? "Entrar al Dashboard →" : "Crear compte →"
              }
            </button>
            <p className={`text-xs text-center mt-4 ${dark ? "text-slate-500" : "text-slate-400"}`}>
              {authMode === "login"
                ? <><span>Nou aquí? </span><button onClick={() => switchMode("register")} className="text-sky-500 hover:underline font-medium">Crea un compte</button></>
                : <><span>Ja tens compte? </span><button onClick={() => switchMode("login")} className="text-sky-500 hover:underline font-medium">Inicia sessió</button></>
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}