"use client";

const BTN_PRIMARY = {
  background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
  boxShadow: "0 4px 16px rgba(14,165,233,0.3)",
  color: "white",
  fontWeight: 600,
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
}

export default function PrimaryBtn({ children, onClick, disabled, className = "" }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-2xl text-sm transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
      style={BTN_PRIMARY}>
      {children}
    </button>
  );
}