export const ALERT_DOT = {
  fall: "bg-red-500",
  medication_missed: "bg-amber-400",
  medication_failed_inventory: "bg-orange-500",
  low_battery: "bg-yellow-500",
  offline: "bg-slate-400",
  low_inventory: "bg-orange-400",
  voice_message: "bg-purple-500",
};

export const ALERT_COLOR = {
  fall: "red",
  medication_missed: "amber",
  medication_failed_inventory: "red",
  low_battery: "amber",
  offline: "slate",
  low_inventory: "amber",
  voice_message: "sky",
};

export const ALERT_LABEL = {
  fall: "🚨 Caiguda",
  medication_missed: "⚠️ Presa perduda",
  medication_failed_inventory: "📦 Sense estoc",
  low_battery: "🔋 Bateria baixa",
  offline: "📡 Desconnectat",
  low_inventory: "📉 Inventari baix",
  voice_message: "💬 Missatge",
};

const DEFAULT_DESCRIPTIONS = {
  fall: "S'ha detectat una possible caiguda",
  low_battery: "La bateria del robot està baixa",
  offline: "El robot ha perdut la connexió",
  low_inventory: "Un slot té poques pastilles restants",
  voice_message: "El pacient ha enviat un missatge",
};

export function buildAlertDescription(a) {
  const log = a.dispense_log;

  if (a.type === "medication_missed" && log) {
    const hora = log.scheduled_time?.slice(0, 5);
    const med = a.medication_name || "medicació";
    return `No s'ha pres ${med}${hora ? ` programada a les ${hora}h` : ""}.`;
  }

  if (a.type === "medication_failed_inventory" && log) {
    const hora = log.scheduled_time?.slice(0, 5);
    const med = a.medication_name || "medicació";
    const real = log.dose_real ?? 0;
    const demanat = log.dose ?? "?";
    return `${med}${hora ? ` (${hora}h)` : ""}: només s'han pogut dispensar ${real} de ${demanat} pastilles. Cal omplir el slot.`;
  }

  return a.description || DEFAULT_DESCRIPTIONS[a.type] || "Alerta del sistema";
}

export function formatAlertTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();
  
  const time = date.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" });
  
  if (isToday) return `Avui ${time}`;
  if (isYesterday) return `Ahir ${time}`;
  return date.toLocaleDateString("ca-ES", { day: "numeric", month: "short" }) + ` ${time}`;
}