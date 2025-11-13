import type { EvaluationResult, SmartGoal, TeamAnalysisResult, PlanDeDesarrollo } from '../types';

// This is to inform TypeScript about the jspdf global variable from the CDN
declare const jspdf: any;

const { jsPDF } = jspdf;

const FONT_SIZE_NORMAL = 10;
const FONT_SIZE_HEADER = 16;
const FONT_SIZE_SUBHEADER = 12;
const LINE_HEIGHT = 7;
const MARGIN = 20;

const checkNewPage = (currentY: number, pdfDoc: any, requiredSpace = 20) => {
    if (currentY > pdfDoc.internal.pageSize.height - requiredSpace) {
        pdfDoc.addPage();
        return MARGIN;
    }
    return currentY;
};

const addText = (doc: any, text: string | string[], x: number, startY: number, options: any = {}) => {
    const lines = doc.splitTextToSize(text, doc.internal.pageSize.width - MARGIN * 2 - (x - MARGIN));
    doc.text(lines, x, startY, options);
    return startY + (lines.length * LINE_HEIGHT * 0.9);
};

const addList = (doc: any, title: string, items: string[] | undefined, startY: number) => {
    let y = startY;
    if (!items || items.length === 0) return y;
    
    y = checkNewPage(y, doc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE_SUBHEADER);
    doc.text(title, MARGIN, y);
    y += LINE_HEIGHT * 1.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZE_NORMAL);
    items.forEach(item => {
        y = checkNewPage(y, doc);
        const itemText = `• ${item}`;
        y = addText(doc, itemText, MARGIN + 5, y);
        y += LINE_HEIGHT * 0.5; // Space between items
    });

    return y + LINE_HEIGHT;
};
    
const addSmartGoals = (doc: any, title: string, items: SmartGoal[] | undefined, startY: number) => {
    let y = startY;
    if (!items || items.length === 0) return y;
    
    y = checkNewPage(y, doc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE_SUBHEADER);
    doc.text(title, MARGIN, y);
    y += LINE_HEIGHT * 1.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZE_NORMAL);
    items.forEach((item, index) => {
        y = checkNewPage(y, doc, 40); // Need more space for each goal
        
        doc.setFont('helvetica', 'bold');
        y = addText(doc, `Objetivo ${index + 1}: ${item.objetivo}`, MARGIN + 5, y);
        y += LINE_HEIGHT * 0.5;

        doc.setFont('helvetica', 'normal');
        y = addText(doc, `Métrica de Éxito: ${item.metrica_exito}`, MARGIN + 10, y);
        y += LINE_HEIGHT * 0.5;
        
        y = addText(doc, `Plazo Sugerido: ${item.plazo_sugerido}`, MARGIN + 10, y);
        y += LINE_HEIGHT * 1.5; // Space between goals
    });

    return y + LINE_HEIGHT;
};

const addDevelopmentPlan = (doc: any, plan: PlanDeDesarrollo | undefined, startY: number) => {
    let y = startY;
    if (!plan || !plan.acciones || plan.acciones.length === 0) return y;

    y = checkNewPage(y, doc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE_SUBHEADER);
    doc.text("Recursos para el Desarrollo", MARGIN, y);
    y += LINE_HEIGHT * 1.5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(FONT_SIZE_NORMAL);
    y = addText(doc, `"${plan.introduccion}"`, MARGIN, y);
    y += LINE_HEIGHT;

    plan.acciones.forEach(accion => {
        y = checkNewPage(y, doc, 40); // Reserve space for each development action
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONT_SIZE_NORMAL);
        y = addText(doc, `Para mejorar: ${accion.area_enfoque}`, MARGIN + 5, y);
        y += LINE_HEIGHT;

        doc.setFont('helvetica', 'normal');
        if (accion.recursos_recomendados && accion.recursos_recomendados.length > 0) {
            y = addText(doc, 'Recursos Sugeridos:', MARGIN + 10, y);
            y += LINE_HEIGHT * 0.5;
            accion.recursos_recomendados.forEach(item => {
                 y = addText(doc, `• ${item}`, MARGIN + 15, y);
                 y += LINE_HEIGHT * 0.5;
            });
        }
        y += LINE_HEIGHT * 1.5;
    });

    return y + LINE_HEIGHT;
};


const addHeader = (doc: any, title: string, companyLogoBase64: string | null) => {
     if (companyLogoBase64) {
        try {
            const imgProps = doc.getImageProperties(companyLogoBase64);
            const aspectRatio = imgProps.width / imgProps.height;
            const logoHeight = 15;
            const logoWidth = logoHeight * aspectRatio;
            const logoX = doc.internal.pageSize.width - MARGIN - logoWidth;
            doc.addImage(companyLogoBase64, 'PNG', logoX, MARGIN - 5, logoWidth, logoHeight);
        } catch(e) {
            console.error("Could not add logo to PDF:", e);
        }
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE_HEADER);
    doc.text(title, MARGIN, MARGIN);
    return MARGIN + (LINE_HEIGHT * 2);
}


