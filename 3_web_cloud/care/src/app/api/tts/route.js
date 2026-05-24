// src/app/api/tts/route.js
import { createClient } from "@supabase/supabase-js";
import textToSpeech from "@google-cloud/text-to-speech";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { robot_id, robot_token, text } = await req.json();

    if (!text?.trim()) {
      return Response.json({ error: "Text buit" }, { status: 400 });
    }

    // Validar token del robot
    const { data: robot } = await supabaseAdmin
      .from("robots")
      .select("id")
      .eq("id", robot_id)
      .eq("robot_token", robot_token)
      .single();

    if (!robot) {
      return Response.json({ error: "Token invàlid" }, { status: 401 });
    }

    // Generar TTS
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    const ttsClient = new textToSpeech.TextToSpeechClient({ credentials });

    const [ttsResponse] = await ttsClient.synthesizeSpeech({
      input: { text: text.trim() },
      voice: {
        languageCode: "ca-ES",
        name: "ca-ES-Standard-A",
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.95,
      },
    });

    const audioBase64 = Buffer.from(ttsResponse.audioContent).toString("base64");

    return Response.json({ 
      success: true,
      audio_base64: audioBase64,
    });

  } catch (error) {
    console.error("Error TTS:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}