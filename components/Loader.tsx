
import React from 'react';
import { DataAnalysisIcon } from './Icons';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-slate-600 p-8">
      <DataAnalysisIcon className="w-12 h-12 text-[#008EAA] animate-pulse" />
      <p className="mt-4 text-lg font-semibold">Analizando documento...</p>
      <p className="text-sm text-slate-500">Extrayendo información clave con IA. Esto puede tardar unos segundos.</p>
    </div>
  );
};