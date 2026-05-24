// src/components/messages/ConversationView.jsx
"use client";

import { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

export default function ConversationView({ messages, patientName, dark }) {
  // Canviem l'estratègia: una referència al final del xat
  const messagesEndRef = useRef(null);

  // Fa un scroll suau cap al final cada cop que canvien els missatges
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("ca-ES", { 
      day: "numeric", 
      month: "short", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  // Agrupar per dia
  const groupedByDay = messages.reduce((acc, msg) => {
    const day = new Date(msg.created_at).toLocaleDateString("ca-ES", {
      weekday: "long", day: "numeric", month: "long"
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  if (messages.length === 0) {
    return (
      <div 
        className={`flex-1 min-h-0 flex items-center justify-center text-center p-6 ${
          dark ? "text-slate-500" : "text-slate-400"
        }`}
      >
        <div>
          <div className="text-4xl mb-2 opacity-50">💬</div>
          <p className="font-medium">Encara no hi ha missatges</p>
          <p className="text-sm mt-1 opacity-70">
            Comença una conversa escrivint un missatge a sota
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6 scroll-smooth">
      {Object.entries(groupedByDay).map(([day, dayMessages]) => (
        <div key={day} className="flex flex-col space-y-2 relative">
          
          {/* DATA STICKY: Es queda fixada a dalt mentre fas scroll, com a WhatsApp */}
          <div className="sticky top-0 z-10 flex items-center justify-center py-1 bg-transparent backdrop-blur-sm pointer-events-none">
            <span className={`text-xs px-3 py-1 rounded-full shadow-sm font-medium ${
              dark 
                ? "bg-slate-800/90 text-slate-300 border border-slate-700" 
                : "bg-white/90 text-slate-500 border border-slate-200"
            }`}>
              {day}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {dayMessages.map(msg => (
              <MessageBubble 
                key={`${msg.sender}-${msg.id}`} 
                msg={msg} 
                patientName={patientName}
                dark={dark} 
                formatTime={formatTime}
              />
            ))}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} className="h-2 w-full" />
    </div>
  );
}