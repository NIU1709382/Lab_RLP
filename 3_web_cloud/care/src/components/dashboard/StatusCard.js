"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function StatusCard({ robot, patient, dark }) {
  const signalColor = { excellent: "sky", good: "green", poor: "amber" }[robot?.signal] ?? "slate";
  const signalLabel = { excellent: "Senyal excel·lent", good: "Senyal bo", poor: "Senyal feble" }[robot?.signal] ?? "—";
  const lastSeen = robot?.updated_at
    ? new Date(robot.updated_at).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })
    : null;

  // Si fa més de 30s sense ping → considerem offline
  const isReallyOnline = robot?.status === "online" &&
    robot?.updated_at &&
    (new Date() - new Date(robot.updated_at)) < 60000;

  return (
    <Card dark={dark} className="p-6 dash:col-span-2 relative overflow-hidden">
      <div className="absolute -bottom-8 -right-8 text-[110px] opacity-[0.04] pointer-events-none select-none">🤖</div>

      <div className="flex items-center gap-2 mb-5">
        <span className={`w-2 h-2 rounded-full ${isReallyOnline ? "bg-green-500" : "bg-slate-400"}`}
          style={isReallyOnline ? { boxShadow: "0 0 6px #22c55e" } : {}} />
        <span className={`text-sm font-medium ${isReallyOnline ? (dark ? "text-green-400" : "text-green-600") : (dark ? "text-slate-400" : "text-slate-500")}`}>
          {isReallyOnline ? "Care-E connectat" : "Care-E desconnectat"}
        </span>
      </div>

      <h2 className={`text-2xl font-bold mb-2 font-jakarta ${dark ? "text-white" : "text-slate-900"}`}>
        {patient?.full_name ?? "Usuari"}
      </h2>
      {lastSeen && (
        <p className={`text-base mb-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Última actualització a les{" "}
          <span className={`font-semibold ${dark ? "text-sky-400" : "text-sky-600"}`}>{lastSeen}h</span>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {robot?.battery != null && <Badge color={robot.battery > 20 ? "green" : "amber"} dark={dark}>🔋 {robot.battery}% Bateria</Badge>}
        {robot?.signal && <Badge color={signalColor} dark={dark}>📶 {signalLabel}</Badge>}
        {isReallyOnline && <Badge color="slate" dark={dark}>🕒 En línia</Badge>}
      </div>
    </Card>
  );
}