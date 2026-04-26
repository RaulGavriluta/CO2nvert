import React, { useState, useContext, useEffect } from 'react';
import { FilePlus, Loader2, FileCheck, AlertCircle } from 'lucide-react';
import { DataContext } from '../../DataContext';

const ReportPreview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  
  // Obține batch_id curent din context
  const context = useContext(DataContext);
  const currentBatchId = context?.currentBatchId;

  // Load available batches when component mounts
  useEffect(() => {
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const response = await fetch('http://127.0.0.1:8000/batches/', {
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setBatches(data);
          // If there's a current batch, use it; otherwise use the first one
          if (currentBatchId) {
            setSelectedBatchId(currentBatchId);
          } else if (data.length > 0) {
            setSelectedBatchId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Eroare la încărcarea batch-urilor:", err);
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatches();
  }, [currentBatchId]);

  const handleGenerate = async () => {
    if (!selectedBatchId) {
      setError("Nu există date disponibile pentru generare. Încarcă documente mai întâi.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/reports/generate/${selectedBatchId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json(); 
        throw new Error(errorData.detail || 'Serverul a întâmpinat o problemă la generare.');
      }

      const data = await response.json();
      
      if (data.download_url) {
        window.open(`http://localhost:8000${data.download_url}`, '_blank');
      }
    } catch (err: any) {
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
          Generează raportul de sustenabilitate din datele procesate.
        </p>
      </div>

      {/* Batch Selection */}
      <div className="w-full max-w-md">
        {loadingBatches ? (
          <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <Loader2 className="animate-spin text-slate-400" size={16} />
            <span className="text-sm text-slate-600">Se încarcă datele...</span>
          </div>
        ) : batches.length > 0 ? (
          <select
            value={selectedBatchId || ''}
            onChange={(e) => setSelectedBatchId(parseInt(e.target.value, 10))}
            className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">Selectează un batch...</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                Batch #{batch.id} - {batch.company_name} ({batch.documents?.length || 0} documente)
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-medium">Nu sunt disponibile date. Încarcă documente mai întâi.</span>
          </div>
        )}
      </div>

      {/* Butonul de acțiune principal */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={loading || !selectedBatchId || loadingBatches}
          className={`
            group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-xl transition-all shadow-lg
            ${(loading || !selectedBatchId || loadingBatches)
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

        {/* Mesaj de eroare */}
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