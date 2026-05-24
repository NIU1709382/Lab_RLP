// src/app/api/robot-info/route.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { robot_id, robot_token } = await req.json();

  const { data: robot } = await supabaseAdmin
    .from("robots")
    .select("id, name, owner_id")
    .eq("id", robot_id)
    .eq("robot_token", robot_token)
    .single();

  if (!robot) return Response.json({ error: "Token invàlid" }, { status: 401 });

  const { data: patient } = await supabaseAdmin
    .from("patients")
    .select("id")
    .eq("robot_id", robot.id)
    .single();

  let schedules = [];
  if (patient) {
    const { data: schData } = await supabaseAdmin
      .from("dispense_schedules")
      .select("*, slot_inventory(id, slot, medication_name, pill_count)")  // ⭐ afegit id i pill_count
      .eq("patient_id", patient.id)
      .eq("active", true);

    schedules = schData || [];
  }

  return Response.json({
    robot_name: robot.name,
    schedules: schedules,
  });
}