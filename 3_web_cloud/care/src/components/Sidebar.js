// src/components/Sidebar.js
"use client";

import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ThemeContext, SidebarContext } from "@/app/dashboard/layout";
import { supabase } from "@/lib/supabase";

const SunIcon  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>);
const MoonIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);

const navItems = [
  { href: "/dashboard",             icon: "⊞",  label: "Dashboard" },
  { href: "/dashboard/medications",           icon: "💊", label: "Medicació" },
  { href: "/dashboard/activity",    icon: "🕒", label: "Activitat" },
  { href: "/dashboard/robot",       icon: "🤖", label: "Control Robot" },
  { href: "/dashboard/reports",     icon: "📊", label: "Informes" },
  { href: "/dashboard/settings",    icon: "⚙️", label: "Configuració" },
];

export default function Sidebar() {
  const { theme, setTheme } = useContext(ThemeContext);
  const { open, setOpen }   = useContext(SidebarContext);
  const dark     = theme === "dark";
  const router   = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState(null);

  // Carrega el perfil de l'usuari autenticat
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      setProfile(data);
    };
    load();
  }, []);

  // Inicial de l'usuari per l'avatar
  const initial = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : "?";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className={`
      fixed md:relative inset-y-0 left-0 z-40
      w-60 flex-shrink-0 flex flex-col justify-between
      transition-transform duration-300 ease-in-out
      ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      ${dark ? "bg-slate-950 border-r border-slate-800" : "bg-white border-r border-slate-100 shadow-sm"}
    `}>

      {/* Top */}
      <div className="p-4 flex flex-col gap-1">

        {/* Logo */}
        <div className={`flex items-center gap-3 px-3 py-3 mb-3 border-b ${dark ? "border-slate-800" : "border-slate-100"}`}>
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0">
            <img src="/favicon.ico" alt="Care-E" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <div className={`font-bold text-sm leading-tight font-jakarta ${dark ? "text-white" : "text-slate-900"}`}
              >Care-E</div>
            <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border inline-block ${
              dark ? "bg-sky-950 border-sky-800 text-sky-400" : "bg-sky-50 border-sky-200 text-sky-600"
            }`}>Beta</div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(dark ? "light" : "dark")}
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                dark ? "bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            {/* Close (mobile) */}
            <button
              className={`md:hidden w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-colors ${
                dark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500"
              }`}
              onClick={() => setOpen(false)}
            >✕</button>
          </div>
        </div>
        {/* Nav */}
        <nav className="space-y-0.5 mt-1">
          {navItems.map(({ href, icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? dark
                      ? "bg-sky-950/60 text-sky-300 border border-sky-800/40"
                      : "bg-sky-50 text-sky-700 border border-sky-200"
                    : dark
                    ? "text-slate-500 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
                }`}>
                  <span className={`text-sm flex-shrink-0 ${!active ? "opacity-60" : ""}`}>{icon}</span>
                  <span className="truncate">{label}</span>
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div className={`p-4 border-t space-y-3 ${dark ? "border-slate-800" : "border-slate-100"}`}>

        {/* Dispense */}
        <button
          className="w-full py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px"
          style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: "0 4px 16px rgba(14,165,233,0.3)" }}
        >
          💊 Dispensar Ara
        </button>

        {/* User row */}
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl ${
          dark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border-2 ${
            dark ? "bg-sky-950 border-sky-800 text-sky-400" : "bg-sky-50 border-sky-200 text-sky-600"
          }`}>
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-semibold truncate ${dark ? "text-slate-300" : "text-slate-700"}`}>
              {profile?.full_name ?? "Usuari"}
            </div>
            <div className={`text-[10px] truncate capitalize ${dark ? "text-slate-600" : "text-slate-400"}`}>
              {profile?.role ?? "familiar"}
            </div>
          </div>
        </div>

        <div className="space-y-0.5">
          <button className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            dark ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}>
            <span>❓</span> Suport
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              dark ? "text-red-500/60 hover:text-red-400 hover:bg-red-950/20" : "text-red-400 hover:text-red-600 hover:bg-red-50"
            }`}
          >
            <span>🚪</span> Tancar sessió
          </button>
        </div>
      </div>
    </aside>
  );
}