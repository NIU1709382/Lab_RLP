// src/components/auth/AuthModal.jsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthModal({ mode, setMode, dark }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Funció per canviar entre login/registre i netejar el formulari
  const changeMode = (newMode) => {
    setMode(newMode);
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      localStorage.setItem("care-theme", dark ? "dark" : "light");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      setError(error.message);
    } else {
      localStorage.setItem("care-theme", dark ? "dark" : "light");
      setError("Comprova el correu per confirmar el compte ✉️");
    }
    setLoading(false);
  };

  const inputCls = `w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
    dark
      ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15"
  }`;

  // Si no hi ha cap mode actiu, no renderitzem res (tot i que el component pare ja ho hauria de bloquejar)
  if (!mode) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && changeMode(null)}
    >
      <div
        className={`w-full max-w-md rounded-3xl p-7 border ${
          dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className={`font-semibold ${dark ? "text-white" : "text-slate-800"} font-jakarta`}>
                Care-E
              </span>
            </div>
            <h2 className={`text-xl font-bold ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>
              {mode === "login" ? "Benvingut de nou 👋" : "Crea el teu compte"}
            </h2>
          </div>
          <button
            onClick={() => changeMode(null)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-colors ${
              dark ? "bg-slate-800 hover:bg-slate-700 text-slate-400" : "bg-slate-100 hover:bg-slate-200 text-slate-500"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Toggle Login/Register */}
        <div className={`flex rounded-xl p-1 mb-5 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
          {[
            ["login", "Iniciar sessió"],
            ["register", "Registrar-se"],
          ].map(([m, label]) => (
            <button
              key={m}
              onClick={() => changeMode(m)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-sky-500 text-white shadow-sm"
                  : dark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Formulari */}
        <div className="space-y-4">
          {mode === "register" && (
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                NOM COMPLET
              </label>
              <input
                type="text"
                placeholder="El teu nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())}
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
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())}
              className={inputCls}
            />
          </div>

          {/* Missatges d'error o confirmació */}
          {error && (
            <p
              className={`text-xs px-3 py-2 rounded-xl ${
                error.includes("Comprova")
                  ? dark
                    ? "bg-green-950/60 text-green-400"
                    : "bg-green-50 text-green-700"
                  : dark
                  ? "bg-red-950/60 text-red-400"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {error}
            </p>
          )}
        </div>

        {/* Botó Submit */}
        <button
          onClick={mode === "login" ? handleLogin : handleRegister}
          disabled={loading}
          className="w-full mt-5 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          style={{
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            boxShadow: "0 4px 16px rgba(14,165,233,0.3)",
          }}
        >
          {loading ? "Carregant..." : mode === "login" ? "Entrar al Dashboard →" : "Crear compte →"}
        </button>

        {/* Text inferior alternatiu */}
        <p className={`text-xs text-center mt-4 ${dark ? "text-slate-500" : "text-slate-400"}`}>
          {mode === "login" ? (
            <>
              <span>Nou aquí? </span>
              <button onClick={() => changeMode("register")} className="text-sky-500 hover:underline font-medium">
                Crea un compte
              </button>
            </>
          ) : (
            <>
              <span>Ja tens compte? </span>
              <button onClick={() => changeMode("login")} className="text-sky-500 hover:underline font-medium">
                Inicia sessió
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}