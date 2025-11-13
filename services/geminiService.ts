import { GoogleGenAI, Type } from "@google/genai";
import type { EvaluationResult, UserData, SmartGoal, TeamAnalysisResult, PlanDeDesarrollo, ChatMessage } from '../types';

// Helper to initialize AI client, ensures API_KEY is available.
const getAiClient = () => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        throw new Error("La clave de API no está configurada. Asegúrate de que la variable de entorno API_KEY esté disponible.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

const buildAnalysisPrompt = (pdfText: string, userData: UserData): string => {
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

export const analyzePerformanceReview = async (pdfText: string, userData: UserData): Promise<EvaluationResult> => {
    try {
        const ai = getAiClient();
        const prompt = buildAnalysisPrompt(pdfText, userData);
        
        const resultStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        let fullResponse = '';
        for await (const chunk of resultStream) {
            fullResponse += chunk.text;
        }

        // Clean potential markdown wrappers from the response
        const cleanedResponse = fullResponse.replace(/^```json\s*|```\s*$/g, '').trim();
        const result: EvaluationResult = JSON.parse(cleanedResponse);
        
        // Populate user data locally
        result.colaborador = userData.name;
        result.area = userData.area;
        result.puesto = userData.position;
        result.seniority = userData.seniority;
        
        return result;

    } catch (e: any) {
        console.error("Error in analyzePerformanceReview:", e);
        throw new Error(`Ocurrió un error al procesar el análisis con la IA. Verifique que su clave de API sea correcta y tenga los permisos necesarios. Detalle: ${e.message}`);
    }
};

export const generateSmartGoals = async (oportunidades: string[]): Promise<SmartGoal[]> => {
    try {
        const ai = getAiClient();
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
             throw new Error("La respuesta de la API de IA estaba vacía.");
        }

        return JSON.parse(jsonText);

    } catch (e: any) {
        console.error("Error in generateSmartGoals:", e);
        throw new Error(`No se pudieron generar los objetivos SMART. Detalle: ${e.message}`);
    }
};

export const generateDevelopmentPlan = async (oportunidades: string[], puesto: string, seniority: string): Promise<PlanDeDesarrollo> => {
     try {
        const ai = getAiClient();
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
        
        return JSON.parse(jsonText);

    } catch (e: any) {
        console.error("Error in generateDevelopmentPlan:", e);
        throw new Error(`No se pudo generar el plan de desarrollo. Detalle: ${e.message}`);
    }
};

export const analyzeTeamPerformance = async (analyses: EvaluationResult[]): Promise<TeamAnalysisResult> => {
     try {
        const ai = getAiClient();
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
            throw new Error("La respuesta de la API de IA estaba vacía.");
        }

        return JSON.parse(jsonText);

    } catch (e: any) {
        console.error("Error in analyzeTeamPerformance:", e);
        throw new Error(`No se pudo analizar el rendimiento del equipo. Detalle: ${e.message}`);
    }
};

export const sendChatMessage = async (
    analysisResult: EvaluationResult,
    messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> => {
    try {
        const ai = getAiClient();
        
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
        
        return readableStream;

    } catch (e: any) {
        console.error("Error in sendChatMessage:", e);
        throw new Error(`No se pudo enviar el mensaje. Detalle: ${e.message}`);
    }
};
