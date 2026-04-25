import React, { useState, useEffect, useContext } from 'react'; // Adăugat useContext
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
// IMPORTĂ CONTEXTUL TĂU AICI (Verifică să ai calea corectă spre fișier)
import { DataContext } from '../../DataContext'; 

const ProcessBatch: React.FC = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  
  // Tragem funcția de reîmprospătare din Context
  const context = useContext(DataContext);
  if (!context) throw new Error("ProcessBatch trebuie să fie în interiorul unui DataProvider");
  const { refreshDashboardData } = context;

  const [activities, setActivities] = useState<any[]>([]);
  const [loadingText, setLoadingText] = useState("AI-ul citește documentele...");
  const [isExtracting, setIsExtracting] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Extracția Automată la încărcarea paginii
  useEffect(() => {
    const extractData = async () => {
      try {
        setIsExtracting(true);
        setError(null);
        const response = await fetch(`http://127.0.0.1:8000/extract/${batchId}`, {
          method: 'POST',
        });
        
        if (response.ok) {
          const data = await response.json();
          setActivities(data.results || []);
        } else {
          const errData = await response.json();
          setError(errData.detail || "Eroare la extracția AI");
        }
      } catch (error) {
        setError("Eroare de rețea: Verifică dacă backend-ul rulează.");
      } finally {
        setIsExtracting(false);
      }
    };

    if (batchId) {
      extractData();
    }
  }, [batchId]);

  // 2. Funcția pentru Butonul Final (Calculul Emisiilor)
  // 2. Funcția pentru Butonul Final (Calculul Emisiilor)
  const handleCalculateEmissions = async () => {
    setIsCalculating(true);
    setLoadingText("Calculăm amprenta de carbon...");
    setError(null);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/emissions/calculate/${batchId}`, {
        method: 'POST',
      });

      // Verificăm dacă răspunsul NU este ok (ex: 404, 422, 500)
      if (!response.ok) {
        // Citim mesajul de eroare de la backend pentru a înțelege problema
        const errorData = await response.json().catch(() => null);
        console.error("Backend-ul a returnat o eroare:", response.status, errorData);
        alert(`Eroare de la server (${response.status}). Verifică consola (F12) pentru detalii.`);
        setIsCalculating(false); // Oprim ecranul de loading
        return; // Oprim execuția funcției aici
      }

      // Dacă am ajuns aici, backend-ul a zis 200 OK!
      console.log("Calculul a reușit pe backend. Aducem datele proaspete pentru Dashboard...");
      
      try {
        await refreshDashboardData();
        console.log("Datele au fost reîmprospătate cu succes! Navigăm spre Dashboard.");
        navigate('/');
      } catch (refreshError) {
        console.error("Eroare la aducerea noilor date pentru dashboard:", refreshError);
        alert("Datele au fost salvate, dar nu am putut actualiza dashboard-ul. Navigăm oricum.");
        setIsCalculating(false);
        navigate('/');
      } else {
        const errData = await response.json();
        setError(errData.detail || "Eroare la calcularea emisiilor.");
        setIsCalculating(false);
      }

    } catch (error) {
      // Aceasta prinde erori de rețea (ex: serverul Python e oprit complet sau erori CORS)
      console.error("Eroare critică (Rețea sau Server Oprit):", error);
      alert("Nu m-am putut conecta la server. Este pornit serverul pe portul 8000?");
      setIsCalculating(false);
    }
  };

  const renderScopeColumn = (scopeNum: number, title: string, borderColor: string, bgColor: string) => {
    const scopeActivities = activities.filter(a => a.activity.scope === scopeNum);

    return (
      <div className={`p-6 rounded-2xl border-2 ${borderColor} ${bgColor} shadow-sm flex flex-col h-full`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <span className="bg-white/50 px-2 py-1 rounded text-xs font-bold border border-current opacity-60">
            Scope {scopeNum}
          </span>
        </div>
        
        <div className="flex-1 space-y-3">
          {scopeActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 border border-dashed border-slate-200 rounded-xl">
              <Info size={20} className="text-slate-300 mb-2" />
              <p className="text-slate-400 text-xs italic">Nicio activitate detectată</p>
            </div>
          ) : (
            scopeActivities.map((item, idx) => {
              const isLowConfidence = item.activity.confidence < 0.8;
              return (
                <div key={idx} className={`p-3 rounded-xl border bg-white flex justify-between items-center transition-all ${isLowConfidence ? 'border-amber-200 shadow-sm' : 'border-slate-100'}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 text-sm capitalize">{item.activity.activity_type.replace('_', ' ')}</p>
                      {isLowConfidence && (
                        <div className="group relative">
                          <AlertTriangle size={14} className="text-amber-500" />
                          <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] p-2 rounded w-32 shadow-xl z-10">
                            Încredere scăzută ({(item.activity.confidence * 100).toFixed(0)}%). Verifică valoarea!
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{item.filename}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600">
                      {item.activity.quantity} <span className="text-[10px] text-slate-500 uppercase">{item.activity.unit}</span>
                    </p>
                    <p className="text-[9px] text-slate-400">Scor: {(item.activity.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Ecran de încărcare
  if (isExtracting || isCalculating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in">
        <div className="relative">
            <Loader2 size={80} className="text-emerald-500 animate-spin mb-6 opacity-20" />
            <Zap size={32} className="text-emerald-500 absolute top-6 left-6 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{loadingText}</h2>
        <p className="text-slate-500 mt-2">Sistemul CO2nvert analizează datele extrase...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Validare Date AI</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            Extracție finalizată. Verifică coerența valorilor înainte de calculul final.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 flex items-center gap-2 animate-bounce">
            <AlertTriangle size={18} />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {renderScopeColumn(1, "Emisii Directe", "border-emerald-100", "bg-emerald-50/30")}
        {renderScopeColumn(2, "Energie Achiziționată", "border-blue-100", "bg-blue-50/30")}
        {renderScopeColumn(3, "Lanț Valoric", "border-purple-100", "bg-purple-50/30")}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-100">
        <div className="flex items-center gap-3 text-slate-400 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            <Info size={18} />
            <p className="text-xs">Dând click pe confirmare, datele vor fi mapate cu factorii de emisie din 2025.</p>
        </div>

        <button 
          onClick={handleCalculateEmissions}
          disabled={activities.length === 0}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-slate-900 hover:bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl hover:shadow-emerald-200 disabled:bg-slate-200 disabled:cursor-not-allowed group"
        >
          <span>Confirmă și Calculează CO2</span>
          <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default ProcessBatch;