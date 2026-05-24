import { GoogleGenAI } from "@google/genai";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // 1. FORZAMOS LA RUTA DEL ARCHIVO JSON SÍ O SÍ
    const credsPath = path.join(process.cwd(), "google-credentials.json");
    
    if (!fs.existsSync(credsPath)) {
      console.error("❌ ERROR CRÍTICO: No se encuentra el archivo JSON en:", credsPath);
      throw new Error("El archivo google-credentials.json no está en la raíz del proyecto.");
    }
    
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
    
    const { newSchedule, existingSchedules } = await req.json();

    console.log("=== INICIANDO PETICIÓN A VERTEX AI ===");

    const ai = new GoogleGenAI({
      vertexai: {
        project: "smrlp-496809",
        location: "us-central1",
      }
    });

    // AQUÍ ESTÁ LA MAGIA: RESTAURAMOS EL PROMPT COMPLETO
    const prompt = `Ets un sistema expert de verificació de seguretat mèdica. La teva funció és protegir pacients grans o vulnerables de dosis incorrectes o perilloses.

NOVA PROGRAMACIÓ A VERIFICAR:
- Medicament: ${newSchedule.medication_name}
- Dosi per presa: ${newSchedule.dose} pastilla/es
- Hora: ${newSchedule.time}
- Dies: ${newSchedule.days?.join(", ")}

MEDICAMENTS JA PROGRAMATS DEL PACIENT (BASE DE DADES):
${existingSchedules.length === 0
  ? "Cap altre medicament programat."
  : existingSchedules.map(s => {
      const name = s.slot_inventory?.medication_name || s.medication_name || "Desconegut";
      const dose = s.dose;
      const time = s.scheduled_time?.slice(0, 5) || s.time || "?";
      return `- ${name}: ${dose} pastilla/es a les ${time}h`;
    }).join("\n")
}

REGLES DE SEGURETAT QUE HAS D'APLICAR ESTRICTAMENT:

DOSI MÀXIMA PER PRESA:
- Avalua si la dosi és adequada per a cada medicament específic.
- Si dosi >= 5 pastilles de qualsevol medicament → safe: false automàticament.
- Si dosi >= 3 pastilles d'un medicament potencialment perillós → warning.

INTERACCIONS PERILLOSES (safe: false):
- Detecta interaccions greus entre el NOU medicament i els JA PROGRAMATS.
- Duplicació terapèutica (ex: dos AINEs, o el mateix medicament repetit a la mateixa hora).
- Dosi total diària excessiva si el mateix medicament apareix programat múltiples vegades al dia.

INTERACCIONS A VIGILAR (warning però safe: true):
- Dos medicaments que interaccionen moderadament o estan programats amb poca diferència de temps.

CRITERI GENERAL:
- Sigues conservador: si tens dubtes, safe: false.

Respon ÚNICAMENT amb un objecte JSON vàlid:
{"safe": true, "warnings": [], "info": "missatge en català"}`;

    console.log("Enviando al modelo gemini-2.5-flash...");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    console.log("=== RESPUESTA DE VERTEX AI OK ===");
    console.log(text);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.log("=== PARSE ERROR ===", e.message);
      parsed = { safe: true, warnings: [], info: "Error al llegir la resposta de la IA." };
    }

    // RESTAURAMOS TAMBIÉN LAS VALIDACIONES MANUALES DEL SERVIDOR POR SEGURIDAD EXTRA
    const doseNum = parseInt(newSchedule.dose);
    const medName = newSchedule.medication_name?.toLowerCase() || "";

    if (doseNum >= 5) {
      parsed.safe = false;
      parsed.warnings = [...(parsed.warnings || []), `Dosi molt elevada: ${doseNum} pastilles per presa.`];
      parsed.info = `Dosi de ${doseNum} pastilles és excessiva. Revisa la programació.`;
    }

    if ((medName.includes("paracetamol") || medName.includes("acetaminofen")) && doseNum > 2) {
      parsed.safe = false;
      if (!parsed.warnings?.some(w => w.toLowerCase().includes("paracetamol"))) {
        parsed.warnings = [...(parsed.warnings || []), `Paracetamol: dosi màxima per presa és 2 comprimits.`];
      }
      parsed.info = `La dosi de Paracetamol és excessiva. Màxim 2 comprimits per presa.`;
    }

    // ⭐ NOU: VERIFICACIÓ D'INVENTARI
    if (newSchedule.slot_inventory_id) {
      const { data: slot } = await supabaseAdmin
        .from("slot_inventory")
        .select("pill_count, slot")
        .eq("id", newSchedule.slot_inventory_id)
        .single();

      if (slot && slot.pill_count < doseNum) {
        parsed.safe = false;
        parsed.warnings = [
          ...(parsed.warnings || []),
          `Inventari insuficient: només hi ha ${slot.pill_count} pastilla/es al slot ${slot.slot}, però la dosi requereix ${doseNum}.`
        ];
        parsed.info = `No es pot programar: cal omplir el slot abans. Disponibles: ${slot.pill_count}, requerides: ${doseNum}.`;
      }
    }

    return Response.json(parsed);

  } catch (error) {
    console.error("=== ERROR VERTEX AI ===", error);
    return Response.json({
      safe: true,
      warnings: ["Fallo forzado. Revisa la consola."],
      info: "Error: " + error.message,
    }, { status: 500 });
  }
}