import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ProcessBatch: React.FC = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingText, setLoadingText] = useState("AI-ul citește documentele...");
  const [isExtracting, setIsExtracting] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  // 1. Imediat cum intrăm pe pagină, pornim Extracția Automată
  useEffect(() => {
    const extractData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/extract/${batchId}`, {
          method: 'POST',
        });
        
        if (response.ok) {
          const data = await response.json();
          setActivities(data.results || []);
        } else {
          console.error("Eroare la extracția AI");
        }
      } catch (error) {
        console.error("Eroare de rețea:", error);
      } finally {
        setIsExtracting(false);
      }
    };

    if (batchId) {
      extractData();
    }
  }, [batchId]);

  // 2. Funcția pentru Butonul Final (Calculul Emisiilor)
  const handleCalculateEmissions = async () => {
    setIsCalculating(true);
    setLoadingText("Calculăm amprenta de carbon...");
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/emissions/calculate/${batchId}`, {
        method: 'POST',
      });

      if (response.ok) {
        // Dacă calculul a reușit, ne întoarcem la Dashboard să vedem graficul!
        navigate('/');
      }
    } catch (error) {
      console.error("Eroare la calcul:", error);
      setIsCalculating(false);
    }
  };

  // Funcție utilă pentru a afișa coloanele
  const renderScopeColumn = (scopeNum: number, title: string, color: string) => {
    // Filtrăm activitățile pentru scope-ul curent
    const scopeActivities = activities.filter(a => a.activity.scope === scopeNum);

    return (
      <div className={`p-6 rounded-2xl border-2 ${color} bg-white shadow-sm flex flex-col h-full`}>
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        
        <div className="flex-1 space-y-3">
          {scopeActivities.length === 0 ? (
            <p className="text-slate-400 text-sm italic">Nu s-au detectat date.</p>
          ) : (
            scopeActivities.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-700 text-sm capitalize">{item.activity.activity_type}</p>
                  <p className="text-xs text-slate-500">{item.filename}</p>
                </div>
                <div className="text-right font-bold text-emerald-600">
                  {item.activity.quantity} {item.activity.unit}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Ecranul de încărcare (Cât timp gândește AI-ul)
  if (isExtracting || isCalculating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={64} className="text-emerald-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-slate-800 animate-pulse">{loadingText}</h2>
        <p className="text-slate-500 mt-2">Acest proces poate dura câteva secunde.</p>
      </div>
    );
  }

  // Ecranul principal de Validare
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Validare Date AI</h1>
          <p className="text-slate-500 mt-2">Verifică cantitățile extrase din documentele tale înainte de a calcula emisiile.</p>
        </div>
      </div>

      {/* Cele 3 coloane pentru Scope 1, 2, 3 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {renderScopeColumn(1, "Scope 1 (Emisii Directe)", "border-emerald-100")}
        {renderScopeColumn(2, "Scope 2 (Energie)", "border-blue-100")}
        {renderScopeColumn(3, "Scope 3 (Lanț Valoric)", "border-purple-100")}
      </div>

      {/* Butonul Final care trimite totul in DB pentru Dashboard */}
      <div className="flex justify-end pt-6 border-t border-slate-200">
        <button 
          onClick={handleCalculateEmissions}
          disabled={activities.length === 0}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          <CheckCircle size={24} />
          {activities.length === 0 ? 'Nicio dată detectată' : 'Confirmă și Calculează CO2'}
        </button>
      </div>
    </div>
  );
};

export default ProcessBatch;