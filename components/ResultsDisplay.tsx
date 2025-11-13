import React, { useState, useEffect, useRef } from 'react';
import type { EvaluationResult, SmartGoal, PlanDeDesarrollo, DevelopmentAction } from '../types';
import { CompetencyRadarChart } from './CompetencyRadarChart';
import { PerformanceTrendChart } from './PerformanceTrendChart';
import { ChatbotModal } from './ChatbotModal';
import { generateSmartGoals, generateDevelopmentPlan } from '../services/geminiService';
import { 
    CheckCircleIcon, ExclamationTriangleIcon, LightBulbIcon, TrophyIcon, 
    TargetIcon, MessageSquareQuoteIcon, ClipboardListIcon, TrendingUpIcon, 
    UserCircleIcon, SaveIcon, DownloadIcon, ClipboardCheckIcon, ThumbsUpIcon, ThumbsDownIcon,
    ArrowRightCircleIcon, CheckSquareIcon, HelpCircleIcon, PlusCircleIcon, MinusCircleIcon,
    UploadIcon, XIcon, SparklesIcon, BarChart4Icon, StarIcon, MessageCircleIcon,
    BookOpenIcon, MessageCircleQuestionIcon
} from './Icons';

interface ResultsDisplayProps {
  result: EvaluationResult;
  onSave: (result: EvaluationResult) => void;
  onDownloadPdf: (result: EvaluationResult) => void;
  companyLogo: string | null;
  onLogoUpload: (logo: string | null) => void;
}

const sentimentStyles: { [key: string]: { icon: React.ReactNode, bg: string, text: string, border: string } } = {
  positivo: { icon: <CheckCircleIcon className="w-5 h-5" />, bg: 'bg-[#6CC24A]/10', text: 'text-[#6CC24A]', border: 'border-[#6CC24A]/30' },
  neutral: { icon: <LightBulbIcon className="w-5 h-5" />, bg: 'bg-[#FF6A14]/10', text: 'text-[#FF6A14]', border: 'border-[#FF6A14]/30' },
  negativo: { icon: <ExclamationTriangleIcon className="w-5 h-5" />, bg: 'bg-[#E10600]/10', text: 'text-[#E10600]', border: 'border-[#E10600]/30' },
};

const ResultCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string; actions?: React.ReactNode; }> = ({ title, icon, children, className, actions }) => (
  <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm ${className}`}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center">
        {icon}
        <h4 className="font-semibold text-slate-800 ml-2">{title}</h4>
      </div>
      {actions && <div className="flex items-center gap-1 flex-shrink-0 ml-2">{actions}</div>}
    </div>
    <div className="text-slate-600 text-sm space-y-2">{children}</div>
  </div>
);

const ScoreIndicator: React.FC<{ score: number }> = ({ score }) => {
    const percentage = score * 10;
    const color = percentage >= 80 ? 'text-[#6CC24A]' : percentage >= 50 ? 'text-[#FF6A14]' : 'text-[#E10600]';
    const circumference = 2 * Math.PI * 20;

    return (
        <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 44 44">
                <circle className="text-slate-200" strokeWidth="4" stroke="currentColor" fill="transparent" r="20" cx="22" cy="22" />
                <circle
                    className={color}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (percentage / 100) * circumference}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="20"
                    cx="22"
                    cy="22"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${color}`}>{score.toFixed(1)}</span>
            </div>
        </div>
    );
};

