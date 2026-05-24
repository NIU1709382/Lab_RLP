// src/hooks/useChatData.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useChatData() {
  const [robot, setRobot] = useState(null);
  const [patient, setPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: robotData } = await supabase
      .from("robots")
      .select("*")
      .eq("owner_id", user.id)
      .single();
    
    setRobot(robotData);
    
    if (!robotData) { 
      setLoading(false); 
      return; 
    }

    const { data: patientData } = await supabase
      .from("patients")
      .select("*")
      .eq("robot_id", robotData.id)
      .single();
      
    setPatient(patientData);

    const { data: caregiverMsgs } = await supabase
    .from("manual_commands")
    .select("id, robot_id, message_text, status, created_at")
    .eq("robot_id", robotData.id)
    .eq("type", "speak")
    .order("created_at", { ascending: true })
    .limit(100);

    const { data: patientMsgs } = await supabase
        .from("voice_messages")
        .select("id, robot_id, transcript, urgency, intent, read_by_caregiver, created_at")
        .eq("robot_id", robotData.id)
        .order("created_at", { ascending: true })
        .limit(100);

    // 3. Combinem i normalitzem al format que espera ConversationView
    const combined = [
    ...(caregiverMsgs || []).map(m => ({
        id: m.id,
        robot_id: m.robot_id,
        sender: "caregiver",
        content: m.message_text,
        urgency: "normal",
        intent: null,
        is_read: true,
        command_status: m.status,
        created_at: m.created_at,
    })),
    ...(patientMsgs || []).map(m => ({
        id: m.id,
        robot_id: m.robot_id,
        sender: "patient",
        content: m.transcript,
        urgency: m.urgency,
        intent: m.intent,
        is_read: m.read_by_caregiver,
        command_status: null,
        created_at: m.created_at,
    })),
    ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    setMessages(combined);
    setLoading(false);
  }, []);

  // 2. Efecto inicial y Suscripción a Realtime (¡Adiós setInterval!)
  useEffect(() => {
    fetchData();

    // Nos suscribimos a los cambios en la tabla original de mensajes
    // NOTA: Reemplaza "voice_messages" por el nombre real de tu tabla si es diferente.
    const channel = supabase
        .channel('chat_updates')
        .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voice_messages' },
        () => fetchData()
        )
        .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'manual_commands' },
        () => fetchData()  // ⭐ quan el robot marca completed/failed
        )
        .subscribe();

    return () => supabase.removeChannel(channel);
    }, [fetchData]);

  // 3. Marcar como leídos
  useEffect(() => {
    if (!robot || messages.length === 0) return;
    
    const unread = messages
      .filter(m => m.sender === "patient" && !m.is_read)
      .map(m => m.id);
    
    if (unread.length > 0) {
      supabase
        .from("voice_messages")
        .update({ read_by_caregiver: true })
        .in("id", unread)
        .then(() => {
        });
    }
  }, [robot, messages]);

  const handleSendMessage = async (text) => {

    console.log("Enviant:", { robot_id: robot?.id, message: text }); // ⭐ debug

    const res = await fetch("/api/speak-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        robot_id: robot.id,
        message: text,
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Error enviant missatge");
    }
    await fetchData();
    return data;
  };

  return {
    robot,
    patient,
    messages,
    loading,
    handleSendMessage
  };
}