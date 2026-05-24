// src/app/dashboard/settings/page.js
"use client";

import { useContext} from "react";
import { ThemeContext, SidebarContext } from "@/app/dashboard/layout";

import ProfileSection from "@/components/settings/ProfileSection";
import RobotSection from "@/components/settings/RobotSection";
import PasswordSection from "@/components/settings/PasswordSection";

export default function SettingsPage() {
  const { theme }    = useContext(ThemeContext);
  const { setOpen }  = useContext(SidebarContext);
  const dark = theme === "dark";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            dark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
          }`}
          onClick={() => setOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div>
          <h1 className={`text-2xl font-bold font-jakarta ${dark ? "text-white" : "text-slate-900"}`}>
            Configuració
          </h1>
          <p className={`text-sm mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
            Gestiona el teu compte i els robots vinculats.
          </p>
        </div>
      </div>
      <ProfileSection dark={dark} />
      <RobotSection dark={dark} />
      <PasswordSection dark={dark} />
    </div>
  );
}