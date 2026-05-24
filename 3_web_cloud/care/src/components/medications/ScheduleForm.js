"use client";

import { useState } from "react";
import ClockPicker from "@/components/medications/ClockPicker";

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
  { dot: "bg-sky-400",     ring: "border-sky-500" },
  { dot: "bg-violet-400",  ring: "border-violet-500" },
  { dot: "bg-emerald-400", ring: "border-emerald-500" },
  { dot: "bg-amber-400",   ring: "border-amber-500" },
];

const EMPTY = { slot_inventory_id: "", time: "", dose: "1", days: [] };

export default function ScheduleForm({
  loadedSlots,
  existingSchedules = [],
  dark,
  onSave,
  onCancel,
  title = "Nova programació",
  subtitle = "Programa una nova dispensació per a l'usuari.",
}) {
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [checking, setChecking] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState(null);
  const [warning, setWarning]   = useState(null);

  const inp = `w-full px-4 py-2.5 rounded-xl border outline-none text-sm transition-all ${
    dark
      ? "bg-slate-800 border-slate-700 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15"
  }`;

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }));
  };

  const checkSafety = async (formData) => {
    const selectedSlot = loadedSlots.find(s => s.id === formData.slot_inventory_id);
    if (!selectedSlot) return null;

  const res = await fetch("/api/check-medication", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      newSchedule: {
        medication_name: selectedSlot.medication_name,
        dose: formData.dose,
        time: formData.time,
        days: formData.days,
        slot_inventory_id: selectedSlot.id, 
      },
      existingSchedules,
    }),
  });

    return await res.json();
  };

  const handleSave = async () => {
    if (!form.slot_inventory_id || !form.time || form.days.length === 0) return;

    setWarning(null);
    setError(null);
    setChecking(true);

    try {
      const safetyResult = await checkSafety(form);

      if (safetyResult && !safetyResult.safe) {
        setWarning(safetyResult);
        setChecking(false);
        return;
      }

      setSaving(true);
      setChecking(false);
      await onSave(form);
      setSaved(true);
      setForm(EMPTY);
      setTimeout(() => setSaved(false), 2500);

    } catch (e) {
      setError(e.message || "Error en guardar");
    } finally {
      setSaving(false);
      setChecking(false);
    }
  };

  const confirmAnyway = async () => {
    setWarning(null);
    setSaving(true);
    try {
      await onSave(form);
      setSaved(true);
      setForm(EMPTY);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message || "Error en guardar");
    }
    setSaving(false);
  };

  return (
    <div className={`rounded-2xl border ${ dark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 shadow-sm text-slate-900"}`}>
      <div className="p-6">
        <h3 className={`text-base font-bold mb-1 font-jakarta ${dark ? "text-white" : "text-slate-900"}`}>
          {title}
        </h3>
        <p className={`text-sm mb-5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
          {subtitle}
        </p>

        <div className="space-y-4">

          {/* Selector de slot */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>
              Medicament
            </label>
            {loadedSlots.length === 0 ? (
              <p className={`text-sm italic ${dark ? "text-slate-500" : "text-slate-400"}`}>
                Cap slot carregat al robot.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {loadedSlots.map((s) => {
                  const color    = COLORS[s.slot - 1];
                  const selected = form.slot_inventory_id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setForm(f => ({ ...f, slot_inventory_id: s.id }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? `border-2 ${color.ring} ${dark ? "bg-sky-900/20" : "bg-sky-50"}`
                          : dark ? "border-slate-700 hover:border-slate-500" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                        <span className={`text-xs font-bold opacity-60 ${dark ? "text-slate-300" : "text-slate-600"}`}>Slot {s.slot}</span>
                        {selected && <span className="ml-auto text-sky-500 text-sm">✓</span>}
                      </div>
                      <p className={`text-sm font-semibold truncate ${dark ? "text-white" : "text-slate-900"}`}>{s.medication_name}</p>
                      <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{s.pill_count} pastilles</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hora + Dosi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                Hora
              </label>
              <ClockPicker
                dark={dark}
                value={form.time}
                onChange={(val) => setForm(f => ({ ...f, time: val }))}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                Dosi
              </label>
              <input
                type="number"
                placeholder="1"
                value={form.dose}
                onChange={e => setForm(f => ({ ...f, dose: e.target.value }))}
                className={inp}
              />
            </div>
          </div>

          {/* Dies */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>
              Dies
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS_CA.map(({ key, short }) => {
                const active = form.days.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleDay(key)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${
                      active ? "bg-sky-500 text-white" : dark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {short}
                  </button>
                );
              })}
              <button
                onClick={() => setForm(f => ({ ...f, days: DAYS_CA.map(d => d.key) }))}
                className={`px-2 h-9 rounded-lg text-xs ${dark ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600"}`}
              >
                Tots
              </button>
            </div>
          </div>

          {/* Animació de verificació */}
          {checking && (
            <div className={`p-4 rounded-xl border ${dark ? "bg-sky-900/20 border-sky-800" : "bg-sky-50 border-sky-200"}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-8 h-8 shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                  <div
                    className="absolute inset-1 rounded-full border-2 border-sky-300/40 border-b-transparent animate-spin"
                    style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
                  />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${dark ? "text-sky-300" : "text-sky-700"}`}>
                    Verificant seguretat...
                  </p>
                  <p className={`text-xs ${dark ? "text-sky-400/70" : "text-sky-500"}`}>
                    Analitzant dosi i interaccions amb IA
                  </p>
                </div>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${dark ? "bg-sky-900/60" : "bg-sky-100"}`}>
                <div
                  className="h-full bg-linear-to-r from-sky-400 to-sky-500 rounded-full"
                  style={{ animation: "check-progress 1.5s ease-in-out infinite" }}
                />
              </div>
              <style>{`
                @keyframes check-progress {
                  0%   { width: 0%;   margin-left: 0%; }
                  50%  { width: 60%;  margin-left: 20%; }
                  100% { width: 0%;   margin-left: 100%; }
                }
              `}</style>
            </div>
          )}

          {/* Warning de seguretat */}
          {warning && (
            <div className={`p-4 rounded-xl border ${dark ? "bg-amber-900/20 border-amber-800" : "bg-amber-50 border-amber-200"}`}>
              <p className={`text-sm font-semibold mb-2 ${dark ? "text-amber-300" : "text-amber-700"}`}>
                ⚠️ Advertència de seguretat
              </p>
              <p className={`text-sm mb-2 ${dark ? "text-amber-400" : "text-amber-600"}`}>
                {warning.info}
              </p>
              {warning.warnings?.length > 0 && (
                <ul className={`text-xs space-y-1 mb-3 ${dark ? "text-amber-400" : "text-amber-600"}`}>
                  {warning.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <button
                  onClick={confirmAnyway}
                  disabled={saving}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    dark ? "border-amber-700 text-amber-300 hover:bg-amber-900/30" : "border-amber-300 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  Guardar igualment
                </button>
                <button
                  onClick={() => setWarning(null)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold ${dark ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"}`}
                >
                  Revisar
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className={`text-xs px-3 py-2 rounded-xl ${dark ? "bg-red-950/60 text-red-400" : "bg-red-50 text-red-600"}`}>
              {error}
            </p>
          )}

          {/* Botó / confirmació */}
          {saved ? (
            <div className={`w-full py-3 rounded-2xl text-sm font-semibold text-center border ${
              dark ? "bg-green-950/60 border-green-800/40 text-green-400" : "bg-green-50 border-green-200 text-green-700"
            }`}>
              ✓ Programació creada!
            </div>
          ) : !warning && !checking ? (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || checking || !form.slot_inventory_id || !form.time || form.days.length === 0}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 hover:-translate-y-px active:translate-y-0 transition-all"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: "0 4px 16px rgba(14,165,233,0.3)" }}
              >
                {saving ? "Guardant..." : "Afegir programació"}
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className={`px-4 py-3 rounded-2xl text-sm border transition-colors ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}
                >
                  Cancel·lar
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
