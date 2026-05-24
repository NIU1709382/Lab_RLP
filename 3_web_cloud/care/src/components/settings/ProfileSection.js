"use client";

import { supabase } from "@/lib/supabase"
import {useState, useEffect } from "react";

import Card from "@/components/ui/Card";
import {SectionTitle, InputField, SaveBtn} from "@/components/ui/SettingsUI";

export default function ProfileSection({ dark }) {
  const [form, setForm]   = useState({ full_name: "", role: "familiar" });
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email);

      const { data } = await supabase
        .from("profiles").select("full_name, role").eq("id", user.id).single();
      if (data) setForm({ full_name: data.full_name ?? "", role: data.role ?? "familiar" });
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({
      full_name: form.full_name,
      role:      form.role,
    }).eq("id", user.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setLoading(false);
  };

  return (
    <Card dark={dark} className="p-6">
      <SectionTitle dark={dark}>👤 Perfil d'usuari</SectionTitle>
      <div className="space-y-4">
        <InputField
          label="Nom complet"
          value={form.full_name}
          onChange={e => setForm({ ...form, full_name: e.target.value })}
          placeholder="El teu nom"
          dark={dark}
        />
        <InputField
          label="Correu electrònic"
          value={email}
          disabled
          dark={dark}
        />
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>Rol</label>
          <select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
              dark ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-sky-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-400"
            }`}
          >
            <option value="familiar">Familiar</option>
            <option value="cuidador">Cuidador professional</option>
          </select>
        </div>
        <div className="flex justify-end pt-2">
          <SaveBtn onClick={handleSave} loading={loading} saved={saved} dark={dark} />
        </div>
      </div>
    </Card>
  );
}