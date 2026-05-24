"use client";
import Badge from "@/components/ui/Badge";

export default function MessageBubble({ msg, patientName, dark, formatTime }) {
  const isCaregiver = msg.sender === "caregiver";

  const getBubbleStyle = () => {
    if (isCaregiver) {
      return { 
        backgroundColor: dark ? '#0369a1' : '#0284c7',
        color: 'white'
      };
    }
    if (msg.urgency === "emergency") {
      return dark 
        ? { backgroundColor: 'rgba(69, 10, 10, 0.6)', color: '#fecaca', border: '1px solid rgba(153, 27, 27, 0.4)' }
        : { backgroundColor: '#fef2f2', color: '#7f1d1d', border: '1px solid #fecaca' };
    }
    return dark 
      ? { backgroundColor: '#1e293b', color: '#f1f5f9' }
      : { backgroundColor: '#f1f5f9', color: '#1e293b' };
  };

  return (
    <div className={`flex ${isCaregiver ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] flex flex-col gap-1 ${isCaregiver ? "items-end" : "items-start"}`}>
        
        {/* Nom + badge */}
        <div className="flex items-center gap-1.5 px-2">
          <span className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {isCaregiver ? "Tu" : (patientName || "Pacient")}
          </span>
          {msg.urgency === "emergency" && <Badge color="red" dark={dark}>🚨 Emergència</Badge>}
          {msg.urgency === "high" && <Badge color="amber" dark={dark}>⚠️ Important</Badge>}
        </div>

        {/* Bombolla amb style inline */}
        <div 
          className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
          style={getBubbleStyle()}
        >
          {isCaregiver && <span className="mr-1">🔊</span>}
          {msg.content}
        </div>

        {/* Hora + estat */}
        <div className="flex items-center gap-2 px-2">
          <span className={`text-xs ${dark ? "text-slate-600" : "text-slate-400"}`}>
            {formatTime(msg.created_at)}
          </span>
          {isCaregiver && msg.command_status && (
            <span className={`text-xs ${
              msg.command_status === "completed" ? (dark ? "text-green-500" : "text-green-600") :
              msg.command_status === "failed"    ? (dark ? "text-red-500"   : "text-red-600")   :
              (dark ? "text-slate-500" : "text-slate-400")
            }`}>
              {msg.command_status === "completed" && "✓ Reproduït"}
              {msg.command_status === "pending"   && "⏳ Enviant..."}
              {msg.command_status === "in_progress" && "⏳ Reproduint..."}
              {msg.command_status === "failed"    && "✗ Error"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}