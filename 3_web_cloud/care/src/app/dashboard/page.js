// src/app/dashboard/page.js
"use client";

import { useContext, useState, useEffect } from "react";
import { ThemeContext, SidebarContext } from "@/app/dashboard/layout";
import { supabase } from "@/lib/supabase"

const BTN_PRIMARY = {
  background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
  boxShadow: "0 4px 16px rgba(14,165,233,0.3)",
  color: "white",
  fontWeight: 600,
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

function PrimaryBtn({ children, onClick, disabled, className = "" }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-2xl text-sm transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
      style={BTN_PRIMARY}>
      {children}
    </button>
  );
}

function Card({ children, className = "", dark }) {
  return (
    <div className={`rounded-2xl border ${
      dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
    } ${className}`}>
      {children}
    </div>
  );
}



function Badge({ children, color = "sky", dark }) {
  const map = {
    sky:   dark ? "bg-sky-950/60 border-sky-800/40 text-sky-300"      : "bg-sky-50 border-sky-200 text-sky-700",
    green: dark ? "bg-green-950/60 border-green-800/40 text-green-400" : "bg-green-50 border-green-200 text-green-700",
    amber: dark ? "bg-amber-950/60 border-amber-800/40 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700",
    slate: dark ? "bg-slate-800 border-slate-700 text-slate-400"       : "bg-slate-50 border-slate-200 text-slate-500",
    red:   dark ? "bg-red-950/60 border-red-800/40 text-red-400"       : "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border ${map[color]}`}>
      {children}
    </span>
  );
}

function Skeleton({ className = "", dark }) {
  return <div className={`animate-pulse rounded-xl ${dark ? "bg-slate-800" : "bg-slate-100"} ${className}`} />;
}

