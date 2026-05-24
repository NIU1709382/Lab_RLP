// src/app/api/robot-voice/route.js
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // Rebem àudio com a form-data
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const robotId = formData.get("robot_id");
    const robotToken = formData.get("robot_token");
    
    const now = new Date().toLocaleString("ca-ES", { 
      timeZone: "Europe/Madrid",
      weekday: "long",
      day: "numeric", 
      month: "long",
      hour: "2-digit", 
      minute: "2-digit" 
    });

    // 1. Validar token
    const { data: robot } = await supabaseAdmin
      .from("robots")
      .select("id")
      .eq("id", robotId)
      .eq("robot_token", robotToken)
      .single();

    if (!robot) {
      return Response.json({ error: "Token invàlid" }, { status: 401 });
    }

    // 2. Trobem el pacient
    const { data: patient } = await supabaseAdmin
      .from("patients")
      .select("id, full_name")
      .eq("robot_id", robotId)
      .single();

    // 3. Convertim àudio a base64
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    if (!audioBase64 || audioBase64.length < 100) {
      return Response.json({
        success: true,
        intent: "unclear",
        transcript: "",
        response_text: "Hola! M'has cridat? Recorda parlar després d'activar-me.",
      });
    }
    // 4. Cridem Gemini amb àudio
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    const ai = new GoogleGenAI({
      vertexai: {
        project: "smrlp-496809",
        location: "us-central1",
        googleAuthOptions: {
          credentials: {
            client_email: credentials.client_email,
            private_key: credentials.private_key,
          },
        },
      },
    });

  const prompt = `Ets l'assistent intel·ligent del robot Care-E, dissenyat per acompanyar pacients grans i ajudar els seus cuidadors. 
    T'arribarà un àudio del pacient. Has de fer el següent:
    La data i hora ACTUAL és: ${now}

    1. TRANSCRIURE: Fes una transcripció literal del que sents a "raw_transcript".
    2. REESCRIURE EL MISSATGE PER AL CUIDADOR ("clean_message"): 
       - Ignora sorolls, errors i quequejos.
       - Redacta un missatge professional, empàtic i complet en TERCERA PERSONA que resumeixi perfectament què vol el pacient.
       - 🧠 AFEGIT DE VALOR: Si el pacient fa una pregunta objectiva sobre medicació (ex: dosis, freqüència), salut, o fets coneguts, AFEGEIX al final del text una "[Nota de l'Assistent]" amb la informació general recomanada per ajudar el cuidador a respondre ràpidament.
       - Exemple: "El pacient demana saber quants paracetamols pot prendre com a màxim al dia. \\n\\n[Nota de l'Assistent: La dosi recomanada per a adults no ha de superar els 4 grams al dia, generalment prenent 1 gram cada 8 hores. Cal revisar la seva pauta mèdica específica.]"
    3. CLASSIFICAR la INTENCIÓ ("intent"):
       - "caregiver": el pacient demana enviar un missatge, fer una pregunta al cuidador o demana ajuda.
       - "robot": el pacient busca interacció directa amb la IA (ex: "quina hora és?", "quin temps fa?").
       - "unclear": no s'entén absolutament res.
    4. URGÈNCIA ("urgency", només si és "caregiver"):
       - "emergency": dolor intens, caiguda, sang, mareig fort.
       - "high": preocupació, malestar moderat, dubtes urgents de medicació.
       - "normal": comentaris o dubtes genèrics sense perill.
       - "low": salutacions o informació rutinària.
    5. RESPOSTA PEL ROBOT ("robot_response"): 
       - Si la intenció és "robot", respon al pacient de forma empàtica i útil.
       - Si la intenció és "caregiver", confirma l'enviament amb una frase com: "Molt bé, acabo d'enviar aquesta pregunta al teu cuidador perquè t'ho revisi."

    Respon ÚNICAMENT amb JSON vàlid:
    {
      "raw_transcript": "...",
      "clean_message": "...",
      "intent": "caregiver" | "robot" | "unclear",
      "urgency": "low" | "normal" | "high" | "emergency",
      "robot_response": "..."
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { 
            inlineData: { 
              mimeType: "audio/wav",   // depèn del format del robot
              data: audioBase64 
            } 
          }
        ]
      }],
      config: {
        responseMimeType: "application/json",
      }
    });

  const parsed = JSON.parse(response.text);

  if (!parsed.clean_message || parsed.clean_message.trim().length === 0) {
      return Response.json({
        success: true,
        intent: "unclear",
        transcript: parsed.raw_transcript,
        response_text: "No t'he entès bé, pots repetir-ho?",
      });
    }

  let voiceMessage = null;
  if (parsed.intent === "caregiver") {
    const { data } = await supabaseAdmin
      .from("voice_messages")
      .insert({
        robot_id: robotId,
        patient_id: patient?.id,
        transcript: parsed.clean_message, // <-- AQUÍ GUARDAMOS EL MENSAJE LIMPIO
        intent: parsed.intent,
        urgency: parsed.urgency || "normal",
        robot_response: parsed.robot_response,
      })
      .select()
      .single();
    voiceMessage = data;
  }

  // 6. Alerta només si és caregiver urgent
  if (parsed.intent === "caregiver" && ["high", "emergency"].includes(parsed.urgency)) {
    await supabaseAdmin.from("alerts").insert({
      robot_id: robotId,
      type: "voice_message",
      severity: parsed.urgency === "emergency" ? "high" : "medium",
      description: `Missatge del pacient: "${parsed.clean_message}"`, // <-- A LA ALERTA TAMBIÉN VA LIMPIO
      medication_name: null,
    });
  }

    // 7. Retornar al robot què fer
    return Response.json({
      success: true,
      intent: parsed.intent,
      transcript: parsed.transcript,
      // Si és per al robot, retornem text perquè el robot el digui amb TTS local
      response_text: parsed.intent === "robot" ? parsed.robot_response : 
                     parsed.intent === "caregiver" ? "Ho he enviat al teu cuidador." :
                     "No t'he entès bé, pots repetir-ho?",
    });

  } catch (error) {
    console.error("Error voice:", error);
    return Response.json({ 
      error: error.message,
      response_text: "Ho sento, ha hagut un problema. Torna-ho a provar.",
    }, { status: 500 });
  }
}