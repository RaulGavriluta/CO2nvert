import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, History, ArrowRight, Loader2, 
  X, Factory, Zap, Truck, FileUp 
} from 'lucide-react';
import HistoryTable from './HistoryTable'; // Asigură-te că fișierul există în același folder

const ActionSelection: React.FC = () => {
  const navigate = useNavigate();
  
  // Stări pentru UI
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal pentru Upload
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // Modal pentru Istoric
  
  // Stări pentru Datele de Istoric
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Funcția pentru a încărca istoricul din backend
  const handleOpenHistory = async () => {
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/dashboard/emissions/history');
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      } else {
        console.error("Eroare la preluarea istoricului");
      }
    } catch (error) {
      console.error("Eroare rețea istoric:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Logica de upload facturi
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
        setIsModalOpen(false);
        navigate(`/process-batch/${data.batch_id}`);
      }
    } catch (error) {
      console.error("Eroare rețea upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-10 p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Panou de Control</h1>
        <p className="text-slate-500 text-lg font-medium">Gestionează datele de mediu și fluxurile de lucru AI.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* CARD 1: INTRODUCERE DATE */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-2xl hover:-translate-y-2 transition-all text-left"
        >
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

        {/* CARD 2: ISTORIC (MODAL) */}
        <button 
          onClick={handleOpenHistory}
          className="group bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-2xl hover:-translate-y-2 transition-all text-left"
        >
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

      {/* ========================================== */}
      {/* MODAL PENTRU UPLOAD (DATE NOI) */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-3xl w-full shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-100 rounded-full"
            >
              <X size={28} />
            </button>

            <h2 className="text-3xl font-bold mb-2 text-slate-800">Sursă Date</h2>
            <p className="text-slate-500 mb-10">Alege modalitatea de introducere a consumului.</p>

            <div className="grid grid-cols-3 gap-6 mb-10">
              <button className="flex flex-col items-center p-6 rounded-3xl border-2 border-slate-50 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50 transition-all group">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3 text-emerald-600 group-hover:scale-110 transition-transform"><Factory size={28} /></div>
                <span className="font-bold text-slate-800 text-sm">Scope 1</span>
              </button>
              <button className="flex flex-col items-center p-6 rounded-3xl border-2 border-slate-50 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-all group">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3 text-blue-600 group-hover:scale-110 transition-transform"><Zap size={28} /></div>
                <span className="font-bold text-slate-800 text-sm">Scope 2</span>
              </button>
              <button className="flex flex-col items-center p-6 rounded-3xl border-2 border-slate-50 bg-slate-50 hover:border-purple-400 hover:bg-purple-50 transition-all group">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3 text-purple-600 group-hover:scale-110 transition-transform"><Truck size={28} /></div>
                <span className="font-bold text-slate-800 text-sm">Scope 3</span>
              </button>
            </div>

            <div className="relative flex items-center gap-4 mb-10">
              <hr className="flex-1 border-slate-100" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Sau Procesare Automată</span>
              <hr className="flex-1 border-slate-100" />
            </div>

            <label className={`flex flex-col items-center justify-center w-full p-12 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all ${isUploading ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30'}`}>
              <input type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" disabled={isUploading} />
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 size={48} className="text-emerald-600 animate-spin mb-4" />
                  <span className="text-xl font-bold text-emerald-800">AI-ul analizează documentele...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-6"><FileUp size={32} /></div>
                  <span className="font-bold text-slate-800 text-xl">Încarcă Facturi Digitale</span>
                  <p className="text-sm text-slate-400 mt-2 max-w-xs">Trage fișierele aici (PDF, JPG, PNG) pentru a extrage automat datele de consum.</p>
                </div>
              )}
            </label>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL PENTRU ISTORIC (POP-UP DREAPTA) */}
      {/* ========================================== */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in zoom-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[85vh] shadow-2xl relative flex flex-col overflow-hidden border border-white/20">
            
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  <History className="text-blue-500" />
                  Istoric Documente
                </h2>
                <p className="text-slate-500 font-medium italic">Consultarea arhivei de emisii salvate</p>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-3 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-white">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={50} className="text-blue-500 animate-spin mb-4" />
                  <p className="font-bold text-slate-400 text-lg">Se accesează baza de date...</p>
                </div>
              ) : (
                /* FOLOSIM COMPONENTA EXTERNĂ AICI */
                <HistoryTable data={historyData} />
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/30 text-center">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                 Total înregistrări identificate: {historyData.length}
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionSelection;