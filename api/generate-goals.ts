import { GoogleGenAI, Type } from "@google/genai";

// Vercel Serverless Function
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { oportunidades } = req.body;

        if (!oportunidades) {
            return res.status(400).json({ error: 'Faltan datos (oportunidades) en la solicitud.' });
        }
    
        const API_KEY = process.env.API_KEY;
        if (!API_KEY) {
            return res.status(500).json({ error: "La clave de API no está configurada en el servidor." });
        }
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        
        const prompt = `
            **Contexto:**
            Actúas como un coach de desarrollo profesional. Tu tarea es ayudar a un manager a definir objetivos de desarrollo para un colaborador.

            **Información de Entrada:**
            - Oportunidades de Mejora identificadas: ${JSON.stringify(oportunidades)}

            **Tu Tarea:**
            Basado en las oportunidades de mejora, redacta 2-3 objetivos de desarrollo siguiendo la metodología SMART.
            Cada parte del objetivo (objetivo, métrica, plazo) debe ser extremadamente conciso y directo, idealmente en una sola frase corta.

            **Formato de Salida:**
            Devuelve un array de objetos JSON con la estructura definida en el schema.
        `;

        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    objetivo: { type: Type.STRING, description: "El objetivo específico y claro." },
                    metrica_exito: { type: Type.STRING, description: "Cómo se medirá el éxito del objetivo." },
                    plazo_sugerido: { type: Type.STRING, description: "El plazo recomendado para alcanzar el objetivo (ej: 'Próximo trimestre', 'Final de Q3')." }
                },
                required: ["objetivo", "metrica_exito", "plazo_sugerido"]
            }
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text;
        if (!jsonText) {
             return res.status(500).json({ error: "La respuesta de la API de IA estaba vacía." });
        }

        const result = JSON.parse(jsonText);
        return res.status(200).json(result);

    } catch (error: any) {
        console.error("Error en /api/generate-goals:", error);
        res.status(500).json({ error: error.message || 'Ocurrió un error interno en el servidor.' });
    }
}