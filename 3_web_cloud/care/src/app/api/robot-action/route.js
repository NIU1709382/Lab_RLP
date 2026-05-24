// src/app/api/robot-action/route.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { robot_id, robot_token, action, payload } = await req.json();

    // 1. Validar el token del robot
    const { data: robot, error: robotError } = await supabaseAdmin
      .from("robots")
      .select("id")
      .eq("id", robot_id)
      .eq("robot_token", robot_token)
      .single();

    if (robotError || !robot) {
      return Response.json({ error: "Token invàlid" }, { status: 401 });
    }

    // ══════════════════════════════════════════
    // ACCIÓ: DISPENSE
    // ══════════════════════════════════════════
    if (action === "dispense") {
      const { 
        schedule_id, 
        slot_inventory_id, 
        dose,
        dose_real,
        status: robotStatus,
        dispensed_at,
        command_id,
      } = payload;

      const finalDoseReal = dose_real !== undefined ? dose_real : dose;
      const finalStatus = robotStatus || (
        finalDoseReal === 0 ? "failed_inventory" :
        finalDoseReal < dose ? "failed_inventory" :
        "dispensed"
      );

      let medication_name = "Desconegut";
      let scheduled_time = null;

      if (schedule_id) {
        const { data: schedule } = await supabaseAdmin
          .from("dispense_schedules")
          .select(`scheduled_time, slot_inventory:slot_inventory_id (medication_name)`)
          .eq("id", schedule_id)
          .single();

        if (schedule) {
          medication_name = schedule.slot_inventory?.medication_name || "Desconegut";
          scheduled_time = schedule.scheduled_time || null;
        }
      } else if (slot_inventory_id) {
        const { data: slot } = await supabaseAdmin
          .from("slot_inventory")
          .select("medication_name")
          .eq("id", slot_inventory_id)
          .single();
        if (slot) medication_name = slot.medication_name;
      }

      let error_reason = null;
      if (finalStatus === "failed_inventory") {
        error_reason = `Dispensació incompleta: demanades ${dose}, dispensades ${finalDoseReal}.`;
      } else if (command_id) {
        error_reason = "Dispensació manual des del dashboard";
      }

      const scheduledDate = new Date().toLocaleDateString("sv-SE", { 
        timeZone: "Europe/Madrid" 
      });
      
      const { error: logError } = await supabaseAdmin
        .from("dispense_logs")
        .insert({
          schedule_id,
          robot_id,
          status: finalStatus,
          medication_name,
          dose,
          dose_real: finalDoseReal,
          scheduled_time,
          scheduled_date: scheduledDate,
          dispensed_at: dispensed_at || new Date().toISOString(),
          error_reason,
        });

      if (logError) {
        console.error("❌ Error creant log:", logError);
        return Response.json(
          { error: "No s'ha pogut guardar el log", details: logError.message },
          { status: 500 }
        );
      }

      if (slot_inventory_id && finalDoseReal > 0) {
        const { error: rpcError } = await supabaseAdmin.rpc("decrement_pill_count", {
          slot_id: slot_inventory_id,
          amount: finalDoseReal,
        });
        if (rpcError) console.error("⚠️ Error restant inventari:", rpcError);
      }

      if (finalStatus === "failed_inventory") {
        const { data: newLog } = await supabaseAdmin
          .from("dispense_logs")
          .select("id")
          .eq("robot_id", robot_id)
          .order("dispensed_at", { ascending: false })
          .limit(1)
          .single();

        await supabaseAdmin.from("alerts").insert({
          robot_id,
          type: "medication_failed_inventory",
          severity: "high",
          medication_name,
          dispense_log_id: newLog?.id,
          description: `${medication_name}: dispensació incompleta (${finalDoseReal}/${dose} pastilles). Cal omplir el slot.`,
        });
      }

      if (command_id) {
        const { error: cmdError } = await supabaseAdmin
          .from("manual_commands")
          .update({
            status: finalStatus === "dispensed" ? "completed" : "failed",
            result_dose_real: finalDoseReal,
            result_message: finalStatus === "dispensed" 
              ? `Dispensades ${finalDoseReal} pastilla/es de ${medication_name}.`
              : `Dispensació incompleta: només ${finalDoseReal}/${dose} pastilles de ${medication_name}.`,
            completed_at: new Date().toISOString(),
          })
          .eq("id", command_id);

        if (cmdError) console.error("❌ Error actualitzant manual_commands:", cmdError);
      }

      return Response.json({ 
        success: true,
        status: finalStatus,
        dose_real: finalDoseReal,
      });
    }

    // ══════════════════════════════════════════
    // ACCIÓ: SPEAK  ← ara està FORA del dispense
    // ══════════════════════════════════════════
    if (action === "speak") {
      const { command_id, status: robotStatus, error_message } = payload;

      if (!command_id) {
        return Response.json({ error: "Falta command_id" }, { status: 400 });
      }

      const { error: cmdError } = await supabaseAdmin
        .from("manual_commands")
        .update({
          status: robotStatus === "ok" ? "completed" : "failed",
          result_message: robotStatus === "ok"
            ? "Missatge reproduït correctament"
            : `Error: ${error_message || "desconegut"}`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", command_id);

      if (cmdError) {
        console.error("❌ Error actualitzant speak:", cmdError);
        return Response.json({ error: cmdError.message }, { status: 500 });
      }

      return Response.json({ success: true });
    }

    // ══════════════════════════════════════════
    // ACCIÓ DESCONEGUDA
    // ══════════════════════════════════════════
    return Response.json({ error: "Acció desconeguda" }, { status: 400 });

  } catch (error) {
    console.error("❌ Error general:", error);
    return Response.json(
      { error: "Error del servidor", details: error.message },
      { status: 500 }
    );
  }
}