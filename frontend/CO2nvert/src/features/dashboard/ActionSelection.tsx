import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, History, ArrowRight, Loader2, 
  X, Factory, Zap, Truck, FileUp, ArrowLeft, Calendar, Calculator, CheckCircle2 
} from 'lucide-react';
import { DataContext } from '../../DataContext';
import HistoryTable from './HistoryTable';

const ActionSelection: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);
  const setActiveBatch = context?.setActiveBatch;
  
  // Stări pentru UI
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // Pasul curent în modalul de introducere date (selectie sau formular manual)
  const [modalStep, setModalStep] = useState<'selection' | 'scope2_manual'>('selection');
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Stări pentru Datele de Istoric
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Stări pentru Formularul Manual Scope 2
  const [manualData, setManualData] = useState({
    activity_type: 'electricity',
    quantity: '',
    start_date: '',
    end_date: '',
    file: null as File | null
  });

  // Calcul instantaneu (estimativ)
  const estimatedCo2 = manualData.quantity 
    ? (parseFloat(manualData.quantity) * 0.233).toFixed(2) 
    : "0.00";

  const handleOpenHistory = async () => {
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/dashboard/emissions/history');
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      }
    } catch (error) {
      console.error("Eroare rețea istoric:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    try {
      const response = await fetch('http://127.0.0.1:8000/upload/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Set the active batch in context
        if (setActiveBatch) {
          setActiveBatch(data.batch_id);
        }
        setIsModalOpen(false);
        navigate(`/process-batch/${data.batch_id}`);
      }
    } catch (error) {
      console.error("Eroare rețea upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingManual(true);
    
    // Simulare trimitere date manuale
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setModalStep('selection');
        setShowSuccess(false);
        setManualData({ activity_type: 'electricity', quantity: '', start_date: '', end_date: '', file: null });
      }, 2000);
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <div className="space-y-10 p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Panou de Control</h1>
        <p className="text-slate-500 text-lg font-medium">Gestionează datele de mediu și fluxurile de lucru AI.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <button onClick={() => setIsModalOpen(true)} className="group bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-2xl hover:-translate-y-2 transition-all text-left">
          <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-600">
            <PlusCircle size={36} />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-slate-800">Introducere Date Noi</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">Încarcă facturi pentru procesare automată OCR sau introdu manual emisiile pe categorii.</p>
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <span>Deschide meniul</span>
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

        <button onClick={handleOpenHistory} className="group bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-2xl hover:-translate-y-2 transition-all text-left">
          <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-600">
            <History size={36} />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-slate-800">Arhivă & Istoric</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">Consultă lista completă a documentelor procesate anterior și valorile extrase de AI.</p>
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <span>Vezi istoricul</span>
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </div>
        </button>
      </div>

      {/* MODAL PENTRU UPLOAD / INTRODUCERE MANUALĂ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden transition-all duration-500">
            
            {/* Buton Închidere */}
            <button onClick={() => { setIsModalOpen(false); setModalStep('selection'); }} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 z-10 transition-colors p-2 hover:bg-slate-100 rounded-full">
              <X size={28} />
            </button>

            {showSuccess ? (
              <div className="py-12 flex flex-col items-center text-center animate-in zoom-in">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-800">Date Salvate!</h2>
                <p className="text-slate-500 mt-2 font-medium">Consumul a fost înregistrat cu succes.</p>
              </div>
            ) : modalStep === 'selection' ? (
              <div className="animate-in slide-in-from-left">
                <h2 className="text-3xl font-bold mb-2 text-slate-800">Sursă Date</h2>
                <p className="text-slate-500 mb-10 font-medium">Alege modalitatea de introducere a consumului.</p>

                <div className="grid grid-cols-3 gap-6 mb-10">
                  <button className="flex flex-col items-center p-6 rounded-3xl border-2 border-slate-50 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50 transition-all group opacity-50 cursor-not-allowed">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3 text-emerald-600"><Factory size={28} /></div>
                    <span className="font-bold text-slate-800 text-sm">Scope 1</span>
                  </button>
                  
                  <button onClick={() => setModalStep('scope2_manual')} className="flex flex-col items-center p-6 rounded-3xl border-2 border-slate-50 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-all group shadow-sm">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3 text-blue-600 group-hover:scale-110 transition-transform"><Zap size={28} /></div>
                    <span className="font-bold text-slate-800 text-sm">Scope 2</span>
                  </button>

                  <button className="flex flex-col items-center p-6 rounded-3xl border-2 border-slate-50 bg-slate-50 hover:border-purple-400 hover:bg-purple-50 transition-all group opacity-50 cursor-not-allowed">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3 text-purple-600"><Truck size={28} /></div>
                    <span className="font-bold text-slate-800 text-sm">Scope 3</span>
                  </button>
                </div>

                <div className="relative flex items-center gap-4 mb-10">
                  <hr className="flex-1 border-slate-100" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Sau Procesare Automată</span>
                  <hr className="flex-1 border-slate-100" />
                </div>

                <label className={`flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all ${isUploading ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30'}`}>
                  <input type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" disabled={isUploading} />
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 size={48} className="text-emerald-600 animate-spin mb-4" />
                      <span className="text-xl font-bold text-emerald-800 tracking-tight">AI-ul analizează facturile...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-6"><FileUp size={32} /></div>
                      <span className="font-bold text-slate-800 text-xl">Încarcă Facturi Digitale</span>
                      <p className="text-sm text-slate-400 mt-2 font-medium">Extragere automată OCR.</p>
                    </div>
                  )}
                </label>
              </div>
            ) : (
              /* FORMULAR MANUAL SCOPE 2 */
              <div className="animate-in slide-in-from-right">
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setModalStep('selection')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                    <ArrowLeft size={24} />
                  </button>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Introducere Scope 2</h2>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tip Energie</label>
                      <select 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                        value={manualData.activity_type}
                        onChange={(e) => setManualData({...manualData, activity_type: e.target.value})}
                      >
                        <option value="electricity">Electricitate</option>
                        <option value="heating">Termoficare</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Cantitate (kWh)</label>
                      <input 
                        type="number" required placeholder="ex: 1250"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-slate-800"
                        value={manualData.quantity}
                        onChange={(e) => setManualData({...manualData, quantity: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Perioada Facturată</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Calendar className="absolute left-4 top-4 text-slate-400" size={20} />
                        <input type="date" required className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-600 font-medium focus:border-blue-500" 
                          onChange={(e) => setManualData({...manualData, start_date: e.target.value})} />
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-4 text-slate-400" size={20} />
                        <input type="date" required className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-600 font-medium focus:border-blue-500"
                          onChange={(e) => setManualData({...manualData, end_date: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex items-center justify-between border border-blue-500/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Calculator size={24} /></div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Impact Estimat</p>
                        <p className="text-3xl font-black">{estimatedCo2} <span className="text-sm font-bold text-slate-500 uppercase">kg CO2e</span></p>
                      </div>
                    </div>
                  </div>

                  <button disabled={isSavingManual} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50">
                    {isSavingManual ? <Loader2 className="animate-spin" /> : "Salvează Consumul"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PENTRU ISTORIC */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in zoom-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[85vh] shadow-2xl relative flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center px-10">
              <div>
                <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                  <History className="text-blue-500" /> Istoric Emisii
                </h2>
                <p className="text-slate-500 font-medium">Baza de date a înregistrărilor salvate</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-3 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={50} className="text-blue-500 animate-spin mb-4" />
                  <p className="font-bold text-slate-400 text-lg tracking-tight">Accesare server...</p>
                </div>
              ) : (
                <HistoryTable data={historyData} />
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/30 text-center">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Înregistrări găsite: {historyData.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionSelection;