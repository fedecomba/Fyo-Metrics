import React, { useState, useEffect } from 'react';
import type { UserData } from '../types';
import { UploadIcon, XIcon, UserIcon, BuildingIcon, BriefcaseIcon, CalendarIcon, StarIcon } from './Icons';

export interface EvaluationPeriod {
    year: string;
    files: File[];
}

interface UserInputFormProps {
  onAnalyze: (userData: UserData, periods: EvaluationPeriod[]) => void;
  isLoading: boolean;
}

export const UserInputForm: React.FC<UserInputFormProps> = ({ onAnalyze, isLoading }) => {
  const [userData, setUserData] = useState<UserData>({ name: '', area: '', position: '', seniority: '' });
  const [evaluationPeriods, setEvaluationPeriods] = useState<EvaluationPeriod[]>([{ year: '', files: [] }]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(!!document.fullscreenElement);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };
  
  const addPeriod = () => {
    setEvaluationPeriods(prev => [...prev, { year: '', files: [] }]);
  };

  const removePeriod = (index: number) => {
    setEvaluationPeriods(prev => prev.filter((_, i) => i !== index));
  };
  
  const handlePeriodYearChange = (index: number, year: string) => {
      setEvaluationPeriods(prev => prev.map((p, i) => i === index ? { ...p, year } : p));
  };
  
  const processAndAddFiles = (index: number, newFiles: File[]) => {
      const pdfFiles = newFiles.filter(file => file.type === 'application/pdf');

      if (pdfFiles.length !== newFiles.length) {
        alert("Algunos archivos no eran PDF y han sido ignorados.");
      }
      
      if(pdfFiles.length === 0) return;
      
      setEvaluationPeriods(prev => prev.map((period, i) => {
          if (i === index) {
              const existingFileNames = new Set(period.files.map(f => f.name));
              const uniqueNewFiles = pdfFiles.filter(f => !existingFileNames.has(f.name));
              return { ...period, files: [...period.files, ...uniqueNewFiles] };
          }
          return period;
      }));
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processAndAddFiles(index, Array.from(e.target.files));
      e.target.value = ''; // Reset input
    }
  };

  const removeFile = (periodIndex: number, fileName: string) => {
    setEvaluationPeriods(prev => prev.map((period, i) => {
        if (i === periodIndex) {
            return { ...period, files: period.files.filter(f => f.name !== fileName) };
        }
        return period;
    }));
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>, index: number) => {
    e.preventDefault();
    setDraggingIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDraggingIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>, index: number) => {
    e.preventDefault();
    setDraggingIndex(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processAndAddFiles(index, Array.from(e.dataTransfer.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validPeriods = evaluationPeriods.filter(p => p.year.trim() !== '' && p.files.length > 0);
    if (validPeriods.length > 0) {
      onAnalyze(userData, validPeriods);
    } else {
      alert("Por favor, complete al menos un período de evaluación con su año y al menos un archivo PDF.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">1. Información del Colaborador</h2>
        <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nombre y Apellido</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" name="name" id="name" value={userData.name} onChange={handleInputChange} placeholder="Ej: Federico Comba" required className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008EAA]" />
              </div>
            </div>
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-slate-700 mb-1">Área</label>
               <div className="relative">
                <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" name="area" id="area" value={userData.area} onChange={handleInputChange} placeholder="Ej: Office Management" required className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008EAA]" />
              </div>
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-slate-700 mb-1">Puesto</label>
              <div className="relative">
                <BriefcaseIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" name="position" id="position" value={userData.position} onChange={handleInputChange} placeholder="Ej: Corporate Office Manager" required className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008EAA]" />
              </div>
            </div>
            <div>
              <label htmlFor="seniority" className="block text-sm font-medium text-slate-700 mb-1">Seniority</label>
              <div className="relative">
                <StarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select name="seniority" id="seniority" value={userData.seniority} onChange={handleInputChange} required className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008EAA] bg-white appearance-none">
                    <option value="" disabled>Seleccionar Seniority...</option>
                    <option value="Analista">Analista</option>
                    <option value="Especialista">Especialista</option>
                    <option value="Líder">Líder</option>
                    <option value="Gerente">Gerente</option>
                </select>
              </div>
            </div>
        </div>
      </div>
      
      <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">2. Períodos de Evaluación</h2>
          {evaluationPeriods.map((period, index) => (
              <div key={index} className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
                  {evaluationPeriods.length > 1 && (
                      <button type="button" onClick={() => removePeriod(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-600" aria-label="Eliminar período">
                          <XIcon className="w-5 h-5" />
                      </button>
                  )}
                  <div>
                      <label htmlFor={`year-${index}`} className="block text-sm font-medium text-slate-700 mb-1">Año o Período</label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="text" id={`year-${index}`} value={period.year} onChange={(e) => handlePeriodYearChange(index, e.target.value)} placeholder="Ej: 2023-2024" required className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008EAA]" />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Documentos (PDF)</label>
                      <label 
                        htmlFor={`file-upload-${index}`} 
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`relative ${isFullScreen ? 'cursor-default' : 'cursor-pointer'} bg-white rounded-md border-2 border-dashed p-6 text-center flex flex-col justify-center items-center transition-colors ${draggingIndex === index ? 'border-[#008EAA] bg-[#008EAA]/10' : 'border-slate-300 hover:border-[#008EAA]'}`}
                      >
                          <UploadIcon className="w-8 h-8 text-slate-400"/>
                          <span className="mt-2 block text-sm text-slate-600">
                             {isFullScreen ? (
                                <span className="font-semibold text-[#008EAA]">Modo Pantalla Completa: Arrastra tus archivos aquí</span>
                              ) : (
                                'Arrastra y suelta o haz clic para agregar'
                              )}
                          </span>
                          <input id={`file-upload-${index}`} type="file" className="sr-only" onChange={(e) => handleFileChange(index, e)} accept=".pdf" multiple disabled={isFullScreen} />
                      </label>
                      {period.files.length > 0 && (
                          <ul className="mt-3 divide-y divide-slate-200 border border-slate-200 rounded-md">
                              {period.files.map(file => (
                                  <li key={file.name} className="px-3 py-2 flex items-center justify-between text-sm hover:bg-white">
                                      <span className="text-slate-700 truncate pr-2">{file.name}</span>
                                      <button type="button" onClick={() => removeFile(index, file.name)} className="text-slate-400 hover:text-red-600 p-1 rounded-full flex-shrink-0" aria-label={`Remover ${file.name}`}>
                                          <XIcon className="w-4 h-4" />
                                      </button>
                                  </li>
                              ))}
                          </ul>
                      )}
                  </div>
              </div>
          ))}
          <button type="button" onClick={addPeriod} className="w-full text-sm font-medium text-[#008EAA] hover:text-[#006F8A] py-2 px-4 border border-dashed border-slate-300 rounded-md">
              + Añadir Período de Evaluación
          </button>
      </div>

      <div>
        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#008EAA] hover:bg-[#006F8A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#008EAA] disabled:bg-[#008EAA]/60 disabled:cursor-not-allowed transition-transform duration-200 transform hover:scale-[1.03]">
          {isLoading ? 'Analizando...' : 'Analizar Documentos'}
        </button>
      </div>
    </form>
  );
};