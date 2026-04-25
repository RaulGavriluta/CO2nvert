import React, { useState } from 'react';
import { FilePlus, Loader2, FileCheck, AlertCircle } from 'lucide-react';

const ReportPreview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Folosim batch_id = 1 ca test
      const batchId = 1; 
      const response = await fetch(`http://localhost:8000/reports/generate/${batchId}`, {
        method: 'POST',
      });

      // Dacă răspunsul NU este ok (ex: primim acel 400 Bad Request)
      if (!response.ok) {
        // Citim JSON-ul de eroare trimis de FastAPI
        const errorData = await response.json(); 
        // Aruncăm eroarea cu mesajul exact din backend (sau un fallback)
        throw new Error(errorData.detail || 'Serverul a întâmpinat o problemă la generare.');
      }

      const data = await response.json();
      
      // Dacă backend-ul returnează URL-ul, deschidem PDF-ul
      if (data.download_url) {
        window.open(`http://localhost:8000${data.download_url}`, '_blank');
      }
    } catch (err: any) {
      // Afișăm eroarea pe ecran
      setError(err.message || 'Nu s-a putut genera raportul. Verifică dacă backend-ul rulează.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in duration-700">
      {/* Iconiță decorativă */}
      <div className="bg-emerald-50 p-6 rounded-full border border-emerald-100 shadow-sm">
        <FileCheck className="text-emerald-500" size={48} />
      </div>

      {/* Text descriptiv */}
      <div className="text-center max-w-md space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Raport Anual CO2</h1>
        <p className="text-slate-500 text-lg">
          Ești gata să generezi raportul de sustenabilitate bazat pe datele procesate?
        </p>
      </div>

      {/* Butonul de acțiune principal */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`
            group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-xl transition-all shadow-lg
            ${loading 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105 active:scale-95 shadow-emerald-200'}
          `}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              <span>Se procesează...</span>
            </>
          ) : (
            <>
              <FilePlus size={24} />
              <span>Generează Raport</span>
            </>
          )}
        </button>

        {/* Mesaj de eroare exact din backend */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200 animate-in slide-in-from-bottom-2 max-w-lg text-center">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>

      <p className="text-slate-400 text-sm">
        Raportul va include Scope 1, 2 și 3 conform standardelor GHG Protocol.
      </p>
    </div>
  );
};

export default ReportPreview;