const EditableContent: React.FC<{
  value: string;
  onChange: (newValue: string) => void;
  isTextarea?: boolean;
  className?: string;
  viewClassName?: string;
}> = ({ value, onChange, isTextarea = false, className = '', viewClassName = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      if (isTextarea && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      } else if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing]);
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };
  
  const handleBlur = () => {
    if (currentValue !== value) {
      onChange(currentValue);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isTextarea && !e.shiftKey) {
      if (currentValue !== value) {
        onChange(currentValue);
      }
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  if (isEditing) {
    if (isTextarea) {
      return (
        <textarea
          ref={textareaRef}
          value={currentValue}
          onChange={handleTextareaChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008EAA] resize-none overflow-hidden ${className}`}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full text-sm p-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008EAA] ${className}`}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`w-full cursor-text p-1.5 rounded-md hover:bg-slate-100/70 min-h-[34px] flex items-center ${viewClassName}`}
      title="Doble clic para editar"
    >
      {isTextarea ? (
        <p className="whitespace-pre-wrap">{value || '...'}</p>
      ) : (
        <span>{value || '...'}</span>
      )}
    </div>
  );
};


const EditableListDisplay: React.FC<{ 
    title: string; 
    items: string[]; 
    onItemChange: (index: number, value: string) => void;
    onAddItem: () => void;
    onRemoveItem: (index: number) => void;
    itemIcon: React.ReactNode;
}> = ({ title, items, onItemChange, onAddItem, onRemoveItem, itemIcon }) => (
    <div className="space-y-1">
        {items.map((item, index) => (
            <div key={index} className="group flex items-center gap-2">
                <span className="flex-shrink-0 text-slate-500 pt-1.5">{itemIcon}</span>
                <EditableContent 
                    value={item}
                    onChange={(newValue) => onItemChange(index, newValue)}
                />
                <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="text-red-500 hover:text-red-700 p-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remover item ${index + 1}`}
                >
                    <MinusCircleIcon className="w-5 h-5" />
                </button>
            </div>
        ))}
        <button type="button" onClick={onAddItem} className="flex items-center gap-2 text-sm font-medium text-[#008EAA] hover:text-[#006F8A] pt-2 ml-1">
            <PlusCircleIcon className="w-5 h-5" />
            Añadir {title}
        </button>
    </div>
);


const LogoUploader: React.FC<{ logo: string | null; onUpload: (logo: string | null) => void }> = ({ logo, onUpload }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                onUpload(reader.result as string);
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                alert("Error al cargar el logo.");
            };
            reader.readAsDataURL(file);
        }
        if(inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                {logo ? (
                    <img src={logo} alt="Company Logo" className="h-10 w-auto object-contain" />
                ) : (
                    <div className="h-10 w-10 bg-slate-200 rounded-md flex items-center justify-center flex-shrink-0">
                        <UploadIcon className="w-5 h-5 text-slate-500" />
                    </div>
                )}
                <div>
                    <p className="text-sm font-medium text-slate-700">Logo de la Empresa (Opcional)</p>
                    <p className="text-xs text-slate-500">Se añadirá al reporte PDF.</p>
                </div>
            </div>

            {logo ? (
                <button
                    onClick={() => onUpload(null)}
                    className="flex-shrink-0 text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                    <XIcon className="w-4 h-4" />
                    Quitar
                </button>
            ) : (
                <>
                    <input
                        type="file"
                        ref={inputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg"
                        className="sr-only"
                        id="logo-upload"
                    />
                    <label
                        htmlFor="logo-upload"
                        className="flex-shrink-0 cursor-pointer text-sm font-medium text-[#008EAA] hover:text-[#006F8A]"
                    >
                        Subir
                    </label>
                </>
            )}
        </div>
    );
};

const Tabs: React.FC<{ tabs: {label: string, icon: React.ReactNode}[], activeTab: number, setActiveTab: (index: number) => void }> = ({ tabs, activeTab, setActiveTab }) => (
    <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map((tab, index) => (
                <button
                    key={tab.label}
                    onClick={() => setActiveTab(index)}
                    className={`
                        ${activeTab === index 
                            ? 'border-[#008EAA] text-[#008EAA]' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }
                        group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors
                    `}
                    aria-current={activeTab === index ? 'page' : undefined}
                >
                    {tab.icon}
                    <span className="ml-2">{tab.label}</span>
                </button>
            ))}
        </nav>
    </div>
);

