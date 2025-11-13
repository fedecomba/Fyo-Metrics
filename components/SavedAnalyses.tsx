import React, { useMemo, useState } from 'react';
import type { EvaluationResult, TeamAnalysisResult } from '../types';
import { analyzeTeamPerformance } from '../services/geminiService';
import { ComparisonModal } from './ComparisonModal';
import { ArchiveIcon, Trash2Icon, UserCircleIcon, UsersIcon, GaugeCircleIcon, BarChart4Icon, SearchIcon, EyeIcon, ClockIcon } from './Icons';

interface SavedAnalysesProps {
    analyses: EvaluationResult[];
    onView: (id: string) => void;
    onDelete: (id: string) => void;
    companyLogo: string | null;
}

const DashboardCard: React.FC<{ icon: React.ReactNode; title: string; value: string | React.ReactNode; }> = ({ icon, title, value }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
        <div className="bg-slate-100 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const calculateStats = (analyses: EvaluationResult[]) => {
    if (analyses.length === 0) {
        return {
            total: 0,
            averageScore: 0,
            distribution: { high: 0, solid: 0, needsImprovement: 0 }
        };
    }
    const totalScore = analyses.reduce((sum, a) => sum + a.puntuacion_general, 0);
    const averageScore = totalScore / analyses.length;

    const distribution = analyses.reduce((dist, a) => {
        if (a.puntuacion_general >= 8.5) dist.high++;
        else if (a.puntuacion_general >= 7) dist.solid++;
        else dist.needsImprovement++;
        return dist;
    }, { high: 0, solid: 0, needsImprovement: 0 });

    return {
        total: analyses.length,
        averageScore,
        distribution
    };
};

