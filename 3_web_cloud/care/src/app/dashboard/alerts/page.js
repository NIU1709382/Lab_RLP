// src/app/dashboard/alerts/page.js
"use client";

import { useContext, useState, useEffect, useCallback } from "react";
import { ThemeContext } from "@/app/dashboard/layout";
import { supabase } from "@/lib/supabase";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import Card from "@/components/ui/Card";

export default function AlertsPage() {
  const { theme } = useContext(ThemeContext);
  const dark = theme === "dark";

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unresolved"); // "all" | "unresolved" | "resolved"
  const [robotId, setRobotId] = useState(null);

  const fetchAlerts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: robot } = await supabase
      .from("robots")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!robot) {
      setLoading(false);
      return;
    }

    setRobotId(robot.id);

    let query = supabase
      .from("alerts")
      .select(`
        *,
        dispense_log:dispense_log_id (
          scheduled_time,
          dose,
          dose_real,
          error_reason,
          status
        )
      `)
      .eq("robot_id", robot.id)
      .order("created_at", { ascending: false });

    if (filter === "unresolved") query = query.eq("resolved", false);
    if (filter === "resolved") query = query.eq("resolved", true);

    const { data } = await query;
    setAlerts(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // ⭐ Callback per marcar com a resolta
  const handleResolve = async (alertId) => {
    // Actualització optimista: marquem la UI primer
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, resolved: true } : a
    ));

    // Després actualitzem a la BD
    const { error } = await supabase
      .from("alerts")
      .update({ resolved: true })
      .eq("id", alertId);

    if (error) {
      console.error("Error resolent alerta:", error);
      // Si falla, revertim
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, resolved: false } : a
      ));
      alert("No s'ha pogut marcar com a resolta. Torna-ho a provar.");
      return;
    }

    // Si el filtre actual no l'ha de mostrar, refetch
    if (filter === "unresolved") {
      fetchAlerts();
    }
  };

  const handleResolveAll = async () => {
    if (!confirm("Marcar totes les alertes sense resoldre com a resoltes?")) return;
    
    const { error } = await supabase
      .from("alerts")
      .update({ resolved: true })
      .eq("robot_id", robotId)
      .eq("resolved", false);

    if (!error) fetchAlerts();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-bold font-jakarta ${dark ? "text-white" : "text-slate-900"}`}>
          Alertes
        </h1>
        {alerts.some(a => !a.resolved) && (
          <button
            onClick={handleResolveAll}
            className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
              dark 
                ? "bg-sky-950/60 border border-sky-800/40 text-sky-400 hover:bg-sky-900/40" 
                : "bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100"
            }`}
          >
            ✓ Resoldre totes
          </button>
        )}
      </div>

      {/* Filtres */}
      <Card dark={dark} className="p-2">
        <div className="flex gap-1">
          {[
            { id: "unresolved", label: "Sense resoldre" },
            { id: "all", label: "Totes" },
            { id: "resolved", label: "Resoltes" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
                filter === f.id
                  ? (dark ? "bg-sky-950/60 text-sky-400" : "bg-sky-50 text-sky-700")
                  : (dark ? "text-slate-400 hover:bg-slate-800/40" : "text-slate-600 hover:bg-slate-50")
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Llista reusant el component existent */}
      <ActivityTimeline 
        logs={alerts} 
        loading={loading} 
        dark={dark}
        title={
          filter === "unresolved" ? "Alertes sense resoldre" :
          filter === "resolved" ? "Alertes resoltes" : 
          "Totes les alertes"
        }
        showResolveButton={true}                  // ⭐ activem el botó
        onResolve={handleResolve}                  // ⭐ passem la lògica
        emptyMessage={
          filter === "unresolved" ? "No hi ha alertes sense resoldre 🎉" :
          filter === "resolved" ? "Encara no hi ha alertes resoltes" :
          "No hi ha cap alerta"
        }
      />
    </div>
  );
}