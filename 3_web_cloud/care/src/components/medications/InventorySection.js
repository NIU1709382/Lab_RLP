"use client";
import MedicationSearch from "@/components/medications/MedicationSearch";

export default function InventorySection({ 
  inventory, editingSlot, deletingSlot, invForm, invSaving, dark, card, inp, 
  openInvEdit, cancelInvEdit, setDeletingSlot, setInvForm, saveInventory, deleteSlot, COLORS 
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((slotNum) => {
        const idx = slotNum - 1;
        const color = COLORS[idx];
        const current = inventory[idx];
        const isEditing = editingSlot === slotNum;
        const isConfirming = deletingSlot === slotNum;

        return (
          <div key={slotNum} className={`rounded-2xl border p-6 transition-all ${card}`}>
            <div className="flex items-center justify-between mb-5">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${dark ? color.badgeD : color.badgeL}`}>
                <span className={`w-2 h-2 rounded-full ${color.dot}`} /> Slot {slotNum}
              </div>
              {current && !isEditing && !isConfirming && (
                <div className="flex gap-2">
                  <button onClick={() => openInvEdit(slotNum, current)} className={`text-xs px-3 py-1.5 rounded-lg border ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}>Editar</button>
                  <button onClick={() => setDeletingSlot(slotNum)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500">Eliminar</button>
                </div>
              )}
            </div>
            
            {isConfirming && (
              <div className={`mb-4 p-4 rounded-xl border ${dark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"}`}>
                <p className="text-sm font-semibold text-red-500 mb-1">Eliminar {current?.medication_name}?</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => deleteSlot(slotNum)} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold">Sí</button>
                  <button onClick={() => setDeletingSlot(null)} className={`flex-1 py-2 rounded-lg text-xs border ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}>No</button>
                </div>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-3">
                <MedicationSearch dark={dark} value={invForm.medication_name} onSelect={(val) => setInvForm(f => ({ ...f, medication_name: val }))} />
                <input type="number" placeholder="Pastilles" value={invForm.pill_count} onChange={(e) => setInvForm(f => ({ ...f, pill_count: e.target.value }))} className={`w-full px-3 py-2 rounded-xl border ${inp}`} />
                <div className="flex gap-2 pt-1">
                  <button onClick={saveInventory} disabled={invSaving} className={`flex-1 py-2.5 rounded-xl bg-linear-to-r ${color.gradBtn} text-white text-sm font-semibold`}>Guardar</button>
                  <button onClick={cancelInvEdit} className={`px-4 py-2.5 rounded-xl text-sm border ${dark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}>Cancel·lar</button>
                </div>
              </div>
            ) : current ? (
              <div>
                <p className="font-bold text-lg mb-3">{current.medication_name}</p>
                <div className={`p-4 rounded-xl text-center ${dark ? "bg-slate-800" : "bg-slate-50"}`}>
                  <p className="text-xs opacity-50">Pastilles restants</p>
                  <p className="text-2xl font-black">{current.pill_count}</p>
                </div>
              </div>
            ) : (
              <button onClick={() => openInvEdit(slotNum, null)} className={`w-full py-8 rounded-xl border-2 border-dashed ${dark ? "border-slate-700 text-slate-500" : "border-slate-200 text-slate-400"}`}>
                Slot buit · Clic per omplir
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}