"use client";
import Card from "@/components/ui/Card";

export default function NextMedPanel({ meds, dark }) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Només medicaments pendents REALS: 
  // - Sense log (encara no s'ha dispensat)
  // - I que l'hora encara no hagi passat (o estigui dins els pròxims minuts)
  const next = meds
    .filter(m => {
      // Descarta els ja presos/dispensats
      if (m.log_status === "taken" || m.log_status === "dispensed") return false;
      // Descarta els perduts
      if (m.log_status === "missed") return false;
      // Descarta els que ja han passat de l'hora (sense log = encara no detectat com missed, però ja és tard)
      const schedTime = m.scheduled_time?.slice(0, 5);
      if (schedTime && schedTime < currentTime) return false;
      return true;
    })
    .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))[0];

  // També contem si hi ha perdudes per mostrar avís
  const missedCount = meds.filter(m => m.log_status === "missed").length;

  return (
    <Card dark={dark} className="p-6 h-fit">
      <h3 className={`text-base font-bold mb-4 ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>
        Propera medicació
      </h3>

      {/* Avís de medicació perduda */}
      {missedCount > 0 && (
        <div className={`mb-4 p-3 rounded-xl border ${dark ? "border-red-800/40 bg-red-950/40" : "border-red-100 bg-red-50"}`}>
          <p className={`text-sm font-semibold ${dark ? "text-red-400" : "text-red-600"}`}>
            ⚠️ {missedCount} {missedCount === 1 ? "presa perduda" : "preses perdudes"} avui
          </p>
        </div>
      )}

      {!next ? (
        <p className={`text-sm text-center py-4 ${dark ? "text-slate-500" : "text-slate-400"}`}>
          {missedCount > 0 
            ? "No queden més preses programades avui" 
            : "Tota la medicació d'avui ja s'ha pres ✓"}
        </p>
      ) : (
        <div className={`p-5 rounded-2xl border ${dark ? "border-sky-800/40 bg-sky-950/40" : "border-sky-100 bg-sky-50"}`}>
          <div className={`text-3xl font-bold mb-1 ${dark ? "text-sky-400" : "text-sky-600"} font-jakarta`}>
            {next.scheduled_time?.slice(0, 5)}
          </div>
          <div className={`text-base font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>
            {next.slot_inventory?.medication_name || "Medicament desconegut"}
          </div>
          <div className={`text-sm mt-0.5 ${dark ? "text-slate-500" : "text-slate-500"}`}>
            {next.dose} {next.dose === 1 ? "pastilla" : "pastilles"}
          </div>
        </div>
      )}
    </Card>
  );
}