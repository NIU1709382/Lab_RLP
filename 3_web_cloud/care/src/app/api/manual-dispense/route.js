// src/app/api/manual-dispense/route.js
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST: crear ordre de dispensació manual
export async function POST(req) {
  try {
    // Autenticar usuari
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autenticat" }, { status: 401 });

    const { robot_id, slot_inventory_id, dose } = await req.json();
    const doseNum = parseInt(dose) || 1;

    // Verificar que el robot pertany a l'usuari
    const { data: robot } = await supabaseAdmin
      .from("robots")
      .select("id, status, updated_at")
      .eq("id", robot_id)
      .eq("owner_id", user.id)
      .single();

    if (!robot) return Response.json({ error: "Robot no trobat" }, { status: 404 });

    // Verificar que el robot està online (heartbeat fa menys de 60s)
    const lastSeen = new Date() - new Date(robot.updated_at);
    if (robot.status !== "online" || lastSeen > 60000) {
      return Response.json({ 
        error: "El robot no està en línia. No es pot enviar l'ordre." 
      }, { status: 409 });
    }

    // Verificar inventari
    const { data: slot } = await supabaseAdmin
      .from("slot_inventory")
      .select("pill_count, medication_name, slot")
      .eq("id", slot_inventory_id)
      .single();

    if (!slot) return Response.json({ error: "Slot no trobat" }, { status: 404 });

    if (slot.pill_count < doseNum) {
      return Response.json({ 
        error: `Inventari insuficient: només hi ha ${slot.pill_count} pastilla/es, demanades ${doseNum}.`,
        pill_count: slot.pill_count,
      }, { status: 409 });
    }

    // Crear l'ordre pendent
    const { data: command, error } = await supabaseAdmin
      .from("manual_commands")
      .insert({
        robot_id,
        type: "dispense_manual",
        slot_inventory_id,
        dose: doseNum,
        status: "pending",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ 
      success: true, 
      command_id: command.id,
      medication: slot.medication_name,
      dose: doseNum,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// GET: consultar estat d'una ordre (polling des del frontend)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const commandId = searchParams.get("id");
  if (!commandId) return Response.json({ error: "Falta id" }, { status: 400 });

  const { data: command } = await supabaseAdmin
    .from("manual_commands")
    .select("*")
    .eq("id", commandId)
    .single();

  if (!command) return Response.json({ error: "Ordre no trobada" }, { status: 404 });

  return Response.json(command);
}