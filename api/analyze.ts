import { GoogleGenAI, Type } from "@google/genai";
import type { UserData } from '../types';

export const config = {
  runtime: 'edge',
};

const buildPrompt = (pdfText: string, userData: UserData): string => {
  return `
    **Contexto general:**
    Actúas como un analista experto de RRHH. Tu tarea es analizar documentos de evaluación de desempeño, transformándolos en un informe estructurado.

    **IMPORTANTE: Tu única salida debe ser un objeto JSON válido. No incluyas markdown (e.g. \`\`\`json) ni ningún otro texto fuera del objeto JSON.**

    **Datos del Colaborador (para tu contexto, no para la salida JSON):**
    - Nombre: ${userData.name}, Área: ${userData.area}, Puesto: ${userData.position}, Seniority: ${userData.seniority}

    **Instrucciones sobre Seniority (MUY IMPORTANTE):**
    Ajusta tus criterios de evaluación y expectativas basándote en el seniority del colaborador. No puedes evaluar a todos por igual.
    - **Para un 'Analista' o 'Especialista':** Enfócate en la calidad de la ejecución de tareas, habilidades técnicas, proactividad, colaboración con pares y cumplimiento de objetivos individuales.
    - **Para un 'Líder' o 'Gerente':** Enfócate en habilidades de liderazgo, desarrollo del equipo, pensamiento estratégico, impacto en los resultados del área/negocio, gestión de stakeholders y comunicación a nivel directivo. Las expectativas son significativamente más altas.

    **Objetivo Principal:**
    1. Analiza la información de todos los documentos. Si hay varios períodos (marcados con "--- INICIO PERÍODO: AÑO ---"), el análisis principal debe centrarse en el **período más reciente**.
    2. Genera un objeto JSON. Las propiedades "colaborador", "area", "puesto", "seniority" NO deben incluirse en tu salida JSON.

    **Instrucciones de Análisis para el JSON (Período más reciente):**
    - **puntuacion_general:** Evalúa el contenido global del período más reciente y asigna una puntuación del 1 al 10, **ajustada por el seniority**. Sé crítico y equilibrado. 7-8 es un desempeño sólido que cumple lo esperado **para su nivel**.
    - **logros_destacados, fortalezas, oportunidades_mejora:** Identifica los **3 a 5 puntos MÁS IMPORTANTES** para cada categoría. Sé selectivo.
    - **competencias_evaluadas:** Evalúa 5 a 7 competencias clave del último período en una escala de 1 a 5 (1=necesita desarrollo, 5=sobresaliente). La selección de competencias debe ser relevante para el seniority:
        - Si el seniority es 'Líder' o 'Gerente', OBLIGATORIAMENTE debes incluir 'Visión Estratégica' entre las competencias evaluadas.
        - Si el seniority es 'Analista' o 'Especialista', enfócate en competencias como Calidad del Trabajo, Proactividad, Colaboración.
    - **resumen_ejecutivo:** Un resumen directo y accionable en **3 viñetas**. Formato: Un único string usando '•' y saltos de línea (\\n).
        • Principal Logro/Fortaleza: [Una frase concisa]
        • Principal Oportunidad de Mejora: [Una frase concisa]
        • Conclusión / Siguiente Paso Clave: [Una frase concisa]
    - **preguntas_discusion:** Sugiere 2-3 preguntas abiertas, concisas e impactantes para una reunión de feedback.

    **Análisis de Evolución (Comparativo):**
    - **La propiedad 'analisis_evolucion' SÓLO se completa si hay texto de más de un período. Si solo hay un período, esta propiedad debe ser nula (null).**
    - Compara el período más reciente con los anteriores de forma breve.
    - **puntuaciones_historicas:** Si hay múltiples períodos, extrae la puntuación general del período más reciente y de todos los períodos anteriores que encuentres en el texto.
    - **resumen_trayectoria:** Describe la evolución general en 1-2 frases.
    - **progreso_en_oportunidades, fortalezas_consistentes, desafios_recurrentes:** Menciona solo los 1-2 puntos más relevantes para cada uno.

    **Texto de los Documentos:**
    \`\`\`
    ${pdfText}
    \`\`\`
  `;
};


// Vercel Edge Function
export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { pdfText, userData } = await req.json();

        if (!pdfText || !userData) {
            return new Response(JSON.stringify({ error: 'Faltan datos (pdfText o userData) en la solicitud.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
    
        const API_KEY = process.env.API_KEY;
        if (!API_KEY) {
            return new Response(JSON.stringify({ error: "La clave de API no está configurada en el servidor." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const prompt = buildPrompt(pdfText, userData as UserData);
    
        const resultStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

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
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });

    } catch (error: any) {
        console.error("Error en /api/analyze:", error);
        const errorMessage = JSON.stringify({ error: error.message || 'Ocurrió un error interno en el servidor.' });
        return new Response(errorMessage, { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}