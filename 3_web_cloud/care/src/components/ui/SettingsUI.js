export const SectionTitle = ({ children, dark }) => (
  <h2 className={`text-base font-bold mb-4 font-jakarta ${dark ? "text-white" : "text-slate-900"}`}>{children}</h2>
);

export const InputField = ({ label, type = "text", value, onChange, placeholder, disabled, dark }) => (
  <div>
    <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
        disabled ? (dark ? "bg-slate-800/50 border-slate-700 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400")
        : (dark ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-sky-500" : "bg-slate-50 border-slate-200 focus:border-sky-400")
      }`} />
  </div>
);

export const SaveBtn = ({ onClick, loading, saved, dark }) => (
  saved ? (
    <div className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-center border ${dark ? "bg-green-950/60 border-green-800/40 text-green-400" : "bg-green-50 border-green-200 text-green-700"}`}>✓ Desat!</div>
  ) : (
    <button onClick={onClick} disabled={loading} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-sky-500 to-sky-600 hover:-translate-y-px transition-all">
      {loading ? "Desant..." : "Desar canvis"}
    </button>
  )
);