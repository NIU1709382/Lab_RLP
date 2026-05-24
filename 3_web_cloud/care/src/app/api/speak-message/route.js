// src/app/api/speak-message/route.js
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import textToSpeech from "@google-cloud/text-to-speech";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // 1. Autenticar usuari
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autenticat" }, { status: 401 });

    const { robot_id, message } = await req.json();

    if (!message?.trim()) {
      return Response.json({ error: "Missatge buit" }, { status: 400 });
    }
    if (message.length > 500) {
      return Response.json({ error: "Màxim 500 caràcters" }, { status: 400 });
    }

    // 2. Validar robot
    const { data: robot } = await supabaseAdmin
      .from("robots")
      .select("id, status, updated_at")
      .eq("id", robot_id)
      .eq("owner_id", user.id)
      .single();

    if (!robot) {
      return Response.json({ error: "Robot no trobat" }, { status: 404 });
    }

    const lastSeen = new Date() - new Date(robot.updated_at);
    if (robot.status !== "online" || lastSeen > 60000) {
      return Response.json({ 
        error: "El robot no està en línia" 
      }, { status: 409 });
    }

    // 3. Generar MP3 amb Google TTS
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    const ttsClient = new textToSpeech.TextToSpeechClient({ credentials });

    const [ttsResponse] = await ttsClient.synthesizeSpeech({
      input: { text: message.trim() },
      voice: {
        languageCode: "ca-ES",
        name: "ca-ES-Standard-A",  // veu femenina catalana natural
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.95,  // una mica més lent (millor per gent gran)
        pitch: 0,
      },
    });

    // 4. Convertir a base64
    const audioBase64 = Buffer.from(ttsResponse.audioContent).toString("base64");

    // 5. Crear comanda al robot
    const { data: command, error } = await supabaseAdmin
      .from("manual_commands")
      .insert({
        robot_id,
        type: "speak",
        message_text: message.trim(),
        audio_base64: audioBase64,
        status: "pending",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      command_id: command.id,
    });

  } catch (error) {
    console.error("Error speak-message:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}