"use client";

export default function Card({ children, className = "", dark }) {
  return (
    <div className={`rounded-2xl border ${
      dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
    } ${className}`}>
      {children}
    </div>
  );
}