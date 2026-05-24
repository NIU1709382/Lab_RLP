"use client";

import {useState} from "react";
import { supabase } from "@/lib/supabase"

import Card from "@/components/ui/Card";
import {SectionTitle, SaveBtn} from "@/components/ui/SettingsUI";

export default function PasswordSection({ dark }) {
  const [form, setForm]     = useState({ password: "", confirm: "" });
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const handleSave = async () => {
    if (form.password !== form.confirm) { setError("Les contrasenyes no coincideixen"); return; }
    if (form.password.length < 6) { setError("Mínim 6 caràcters"); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: form.password });
    if (error) { setError(error.message); }
    else { setSaved(true); setForm({ password: "", confirm: "" }); setTimeout(() => setSaved(false), 2500); }
    setLoading(false);
  };

  const inputCls = `w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
    dark
      ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15"
  }`;

  return (
    <Card dark={dark} className="p-6">
      <SectionTitle dark={dark}>🔒 Canviar contrasenya</SectionTitle>
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>Nova contrasenya</label>
          <input type="password" placeholder="••••••••" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>Confirmar contrasenya</label>
          <input type="password" placeholder="••••••••" value={form.confirm}
            onChange={e => setForm({ ...form, confirm: e.target.value })} className={inputCls} />
        </div>
        {error && <p className={`text-xs px-3 py-2 rounded-xl ${dark ? "bg-red-950/60 text-red-400" : "bg-red-50 text-red-600"}`}>{error}</p>}
        <div className="flex justify-end pt-2">
          <SaveBtn onClick={handleSave} loading={loading} saved={saved} dark={dark} />
        </div>
      </div>
    </Card>
  );
}