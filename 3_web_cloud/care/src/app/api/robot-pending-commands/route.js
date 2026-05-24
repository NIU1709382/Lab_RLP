// src/app/api/robot-pending-commands/route.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { robot_id, robot_token } = await req.json();

  // Validar token
  const { data: robot } = await supabaseAdmin
    .from("robots")
    .select("id")
    .eq("id", robot_id)
    .eq("robot_token", robot_token)
    .single();

  if (!robot) return Response.json({ error: "Token invàlid" }, { status: 401 });

  // Buscar ordres pendents amb info del slot
  const { data: commands } = await supabaseAdmin
    .from("manual_commands")
    .select(`
      id,
      type,
      dose,
      slot_inventory_id,
      message_text,
      audio_base64,
      slot_inventory:slot_inventory_id (
        slot,
        medication_name,
        pill_count
      )
    `)
    .eq("robot_id", robot_id)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(5);

  // Les marquem com "in_progress" perquè no es reenviin
  if (commands && commands.length > 0) {
    const ids = commands.map(c => c.id);
    await supabaseAdmin
      .from("manual_commands")
      .update({ status: "in_progress" })
      .in("id", ids);
  }

  return Response.json({ commands: commands || [] });
}