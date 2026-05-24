"use client";

import { useContext, useState, useEffect } from "react";
import { ThemeContext, SidebarContext } from "@/app/dashboard/layout";
import { supabase } from "@/lib/supabase";

import InventorySection from "@/components/medications/InventorySection";
import SchedulesSection from "@/components/medications/SchedulesSection";

// Constants que es mantenen al fitxer perquè es fan servir aquí
const COLORS = [
  { dot: "bg-sky-400",    gradBtn: "from-sky-500 to-sky-600",    badgeL: "bg-sky-50 text-sky-700 border-sky-200",    badgeD: "bg-sky-900/30 text-sky-300 border-sky-800",    dayActive: "bg-sky-500",    ring: "border-sky-500" },
  { dot: "bg-violet-400",  gradBtn: "from-violet-500 to-violet-600", badgeL: "bg-violet-50 text-violet-700 border-violet-200", badgeD: "bg-violet-900/30 text-violet-300 border-violet-800", dayActive: "bg-violet-500", ring: "border-violet-500" },
  { dot: "bg-emerald-400", gradBtn: "from-emerald-500 to-emerald-600", badgeL: "bg-emerald-50 text-emerald-700 border-emerald-200", badgeD: "bg-emerald-900/30 text-emerald-300 border-emerald-800", dayActive: "bg-emerald-500", ring: "border-emerald-500" },
  { dot: "bg-amber-400",   gradBtn: "from-amber-500 to-amber-600",  badgeL: "bg-amber-50 text-amber-700 border-amber-200",   badgeD: "bg-amber-900/30 text-amber-300 border-amber-800",   dayActive: "bg-amber-500",   ring: "border-amber-500" },
];

const EMPTY_SCHED = { slot_inventory_id: "", time: "", dose: "1", days: [] };

export default function MedicationsPage() {
  const { theme } = useContext(ThemeContext);
  const { setOpen } = useContext(SidebarContext);
  const dark = theme === "dark";

  const [tab, setTab] = useState("inventory");
  const [robotId, setRobotId] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [inventory, setInventory] = useState([null, null, null, null]);
  const [schedules, setSchedules] = useState([]);

  // Estats per als formularis
  const [editingSlot, setEditingSlot] = useState(null);
  const [invForm, setInvForm] = useState({ medication_name: "", pill_count: "" });
  const [invSaving, setInvSaving] = useState(false);
  const [deletingSlot, setDeletingSlot] = useState(null);
  const [showSchedForm, setShowSchedForm] = useState(false);
  const [schedForm, setSchedForm] = useState(EMPTY_SCHED);

  // --- Lògica de dades ---
  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data: robot } = await supabase.from("robots").select("id").eq("owner_id", user.id).single();
    if (!robot) return;
    setRobotId(robot.id);
    const { data: patient } = await supabase.from("patients").select("id").eq("robot_id", robot.id).single();
    if (patient) setPatientId(patient.id);
    
    const { data: slots } = await supabase.from("slot_inventory").select("*").eq("robot_id", robot.id).order("slot");
    const arr = [null, null, null, null];
    (slots || []).forEach(s => { arr[s.slot - 1] = s; });
    setInventory(arr);
    
    if (patient) {
      const { data: sched } = await supabase
        .from("dispense_schedules")
        .select("*, slot_inventory(slot, medication_name)")
        .eq("patient_id", patient.id)
        .eq("active", true)
        .order("scheduled_time");
      setSchedules(sched || []);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // --- Funcions d'acció ---
  const saveInventory = async () => {
    setInvSaving(true);
    await supabase.from("slot_inventory").upsert({
      robot_id: robotId, slot: editingSlot, medication_name: invForm.medication_name,
      pill_count: parseInt(invForm.pill_count), updated_at: new Date().toISOString(),
    }, { onConflict: "robot_id,slot" });
    setEditingSlot(null);
    await fetchAll();
    setInvSaving(false);
  };

  const deleteSlot = async (slotNum) => {
    const slotData = inventory[slotNum - 1];
    await supabase.from("dispense_schedules").update({ active: false, slot_inventory_id: null }).eq("slot_inventory_id", slotData.id);
    await supabase.from("slot_inventory").delete().eq("id", slotData.id);
    setDeletingSlot(null);
    await fetchAll();
  };

  const saveSchedule = async (formData) => {
    await supabase.from("dispense_schedules").insert({
      patient_id: patientId, slot_inventory_id: formData.slot_inventory_id,
      scheduled_time: formData.time, days: formData.days, dose: formData.dose,
      active: true, created_by: userId,
    });
    await fetchAll();
    setShowSchedForm(false);
  };

  const deleteSchedule = async (id) => {
    await supabase.from("dispense_schedules").update({ active: false }).eq("id", id);
    await fetchAll();
  };

  // --- Render ---
  const base = dark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900";
  const card = dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm";
  const inp = dark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200";

  return (
    <div className={`${base} min-h-screen transition-colors duration-300`}>
      <button className={`md:hidden m-4 w-9 h-9 rounded-xl flex items-center justify-center ${dark ? "bg-slate-800" : "bg-slate-100"}`} onClick={() => setOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <main className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-1">Medicació del Robot</h2>
        <div className={`inline-flex rounded-2xl p-1 gap-1 mb-8 ${dark ? "bg-slate-800" : "bg-slate-200/60"}`}>
          {["inventory", "schedules"].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-xl text-sm font-semibold ${tab === t ? (dark ? "bg-slate-700" : "bg-white") : ""}`}>
              {t === "inventory" ? "Inventari" : "Programació"}
            </button>
          ))}
        </div>

        {tab === "inventory" ? (
          <InventorySection {...{ inventory, editingSlot, deletingSlot, invForm, invSaving, dark, card, inp, COLORS, setInvForm, setDeletingSlot, openInvEdit: (s, c) => { setEditingSlot(s); setInvForm({ medication_name: c?.medication_name || "", pill_count: c?.pill_count?.toString() || "" }); }, cancelInvEdit: () => setEditingSlot(null), saveInventory, deleteSlot }} />
        ) : (
          <SchedulesSection {...{ grouped: schedules.reduce((acc, s) => { const k = s.slot_inventory_id; if (!acc[k]) acc[k] = []; acc[k].push(s); return acc; }, {}), showSchedForm, loadedSlots: inventory.filter(Boolean), schedules, dark, card, COLORS, setShowSchedForm, setSchedForm, EMPTY_SCHED, saveSchedule, deleteSchedule }} />
        )}
      </main>
    </div>
  );
}