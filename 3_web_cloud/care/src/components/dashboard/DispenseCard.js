"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import PrimaryBtn from "@/components/ui/PrimaryBtn";

export default function DispenseCard({ robot, slots, dark }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dose, setDose] = useState(1);
  const [st, setSt] = useState("idle"); // idle | loading | waiting_robot | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [commandId, setCommandId] = useState(null);

  const reset = () => {
    setSt("idle");
    setResult(null);
    setErrorMsg("");
    setCommandId(null);
  };

  // Polling per saber si el robot ha completat l'ordre
  useEffect(() => {
    if (!commandId || st !== "waiting_robot") return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/manual-dispense?id=${commandId}`);
        const data = await res.json();
        
        if (data.status === "completed" || data.status === "failed") {
          setResult(data);
          setSt(data.status === "completed" ? "done" : "error");
          clearInterval(interval);
          setTimeout(reset, 5000);
        }
      } catch (e) {
        console.error("Error polling:", e);
      }
    }, 2000);

    // Timeout de 60s
    const timeout = setTimeout(() => {
      setSt("error");
      setErrorMsg("El robot no ha respost en 60 segons.");
      clearInterval(interval);
      setTimeout(reset, 5000);
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [commandId, st]);

  const handleDispense = async () => {
    if (!selectedSlot) {
      setErrorMsg("Selecciona un slot primer");
      return;
    }
    
    setSt("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/manual-dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robot_id: robot.id,
          slot_inventory_id: selectedSlot.id,
          dose,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSt("error");
        setErrorMsg(data.error || "Error desconegut");
        setTimeout(reset, 4000);
        return;
      }

      setCommandId(data.command_id);
      setSt("waiting_robot");
    } catch (e) {
      setSt("error");
      setErrorMsg(e.message);
      setTimeout(reset, 4000);
    }
  };

  return (
    <Card dark={dark} className="p-6 flex flex-col gap-4">
      <div className="text-center">
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl ${dark ? "bg-sky-950/60 border border-sky-800/40" : "bg-sky-50 border border-sky-100"}`}>💊</div>
        <h3 className={`text-lg font-bold mb-1 ${dark ? "text-white" : "text-slate-900"} font-jakarta`}>Control Manual</h3>
        <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Dispensació puntual</p>
      </div>

      {/* Resultats */}
      {st === "done" && result && (
        <div className={`p-3 rounded-2xl border text-sm text-center ${dark ? "bg-green-950/60 border-green-800/40 text-green-400" : "bg-green-50 border-green-200 text-green-700"}`}>
          ✓ {result.result_message}
        </div>
      )}

      {st === "error" && (
        <div className={`p-3 rounded-2xl border text-sm text-center ${dark ? "bg-red-950/60 border-red-800/40 text-red-400" : "bg-red-50 border-red-200 text-red-700"}`}>
          ⚠ {errorMsg || result?.result_message || "Error"}
        </div>
      )}

      {/* Selector */}
      {st === "idle" && (
        <>
          <div className="space-y-2">
            <label className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-600"}`}>Slot</label>
            <div className="grid grid-cols-2 gap-2">
              {slots?.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  disabled={slot.pill_count === 0}
                  className={`p-2 rounded-xl text-xs text-left border transition-all ${
                    selectedSlot?.id === slot.id
                      ? (dark ? "border-sky-500 bg-sky-950/40" : "border-sky-500 bg-sky-50")
                      : (dark ? "border-slate-700 hover:border-slate-600" : "border-slate-200 hover:border-slate-300")
                  } ${slot.pill_count === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <div className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Slot {slot.slot}</div>
                  <div className={`truncate ${dark ? "text-slate-400" : "text-slate-600"}`}>{slot.medication_name}</div>
                  <div className={`text-[10px] mt-1 ${slot.pill_count < 5 ? "text-red-500" : (dark ? "text-slate-500" : "text-slate-400")}`}>
                    {slot.pill_count} pastilles
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-600"}`}>Dosi</label>
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => setDose(Math.max(1, dose - 1))}
                className={`w-8 h-8 rounded-lg border ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-700"}`}
              >−</button>
              <span className={`flex-1 text-center font-bold ${dark ? "text-white" : "text-slate-900"}`}>{dose}</span>
              <button 
                onClick={() => setDose(dose + 1)}
                className={`w-8 h-8 rounded-lg border ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-700"}`}
              >+</button>
            </div>
          </div>

          <PrimaryBtn 
            onClick={handleDispense} 
            disabled={!selectedSlot}
            className="w-full py-2.5"
          >
            💊 Dispensar
          </PrimaryBtn>
        </>
      )}

      {(st === "loading" || st === "waiting_robot") && (
        <div className={`text-center py-4 ${dark ? "text-slate-400" : "text-slate-500"}`}>
          <div className="text-sm font-medium">
            {st === "loading" ? "Enviant ordre..." : "Esperant resposta del robot..."}
          </div>
          <div className="text-xs mt-1">Això pot tardar uns segons</div>
        </div>
      )}
    </Card>
  );
}