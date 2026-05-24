"use client";

export default function Skeleton({ className = "", dark }) {
  return <div className={`animate-pulse rounded-xl ${dark ? "bg-slate-800" : "bg-slate-100"} ${className}`} />;
}