function StatsRow({ meds, alerts, dark }) {
  const total        = meds.length;
  const taken        = meds.filter(m => m.log_status === "taken" || m.log_status === "dispensed").length;
  const pending      = total - taken;
  const activeAlerts = alerts.filter(a => !a.resolved).length;

  const stats = [
    { value: total > 0 ? `${taken} / ${total}` : "—", label: "Pastilles avui",   badge: pending > 0 ? `${pending} pendents` : "Tot pres ✓",       bColor: pending > 0 ? "sky" : "green" },
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

function StatusCard({ robot, patient, dark }) {
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
    <Card dark={dark} className="p-6 lg:col-span-2 relative overflow-hidden">
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

function DispenseCard({ robot, dark }) {
  const [st, setSt] = useState("idle");
  const handle = async () => {
    setSt("loading");
    if (robot?.id) {
      await supabase.from("activity_logs").insert({
        robot_id: robot.id, type: "medication", description: "Dispensació manual des del dashboard",
      });
    }
    setTimeout(() => setSt("done"), 1800);
    setTimeout(() => setSt("idle"), 4000);
  };
  return (
    <Card dark={dark} className="p-6 flex flex-col items-center text-center justify-between gap-5">
      <div>
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl ${dark ? "bg-sky-950/60 border border-sky-800/40" : "bg-sky-50 border border-sky-100"}`}>💊</div>
        <h3 className={`text-lg font-bold mb-2 ${dark ? "text-white" : "text-slate-900"} font-jakarta`} >Control Manual</h3>
        <p className={`text-sm leading-relaxed max-w-45 mx-auto ${dark ? "text-slate-400" : "text-slate-500"}`}>Dispensa la medicació manualment per a proves o emergències.</p>
      </div>
      {st === "done" ? (
        <div className={`w-full py-3 rounded-2xl text-sm font-semibold border text-center ${dark ? "bg-green-950/60 border-green-800/40 text-green-400" : "bg-green-50 border-green-200 text-green-700"}`}>✓ Dispensat correctament</div>
      ) : (
        <PrimaryBtn onClick={handle} disabled={st === "loading"} className="w-full py-3 px-6">
          {st === "loading" ? "Enviant ordre..." : "💊 Dispensar Ara"}
        </PrimaryBtn>
      )}
    </Card>
  );
}

function MedicationTable({ meds, loading, dark }) {
  const today = new Date().toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long" });
  return (
    <Card dark={dark} className="h-full overflow-hidden">
      <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={`text-base font-bold ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>Medicació d'avui</h3>
        <span className={`text-sm capitalize ${dark ? "text-slate-500" : "text-slate-400"}`}>{today}</span>
      </div>
      {loading ? (
        <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} dark={dark} className="h-10 w-full" />)}</div>
      ) : meds.length === 0 ? (
        <div className={`flex items-center justify-center min-h-75 text-center text-lg ${ dark ? "text-slate-500" : "text-slate-400" }`} > No hi ha medicació programada per avui </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-xs font-medium border-b ${dark ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-100"}`}>
                <th className="px-6 py-3 text-left font-medium">Hora</th>
                <th className="px-4 py-3 text-left font-medium">Medicament</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Dosi</th>
                <th className="px-6 py-3 text-right font-medium">Estat</th>
              </tr>
            </thead>
            <tbody>
              {meds.map((m) => (
                <tr key={m.id} className={`border-b last:border-0 transition-colors ${dark ? "border-slate-800/50 hover:bg-slate-800/20" : "border-slate-50 hover:bg-slate-50"}`}>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold ${dark ? "text-sky-400" : "text-sky-600"}`}>
                      {m.scheduled_time?.slice(0, 5)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-sm ${dark ? "text-slate-200" : "text-slate-800"}`}>
                      {m.slot_inventory?.medication_name || "Medicament desconegut"}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className={`text-sm ${dark ? "text-slate-500" : "text-slate-400"}`}>
                      {m.dose} {m.dose === 1 ? "pastilla" : "pastilles"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge color={m.log_status === "taken" || m.log_status === "dispensed" ? "green" : "amber"} dark={dark}>
                      {m.log_status === "taken" || m.log_status === "dispensed" ? "✓ Pres" : "Pendent"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function AddMedForm({ patientId, onAdded, dark }) {
  const [form, setForm] = useState({ name: "", time: "", dose: "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const inputCls = `w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
    dark
      ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15"
  }`;

  const handle = async () => {
    if (!form.name || !form.time || !form.dose) return;
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("medications").insert({
      name: form.name, dose: form.dose, scheduled_time: form.time,
      days: ["dilluns","dimarts","dimecres","dijous","divendres","dissabte","diumenge"],
      active: true, patient_id: patientId, created_by: user.id,
    });
    if (error) { setError(error.message); return; }
    setSaved(true);
    setForm({ name: "", time: "", dose: "" });
    onAdded?.();
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card dark={dark} className="p-6 h-full">
      <h3 className={`text-base font-bold mb-1 ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>Afegir medicació</h3>
      <p className={`text-sm mb-5 ${dark ? "text-slate-500" : "text-slate-400"}`}>Programa una nova pastilla per a l'usuari.</p>
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>Nom del medicament</label>
          <input type="text" placeholder="Ex: Paracetamol" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>Hora</label>
            <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${dark ? "text-slate-300" : "text-slate-600"}`}>Quantitat</label>
            <input type="text" placeholder="1 pastilla" value={form.dose} onChange={e => setForm({ ...form, dose: e.target.value })} className={inputCls} />
          </div>
        </div>
        {error && <p className={`text-xs px-3 py-2 rounded-xl ${dark ? "bg-red-950/60 text-red-400" : "bg-red-50 text-red-600"}`}>{error}</p>}
        {saved ? (
          <div className={`w-full py-3 rounded-2xl text-sm font-semibold text-center border ${dark ? "bg-green-950/60 border-green-800/40 text-green-400" : "bg-green-50 border-green-200 text-green-700"}`}>✓ Medicació afegida!</div>
        ) : (
          <PrimaryBtn onClick={handle} className="w-full py-3 px-6">Afegir a la llista</PrimaryBtn>
        )}
      </div>
    </Card>
  );
}

function ActivityTimeline({ logs, loading, dark }) {
  const dot   = { medication: "bg-green-500", interaction: "bg-sky-400", alert: "bg-amber-400", fall: "bg-red-500" };
  const color = { medication: "green", interaction: "sky", alert: "amber", fall: "red" };
  const label = { medication: "Medicació", interaction: "Interacció", alert: "Alerta", fall: "Caiguda" };

  return (
    <Card dark={dark} className="overflow-hidden">
      <div className={`flex items-center gap-2 px-6 py-4 border-b ${dark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={`text-base font-bold ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>Activitat recent</h3>
      </div>
      <div className="p-4 space-y-2">
        {loading ? (
          [1,2,3].map(i => <Skeleton key={i} dark={dark} className="h-16 w-full" />)
        ) : logs.length === 0 ? (
          <p className={`text-sm text-center py-6 ${dark ? "text-slate-500" : "text-slate-400"}`}>Cap activitat recent</p>
        ) : (
          logs.map((a, i) => (
            <div key={a.id} className={`flex gap-4 p-4 rounded-2xl border transition-colors ${dark ? "border-slate-800/50 hover:bg-slate-800/20" : "border-slate-100 hover:bg-slate-50"}`}>
              <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${dot[a.type] ?? "bg-slate-400"}`} />
                {i < logs.length - 1 && <div className={`w-px flex-1 min-h-6 rounded-full ${dark ? "bg-slate-800" : "bg-slate-100"}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <Badge color={color[a.type] ?? "slate"} dark={dark}>{label[a.type] ?? a.type}</Badge>
                  <span className={`text-xs shrink-0 ${dark ? "text-slate-600" : "text-slate-400"}`}>
                    {new Date(a.created_at).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>{a.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function NextMedPanel({ meds, dark }) {
  const next = meds
    .filter(m => m.log_status !== "taken" && m.log_status !== "dispensed")
    .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))[0];

  return (
    <Card dark={dark} className="p-6 h-fit">
      <h3 className={`text-base font-bold mb-4 ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>
        Propera medicació
      </h3>
      {!next ? (
        <p className={`text-sm text-center py-4 ${dark ? "text-slate-500" : "text-slate-400"}`}>
          Tota la medicació d'avui ja s'ha pres ✓
        </p>
      ) : (
        <div className={`p-5 rounded-2xl border ${dark ? "border-sky-800/40 bg-sky-950/40" : "border-sky-100 bg-sky-50"}`}>
          <div className={`text-3xl font-bold mb-1 ${dark ? "text-sky-400" : "text-sky-600"} font-jakarta`}>
            {next.scheduled_time?.slice(0, 5)}
          </div>
          
          {/* ARREGLAT: Busquem el nom dins de slot_inventory */}
          <div className={`text-base font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>
            {next.slot_inventory?.medication_name || "Medicament desconegut"}
          </div>
          
          {/* ARREGLAT: Afegim el text "pastilla/es" al costat del número de la dosi */}
          <div className={`text-sm mt-0.5 ${dark ? "text-slate-500" : "text-slate-500"}`}>
            {next.dose} {next.dose === 1 ? "pastilla" : "pastilles"}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── No robot dialog ──────────────────────────────────────────────────────────
function NoRobotDialog({ dark }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`max-w-md w-full text-center p-10 rounded-3xl border ${
        dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
      }`}>
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6`}>
          <img src="/favicon.ico" alt="Care-E" class="w-18 h-18 object-contain"></img></div>
        <h2 className={`text-xl font-bold mb-2 ${dark ? "text-white" : "text-slate-900"} font-jakarta`}
          >
          Cap Care-E connectat
        </h2>
        <p className={`text-sm leading-relaxed mb-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
          No hem trobat cap Care-E associat al teu compte. Configura el teu robot per començar a monitorar.
        </p>
        <div className={`text-xs px-4 py-3 rounded-xl ${
          dark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500 border border-slate-100"
        }`}>
          Contacta amb el teu proveïdor o afegeix un robot des de la configuració.
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { theme } = useContext(ThemeContext);
  const dark = theme === "dark";
  const { setOpen } = useContext(SidebarContext);
  const [robot,   setRobot]   = useState(null);
  const [patient, setPatient] = useState(null);
  const [meds,    setMeds]    = useState([]);
  const [logs,    setLogs]    = useState([]);
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await fetchData();
    setRetrying(false);
  };
  const isReallyOnline = robot?.status === "online" &&
    robot?.updated_at &&
    (new Date() - new Date(robot.updated_at)) < 60000;

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: robotData } = await supabase
      .from("robots").select("*").eq("owner_id", user.id).single();
    setRobot(robotData);
    if (!robotData) { setLoading(false); return; }

    const { data: patientData } = await supabase
      .from("patients").select("*").eq("robot_id", robotData.id).single();
    setPatient(patientData);
    if (!patientData) { setLoading(false); return; }

    const dayName = new Date().toLocaleDateString("ca-ES", { weekday: "long" }).toLowerCase();
    
    // 1. Obtenim els horaris (COPIANT el format del teu fetchAll que funciona)
    const { data: medsData, error: medsError } = await supabase
      .from("dispense_schedules")
      .select("*, slot_inventory(medication_name)") // <-- Ja no demanem els logs aquí!
      .eq("patient_id", patientData.id)
      .eq("active", true)
      .contains("days", [dayName])
      .order("scheduled_time");

    if (medsError) console.error("Error meds:", medsError);

    // 2. Obtenim els logs de dispensació per separat (així Supabase no es queixa)
    // Filtrem per avui per no descarregar tot l'historial sencer
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayLogs } = await supabase
      .from("dispense_logs")
      .select("schedule_id, status")
      .eq("robot_id", robotData.id)
      .gte("dispensed_at", todayStart.toISOString()); // Només els d'avui

    // 3. Juntem les dues coses amb JavaScript
    setMeds((medsData ?? []).map(m => {
      // Busquem si hi ha algun log d'avui per a aquesta pastilla
      const pastillaLog = todayLogs?.find(log => log.schedule_id === m.id);
      
      return {
        ...m, 
        log_status: pastillaLog ? pastillaLog.status : "pending"
      };
    }));

    const { data: logsData } = await supabase
      .from("activity_logs").select("*").eq("robot_id", robotData.id)
      .order("created_at", { ascending: false }).limit(10);
    setLogs(logsData ?? []);

    const { data: alertsData } = await supabase
      .from("alerts").select("*").eq("robot_id", robotData.id)
      .order("created_at", { ascending: false });
    setAlerts(alertsData ?? []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bon dia" : hour < 20 ? "Bona tarda" : "Bona nit";

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Hamburguesa — només mòbil */}
          <button
            className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              dark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
            onClick={() => setOpen(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div>
            <h1 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>
              {greeting}! 👋
            </h1>
            <p className={`text-sm mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
              Aquí tens el resum d'avui de Care-E.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isReallyOnline ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}
            style={isReallyOnline ? { boxShadow: "0 0 6px #22c55e" } : {}} />
          <span className={`text-sm font-medium ${
            isReallyOnline
              ? dark ? "text-green-400" : "text-green-600"
              : dark ? "text-slate-400" : "text-slate-500"
          }`}>
            {isReallyOnline ? "En línia" : "Desconnectat"}
          </span>
        </div>
      </div>

      {/* States */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} dark={dark} className="h-32" />)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton dark={dark} className="h-48 col-span-2" />
            <Skeleton dark={dark} className="h-48" />
          </div>
        </div>

      ) : !robot ? (
        <NoRobotDialog dark={dark} />
      ) : !isReallyOnline ? (
        // Robot vinculat però offline
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className={`max-w-md w-full text-center p-10 rounded-3xl border ${
            dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
          }`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 ${
              dark ? "bg-slate-800" : "bg-slate-50 border border-slate-100"
            }`}>📡</div>
            <h2 className={`text-xl font-bold mb-2 font-jakarta ${dark ? "text-white" : "text-slate-900"}`}>
              Robot offline
            </h2>
            <p className={`text-sm leading-relaxed mb-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
              No es pot mostrar informació en directe. El robot <span className={`font-semibold ${dark ? "text-white" : "text-slate-800"}`}>{robot.name}</span> no està responent.
            </p>
            <div className={`text-xs px-4 py-3 rounded-xl mb-4 ${
              dark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500 border border-slate-100"
            }`}>
              Última connexió: {robot.updated_at
                ? new Date(robot.updated_at).toLocaleString("ca-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                : "Desconegut"
              }
            </div>
            <button onClick={handleRetry} disabled={retrying}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:-translate-y-px transition-all disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: "0 4px 16px rgba(14,165,233,0.3)" }}>
              <span className={`inline-block ${retrying ? "animate-spin" : ""}`}>🔄</span>
              {retrying ? " Comprovant..." : " Tornar a intentar"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <StatsRow meds={meds} alerts={alerts} dark={dark} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <StatusCard robot={robot} patient={patient} dark={dark} />
            <DispenseCard robot={robot} dark={dark} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-full">
            <MedicationTable meds={meds} loading={false} dark={dark} />
          </div>
            <div className="h-full">
              <AddMedForm
                patientId={patient?.id}
                onAdded={fetchData}
                dark={dark}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            <div className="lg:col-span-2">
              <ActivityTimeline logs={logs} loading={false} dark={dark} />
            </div>
            <NextMedPanel meds={meds} dark={dark} />
          </div>
        </>
      )}
    </div>
  );
}