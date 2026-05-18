"use client";

import { useContext, useState, useEffect, useRef } from "react";
import { ThemeContext, SidebarContext } from "@/app/dashboard/layout";
import { supabase } from "@/lib/supabase";

const DAYS_CA = [
  { key: "dilluns",   short: "Dl" },
  { key: "dimarts",   short: "Dt" },
  { key: "dimecres",  short: "Dc" },
  { key: "dijous",    short: "Dj" },
  { key: "divendres", short: "Dv" },
  { key: "dissabte",  short: "Ds" },
  { key: "diumenge",  short: "Dg" },
];

const COLORS = [
  { dot: "bg-sky-400",     gradBtn: "from-sky-500 to-sky-600",     badgeL: "bg-sky-50 text-sky-700 border-sky-200",     badgeD: "bg-sky-900/30 text-sky-300 border-sky-800",     dayActive: "bg-sky-500",     ring: "border-sky-500" },
  { dot: "bg-violet-400",  gradBtn: "from-violet-500 to-violet-600", badgeL: "bg-violet-50 text-violet-700 border-violet-200", badgeD: "bg-violet-900/30 text-violet-300 border-violet-800", dayActive: "bg-violet-500", ring: "border-violet-500" },
  { dot: "bg-emerald-400", gradBtn: "from-emerald-500 to-emerald-600", badgeL: "bg-emerald-50 text-emerald-700 border-emerald-200", badgeD: "bg-emerald-900/30 text-emerald-300 border-emerald-800", dayActive: "bg-emerald-500", ring: "border-emerald-500" },
  { dot: "bg-amber-400",   gradBtn: "from-amber-500 to-amber-600",  badgeL: "bg-amber-50 text-amber-700 border-amber-200",   badgeD: "bg-amber-900/30 text-amber-300 border-amber-800",   dayActive: "bg-amber-500",   ring: "border-amber-500" },
];

