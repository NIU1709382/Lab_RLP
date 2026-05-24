"use client";
import Badge from "@/components/ui/Badge";
import { ALERT_DOT, ALERT_COLOR, ALERT_LABEL, buildAlertDescription, formatAlertTime } from "@/lib/alerts";

export default function AlertItem({ alert: a, isLast, dark, showResolveButton, onResolve }) {
  return (
    <div className={`flex gap-4 p-4 rounded-2xl border transition-colors ${
      a.resolved 
        ? (dark ? "border-slate-800/30 opacity-60" : "border-slate-100 opacity-60")
        : (dark ? "border-slate-800/50 hover:bg-slate-800/20" : "border-slate-100 hover:bg-slate-50")
    }`}>
      {/* Punt i línia vertical */}
      <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${ALERT_DOT[a.type] ?? "bg-slate-400"}`} />
        {!isLast && (
          <div className={`w-px flex-1 min-h-6 rounded-full ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
        )}
      </div>
      
      {/* Contingut */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <Badge color={ALERT_COLOR[a.type] ?? "slate"} dark={dark}>
            {ALERT_LABEL[a.type] ?? a.type}
          </Badge>
          <span className={`text-xs shrink-0 ${dark ? "text-slate-600" : "text-slate-400"}`}>
            {formatAlertTime(a.created_at)}
          </span>
        </div>

        <p className={`text-sm leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>
          {buildAlertDescription(a)}
        </p>

        <AlertPills alert={a} dark={dark} />

        <AlertFooter 
          alert={a} 
          dark={dark} 
          showResolveButton={showResolveButton}
          onResolve={onResolve}
        />
      </div>
    </div>
  );
}

// Sub-component per als pills (hora, medicament, dosi)
function AlertPills({ alert: a, dark }) {
  if (!a.dispense_log) return null;
  
  const pill = `text-xs px-2 py-0.5 rounded-md ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"}`;
  
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {a.dispense_log.scheduled_time && (
        <span className={pill}>🕒 {a.dispense_log.scheduled_time.slice(0, 5)}</span>
      )}
      {a.medication_name && (
        <span className={pill}>💊 {a.medication_name}</span>
      )}
      {a.type === "medication_failed_inventory" && a.dispense_log.dose_real !== null && (
        <span className={`text-xs px-2 py-0.5 rounded-md ${dark ? "bg-red-950/40 text-red-400" : "bg-red-50 text-red-600"}`}>
          📦 {a.dispense_log.dose_real}/{a.dispense_log.dose} dispensades
        </span>
      )}
    </div>
  );
}

// Sub-component per al footer (botó / etiqueta resolta)
function AlertFooter({ alert: a, dark, showResolveButton, onResolve }) {
  if (!a.resolved && !showResolveButton) return null;
  
  return (
    <div className="flex items-center justify-between mt-2">
      {a.resolved ? (
        <span className={`text-xs ${dark ? "text-green-500" : "text-green-600"}`}>
          ✓ Resolta
        </span>
      ) : <span />}
      
      {showResolveButton && !a.resolved && onResolve && (
        <button
          onClick={() => onResolve(a.id)}
          className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
            dark 
              ? "bg-sky-950/60 border border-sky-800/40 text-sky-400 hover:bg-sky-900/40" 
              : "bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100"
          }`}
        >
          ✓ Marcar com a resolta
        </button>
      )}
    </div>
  );
}