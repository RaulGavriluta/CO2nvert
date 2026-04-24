import React from 'react';
import { PlusCircle, History, ArrowRight } from 'lucide-react';

const ActionSelection: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Bun venit,</h1>
        <p className="text-slate-500 mt-2">Ce dorești să faci astăzi pentru raportarea amprentei de carbon?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card: Raport Nou */}
        <button className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all text-left w-full cursor-pointer">
          <div className="bg-emerald-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-600">
            <PlusCircle size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Introducere Date Noi</h3>
          <p className="text-slate-500 mb-6">Încărcați facturi de gaz, electricitate sau combustibil pentru procesare OCR.</p>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold">
            <span>Începe fluxul</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card: Istoric */}
        <button className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-400 hover:shadow-md transition-all text-left w-full cursor-pointer">
          <div className="bg-slate-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-800 group-hover:text-white transition-colors text-slate-600">
            <History size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Istoric Rapoarte</h3>
          <p className="text-slate-500 mb-6">Vizualizați și exportați rapoartele de sustenabilitate generate anterior.</p>
          <div className="flex items-center gap-2 text-slate-600 font-semibold">
            <span>Vezi arhivă</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default ActionSelection;