export const SavedAnalyses: React.FC<SavedAnalysesProps> = ({ analyses, onView, onDelete, companyLogo }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArea, setSelectedArea] = useState('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [comparisonResult, setComparisonResult] = useState<TeamAnalysisResult | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonError, setComparisonError] = useState<string | null>(null);

    const uniqueAreas = useMemo(() => {
        const areas = new Set(analyses.map(a => a.area || 'Sin Área'));
        return ['all', ...Array.from(areas).sort()];
    }, [analyses]);

    const filteredAnalyses = useMemo(() => {
        return analyses.filter(analysis => {
            const matchesSearch = analysis.colaborador.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesArea = selectedArea === 'all' || analysis.area === selectedArea;
            return matchesSearch && matchesArea;
        });
    }, [analyses, searchTerm, selectedArea]);

    const stats = useMemo(() => calculateStats(filteredAnalyses), [filteredAnalyses]);

    const groupedAnalyses = useMemo(() => {
        return filteredAnalyses.reduce((acc, analysis) => {
            const area = analysis.area || 'Sin Área';
            if (!acc[area]) {
                acc[area] = [];
            }
            acc[area].push(analysis);
            return acc;
        }, {} as Record<string, EvaluationResult[]>);
    }, [filteredAnalyses]);

    const handleSelect = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const handleCompare = async () => {
        const analysesToCompare = analyses.filter(a => selectedIds.has(a.id!));
        if (analysesToCompare.length < 2) return;

        setIsModalOpen(true);
        setIsComparing(true);
        setComparisonError(null);
        setComparisonResult(null);

        try {
            const result = await analyzeTeamPerformance(analysesToCompare);
            setComparisonResult(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
            setComparisonError(errorMessage);
        } finally {
            setIsComparing(false);
        }
    };


    if (analyses.length === 0) {
        return (
            <div className="text-center text-slate-500 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                <ArchiveIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="font-semibold text-xl text-slate-700">No hay análisis guardados</h3>
                <p className="mt-2">Cuando guardes un análisis, aparecerá aquí.</p>
            </div>
        );
    }

    const canCompare = selectedIds.size >= 2;

    return (
        <div className="space-y-8 animate-fade-in">
            <ComparisonModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                isLoading={isComparing}
                error={comparisonError}
                data={comparisonResult}
                companyLogo={companyLogo}
            />
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DashboardCard 
                    icon={<UsersIcon className="w-6 h-6 text-[#008EAA]" />}
                    title="Total de Evaluaciones"
                    value={stats.total.toString()}
                />
                <DashboardCard 
                    icon={<GaugeCircleIcon className="w-6 h-6 text-[#6CC24A]" />}
                    title="Puntuación Promedio"
                    value={stats.averageScore.toFixed(2)}
                />
                <DashboardCard 
                    icon={<BarChart4Icon className="w-6 h-6 text-[#006EC1]" />}
                    title="Distribución Desempeño"
                    value={
                        <div className="text-xs flex items-center space-x-2 font-sans">
                           <span title="Alto Rendimiento (>= 8.5)" className="font-bold text-[#6CC24A]">{stats.distribution.high}</span>
                           <span className="text-slate-300">/</span>
                           <span title="Sólido (7-8.4)" className="font-bold text-[#FF6A14]">{stats.distribution.solid}</span>
                           <span className="text-slate-300">/</span>
                           <span title="A Mejorar (< 7)" className="font-bold text-[#E10600]">{stats.distribution.needsImprovement}</span>
                        </div>
                    }
                />
            </div>
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full sm:w-auto">
                     <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                     <input 
                        type="text"
                        placeholder="Buscar por colaborador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008EAA]"
                     />
                </div>
                <div className="flex-shrink-0 w-full sm:w-auto">
                    <select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                         className="w-full h-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008EAA] bg-white"
                    >
                       {uniqueAreas.map(area => (
                           <option key={area} value={area}>{area === 'all' ? 'Todas las Áreas' : area}</option>
                       ))}
                    </select>
                </div>
                 <button
                    onClick={handleCompare}
                    disabled={!canCompare}
                    title={!canCompare ? "Selecciona al menos 2 análisis para comparar" : "Generar análisis comparativo del equipo"}
                    className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-[#00C1D4] text-white text-sm font-medium rounded-md hover:bg-[#00A3B6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C1D4] transition-all duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                    <UsersIcon className="w-5 h-5" />
                    Comparar ({selectedIds.size})
                </button>
            </div>

            {filteredAnalyses.length === 0 && (
                 <div className="text-center text-slate-500 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                    <SearchIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                    <h3 className="font-semibold text-xl text-slate-700">Sin resultados</h3>
                    <p className="mt-2">No se encontraron análisis que coincidan con tu búsqueda o filtro.</p>
                </div>
            )}

            {Object.keys(groupedAnalyses).length > 0 && Object.keys(groupedAnalyses).map(area => {
                const areaAnalyses = groupedAnalyses[area];
                return (
                <div key={area}>
                    <h2 className="text-xl font-bold text-slate-800 mb-3">{area}</h2>
                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200">
                        <ul className="divide-y divide-slate-200">
                            {[...areaAnalyses].sort((a,b) => new Date(b.savedAt!).getTime() - new Date(a.savedAt!).getTime()).map(analysis => (
                                <li key={analysis.id} className="py-4 flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(analysis.id!)}
                                            onChange={() => handleSelect(analysis.id!)}
                                            className="h-5 w-5 rounded border-slate-300 text-[#008EAA] focus:ring-[#008EAA] cursor-pointer"
                                            aria-label={`Seleccionar análisis de ${analysis.colaborador}`}
                                        />
                                        <UserCircleIcon className="w-10 h-10 text-[#008EAA] flex-shrink-0"/>
                                        <div>
                                            <p className="font-semibold text-slate-900">{analysis.colaborador}</p>
                                            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                                                <span className="flex items-center gap-1.5"><ClockIcon className="w-4 h-4"/> {new Date(analysis.savedAt!).toLocaleDateString()}</span>
                                                <span className="hidden sm:inline">|</span>
                                                <span>Período: {analysis.año}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button 
                                            onClick={() => onView(analysis.id!)}
                                            className="px-3 py-1.5 text-sm font-medium text-[#008EAA] bg-[#008EAA]/10 rounded-md hover:bg-[#008EAA]/20 flex items-center gap-1.5"
                                        >
                                            <EyeIcon className="w-4 h-4"/>
                                            Ver
                                        </button>
                                        <button 
                                            onClick={() => onDelete(analysis.id!)}
                                            className="p-2 text-slate-500 hover:bg-red-100 hover:text-red-700 rounded-md"
                                            aria-label={`Eliminar análisis de ${analysis.colaborador}`}
                                        >
                                            <Trash2Icon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )})}
        </div>
    );
};