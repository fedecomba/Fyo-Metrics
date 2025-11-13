import { GoogleGenAI } from "@google/genai";
import type { EvaluationResult, ChatMessage } from '../types';

export const config = {
  runtime: 'edge',
};

// Vercel Edge Function for streaming chat
export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { analysisResult, messages } = await req.json();

        if (!analysisResult || !messages) {
            return new Response(JSON.stringify({ error: 'Faltan datos (analysisResult o messages) en la solicitud.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const API_KEY = process.env.API_KEY;
        if (!API_KEY) {
            return new Response(JSON.stringify({ error: "La clave de API no está configurada en el servidor." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const analysisContext = { ...analysisResult };
        delete analysisContext.raw_text;

        const systemInstruction = `
            **Tu Rol:**
            Eres un Asistente de IA experto en RRHH. Tu propósito es ayudar a un usuario a explorar en profundidad una evaluación de desempeño. Tienes acceso a dos fuentes de información:
            1.  El **análisis estructurado en JSON** que ya se ha realizado.
            2.  El **texto original y completo** de los documentos de evaluación.

            **Tus Tareas:**
            - Responde preguntas específicas sobre el análisis.
            - Si el usuario te pide un ejemplo concreto, búscalo en el texto original y cítalo brevemente.
            - Ayuda al usuario a conectar los puntos entre diferentes secciones (ej: "cómo se relaciona una oportunidad de mejora con los comentarios del jefe").
            - Mantén un tono profesional, servicial y perspicaz.
            - Sé conciso y directo en tus respuestas.

            **Contexto del Análisis (JSON):**
            \`\`\`json
            ${JSON.stringify(analysisContext, null, 2)}
            \`\`\`

            **Texto Original de los Documentos:**
            \`\`\`
            ${analysisResult.raw_text || "No se proporcionó texto original."}
            \`\`\`
        `;

        const history = messages.slice(0, -1).map((msg: ChatMessage) => ({
            role: msg.role,
            parts: [{ text: msg.content }],
        }));

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: history,
            config: {
                systemInstruction,
            },
        });

        const lastMessageContent = messages[messages.length - 1].content;
        const resultStream = await chat.sendMessageStream({ message: lastMessageContent });

        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of resultStream) {
                    controller.enqueue(encoder.encode(chunk.text));
                }
                controller.close();
            },
        });

        return new Response(readableStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error: any) {
        console.error("Error en /api/chat:", error);
        const errorMessage = JSON.stringify({ error: error.message || 'Ocurrió un error interno en el servidor.' });
        return new Response(errorMessage, { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}