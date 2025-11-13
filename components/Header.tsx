import React from 'react';
import { DataAnalysisIcon, ArchiveIcon, FyoLogo } from './Icons';

interface HeaderProps {
    activeView: 'analyzer' | 'saved';
    onViewChange: (view: 'analyzer' | 'saved') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, onViewChange }) => {
    const navItemClasses = "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 transform hover:scale-[1.03]";
    const activeClasses = "bg-[#008EAA]/10 text-[#008EAA]";
    const inactiveClasses = "text-slate-500 hover:bg-slate-100 hover:text-slate-700";

  return (
    <header className="bg-white shadow-md">
      <div className="container relative mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <FyoLogo className="h-9 w-auto text-[#00C1D4]" />
        </div>

        {/* Centered Title & Tagline - hidden on small screens to prevent overlap */}
        <div className="hidden md:flex flex-col items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-xl font-bold text-slate-800 whitespace-nowrap">Fyo Metrics</h1>
            <p className="text-sm text-slate-500 italic mt-1">
              Impulsando el talento con datos
            </p>
        </div>

        <nav className="flex items-center space-x-2 border border-slate-200 rounded-lg p-1">
            <button 
                onClick={() => onViewChange('analyzer')}
                className={`${navItemClasses} ${activeView === 'analyzer' ? activeClasses : inactiveClasses}`}
                aria-current={activeView === 'analyzer' ? 'page' : undefined}
            >
                <DataAnalysisIcon className="h-5 w-5" />
                <span>Analizador</span>
            </button>
             <button 
                onClick={() => onViewChange('saved')}
                className={`${navItemClasses} ${activeView === 'saved' ? activeClasses : inactiveClasses}`}
                aria-current={activeView === 'saved' ? 'page' : undefined}
            >
                <ArchiveIcon className="h-5 w-5" />
                <span>Guardados</span>
            </button>
        </nav>
      </div>
    </header>
  );
};