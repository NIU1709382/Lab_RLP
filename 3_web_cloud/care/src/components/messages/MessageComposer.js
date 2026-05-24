// src/components/messages/MessageComposer.jsx
"use client";

import { useState } from "react";

export default function MessageComposer({ onSend, robotOnline, dark }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const quickMessages = [
    "Hola, com estàs?",
    "Recorda prendre la medicació",
    "Ja vinc cap a casa",
    "Truca'm si em necessites",
  ];

    const handleSend = async () => {
    if (!text.trim() || sending || !robotOnline) return;
    setSending(true);
    setError("");
    try {
        await onSend(text.trim());
        setText("");
    } catch (e) {
        setError(e.message || "Error enviant");
    } finally {
        setSending(false);
    }
    };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`border-t ${dark ? "border-slate-800" : "border-slate-100"}`}>
      {/* Missatges ràpids */}
      <div className={`px-4 py-2 flex gap-1.5 overflow-x-auto border-b ${
        dark ? "border-slate-800" : "border-slate-100"
      }`}>
        {quickMessages.map(qm => (
          <button
            key={qm}
            onClick={() => setText(qm)}
            disabled={sending}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              dark 
                ? "border-slate-700 text-slate-300 hover:border-sky-600 hover:bg-sky-950/30" 
                : "border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50"
            } disabled:opacity-50`}
          >
            {qm}
          </button>
        ))}
      </div>
      {error && (
        <div className={`px-4 py-2 text-xs ${dark ? "bg-red-950/30 text-red-400" : "bg-red-50 text-red-700"}`}>
          ⚠ {error}
        </div>
      )}
      {!robotOnline && (
        <div className={`px-4 py-2 text-xs ${dark ? "bg-amber-950/30 text-amber-400" : "bg-amber-50 text-amber-700"}`}>
          ⚠ Robot desconnectat. El missatge no es podrà enviar fins que torni a estar en línia.
        </div>
      )}
      <div className="p-3 flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          placeholder={robotOnline ? "Escriu un missatge..." : "Robot desconnectat"}
          rows={1}
          disabled={sending || !robotOnline}
          className={`flex-1 px-4 py-2.5 rounded-2xl text-sm resize-none border ${
            dark 
              ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" 
              : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
          } disabled:opacity-50`}
          style={{ maxHeight: "120px" }}
        />  
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || !robotOnline}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-colors ${
            text.trim() && !sending && robotOnline
              ? (dark ? "bg-sky-700 hover:bg-sky-600 text-white" : "bg-sky-600 hover:bg-sky-700 text-white")
              : (dark ? "bg-slate-800 text-slate-600" : "bg-slate-100 text-slate-400")
          } disabled:cursor-not-allowed`}
        >
          {sending ? "⏳" : "🔊"}
        </button>
      </div>

      {/* Counter */}
      <div className={`px-4 pb-2 text-right text-xs ${dark ? "text-slate-600" : "text-slate-400"}`}>
        {text.length}/500
      </div>
    </div>
  );
}