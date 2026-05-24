"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"

import Card from "@/components/ui/Card";
import {SectionTitle} from "@/components/ui/SettingsUI";

export default function RobotSection({ dark }) {
  const [robots,   setRobots]   = useState([]);
  const [patients, setPatients] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [tab,      setTab]      = useState("link"); // "link" | "create"
  const [form,     setForm]     = useState({ robotId: "", robotName: "", name: "", patientName: "" });
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState(null);

  const loadRobots = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("robots").select("*").eq("owner_id", user.id).order("created_at");
    setRobots(data ?? []);
    if (data?.length) {
      const ids = data.map(r => r.id);
      const { data: pats } = await supabase.from("patients").select("*").in("robot_id", ids);
      const map = {};
      (pats ?? []).forEach(p => { map[p.robot_id] = p; });
      setPatients(map)
    }
  };

  useEffect(() => { loadRobots(); }, []);

  // Vincular robot existent per ID
  const handleLink = async () => {
    if (!form.robotId || !form.patientName) { setError("Omple tots els camps"); return; }
    setLoading(true); setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    // Comprova que l'ID existeix
    const { data: robot } = await supabase
      .from("robots").select("id, owner_id, name").eq("id", form.robotId.trim()).single();

    if (!robot) { setError("No s'ha trobat cap robot amb aquest ID. Comprova que el Pi estigui encès."); setLoading(false); return; }
    if (robot.owner_id && robot.owner_id !== user.id) { setError("Aquest robot ja està vinculat a un altre compte."); setLoading(false); return; }
    if (robot.owner_id === user.id) { setError("Aquest robot ja està vinculat al teu compte."); setLoading(false); return; }

    // Vincula
    await supabase.from("robots").update({
      owner_id: user.id,
      name:     form.robotName.trim() || robot.name || "Care-E",
    }).eq("id", form.robotId.trim());

    // Crea el pacient
    const { data: patient } = await supabase.from("patients").insert({
      full_name: form.patientName,
      robot_id:  form.robotId.trim(),
    }).select().single();

    // Caregiver
    await supabase.from("patient_caregivers").insert({
      patient_id: patient.id,
      profile_id: user.id,
    });

    // Al handleLink — generes el token
    const token = crypto.randomUUID();
    await supabase.from("robots").update({ robot_token: token }).eq("id", form.robotId.trim());

    done();
  };

  // Crear robot nou (sense Pi encara)
  const handleCreate = async () => {
    if (!form.name || !form.patientName) { setError("Omple tots els camps"); return; }
    setLoading(true); setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: robot, error: robotErr } = await supabase
      .from("robots").insert({
        name: form.name, status: "offline", battery: 100, signal: "excellent", owner_id: user.id,
      }).select().single();

    if (robotErr) { setError(robotErr.message); setLoading(false); return; }

    const { data: patient, error: patErr } = await supabase.from("patients").insert({
      full_name: form.patientName, robot_id: robot.id,
    }).select().single();

    if (patErr) { setError(patErr.message); setLoading(false); return; }

    await supabase.from("patient_caregivers").insert({
      patient_id: patient.id, profile_id: user.id,
    });

    done();
  };

  const done = async () => {
    setSaved(true);
    setForm({ robotId: "", robotName: "", name: "", patientName: "" });
    setShowForm(false);
    await loadRobots();
    setTimeout(() => setSaved(false), 3000);
    setLoading(false);
  };

  const handleDelete = async (robotId) => {
    if (!confirm("Segur que vols eliminar aquest robot i totes les seves dades?")) return;
    await supabase.from("robots").delete().eq("id", robotId);
    await loadRobots();
  };

  const inputCls = `w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
    dark
      ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15"
  }`;

  return (
    <Card dark={dark} className="p-6">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle dark={dark}>🤖 Robots vinculats</SectionTitle>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setError(null); }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
              dark ? "bg-sky-950/60 text-sky-400 hover:bg-sky-950" : "bg-sky-50 text-sky-600 hover:bg-sky-100"
            }`}
          >
            + Vincular robot
          </button>
        )}
      </div>

      {/* Llista de robots */}
      {robots.length === 0 && !showForm && (
        <div className={`text-center py-8 ${dark ? "text-slate-500" : "text-slate-400"}`}>
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-sm font-medium mb-1">Cap robot vinculat</p>
          <p className="text-xs">Vincula el teu Care-E per començar a monitorar.</p>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {robots.map(robot => {
          const patient = patients[robot.id];
          const isOnline = robot.status === "online";
          return (
            <div key={robot.id} className={`p-4 rounded-xl border ${
              dark ? "border-slate-800 bg-slate-800/30" : "border-slate-100 bg-slate-50"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                    dark ? "bg-slate-700" : "bg-white border border-slate-100"
                  }`}>🤖</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                        {robot.name}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isOnline
                          ? dark ? "bg-green-950/60 border-green-800/40 text-green-400" : "bg-green-50 border-green-200 text-green-700"
                          : dark ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-400"
                      }`}>
                        {isOnline ? "● En línia" : "○ Offline"}
                      </span>
                    </div>
                    <div className={`text-xs mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
                      {patient ? `Cuidant: ${patient.full_name}` : "Sense pacient assignat"}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(robot.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl transition-colors ${
                    dark ? "text-red-500/60 hover:text-red-400 hover:bg-red-950/20" : "text-red-400 hover:text-red-600 hover:bg-red-50"
                  }`}>
                  Eliminar
                </button>
              </div>
              {/* ID visible per copiar al Pi */}
              <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${
                dark ? "bg-slate-900 border border-slate-700" : "bg-white border border-slate-200"
              }`}>
                <span className={`text-[10px] font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}>ID:</span>
                <span className={`text-[10px] font-mono flex-1 truncate ${dark ? "text-slate-400" : "text-slate-600"}`}>
                  {robot.id}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(robot.id)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-colors ${
                    dark ? "bg-slate-800 text-slate-400 hover:text-sky-400" : "bg-slate-50 text-slate-400 hover:text-sky-600"
                  }`}
                >
                  Copiar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {saved && (
        <div className={`px-4 py-2.5 rounded-xl text-sm font-medium mb-3 ${
          dark ? "bg-green-950/60 text-green-400" : "bg-green-50 text-green-700"
        }`}>✓ Robot vinculat correctament!</div>
      )}

      {/* Formulari */}
      {showForm && (
        <div className={`p-4 rounded-xl border space-y-4 ${
          dark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50"
        }`}>
          {/* Tab selector */}
          <div className={`flex rounded-xl p-1 ${dark ? "bg-slate-900" : "bg-white border border-slate-200"}`}>
            {[["link", "Vincular per ID"], ["create", "Crear nou"]].map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === t
                    ? "bg-sky-500 text-white shadow-sm"
                    : dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                }`}>
                {label}
              </button>
            ))}
          </div>

          {tab === "link" ? (
            <>
              <div className={`text-xs p-3 rounded-xl ${dark ? "bg-slate-900 border border-slate-700 text-slate-400" : "bg-white border border-slate-100 text-slate-500"}`}>
                <p className="font-semibold mb-1">Com obtenir l'ID:</p>
                <p>1. Encén el Raspberry Pi amb el script de Care-E</p>
                <p>2. L'ID apareixerà a la consola en iniciar</p>
                <p>3. Copia'l i enganxa'l aquí sota</p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>ID del robot</label>
                <input type="text" placeholder="Enganxa l'ID del robot aquí"
                  value={form.robotId} onChange={e => setForm({ ...form, robotId: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>Nom del robot (opcional)</label>
                <input type="text" placeholder="Ex: Care-E de l'Àvia Maria"
                  value={form.robotName} onChange={e => setForm({ ...form, robotName: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>Nom de la persona cuidada</label>
                <input type="text" placeholder="Ex: Maria García"
                  value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })}
                  className={inputCls} />
              </div>
            </>
          ) : (
            <>
              <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
                Crea un robot a la BD i obté l'ID per configurar el Raspberry Pi després.
              </p>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>Nom del robot</label>
                <input type="text" placeholder="Ex: Care-E de l'Àvia Maria"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>Nom de la persona cuidada</label>
                <input type="text" placeholder="Ex: Maria García"
                  value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })}
                  className={inputCls} />
              </div>
            </>
          )}

          {error && (
            <p className={`text-xs px-3 py-2 rounded-xl ${dark ? "bg-red-950/60 text-red-400" : "bg-red-50 text-red-600"}`}>
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={tab === "link" ? handleLink : handleCreate}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:-translate-y-px transition-all"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: "0 4px 16px rgba(14,165,233,0.25)" }}>
              {loading ? "Processant..." : tab === "link" ? "Vincular robot" : "Crear robot"}
            </button>
            <button onClick={() => { setShowForm(false); setError(null); setTab("link"); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                dark ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}>
              Cancel·lar
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}