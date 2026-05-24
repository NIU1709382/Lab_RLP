"use client";
import {useState, useEffect, useRef } from "react";

export default function MedicationSearch({ onSelect, dark, value }) {
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