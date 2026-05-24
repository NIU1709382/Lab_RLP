"use client";

import { useState, useEffect, useRef } from "react";

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
          {value ? `${selH}:${selM}` : "Horari"}
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

export default ClockPicker;