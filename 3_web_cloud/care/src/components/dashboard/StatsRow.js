"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function StatsRow({ meds, alerts, dark }) {
  const total        = meds.length;
  const taken = meds.filter(m => m.log_status === "taken" || m.log_status === "dispensed").length;
  const missed = meds.filter(m => m.log_status === "missed").length;
  const pending = total - taken - missed;
  const activeAlerts = alerts.filter(a => !a.resolved).length;

  const stats = [
    { value: total > 0 ? `${taken} / ${total}` : "—", label: "Pastilles avui", badge: missed > 0 ? `${missed} perdudes ⚠️`: pending > 0 ? `${pending} pendents` : "Tot pres ✓", bColor: missed > 0 ? "red" : pending > 0 ? "sky" : "green" },
    { value: activeAlerts === 0 ? "Cap" : `${activeAlerts}`, label: "Alertes actives", badge: activeAlerts === 0 ? "Tot bé 🎉" : "Revisar avui", bColor: activeAlerts === 0 ? "green" : "amber" },
    { value: total > 0 ? `${Math.round((taken / total) * 100)}%` : "—", label: "Adherència avui", badge: taken === total && total > 0 ? "Excel·lent" : "En curs", bColor: taken === total && total > 0 ? "green" : "sky" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {stats.map(({ value, label, badge, bColor }) => (
        <Card key={label} dark={dark} className="p-4 sm:p-5">
          <div className={`text-2xl sm:text-3xl font-bold font-jakarta mb-1.5 ${
            bColor === "sky" ? (dark ? "text-sky-400" : "text-sky-600") :
            bColor === "green" ? (dark ? "text-green-400" : "text-green-600") :
            (dark ? "text-amber-400" : "text-amber-600")
          }`}>{value}</div>
          <p className={`text-sm mb-2.5 ${dark ? "text-slate-300" : "text-slate-700"}`}>{label}</p>
          <Badge color={bColor} dark={dark}>{badge}</Badge>
        </Card>
      ))}
    </div>
  );
}