import React, { useState, useCallback, useEffect } from 'react';
import { UserInputForm, EvaluationPeriod } from './components/UserInputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { SavedAnalyses } from './components/SavedAnalyses';
import { ResultsSkeleton } from './components/ResultsSkeleton';
import { Header } from './components/Header';
import { extractTextFromPdf } from './services/pdfService';
import { analyzePerformanceReview } from './services/geminiService';
import { generateAnalysisPdf } from './services/pdfGeneratorService';
import type { EvaluationResult, UserData } from './types';
import { DocumentIcon } from './components/Icons';

type View = 'analyzer' | 'saved';

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<EvaluationResult | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<EvaluationResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('analyzer');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedAnalyses = localStorage.getItem('savedAnalyses');
      if (storedAnalyses) {
        setSavedAnalyses(JSON.parse(storedAnalyses));
      }
    } catch (e) {
      console.error("Failed to load saved analyses from localStorage", e);
    }
  }, []);

  const handleAnalyze = useCallback(async (userData: UserData, periods: EvaluationPeriod[]) => {
    if (!userData.name || !userData.area || !userData.position || periods.length === 0) {
      setError("Por favor, complete todos los campos y agregue al menos un período de evaluación.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      let combinedTextWithMarkers = '';
      for (const period of periods) {
        const pdfTextPromises = period.files.map(file => extractTextFromPdf(file));
        const pdfTexts = await Promise.all(pdfTextPromises);
        const combinedPeriodText = pdfTexts.join('\n\n---\n\n');
        combinedTextWithMarkers += `--- INICIO PERÍODO: ${period.year} ---\n\n${combinedPeriodText}\n\n--- FIN PERÍODO: ${period.year} ---\n\n`;
      }

      if (!combinedTextWithMarkers.trim()) {
        throw new Error("No se pudo extraer texto de los PDFs. Los archivos podrían estar vacíos o corruptos.");
      }

      const result = await analyzePerformanceReview(combinedTextWithMarkers, userData);
      
      // Add raw text to the result object for the chatbot context
      const resultWithContext: EvaluationResult = { ...result, raw_text: combinedTextWithMarkers };
      
      setAnalysisResult(resultWithContext);
    } catch (err) {
      console.error(err);
      if (err instanceof Error && (err.message.includes('503') || err.message.toLowerCase().includes('overloaded'))) {
          setError("El servicio de IA está experimentando una alta demanda en este momento. Por favor, inténtalo de nuevo en unos minutos.");
      } else {
          const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido durante el análisis.";
          setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveAnalysis = (resultToSave: EvaluationResult) => {
    if (!resultToSave) return;

    let updatedAnalyses;
    let analysisToStore;

    if (resultToSave.id) { // It's an existing analysis being updated
        analysisToStore = { ...resultToSave, savedAt: new Date().toISOString() };
        updatedAnalyses = savedAnalyses.map(a => a.id === resultToSave.id ? analysisToStore : a);
    } else { // It's a new analysis
        analysisToStore = {
            ...resultToSave,
            id: `analysis-${Date.now()}`,
            savedAt: new Date().toISOString(),
        };
        updatedAnalyses = [...savedAnalyses, analysisToStore];
    }
    
    setSavedAnalyses(updatedAnalyses);
    setAnalysisResult(analysisToStore); // Update current result to reflect its saved/updated state

    try {
      localStorage.setItem('savedAnalyses', JSON.stringify(updatedAnalyses));
    } catch (e) {
      console.error("Failed to save analysis to localStorage", e);
      setError("No se pudo guardar el análisis. El almacenamiento podría estar lleno.");
    }
  };

  const handleDeleteAnalysis = (id: string) => {
    const updatedAnalyses = savedAnalyses.filter(a => a.id !== id);
    setSavedAnalyses(updatedAnalyses);
    try {
      localStorage.setItem('savedAnalyses', JSON.stringify(updatedAnalyses));
    } catch (e) {
      console.error("Failed to update localStorage after deletion", e);
    }
  };

  const handleViewAnalysis = (id: string) => {
    const analysisToView = savedAnalyses.find(a => a.id === id);
    if (analysisToView) {
      setAnalysisResult(analysisToView);
      setView('analyzer');
    }
  };
  
  const handleDownloadPdf = (resultToDownload: EvaluationResult) => {
      if (resultToDownload) {
          generateAnalysisPdf(resultToDownload, companyLogo);
      }
  };

  const handleLogoUpload = useCallback((logoDataUrl: string | null) => {
    setCompanyLogo(logoDataUrl);
  }, []);

  const renderAnalyzerView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
        <UserInputForm onAnalyze={handleAnalyze} isLoading={isLoading} />
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 min-h-[400px] flex flex-col justify-center">
        {isLoading && <ResultsSkeleton />}
        
        {error && (
          <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Error en el Análisis</h3>
            <p>{error}</p>
          </div>
        )}
        
        {!isLoading && !error && !analysisResult && (
           <div className="text-center text-slate-500">
              <DocumentIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="font-semibold text-xl text-slate-700">Resultados del Análisis</h3>
              <p className="mt-2">Los resultados del análisis del documento se mostrarán aquí.</p>
           </div>
        )}

        {analysisResult && <ResultsDisplay result={analysisResult} onSave={handleSaveAnalysis} onDownloadPdf={handleDownloadPdf} companyLogo={companyLogo} onLogoUpload={handleLogoUpload} />}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Header activeView={view} onViewChange={setView} />
      <main className="container mx-auto p-4 md:p-8">
        {view === 'analyzer' ? renderAnalyzerView() : <SavedAnalyses analyses={savedAnalyses} onView={handleViewAnalysis} onDelete={handleDeleteAnalysis} companyLogo={companyLogo} />}
      </main>
      <footer className="text-center p-4 text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Performance Review Analyzer. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;