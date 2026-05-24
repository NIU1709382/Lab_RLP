// src/components/medications/SchedulesSection.jsx
"use client";
import ScheduleForm from "@/components/medications/ScheduleForm";
import ClockPicker from "@/components/medications/ClockPicker";

const DAYS_CA = [
  { key: "dilluns", short: "Dl" }, { key: "dimarts", short: "Dt" },
  { key: "dimecres", short: "Dc" }, { key: "dijous", short: "Dj" },
  { key: "divendres", short: "Dv" }, { key: "dissabte", short: "Ds" },
  { key: "diumenge", short: "Dg" },
];

export default function SchedulesSection({ 
  grouped, showSchedForm, loadedSlots, schedules, dark, card, COLORS, 
  setShowSchedForm, setSchedForm, EMPTY_SCHED, saveSchedule, deleteSchedule 
}) {
  return (
    <div>
      <div className="flex justify-end mb-6">
        <button 
          onClick={() => { setShowSchedForm(true); setSchedForm(EMPTY_SCHED); }} 
          disabled={loadedSlots.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 hover:scale-[1.02] transition-transform disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova programació
        </button>
      </div>

      {showSchedForm && (
        <div className="mb-6">
          <ScheduleForm loadedSlots={loadedSlots} existingSchedules={schedules} dark={dark} ClockPicker={ClockPicker} onSave={saveSchedule} onCancel={() => setShowSchedForm(false)} />
        </div>
      )}

      {schedules.length === 0 && !showSchedForm ? (
        <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${dark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"}`}>
          <p className="text-sm font-medium">Cap programació creada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([slotInventoryId, items]) => {
            const slotInfo = items[0]?.slot_inventory;
            const slotNum = slotInfo?.slot;
            const color = slotNum ? COLORS[slotNum - 1] : COLORS[0];

            return (
              <div key={slotInventoryId} className={`rounded-2xl border overflow-hidden ${card}`}>
                <div className={`px-5 py-3 border-b flex items-center gap-3 ${dark ? "border-slate-800" : "border-slate-100"}`}>
                  <span className={`w-3 h-3 rounded-full ${color.dot}`} />
                  <span className="font-semibold text-sm">Slot {slotNum}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${dark ? color.badgeD : color.badgeL}`}>
                    {slotInfo?.medication_name}
                  </span>
                </div>

                <div className={`divide-y ${dark ? "divide-slate-800" : "divide-slate-50"}`}>
                  {[...items].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)).map((s) => (
                    <div key={s.id} className="px-5 py-4 flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-lg w-16 shrink-0">{s.scheduled_time.slice(0, 5)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg shrink-0 ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                        {s.dose}
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {DAYS_CA.map(({ key, short }) => (
                          <span key={key} className={`text-xs w-6 h-6 rounded flex items-center justify-center font-medium ${
                            s.days.includes(key) ? `${color.dayActive} text-white` : (dark ? "bg-slate-800 text-slate-600" : "bg-slate-100 text-slate-300")
                          }`}>
                            {short}
                          </span>
                        ))}
                      </div>
                      <button onClick={() => deleteSchedule(s.id)} className={`ml-auto p-1.5 rounded-lg text-red-400 transition-colors ${dark ? "hover:bg-red-900/20" : "hover:bg-red-50"}`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}