const TabPanel: React.FC<{ children: React.ReactNode, index: number, activeTab: number }> = ({ children, index, activeTab }) => {
    return (
        <div role="tabpanel" hidden={activeTab !== index} className="py-4">
            {activeTab === index && children}
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, onSave, onDownloadPdf, companyLogo, onLogoUpload }) => {
  const [editableResult, setEditableResult] = useState<EvaluationResult>(result);
  const [isGeneratingGoals, setIsGeneratingGoals] = useState(false);
  const [smartGoalsError, setSmartGoalsError] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [devPlanError, setDevPlanError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    setEditableResult(result);
  }, [result]);
  
  const handleListChange = (field: keyof EvaluationResult, index: number, value: string) => {
    setEditableResult(prev => {
      const list = [...(prev[field] as string[])];
      list[index] = value;
      return { ...prev, [field]: list };
    });
  };

  const handleAddItem = (field: keyof EvaluationResult) => {
    setEditableResult(prev => {
        const list = [...(prev[field] as string[] || []), 'Nuevo item...'];
        return { ...prev, [field]: list };
    });
  };

  const handleRemoveItem = (field: keyof EvaluationResult, index: number) => {
    setEditableResult(prev => {
        const list = (prev[field] as string[]).filter((_, i) => i !== index);
        return { ...prev, [field]: list };
    });
  };
  
  const handleNestedListChange = (parentField: 'analisis_evolucion', field: keyof NonNullable<EvaluationResult['analisis_evolucion']>, index: number, value: string) => {
    setEditableResult(prev => {
        if (!prev[parentField]) return prev;
        const parentObj = { ...prev[parentField]! };
        const list = [...(parentObj[field] as string[])];
        list[index] = value;
        return { ...prev, [parentField]: { ...parentObj, [field]: list } };
    });
  };

  const handleNestedAddItem = (parentField: 'analisis_evolucion', field: keyof NonNullable<EvaluationResult['analisis_evolucion']>) => {
    setEditableResult(prev => {
        if (!prev[parentField]) return prev;
        const parentObj = { ...prev[parentField]! };
        const list = [...(parentObj[field] as string[] || []), 'Nuevo item...'];
        return { ...prev, [parentField]: { ...parentObj, [field]: list } };
    });
  };

  const handleNestedRemoveItem = (parentField: 'analisis_evolucion', field: keyof NonNullable<EvaluationResult['analisis_evolucion']>, index: number) => {
    setEditableResult(prev => {
        if (!prev[parentField]) return prev;
        const parentObj = { ...prev[parentField]! };
        const list = (parentObj[field] as string[]).filter((_, i) => i !== index);
        return { ...prev, [parentField]: { ...parentObj, [field]: list } };
    });
  };

  const handleFeedback = (newFeedback: 'up' | 'down') => {
    setEditableResult(prev => {
      // If the user clicks the same button again, unset the feedback.
      if (prev.feedback === newFeedback) {
        return { ...prev, feedback: null };
      }
      return { ...prev, feedback: newFeedback };
    });
  };
  
    const handleGenerateSmartGoals = async () => {
        setIsGeneratingGoals(true);
        setSmartGoalsError(null);
        try {
            const goals = await generateSmartGoals(
                editableResult.oportunidades_mejora
            );
            setEditableResult(prev => ({ ...prev, objetivos_smart: goals }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
            setSmartGoalsError(errorMessage);
        } finally {
            setIsGeneratingGoals(false);
        }
    };

    const handleSmartGoalChange = (index: number, field: keyof SmartGoal, value: string) => {
        setEditableResult(prev => {
            const goals = [...(prev.objetivos_smart || [])];
            if (goals[index]) {
                goals[index] = { ...goals[index], [field]: value };
            }
            return { ...prev, objetivos_smart: goals };
        });
    };

    const handleAddSmartGoal = () => {
        setEditableResult(prev => {
            const newGoal: SmartGoal = {
                objetivo: 'Nuevo objetivo...',
                metrica_exito: 'Nueva métrica...',
                plazo_sugerido: 'Nuevo plazo...'
            };
            const goals = [...(prev.objetivos_smart || []), newGoal];
            return { ...prev, objetivos_smart: goals };
        });
    };

    const handleRemoveSmartGoal = (index: number) => {
        setEditableResult(prev => {
            const goals = (prev.objetivos_smart || []).filter((_, i) => i !== index);
            return { ...prev, objetivos_smart: goals };
        });
    };

    const handleGenerateDevPlan = async () => {
        setIsGeneratingPlan(true);
        setDevPlanError(null);
        try {
            const plan = await generateDevelopmentPlan(
                editableResult.oportunidades_mejora,
                editableResult.puesto,
                editableResult.seniority,
            );
            setEditableResult(prev => ({ ...prev, plan_desarrollo: plan }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
            setDevPlanError(errorMessage);
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleDevPlanChange = (actionIndex: number, field: 'recursos_recomendados', itemIndex: number, value: string) => {
        setEditableResult(prev => {
            if (!prev.plan_desarrollo) return prev;
            const newPlan = JSON.parse(JSON.stringify(prev.plan_desarrollo)) as PlanDeDesarrollo;
            newPlan.acciones[actionIndex][field][itemIndex] = value;
            return { ...prev, plan_desarrollo: newPlan };
        });
    };
    
    const handleAddDevPlanItem = (actionIndex: number, field: 'recursos_recomendados') => {
        setEditableResult(prev => {
            if (!prev.plan_desarrollo) return prev;
            const newPlan = JSON.parse(JSON.stringify(prev.plan_desarrollo)) as PlanDeDesarrollo;
            newPlan.acciones[actionIndex][field].push('Nuevo item...');
            return { ...prev, plan_desarrollo: newPlan };
        });
    };

    const handleRemoveDevPlanItem = (actionIndex: number, field: 'recursos_recomendados', itemIndex: number) => {
        setEditableResult(prev => {
            if (!prev.plan_desarrollo) return prev;
            const newPlan = JSON.parse(JSON.stringify(prev.plan_desarrollo)) as PlanDeDesarrollo;
            newPlan.acciones[actionIndex][field] = newPlan.acciones[actionIndex][field].filter((_, i) => i !== itemIndex);
            return { ...prev, plan_desarrollo: newPlan };
        });
    };


  const sentiment = editableResult.sentimiento_general?.toLowerCase() || 'neutral';
  const style = sentimentStyles[sentiment] || sentimentStyles.neutral;
  
  const TABS = [
    { label: 'Desempeño y Competencias', icon: <BarChart4Icon className="w-5 h-5"/> },
    { label: 'Logros y Objetivos', icon: <StarIcon className="w-5 h-5" /> },
    { label: 'Feedback del Manager', icon: <MessageCircleIcon className="w-5 h-5" /> },
  ];

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <ChatbotModal
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
          analysisResult={editableResult}
        />
        
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900">Análisis de Desempeño</h3>
          <p className="text-slate-500 mt-1">
            Período más reciente: <span className="font-medium text-slate-700">{editableResult.año}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="md:col-span-2">
              <div className="flex items-center mb-2">
                  <UserCircleIcon className="w-8 h-8 text-[#008EAA] mr-3" />
                  <div>
                      <h4 className="font-bold text-lg text-slate-800">{editableResult.colaborador}</h4>
                      <p className="text-sm text-slate-500">{editableResult.puesto}, {editableResult.area} • <span className="font-medium capitalize">{editableResult.seniority}</span></p>
                  </div>
              </div>
          </div>
          <div className="flex justify-center md:justify-end">
              <ScoreIndicator score={editableResult.puntuacion_general} />
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <LogoUploader logo={companyLogo} onUpload={onLogoUpload} />
          <div className="flex flex-col sm:flex-row gap-3">
            <button
                onClick={() => onSave(editableResult)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#008EAA] text-white text-sm font-medium rounded-md hover:bg-[#006F8A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#008EAA] transition-transform duration-200 transform hover:scale-[1.03]"
            >
                <SaveIcon className="w-4 h-4" />
                {result.id ? 'Actualizar Análisis' : 'Guardar Análisis'}
            </button>
            <button
                onClick={() => onDownloadPdf(editableResult)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#97999B] text-white text-sm font-medium rounded-md hover:bg-[#7f8183] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#97999B] transition-transform duration-200 transform hover:scale-[1.03]"
            >
                <DownloadIcon className="w-4 h-4" />
                Descargar PDF
            </button>
          </div>
        </div>
        
        {/* --- AT A GLANCE --- */}
        <ResultCard 
          title="Vista Rápida (Último Período)" 
          icon={<ClipboardListIcon className="w-5 h-5 text-[#008EAA]" />}
          actions={
              <div className="flex items-center gap-2" title="¿Fue útil este resumen?">
                  <button
                      onClick={() => handleFeedback('up')}
                      className={`p-1 rounded-full transition-colors ${
                          editableResult.feedback === 'up' 
                          ? 'bg-green-100 text-green-600' 
                          : 'text-slate-400 hover:bg-green-100 hover:text-green-600'
                      }`}
                      aria-pressed={editableResult.feedback === 'up'}
                      title="Resumen útil"
                      aria-label="Resumen útil"
                  >
                      <ThumbsUpIcon className="w-5 h-5" filled={editableResult.feedback === 'up'} />
                  </button>
                  <button
                      onClick={() => handleFeedback('down')}
                      className={`p-1 rounded-full transition-colors ${
                          editableResult.feedback === 'down' 
                          ? 'bg-red-100 text-red-600' 
                          : 'text-slate-400 hover:bg-red-100 hover:text-red-600'
                      }`}
                      aria-pressed={editableResult.feedback === 'down'}
                      title="Resumen no útil"
                      aria-label="Resumen no útil"
                  >
                      <ThumbsDownIcon className="w-5 h-5" filled={editableResult.feedback === 'down'} />
                  </button>
              </div>
          }
        >
          <EditableContent 
              isTextarea
              value={editableResult.resumen_ejecutivo}
              onChange={(newValue) => setEditableResult(prev => ({...prev, resumen_ejecutivo: newValue}))}
              viewClassName=" "
          />
          <div className={`mt-3 flex items-center gap-2 p-3 rounded-md text-sm font-medium ${style.bg} ${style.text} border ${style.border}`}>
              {style.icon}
              Sentimiento General: <span className="capitalize font-bold">{editableResult.sentimiento_general}</span>
          </div>
        </ResultCard>

        {/* --- CURRENT PERIOD ANALYSIS --- */}
        <ResultCard title={`Análisis del Período ${editableResult.año}`} icon={<ClipboardCheckIcon className="w-5 h-5 text-[#FF6A14]" />}>
              <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabPanel index={0} activeTab={activeTab}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                          <h4 className="font-semibold text-slate-800 mb-2">Fortalezas</h4>
                          <EditableListDisplay 
                              title="Fortaleza"
                              items={editableResult.fortalezas || []}
                              onItemChange={(index, value) => handleListChange('fortalezas', index, value)}
                              onAddItem={() => handleAddItem('fortalezas')}
                              onRemoveItem={(index) => handleRemoveItem('fortalezas', index)}
                              itemIcon={<ThumbsUpIcon className="w-4 h-4 text-slate-400" />}
                            />
                      </div>
                      <div>
                          <h4 className="font-semibold text-slate-800 mb-2">Oportunidades de Mejora</h4>
                          <EditableListDisplay 
                              title="Oportunidad"
                              items={editableResult.oportunidades_mejora || []}
                              onItemChange={(index, value) => handleListChange('oportunidades_mejora', index, value)}
                              onAddItem={() => handleAddItem('oportunidades_mejora')}
                              onRemoveItem={(index) => handleRemoveItem('oportunidades_mejora', index)}
                              itemIcon={<ArrowRightCircleIcon className="w-4 h-4 text-[#FF6A14]" />}
                          />
                      </div>
                  </div>
                  <div className="mt-6">
                      <h4 className="font-semibold text-slate-800 mb-2 text-center">Competencias Clave</h4>
                      {editableResult.competencias_evaluadas && editableResult.competencias_evaluadas.length > 0 && (
                          <CompetencyRadarChart data={editableResult.competencias_evaluadas} />
                      )}
                  </div>
              </TabPanel>
              <TabPanel index={1} activeTab={activeTab}>
                  <div className="space-y-4">
                      <div>
                          <h4 className="font-semibold text-slate-800 mb-2">Logros Destacados</h4>
                          <EditableListDisplay 
                              title="Logro"
                              items={editableResult.logros_destacados || []}
                              onItemChange={(index, value) => handleListChange('logros_destacados', index, value)}
                              onAddItem={() => handleAddItem('logros_destacados')}
                              onRemoveItem={(index) => handleRemoveItem('logros_destacados', index)}
                              itemIcon={<TrophyIcon className="w-4 h-4 text-[#6CC24A]" />}
                            />
                      </div>
                      <div className="pt-2">
                          <h4 className="font-semibold text-slate-800 mb-2">Objetivos Principales</h4>
                          <EditableListDisplay 
                              title="Objetivo"
                              items={editableResult.objetivos_principales || []}
                              onItemChange={(index, value) => handleListChange('objetivos_principales', index, value)}
                              onAddItem={() => handleAddItem('objetivos_principales')}
                              onRemoveItem={(index) => handleRemoveItem('objetivos_principales', index)}
                              itemIcon={<TargetIcon className="w-4 h-4 text-[#006EC1]" />}
                            />
                      </div>
                  </div>
              </TabPanel>
              <TabPanel index={2} activeTab={activeTab}>
                  <h4 className="font-semibold text-slate-800 mb-2">Comentarios del Manager</h4>
                  <EditableContent 
                      isTextarea
                      value={editableResult.comentarios_jefe}
                      onChange={(newValue) => setEditableResult(prev => ({...prev, comentarios_jefe: newValue}))}
                      viewClassName="italic bg-slate-50 p-3 rounded-md"
                  />
              </TabPanel>
        </ResultCard>

        {/* --- EVOLUTION ANALYSIS --- */}
        {editableResult.analisis_evolucion && (
          <ResultCard title="Análisis de Evolución" icon={<TrendingUpIcon className="w-5 h-5 text-[#00C1D4]" />}>
              <div className="space-y-4">
                  {editableResult.analisis_evolucion.puntuaciones_historicas && editableResult.analisis_evolucion.puntuaciones_historicas.length > 1 && (
                      <div>
                          <h5 className="font-semibold text-sm text-slate-700 mb-2">Tendencia de Desempeño</h5>
                          <PerformanceTrendChart data={editableResult.analisis_evolucion.puntuaciones_historicas} />
                      </div>
                  )}
                  <div>
                      <h5 className="font-semibold text-sm text-slate-700 mb-1">Trayectoria General</h5>
                      <EditableContent 
                          isTextarea
                          value={editableResult.analisis_evolucion.resumen_trayectoria}
                          onChange={(newValue) => setEditableResult(prev => ({...prev, analisis_evolucion: {...prev.analisis_evolucion!, resumen_trayectoria: newValue}}))}
                          viewClassName="italic"
                      />
                  </div>
                  <div>
                      <h5 className="font-semibold text-sm text-slate-700 mb-1">Progreso Destacado</h5>
                      <EditableListDisplay 
                          title="Progreso"
                          items={editableResult.analisis_evolucion.progreso_en_oportunidades || []}
                          onItemChange={(index, value) => handleNestedListChange('analisis_evolucion', 'progreso_en_oportunidades', index, value)}
                          onAddItem={() => handleNestedAddItem('analisis_evolucion', 'progreso_en_oportunidades')}
                          onRemoveItem={(index) => handleNestedRemoveItem('analisis_evolucion', 'progreso_en_oportunidades', index)}
                          itemIcon={<CheckSquareIcon className="w-4 h-4 text-[#6CC24A]" />}
                      />
                  </div>
                  <div>
                      <h5 className="font-semibold text-sm text-slate-700 mb-1">Fortalezas Consistentes</h5>
                      <EditableListDisplay 
                          title="Fortaleza"
                          items={editableResult.analisis_evolucion.fortalezas_consistentes || []}
                          onItemChange={(index, value) => handleNestedListChange('analisis_evolucion', 'fortalezas_consistentes', index, value)}
                          onAddItem={() => handleNestedAddItem('analisis_evolucion', 'fortalezas_consistentes')}
                          onRemoveItem={(index) => handleNestedRemoveItem('analisis_evolucion', 'fortalezas_consistentes', index)}
                          itemIcon={<ThumbsUpIcon className="w-4 h-4 text-slate-400" />}
                      />
                  </div>
                  <div>
                      <h5 className="font-semibold text-sm text-slate-700 mb-1">Desafíos Recurrentes</h5>
                      <EditableListDisplay 
                          title="Desafío"
                          items={editableResult.analisis_evolucion.desafios_recurrentes || []}
                          onItemChange={(index, value) => handleNestedListChange('analisis_evolucion', 'desafios_recurrentes', index, value)}
                          onAddItem={() => handleNestedAddItem('analisis_evolucion', 'desafios_recurrentes')}
                          onRemoveItem={(index) => handleNestedRemoveItem('analisis_evolucion', 'desafios_recurrentes', index)}
                          itemIcon={<ArrowRightCircleIcon className="w-4 h-4 text-[#FF6A14]" />}
                      />
                  </div>
              </div>
          </ResultCard>
        )}

        {/* --- NEXT STEPS --- */}
        <ResultCard title="Próximos Pasos" icon={<TargetIcon className="w-5 h-5 text-[#006EC1]" />}>
            <div className="space-y-4">
                <ResultCard title="Asistente de Objetivos SMART" icon={<SparklesIcon className="w-5 h-5 text-[#00C1D4]" />}>
                  {isGeneratingGoals && (
                      <div className="flex flex-col items-center justify-center text-center text-slate-600 p-4">
                      <SparklesIcon className="w-8 h-8 text-[#00C1D4] animate-pulse" />
                      <p className="mt-2 text-sm font-semibold">Generando objetivos con IA...</p>
                      </div>
                  )}
                  {smartGoalsError && (
                      <div className="text-center text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                          <p>{smartGoalsError}</p>
                          <button onClick={handleGenerateSmartGoals} className="text-sm font-semibold text-red-700 mt-2">Reintentar</button>
                      </div>
                  )}
                  {!isGeneratingGoals && !smartGoalsError && (!editableResult.objetivos_smart || editableResult.objetivos_smart.length === 0) && (
                      <div className="text-center p-4">
                          <p className="text-sm text-slate-600 mb-4">Transforma las oportunidades de mejora en objetivos claros y medibles para el colaborador.</p>
                          <button
                              onClick={handleGenerateSmartGoals}
                              disabled={editableResult.oportunidades_mejora.length === 0}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#00C1D4] text-white text-sm font-medium rounded-md hover:bg-[#00A3B6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C1D4] transition-transform duration-200 transform hover:scale-[1.03] disabled:bg-slate-300 disabled:cursor-not-allowed"
                              title={editableResult.oportunidades_mejora.length === 0 ? 'Se necesitan Oportunidades de Mejora para generar objetivos.' : ''}
                          >
                              <SparklesIcon className="w-4 h-4" />
                              Generar Objetivos SMART
                          </button>
                      </div>
                  )}
                  {!isGeneratingGoals && editableResult.objetivos_smart && editableResult.objetivos_smart.length > 0 && (
                      <div className="space-y-4">
                      {editableResult.objetivos_smart.map((goal, index) => (
                          <div key={index} className="group p-3 border border-slate-200 rounded-lg relative space-y-2 bg-slate-50/50">
                              <button
                                  type="button"
                                  onClick={() => handleRemoveSmartGoal(index)}
                                  className="absolute top-2 right-2 text-slate-400 hover:text-red-600 p-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label={`Remover objetivo ${index + 1}`}
                              >
                                  <MinusCircleIcon className="w-5 h-5" />
                              </button>
                              <div>
                                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Objetivo</label>
                                  <EditableContent
                                      isTextarea
                                      value={goal.objetivo}
                                      onChange={(newValue) => handleSmartGoalChange(index, 'objetivo', newValue)}
                                      viewClassName="font-medium text-slate-800"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Métrica de Éxito</label>
                                  <EditableContent
                                      isTextarea
                                      value={goal.metrica_exito}
                                      onChange={(newValue) => handleSmartGoalChange(index, 'metrica_exito', newValue)}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Plazo Sugerido</label>
                                  <EditableContent
                                      value={goal.plazo_sugerido}
                                      onChange={(newValue) => handleSmartGoalChange(index, 'plazo_sugerido', newValue)}
                                  />
                              </div>
                          </div>
                      ))}
                      <button type="button" onClick={handleAddSmartGoal} className="flex items-center gap-2 text-sm font-medium text-[#008EAA] hover:text-[#006F8A] pt-2 ml-1">
                              <PlusCircleIcon className="w-5 h-5" />
                              Añadir Objetivo
                          </button>
                      </div>
                  )}
                </ResultCard>

                <ResultCard title="Recursos para el Desarrollo" icon={<BookOpenIcon className="w-5 h-5 text-[#6366F1]" />}>
                    {isGeneratingPlan && (
                      <div className="flex flex-col items-center justify-center text-center text-slate-600 p-4">
                          <BookOpenIcon className="w-8 h-8 text-[#6366F1] animate-pulse" />
                          <p className="mt-2 text-sm font-semibold">Buscando recursos con IA...</p>
                      </div>
                    )}
                    {devPlanError && (
                        <div className="text-center text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                            <p>{devPlanError}</p>
                            <button onClick={handleGenerateDevPlan} className="text-sm font-semibold text-red-700 mt-2">Reintentar</button>
                        </div>
                    )}
                    {!isGeneratingPlan && !devPlanError && !editableResult.plan_desarrollo && (
                        <div className="text-center p-4">
                            <p className="text-sm text-slate-600 mb-4">Genera una lista de libros, cursos y otros recursos para potenciar el crecimiento del colaborador.</p>
                            <button
                                onClick={handleGenerateDevPlan}
                                disabled={editableResult.oportunidades_mejora.length === 0}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#6366F1] text-white text-sm font-medium rounded-md hover:bg-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1] transition-transform duration-200 transform hover:scale-[1.03] disabled:bg-slate-300 disabled:cursor-not-allowed"
                                title={editableResult.oportunidades_mejora.length === 0 ? 'Se necesitan Oportunidades de Mejora para generar un plan.' : ''}
                            >
                                <BookOpenIcon className="w-4 h-4" />
                                Generar Recursos
                            </button>
                        </div>
                    )}
                    {!isGeneratingPlan && editableResult.plan_desarrollo && (
                        <div className="space-y-4">
                            <EditableContent 
                              isTextarea
                              value={editableResult.plan_desarrollo.introduccion}
                              onChange={(newValue) => setEditableResult(prev => ({...prev, plan_desarrollo: {...prev.plan_desarrollo!, introduccion: newValue}}))}
                              viewClassName="italic"
                            />
                            {editableResult.plan_desarrollo.acciones.map((accion, index) => (
                                <div key={index} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                                    <h5 className="font-bold text-slate-800 mb-2">Para mejorar: <span className="font-normal italic">{accion.area_enfoque}</span></h5>
                                    <div className="space-y-3">
                                        <div>
                                            <h6 className="text-xs font-bold text-slate-600 uppercase mb-1">Recursos Recomendados</h6>
                                            <EditableListDisplay 
                                              title="Recurso"
                                              items={accion.recursos_recomendados}
                                              onItemChange={(itemIndex, value) => handleDevPlanChange(index, 'recursos_recomendados', itemIndex, value)}
                                              onAddItem={() => handleAddDevPlanItem(index, 'recursos_recomendados')}
                                              onRemoveItem={(itemIndex) => handleRemoveDevPlanItem(index, 'recursos_recomendados', itemIndex)}
                                              itemIcon={<BookOpenIcon className="w-4 h-4 text-slate-400" />}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ResultCard>

                <ResultCard title="Preguntas para la Conversación" icon={<MessageSquareQuoteIcon className="w-5 h-5 text-[#A05EB5]" />}>
                  <EditableListDisplay 
                      title="Pregunta"
                      items={editableResult.preguntas_discusion || []}
                      onItemChange={(index, value) => handleListChange('preguntas_discusion', index, value)}
                      onAddItem={() => handleAddItem('preguntas_discusion')}
                      onRemoveItem={(index) => handleRemoveItem('preguntas_discusion', index)}
                      itemIcon={<HelpCircleIcon className="w-4 h-4 text-[#A05EB5]" />}
                    />
                </ResultCard>
            </div>
        </ResultCard>
      </div>
      
      {/* Chatbot FAB */}
      <button
        onClick={() => setIsChatbotOpen(true)}
        className="group fixed bottom-8 right-8 flex items-center gap-2 bg-[#008EAA] text-white pl-4 pr-5 py-4 rounded-full shadow-lg hover:bg-[#006F8A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#008EAA] transition-all duration-300 ease-in-out animate-pulse-slow"
        aria-label="Abrir asistente de IA"
        title="Asistente de IA"
      >
        <MessageCircleQuestionIcon className="w-6 h-6 flex-shrink-0 transition-transform duration-300 group-hover:rotate-12" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-semibold">
            Asistente IA
        </span>
      </button>
    </>
  );
};