export interface UserData {
  name: string;
  area: string;
  position: string;
  seniority: string;
}

export interface CompetenciaEvaluada {
  nombre: string;
  puntuacion: number;
}

export interface PuntuacionHistorica {
    anio: string;
    puntuacion: number;
}

export interface AnalisisEvolucion {
  resumen_trayectoria: string;
  progreso_en_oportunidades: string[];
  fortalezas_consistentes: string[];
  desafios_recurrentes: string[];
  puntuaciones_historicas?: PuntuacionHistorica[];
}

export interface SmartGoal {
    objetivo: string;
    metrica_exito: string;
    plazo_sugerido: string;
}

export interface DevelopmentAction {
    area_enfoque: string;
    recursos_recomendados: string[];
}

export interface PlanDeDesarrollo {
    introduccion: string;
    acciones: DevelopmentAction[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface EvaluationResult {
  id?: string; // Unique ID when saved
  savedAt?: string; // ISO string timestamp when saved
  feedback?: 'up' | 'down' | null; // User feedback on the analysis quality
  raw_text?: string; // Raw text from PDFs for chatbot context
  año: string;
  colaborador: string;
  area: string;
  puesto: string;
  seniority: string;
  tipo_documento: string;
  objetivos_principales: string[];
  logros_destacados: string[];
  fortalezas: string[];
  oportunidades_mejora: string[];
  comentarios_jefe: string;
  evaluacion_general: string;
  competencias_evaluadas: CompetenciaEvaluada[];
  sentimiento_general: string;
  puntuacion_general: number;
  resumen_ejecutivo: string;
  preguntas_discusion: string[];
  analisis_evolucion?: AnalisisEvolucion; // Opcional, solo para análisis multi-año
  objetivos_smart?: SmartGoal[];
  plan_desarrollo?: PlanDeDesarrollo;
}

export interface TeamAnalysisResult {
    resumen_equipo: string;
    fortalezas_comunes: string[];
    oportunidades_grupales: string[];
    iniciativa_sugerida: string;
}