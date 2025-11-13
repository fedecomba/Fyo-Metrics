import { GoogleGenAI, Type } from "@google/genai";
import type { EvaluationResult } from '../types';

// Vercel Serverless Function
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { analyses } = req.body;

        if (!analyses || !Array.isArray(analyses)) {
            return res.status(400).json({ error: 'Falta el array de análisis en la solicitud.' });
        }
    
        const API_KEY = process.env.API_KEY;
        if (!API_KEY) {
            return res.status(500).json({ error: "La clave de API no está configurada en el servidor." });
        }
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        
        const simplifiedAnalyses = analyses.map((a: EvaluationResult) => ({
            colaborador: a.colaborador,
            puntuacion_general: a.puntuacion_general,
            fortalezas: a.fortalezas,
            oportunidades_mejora: a.oportunidades_mejora,
            resumen_ejecutivo: a.resumen_ejecutivo,
        }));

        const prompt = `
            **Contexto:**
            Actúas como un director de RRHH analizando el desempeño colectivo de un equipo. A continuación, te proporciono una serie de análisis de desempeño individuales en formato JSON. Tu tarea es consolidarlos y generar un reporte comparativo del equipo.

            **Datos del Equipo:**
            ${JSON.stringify(simplifiedAnalyses, null, 2)}

            **Tu Tarea:**
            Analiza los datos de todos los miembros del equipo y genera un reporte que identifique patrones y tendencias grupales.

            **Formato de Salida (JSON):**
            - **resumen_equipo:** Un párrafo conciso (3-4 frases) resumiendo el desempeño general del equipo, su cohesión, la distribución del rendimiento (ej: "mayoritariamente sólido con algunos talentos excepcionales") y cualquier dinámica notable.
            - **fortalezas_comunes:** Una lista de las 3 o 4 fortalezas técnicas o de comportamiento que aparecen con más frecuencia en el equipo. Sé específico.
            - **oportunidades_grupales:** Una lista de las 3 o 4 áreas de mejora, desafíos o carencias más comunes que enfrenta el equipo.
            - **iniciativa_sugerida:** Basado en los hallazgos, sugiere una única iniciativa de desarrollo concreta y accionable para el equipo (ej: "Un taller sobre gestión de proyectos ágiles", "Implementar sesiones de feedback cruzado", "Un curso avanzado de comunicación asertiva").
        `;

        const teamAnalysisSchema = {
            type: Type.OBJECT,
            properties: {
                resumen_equipo: { type: Type.STRING },
                fortalezas_comunes: { type: Type.ARRAY, items: { type: Type.STRING } },
                oportunidades_grupales: { type: Type.ARRAY, items: { type: Type.STRING } },
                iniciativa_sugerida: { type: Type.STRING }
            },
            required: ["resumen_equipo", "fortalezas_comunes", "oportunidades_grupales", "iniciativa_sugerida"]
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: teamAnalysisSchema,
            },
        });
        
        const jsonText = response.text;
        if (!jsonText) {
            return res.status(500).json({ error: "La respuesta de la API de IA estaba vacía." });
        }

        return res.status(200).json(JSON.parse(jsonText));

    } catch (error: any) {
        console.error("Error en /api/analyze-team:", error);
        res.status(500).json({ error: error.message || 'Ocurrió un error interno en el servidor.' });
    }
}