export const generateAnalysisPdf = (result: EvaluationResult, companyLogoBase64: string | null) => {
    const doc = new jsPDF();
    let y = addHeader(doc, 'Análisis de Desempeño', companyLogoBase64);

    // --- Collaborator Info ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.text(`Colaborador: ${result.colaborador}`, MARGIN, y);
    y += LINE_HEIGHT;
    doc.text(`Puesto: ${result.puesto} (${result.seniority})`, MARGIN, y);
    y += LINE_HEIGHT;
    doc.text(`Área: ${result.area}`, MARGIN, y);
    y += LINE_HEIGHT;
    doc.text(`Período Analizado: ${result.año}`, MARGIN, y);
    y += LINE_HEIGHT * 2;
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y - LINE_HEIGHT, doc.internal.pageSize.width - MARGIN, y - LINE_HEIGHT);

    // --- Executive Summary ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE_SUBHEADER);
    doc.text('Resumen Ejecutivo', MARGIN, y);
    y += LINE_HEIGHT * 1.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZE_NORMAL);
    y = addText(doc, result.resumen_ejecutivo, MARGIN, y);
    y += LINE_HEIGHT;
    
    // --- Score ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE_SUBHEADER);
    doc.text(`Puntuación General: ${result.puntuacion_general.toFixed(1)} / 10`, MARGIN, y);
    y += LINE_HEIGHT * 2;
    
    // --- Evolution Analysis (if present) ---
    if (result.analisis_evolucion) {
        y = checkNewPage(y, doc);
        doc.setLineWidth(0.2);
        doc.line(MARGIN, y - LINE_HEIGHT, doc.internal.pageSize.width - MARGIN, y - LINE_HEIGHT);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONT_SIZE_SUBHEADER);
        doc.text('Análisis de Evolución', MARGIN, y);
        y += LINE_HEIGHT * 1.5;
        
        doc.setFont('helvetica', 'italic');
        y = addText(doc, `"${result.analisis_evolucion.resumen_trayectoria}"`, MARGIN, y);
        y += LINE_HEIGHT;

        y = addList(doc, 'Progreso Destacado', result.analisis_evolucion.progreso_en_oportunidades, y);
        y = addList(doc, 'Fortalezas Consistentes', result.analisis_evolucion.fortalezas_consistentes, y);
        y = addList(doc, 'Desafíos Recurrentes', result.analisis_evolucion.desafios_recurrentes, y);
    }
    
    // --- Strengths and Opportunities ---
    y = checkNewPage(y, doc);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y - LINE_HEIGHT, doc.internal.pageSize.width - MARGIN, y - LINE_HEIGHT);
    y = addList(doc, 'Fortalezas (Último Período)', result.fortalezas, y);
    y = addList(doc, 'Oportunidades de Mejora (Último Período)', result.oportunidades_mejora, y);
    
    // --- SMART Goals and Discussion Points ---
    y = addSmartGoals(doc, 'Objetivos SMART Sugeridos', result.objetivos_smart, y);
    y = addDevelopmentPlan(doc, result.plan_desarrollo, y);
    y = addList(doc, 'Preguntas para la Conversación', result.preguntas_discusion, y);

    // --- Save the PDF ---
    doc.save(`Analisis_Desempeno_${result.colaborador.replace(/\s/g, '_')}.pdf`);
};


export const generateTeamAnalysisPdf = (data: TeamAnalysisResult, companyLogoBase64: string | null) => {
    const doc = new jsPDF();
    let y = addHeader(doc, 'Análisis Comparativo de Equipo', companyLogoBase64);

    doc.setLineWidth(0.5);
    doc.line(MARGIN, y - LINE_HEIGHT, doc.internal.pageSize.width - MARGIN, y - LINE_HEIGHT);
    
    // --- Team Summary ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE_SUBHEADER);
    doc.text('Resumen del Equipo', MARGIN, y);
    y += LINE_HEIGHT * 1.5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(FONT_SIZE_NORMAL);
    y = addText(doc, `"${data.resumen_equipo}"`, MARGIN, y);
    y += LINE_HEIGHT * 2;

    // --- Strengths and Opportunities ---
    y = checkNewPage(y, doc);
    y = addList(doc, 'Fortalezas Comunes', data.fortalezas_comunes, y);
    y = addList(doc, 'Oportunidades Grupales', data.oportunidades_grupales, y);

    // --- Suggested Initiative ---
    y = checkNewPage(y, doc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE_SUBHEADER);
    doc.text('Iniciativa de Desarrollo Sugerida', MARGIN, y);
    y += LINE_HEIGHT * 1.5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZE_NORMAL);
    y = addText(doc, data.iniciativa_sugerida, MARGIN + 5, y);

    // --- Save the PDF ---
    doc.save(`Analisis_Comparativo_Equipo.pdf`);
};