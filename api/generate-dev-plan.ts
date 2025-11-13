import { GoogleGenAI, Type } from "@google/genai";
import type { PlanDeDesarrollo } from '../types';

const devPlanResponseSchema = {
    type: Type.OBJECT,
    properties: {
        introduccion: { type: Type.STRING, description: "Un párrafo introductorio motivador y muy breve (1-2 frases) para el plan de desarrollo." },
        acciones: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    area_enfoque: { type: Type.STRING, description: "La oportunidad de mejora que se está abordando." },
                    recursos_recomendados: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de 2-3 recursos como libros, cursos, podcasts, etc." }
                },
                required: ["area_enfoque", "recursos_recomendados"]
            }
        }
    },
    required: ["introduccion", "acciones"]
};

// Vercel Serverless Function
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { oportunidades, puesto, seniority } = req.body;

        if (!oportunidades || !puesto || !seniority) {
            return res.status(400).json({ error: 'Faltan datos (oportunidades, puesto o seniority) en la solicitud.' });
        }

        const API_KEY = process.env.API_KEY;
        if (!API_KEY) {
            return res.status(500).json({ error: "La clave de API no está configurada en el servidor." });
        }
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const prompt = `
            **Contexto:**
            Actúas como un experto en Desarrollo Organizacional. Tu tarea es crear una lista de recursos de aprendizaje personalizados.

            **Información del Colaborador:**
            - Puesto: ${puesto}
            - Seniority: ${seniority}
            - Oportunidades de Mejora identificadas: ${JSON.stringify(oportunidades)}

            **Tu Tarea:**
            Para CADA una de las oportunidades de mejora, genera una lista de recursos de aprendizaje.

            **Instrucciones Específicas:**
            1.  **introduccion:** Escribe una muy breve frase (1-2 frases) que enmarque esta lista como una herramienta de crecimiento.
            2.  **acciones:** Crea un objeto por cada 'oportunidad de mejora'.
            3.  **recursos_recomendados:** Para cada oportunidad, recomienda 2-3 recursos específicos y de alta calidad. Utiliza el formato exacto: 'Tipo: Título (Autor/Plataforma)'.
                - Ejemplo Correcto: "Libro: Conversaciones Cruciales (Patterson, Grenny, McMillan, Switzler)"
                - Ejemplo Correcto: "Curso: Gestión de Proyectos Simplificada (LinkedIn Learning)"
                - **NO añadas descripciones ni explicaciones adicionales a los recursos.**

            **Formato de Salida:**
            Devuelve un único objeto JSON con la estructura definida en el schema.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: devPlanResponseSchema,
            },
        });

        const jsonText = response.text;
        if (!jsonText) {
            throw new Error("La respuesta de la API de IA estaba vacía.");
        }
        
        res.status(200).json(JSON.parse(jsonText));

    } catch (error: any) {
        console.error("Error en /api/generate-dev-plan:", error);
        res.status(500).json({ error: error.message || 'Ocurrió un error interno en el servidor.' });
    }
}