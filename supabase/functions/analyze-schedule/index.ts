
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.1.3";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, context } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no configurada en Supabase Secrets');
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-pro-preview';

    // Construcción del prompt segura en el servidor
    const systemPrompt = `
      Actúa como un analista experto de RRHH Municipal.
      Analiza los siguientes datos de turnos y funcionarios.
      
      Datos del Contexto:
      ${JSON.stringify(context)}
      
      Instrucción del Usuario:
      ${prompt}
      
      Si la modalidad es '24/7', responde EXCLUSIVAMENTE con un JSON válido siguiendo la estructura de WeeklyAnalysis.
      Si es otra modalidad, responde en Markdown claro y conciso.
    `;

    const result = await ai.models.generateContent({
      model: model,
      contents: systemPrompt,
      config: {
        // Configuración dinámica basada en el contexto podría ir aquí
        temperature: 0.2
      }
    });

    const responseText = result.text;

    return new Response(JSON.stringify({ text: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});