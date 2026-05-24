"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function MedicationTable({ meds, loading, dark }) {
  const today = new Date().toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long" });
  
  // Helper per formatar la hora real
  const formatHoraReal = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleTimeString("ca-ES", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  return (
    <Card dark={dark} className="h-full overflow-hidden">
      <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={`text-base font-bold ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>Medicació d'avui</h3>
        <span className={`text-sm capitalize ${dark ? "text-slate-500" : "text-slate-400"}`}>{today}</span>
      </div>
      {loading ? (
        <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} dark={dark} className="h-10 w-full" />)}</div>
      ) : meds.length === 0 ? (
        <div className={`flex items-center justify-center min-h-75 text-center text-lg ${ dark ? "text-slate-500" : "text-slate-400" }`}>
          No hi ha medicació programada per avui
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-xs font-medium border-b ${dark ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-100"}`}>
                <th className="px-6 py-3 text-left font-medium">Hora</th>
                <th className="px-4 py-3 text-left font-medium">Medicament</th>
                <th className="px-6 py-3 text-center font-medium">Estat</th>
              </tr>
            </thead>
            <tbody>
              {meds.map((m) => {
                const horaReal = formatHoraReal(m.dispensed_at);
                const teHoraProgramada = m.scheduled_time && m.scheduled_time !== "—";
                const esDispensat = m.log_status === "taken" || m.log_status === "dispensed";

                return (
                  <tr key={m.id} className={`border-b last:border-0 transition-colors ${dark ? "border-slate-800/50 hover:bg-slate-800/20" : "border-slate-50 hover:bg-slate-50"}`}>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${dark ? "text-sky-400" : "text-sky-600"}`}>
                        {teHoraProgramada ? m.scheduled_time.slice(0, 5) : "Manual"}
                      </span>
                      {/* ⭐ Hora real de dispensació (quan ja s'ha fet) */}
                      {horaReal && esDispensat && (
                        <div className={`text-xs mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
                          Pres a les {horaReal}
                        </div>
                      )}
                      {horaReal && m.log_status === "failed_inventory" && (
                        <div className={`text-xs mt-0.5 ${dark ? "text-red-400" : "text-red-500"}`}>
                          Intentat a les {horaReal}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm ${dark ? "text-slate-200" : "text-slate-800"}`}>
                        {m.slot_inventory?.medication_name || "Medicament desconegut"}
                      </span>
                      {m.log_status === "failed_inventory" && m.dose_real !== undefined && m.dose !== undefined && (
                        <div className={`text-xs mt-0.5 ${dark ? "text-red-400" : "text-red-600"}`}>
                          Dispensades {m.dose_real}/{m.dose} pastilles
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {esDispensat ? (
                        <Badge color="green" dark={dark}>✓Pres</Badge>
                      ) : m.log_status === "missed" ? (
                        <Badge color="red" dark={dark}>✗Perdut</Badge>
                      ) : m.log_status === "failed_inventory" ? (
                        <Badge color="red" dark={dark}>⚠&nbsp;Sense&nbsp;estoc</Badge>
                      ) : (
                        <Badge color="amber" dark={dark}>Pendent</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}