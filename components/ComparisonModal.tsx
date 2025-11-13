import React, { useEffect } from 'react';
import type { TeamAnalysisResult } from '../types';
import { generateTeamAnalysisPdf } from '../services/pdfGeneratorService';
import { XIcon, UsersIcon, ClipboardPasteIcon, TrophyIcon, LightBulbIcon, TargetIcon, SparklesIcon, DownloadIcon } from './Icons';

interface ComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
    data: TeamAnalysisResult | null;
    companyLogo: string | null;
}

const ResultCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ title, icon, children }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center mb-3">
        {icon}
        <h4 className="font-semibold text-slate-800 ml-2">{title}</h4>
      </div>
      <div className="text-slate-600 text-sm space-y-2">{children}</div>
    </div>
);


export const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, isLoading, error, data, companyLogo }) => {

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);


    if (!isOpen) return null;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center text-slate-600 p-8 min-h-[300px]">
                    <UsersIcon className="w-12 h-12 text-[#00C1D4] animate-pulse" />
                    <p className="mt-4 text-lg font-semibold">Analizando equipo...</p>
                    <p className="text-sm text-slate-500">Identificando patrones y tendencias grupales con IA.</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg min-h-[300px] flex flex-col justify-center">
                    <h3 className="font-bold text-lg mb-2">Error en el Análisis Comparativo</h3>
                    <p>{error}</p>
                </div>
            );
        }

        if (data) {
            return (
                 <div className="space-y-4">
                    <ResultCard title="Resumen del Equipo" icon={<ClipboardPasteIcon className="w-5 h-5 text-[#008EAA]" />}>
                        <p className="italic">{data.resumen_equipo}</p>
                    </ResultCard>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ResultCard title="Fortalezas Comunes" icon={<TrophyIcon className="w-5 h-5 text-[#6CC24A]" />}>
                            <ul className="list-disc list-inside space-y-1">
                                {data.fortalezas_comunes.map((item, index) => <li key={index}>{item}</li>)}
                            </ul>
                        </ResultCard>
                        <ResultCard title="Oportunidades Grupales" icon={<LightBulbIcon className="w-5 h-5 text-[#FF6A14]" />}>
                             <ul className="list-disc list-inside space-y-1">
                                {data.oportunidades_grupales.map((item, index) => <li key={index}>{item}</li>)}
                            </ul>
                        </ResultCard>
                    </div>
                    <ResultCard title="Iniciativa de Desarrollo Sugerida" icon={<TargetIcon className="w-5 h-5 text-[#006EC1]" />}>
                        <div className="flex items-start gap-3">
                            <SparklesIcon className="w-5 h-5 text-[#00C1D4] flex-shrink-0 mt-0.5" />
                            <p className="font-medium">{data.iniciativa_sugerida}</p>
                        </div>
                    </ResultCard>
                </div>
            );
        }

        return null;
    };


    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#00C1D4]/10 p-2 rounded-full">
                           <UsersIcon className="w-6 h-6 text-[#00C1D4]" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Análisis Comparativo de Equipo</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:bg-slate-200 rounded-full"
                        aria-label="Cerrar modal"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                   {renderContent()}
                </div>
                 <div className="p-4 border-t border-slate-200 flex-shrink-0 flex justify-end gap-3">
                    <button
                        onClick={() => { if(data) generateTeamAnalysisPdf(data, companyLogo) }}
                        disabled={!data || isLoading}
                        className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 text-sm font-medium rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#008EAA] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Descargar PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[#97999B] text-white text-sm font-medium rounded-md hover:bg-[#7f8183] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#97999B]"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};