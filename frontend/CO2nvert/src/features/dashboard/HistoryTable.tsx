import React from 'react';
import { Zap, Leaf, Gauge } from 'lucide-react';

interface HistoryItem {
  id: number;
  type: string;
  scope: string;
  quantity: number;
  unit: string;
  co2e: number;
}

interface Props {
  data: HistoryItem[];
}

const HistoryTable: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-black tracking-widest border-b border-slate-100">
          <tr>
            <th className="px-8 py-5">Sursă / Categorie</th>
            <th className="px-8 py-5">Consum</th>
            <th className="px-8 py-5 text-right">Emisii Generate</th>
            <th className="px-8 py-5 text-center">Clasificare</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
              <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                    {item.type.toLowerCase().includes('electr') ? <Zap size={22}/> : <Leaf size={22}/>}
                  </div>
                  <span className="font-extrabold text-slate-800 text-lg">{item.type}</span>
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-2 font-bold text-slate-500 text-lg">
                  <Gauge size={18} className="text-slate-300" />
                  {item.quantity.toLocaleString()} <span className="text-sm font-medium text-slate-400">{item.unit}</span>
                </div>
              </td>
              <td className="px-8 py-6 text-right">
                <span className="text-2xl font-black text-slate-900">{item.co2e.toLocaleString()}</span>
                <span className="ml-2 text-sm font-bold text-slate-400">kgCO2e</span>
              </td>
              <td className="px-8 py-6 text-center">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-tighter ${
                  item.scope.includes('1') ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {item.scope.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;