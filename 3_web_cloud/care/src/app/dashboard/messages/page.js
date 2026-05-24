// src/app/dashboard/messages/page.js
"use client";

import { useContext } from "react";
import { ThemeContext } from "@/app/dashboard/layout";
import Card from "@/components/ui/Card";
import ConversationView from "@/components/messages/ConversationView";
import MessageComposer from "@/components/messages/MessageComposer";
import { useChatData } from "@/hooks/useChatData"; // <-- Tu nuevo hook

export default function MessagesPage() {
  const { theme } = useContext(ThemeContext);
  const dark = theme === "dark";

  const { 
    robot, 
    patient, 
    messages, 
    loading, 
    handleSendMessage 
  } = useChatData();

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className={dark ? "text-slate-400" : "text-slate-600"}>Carregant...</p>
      </div>
    );
  }

  if (!robot) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card dark={dark} className="p-8 text-center">
          <p className={dark ? "text-slate-400" : "text-slate-600"}>Cap robot vinculat</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-100px)] flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
          dark ? "bg-sky-950/60 border border-sky-800/40" : "bg-sky-50 border border-sky-100"
        }`}>
          👤
        </div>
        <div className="flex-1">
          <h1 className={`text-xl font-bold font-jakarta ${dark ? "text-white" : "text-slate-900"}`}>
            {patient?.full_name || "Pacient"}
          </h1>
          <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {robot.status === "online" ? (
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                En línia
              </span>
            ) : (
              <span className={dark ? "text-slate-500" : "text-slate-400"}>
                Desconnectat
              </span>
            )}
          </p>
        </div>
      </div>
      <Card dark={dark} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col h-screen overflow-hidden">
          <ConversationView 
            messages={messages} 
            patientName={patient?.full_name}
            dark={dark}
          />
        </div>
        <MessageComposer onSend={handleSendMessage} robotOnline={robot.status === "online"} dark={dark} />
      </Card>
    </div>
  );
}