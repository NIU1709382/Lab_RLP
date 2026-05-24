"use client";

export default function Badge({ children, color = "sky", dark }) {
  const map = {
    sky:   dark ? "bg-sky-950/60 border-sky-800/40 text-sky-300"      : "bg-sky-50 border-sky-200 text-sky-700",
    green: dark ? "bg-green-950/60 border-green-800/40 text-green-400" : "bg-green-50 border-green-200 text-green-700",
    amber: dark ? "bg-amber-950/60 border-amber-800/40 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700",
    slate: dark ? "bg-slate-800 border-slate-700 text-slate-400"       : "bg-slate-50 border-slate-200 text-slate-500",
    red:   dark ? "bg-red-950/60 border-red-800/40 text-red-400"       : "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border whitespace-nowrap ${map[color]}`}>
      {children}
    </span>
  );
}