function ClockPicker({ value, onChange, dark }) {
  const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  const [h, m] = value ? value.split(":") : ["08", "00"];
  const [selH, setSelH] = useState(h || "08");
  const [selM, setSelM] = useState(m || "00");
  const [open, setOpen] = useState(false);

  const hourRef = useRef(null);
  const minRef  = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const hi = HOURS.indexOf(selH);
    const mi = MINUTES.indexOf(selM) !== -1 ? MINUTES.indexOf(selM) : 0;
    if (hourRef.current) hourRef.current.scrollTop = hi * 44;
    if (minRef.current)  minRef.current.scrollTop  = mi * 44;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const confirm = () => { onChange(`${selH}:${selM}`); setOpen(false); };

  const col  = dark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900";
  const item = (selected) =>
    `w-full h-11 flex items-center justify-center text-lg font-mono font-semibold rounded-xl transition-colors cursor-pointer select-none ${
      selected ? "bg-sky-500 text-white" : dark ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm text-left flex items-center gap-3 transition-all ${col} ${open ? "ring-2 ring-sky-400" : ""}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50 shrink-0">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span className={value ? "font-mono font-bold" : "opacity-40"}>
          {value ? `${selH}:${selM}` : "Selecciona hora"}
        </span>
      </button>

      {open && (
        <div className={`absolute z-50 left-0 mt-2 rounded-2xl border shadow-2xl p-4 w-64 ${dark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}>
          <p className="text-xs font-medium opacity-50 mb-3 text-center">Selecciona l'hora</p>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <p className="text-xs opacity-40 text-center mb-1">Hora</p>
              <div ref={hourRef} className={`h-44 overflow-y-scroll rounded-xl border scrollbar-hide ${dark ? "border-slate-700" : "border-slate-100"}`} style={{ scrollSnapType: "y mandatory" }}>
                {HOURS.map((hh) => (
                  <div key={hh} style={{ scrollSnapAlign: "start" }} className={item(hh === selH)} onClick={() => setSelH(hh)}>{hh}</div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center text-2xl font-bold opacity-30 pb-1">:</div>
            <div className="flex-1">
              <p className="text-xs opacity-40 text-center mb-1">Minut</p>
              <div ref={minRef} className={`h-44 overflow-y-scroll rounded-xl border scrollbar-hide ${dark ? "border-slate-700" : "border-slate-100"}`} style={{ scrollSnapType: "y mandatory" }}>
                {MINUTES.map((mm) => (
                  <div key={mm} style={{ scrollSnapAlign: "start" }} className={item(mm === selM)} onClick={() => setSelM(mm)}>{mm}</div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={confirm} className="w-full py-2.5 rounded-xl bg-linear-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold">
            Confirmar — {selH}:{selM}
          </button>
        </div>
      )}
    </div>
  );
}

function MedicationSearch({ onSelect, dark, value }) {
  const [query, setQuery]     = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setResults([]);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { return () => setResults([]); }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.length < 3) { setResults([]); return; }
      setLoading(true);
      try {
        const res  = await fetch(`https://cima.aemps.es/cima/rest/medicamentos?nombre=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.resultados || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, [query]);

  const select = (nombre) => { onSelect(nombre); setQuery(nombre); setResults([]); };

  return (
    <div className="relative w-full" ref={wrapRef}>
      <input
        type="text"
        placeholder="Cerca medicament..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); if (value) onSelect(""); }}
        className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm transition-all ${
          dark ? "bg-slate-800 border-slate-700 text-white focus:border-sky-500" : "bg-white border-slate-200 focus:border-sky-400"
        }`}
      />
      {loading && (
        <div className="absolute right-3 top-3">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {results.length > 0 && (
        <div className={`absolute z-50 w-full mt-1 rounded-xl border shadow-2xl max-h-48 overflow-y-auto ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          {results.map((m) => (
            <button
              key={m.nregistro}
              onMouseDown={(e) => { e.preventDefault(); select(m.nombre); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-sky-600 hover:text-white transition-colors ${
                dark ? "text-slate-200 border-b border-slate-700 last:border-0" : "text-slate-700 border-b border-slate-50 last:border-0"
              }`}
            >
              {m.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_SCHED = { slot_inventory_id: "", time: "", dose: "1", days: [] };

export default function MedicationsPage() {
  const { theme } = useContext(ThemeContext);
  const { setOpen } = useContext(SidebarContext);
  const dark = theme === "dark";

  const [tab, setTab] = useState("inventory");

  const [robotId, setRobotId]     = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [userId, setUserId]       = useState(null);
  const [inventory, setInventory] = useState([null, null, null, null]);
  const [schedules, setSchedules] = useState([]);

  const [editingSlot, setEditingSlot] = useState(null);
  const [invForm, setInvForm]         = useState({ medication_name: "", pill_count: "" });
  const [invSaving, setInvSaving]     = useState(false);
  const [deletingSlot, setDeletingSlot] = useState(null);

  const [showSchedForm, setShowSchedForm] = useState(false);
  const [schedForm, setSchedForm]         = useState(EMPTY_SCHED);
  const [schedSaving, setSchedSaving]     = useState(false);

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data: robot } = await supabase.from("robots").select("id").eq("owner_id", user.id).single();
    if (!robot) return;
    setRobotId(robot.id);
    const { data: patient } = await supabase.from("patients").select("id").eq("robot_id", robot.id).single();
    if (patient) setPatientId(patient.id);
    const { data: slots } = await supabase.from("slot_inventory").select("*").eq("robot_id", robot.id).order("slot");
    const arr = [null, null, null, null];
    (slots || []).forEach(s => { arr[s.slot - 1] = s; });
    setInventory(arr);
    if (patient) {
      const { data: sched } = await supabase
        .from("dispense_schedules")
        .select("*, slot_inventory(slot, medication_name)")
        .eq("patient_id", patient.id)
        .eq("active", true)
        .order("scheduled_time");
      setSchedules(sched || []);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openInvEdit = (slotNum, current) => {
    setEditingSlot(slotNum);
    setInvForm({ medication_name: current?.medication_name || "", pill_count: current?.pill_count?.toString() || "" });
  };

  const cancelInvEdit = () => {
    setEditingSlot(null);
    setInvForm({ medication_name: "", pill_count: "" });
  };

  const saveInventory = async () => {
    if (!invForm.medication_name || !invForm.pill_count || !robotId) return;
    setInvSaving(true);
    await supabase.from("slot_inventory").upsert({
      robot_id: robotId,
      slot: editingSlot,
      medication_name: invForm.medication_name,
      pill_count: parseInt(invForm.pill_count),
      updated_at: new Date().toISOString(),
    }, { onConflict: "robot_id,slot" });
    setEditingSlot(null);
    await fetchAll();
    setInvSaving(false);
  };
  
  const deleteSlot = async (slotNum) => {
    const slotData = inventory[slotNum - 1];
    if (!slotData) return;

    try {
      const { error: updateError } = await supabase
        .from("dispense_schedules")
        .update({ active: false, slot_inventory_id: null })
        .eq("slot_inventory_id", slotData.id);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from("slot_inventory")
        .delete()
        .eq("id", slotData.id);

      if (deleteError) throw deleteError;

      setDeletingSlot(null);
      await fetchAll();

    } catch (error) {
      console.error("Error eliminando el slot:", error.message);
    }
  };

  const toggleDay = (day) => {
    setSchedForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }));
  };

  const saveSchedule = async () => {
    if (!schedForm.slot_inventory_id || !schedForm.time || schedForm.days.length === 0 || !patientId) return;
    setSchedSaving(true);
    await supabase.from("dispense_schedules").insert({
      patient_id: patientId,
      slot_inventory_id: schedForm.slot_inventory_id,
      scheduled_time: schedForm.time,
      days: schedForm.days,
      dose: schedForm.dose,
      active: true,
      created_by: userId,
    });
    setSchedForm(EMPTY_SCHED);
    setShowSchedForm(false);
    await fetchAll();
    setSchedSaving(false);
  };

  const deleteSchedule = async (id) => {
    await supabase.from("dispense_schedules").update({ active: false }).eq("id", id);
    await fetchAll();
  };

  const loadedSlots = inventory.filter(Boolean);
  const grouped = schedules.reduce((acc, s) => {
    const key = s.slot_inventory_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const base = dark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900";
  const card = dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm";
  const inp  = dark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200";

  return (
    <div className={`${base} min-h-screen transition-colors duration-300`}>
      <button
        className={`md:hidden m-4 w-9 h-9 rounded-xl flex items-center justify-center ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}
        onClick={() => setOpen(true)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <main className="max-w-5xl mx-auto p-6">

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Medicació del Robot</h2>
          <p className="opacity-60 text-sm mb-6">Gestiona l'inventari de cada slot i configura els horaris de dispensació.</p>
          <div className={`inline-flex rounded-2xl p-1 gap-1 ${dark ? "bg-slate-800" : "bg-slate-200/60"}`}>
            {[
              { key: "inventory", label: "Inventari de slots" },
              { key: "schedules", label: "Programació" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); cancelInvEdit(); setDeletingSlot(null); }}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  tab === t.key
                    ? dark ? "bg-slate-700 text-white shadow" : "bg-white text-slate-900 shadow"
                    : dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "inventory" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((slotNum) => {
              const idx       = slotNum - 1;
              const color     = COLORS[idx];
              const current   = inventory[idx];
              const isEditing = editingSlot === slotNum;
              const isConfirming = deletingSlot === slotNum;

              return (
                <div key={slotNum} className={`rounded-2xl border p-6 transition-all ${card}`}>

                  <div className="flex items-center justify-between mb-5">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${dark ? color.badgeD : color.badgeL}`}>
                      <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                      Slot {slotNum}
                    </div>
                    {current && !isEditing && !isConfirming && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openInvEdit(slotNum, current)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeletingSlot(slotNum)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                  {isConfirming && (
                    <div className={`mb-4 p-4 rounded-xl border ${dark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"}`}>
                      <p className="text-sm font-semibold text-red-500 mb-1">Eliminar {current?.medication_name}?</p>
                      <p className="text-xs opacity-60 mb-3">Això també eliminarà tots els horaris de dispensació d'aquest slot.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteSlot(slotNum)}
                          className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          onClick={() => setDeletingSlot(null)}
                          className={`flex-1 py-2 rounded-lg text-xs border transition-colors ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}
                        >
                          Cancel·lar
                        </button>
                      </div>
                    </div>
                  )}
                  {isEditing ? (
                    <div key={`edit-${slotNum}`} className="space-y-3">
                      <MedicationSearch
                        dark={dark}
                        value={invForm.medication_name}
                        onSelect={(val) => setInvForm(f => ({ ...f, medication_name: val }))}
                      />
                      <div className="flex gap-3 items-center">
                        <label className="text-sm opacity-60 whitespace-nowrap">Nombre de pastilles:</label>
                        <input
                          type="number" min="0" placeholder="Ex: 30"
                          value={invForm.pill_count}
                          onChange={(e) => setInvForm(f => ({ ...f, pill_count: e.target.value }))}
                          className={`flex-1 px-3 py-2 rounded-xl border outline-none text-sm ${inp}`}
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={saveInventory}
                          disabled={invSaving || !invForm.medication_name || !invForm.pill_count}
                          className={`flex-1 py-2.5 rounded-xl bg-linear-to-r ${color.gradBtn} text-white text-sm font-semibold disabled:opacity-50`}
                        >
                          {invSaving ? "Guardant..." : "Guardar"}
                        </button>
                        <button
                          onClick={cancelInvEdit}
                          className={`px-4 py-2.5 rounded-xl text-sm border ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}
                        >
                          Cancel·lar
                        </button>
                      </div>
                    </div>

                  ) : current && !isConfirming ? (
                    <div>
                      <p className="font-bold text-lg leading-tight mb-3">{current.medication_name}</p>
                      <div className="flex gap-3">
                        <div className={`flex-1 px-4 py-3 rounded-xl text-center ${dark ? "bg-slate-800" : "bg-slate-50"}`}>
                          <p className="text-xs opacity-50 mb-1">Pastilles restants</p>
                          <p className="text-2xl font-black">{current.pill_count}</p>
                        </div>
                        <div className={`flex-1 px-4 py-3 rounded-xl text-center ${dark ? "bg-slate-800" : "bg-slate-50"}`}>
                          <p className="text-xs opacity-50 mb-1">Actualitzat</p>
                          <p className="text-sm font-semibold">
                            {new Date(current.updated_at).toLocaleDateString("ca-ES", { day: "2-digit", month: "short" })}
                          </p>
                        </div>
                      </div>
                    </div>

                  ) : !current ? (
                    <button
                      onClick={() => openInvEdit(slotNum, null)}
                      className={`w-full py-8 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-colors ${
                        dark ? "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300" : "border-slate-200 text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                      <span className="text-sm">Slot buit · clic per omplir</span>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ TAB PROGRAMACIÓ ════════════════════════════════════════════════ */}
        {tab === "schedules" && (
          <div>
            {loadedSlots.length === 0 && (
              <div className={`mb-6 p-4 rounded-2xl border ${dark ? "bg-amber-900/20 border-amber-800 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                <p className="text-sm font-medium">⚠️ Cap slot carregat al robot.</p>
                <p className="text-xs opacity-70 mt-1">
                  Ves a{" "}
                  <button className="underline font-semibold" onClick={() => setTab("inventory")}>
                    Inventari de slots
                  </button>{" "}
                  i omple els slots primer.
                </p>
              </div>
            )}

            <div className="flex justify-end mb-6">
              <button
                onClick={() => { setShowSchedForm(true); setSchedForm(EMPTY_SCHED); }}
                disabled={loadedSlots.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:pointer-events-none"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nova programació
              </button>
            </div>

            {showSchedForm && (
              <div className={`mb-6 p-6 rounded-2xl border ${dark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}>
                <h3 className="font-semibold mb-5">Nova programació</h3>

                <div className="mb-4">
                  <label className="block text-xs font-medium opacity-60 mb-2">Selecciona el medicament</label>
                  <div className="grid grid-cols-2 gap-2">
                    {loadedSlots.map((s) => {
                      const color    = COLORS[s.slot - 1];
                      const selected = schedForm.slot_inventory_id === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSchedForm(f => ({ ...f, slot_inventory_id: s.id }))}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selected
                              ? `border-2 ${color.ring} ${dark ? "bg-sky-900/20" : "bg-sky-50"}`
                              : dark ? "border-slate-700 hover:border-slate-500" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                            <span className="text-xs font-bold opacity-60">Slot {s.slot}</span>
                            {selected && <span className="ml-auto text-sky-500 text-sm">✓</span>}
                          </div>
                          <p className="text-sm font-semibold truncate">{s.medication_name}</p>
                          <p className="text-xs opacity-50">{s.pill_count} pastilles</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium opacity-60 mb-1.5">Hora</label>
                    <ClockPicker dark={dark} value={schedForm.time} onChange={(val) => setSchedForm(f => ({ ...f, time: val }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium opacity-60 mb-1.5">Dosi</label>
                    <input
                      type="number"
                      placeholder="1"
                      value={schedForm.dose}
                      onChange={e => setSchedForm(f => ({ ...f, dose: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm ${inp}`}
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-medium opacity-60 mb-2">Dies</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS_CA.map(({ key, short }) => {
                      const active = schedForm.days.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleDay(key)}
                          className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                            active ? "bg-sky-500 text-white" : dark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {short}
                        </button>
                      );
                    })}
                    <button onClick={() => setSchedForm(f => ({ ...f, days: DAYS_CA.map(d => d.key) }))} className={`px-3 h-10 rounded-lg text-xs ${dark ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600"}`}>Tots</button>
                    <button onClick={() => setSchedForm(f => ({ ...f, days: [] }))} className={`px-3 h-10 rounded-lg text-xs ${dark ? "text-slate-500 hover:text-slate-300" : "text-slate-300 hover:text-slate-500"}`}>Cap</button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveSchedule}
                    disabled={schedSaving || !schedForm.slot_inventory_id || !schedForm.time || schedForm.days.length === 0}
                    className="flex-1 py-3 rounded-xl bg-linear-to-r from-sky-500 to-sky-600 text-white font-semibold text-sm disabled:opacity-40"
                  >
                    {schedSaving ? "Guardant..." : "Crear programació"}
                  </button>
                  <button
                    onClick={() => setShowSchedForm(false)}
                    className={`px-5 py-3 rounded-xl text-sm border ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}
                  >
                    Cancel·lar
                  </button>
                </div>
              </div>
            )}

            {schedules.length === 0 && !showSchedForm ? (
              <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${dark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"}`}>
                <svg className="mx-auto mb-3 opacity-40" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <p className="text-sm font-medium">Cap programació creada</p>
                <p className="text-xs opacity-70 mt-1">Prem "Nova programació" per afegir horaris.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([slotInventoryId, items]) => {
                  const slotInfo = items[0]?.slot_inventory;
                  const slotNum  = slotInfo?.slot;
                  const color    = slotNum ? COLORS[slotNum - 1] : COLORS[0];

                  return (
                    <div key={slotInventoryId} className={`rounded-2xl border overflow-hidden ${card}`}>
                      <div className={`px-5 py-3 border-b flex items-center gap-3 ${dark ? "border-slate-800" : "border-slate-100"}`}>
                        <span className={`w-3 h-3 rounded-full ${color.dot}`} />
                        <span className="font-semibold text-sm">Slot {slotNum}</span>
                        {slotInfo && (
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border ${dark ? color.badgeD : color.badgeL}`}>
                            {slotInfo.medication_name}
                          </span>
                        )}
                        <span className="ml-auto text-xs opacity-40">
                          {items.length} horari{items.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className={`divide-y ${dark ? "divide-slate-800" : "divide-slate-50"}`}>
                        {[...items].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)).map((s) => (
                          <div key={s.id} className="px-5 py-4 flex items-center gap-3 flex-wrap">
                            <span className="font-mono font-bold text-lg w-16 shrink-0">
                              {s.scheduled_time.slice(0, 5)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-lg shrink-0 ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                              {s.dose}
                            </span>
                            <div className="flex gap-1 flex-wrap">
                              {DAYS_CA.map(({ key, short }) => (
                                <span
                                  key={key}
                                  className={`text-xs w-6 h-6 rounded flex items-center justify-center font-medium ${
                                    s.days.includes(key)
                                      ? `${color.dayActive} text-white`
                                      : dark ? "bg-slate-800 text-slate-600" : "bg-slate-100 text-slate-300"
                                  }`}
                                >
                                  {short}
                                </span>
                              ))}
                            </div>
                            <button
                              onClick={() => deleteSchedule(s.id)}
                              className={`ml-auto p-1.5 rounded-lg text-red-400 transition-colors ${dark ? "hover:bg-red-900/20" : "hover:bg-red-50"}`}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
