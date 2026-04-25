import React, { useContext } from 'react';
import { Flame, Zap, Plane, Loader2 } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// Importăm Contextul (verifică să fie corectă calea)
import { DataContext } from '../../DataContext'; 

// Funcție pentru a asocia iconițele dinamic
const getIconForSource = (category: string) => {
  if (category === 'Scope 1') return <Flame size={20} />;
  if (category === 'Scope 2') return <Zap size={20} />;
  return <Plane size={20} />;
};

const Dashboard: React.FC = () => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { data, loading } = context;

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
        <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold">Se încarcă datele ESG din baza de date...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col gap-6 animate-in fade-in duration-500 bg-slate-50 overflow-hidden">
      
      {/* HEADER */}
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Dashboard Emisii</h1>
          <p className="text-slate-500 text-sm font-medium mt-2">Monitorizare performanță ESG curentă</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none mb-2 font-mono">Total Amprentă</div>
          <div className="text-4xl font-black text-slate-800 leading-none">
            {data.totalEmissions.toLocaleString()} <span className="text-base font-bold text-slate-400 ml-1">tCO2e</span>
          </div>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        
        {/* STÂNGA: DISTRIBUȚIE (DONUT) */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col min-h-0">
          <h3 className="text-lg font-bold text-slate-700 mb-1 shrink-0">Distribuție Categorii</h3>
          <p className="text-sm text-slate-400 mb-6 shrink-0 font-medium">Ponderea pe Scope</p>
          
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart key={data.totalEmissions}>
                <Pie 
                  data={data.scopeData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="70%" 
                  outerRadius="90%" 
                  paddingAngle={8} 
                  dataKey="value" 
                  stroke="none"
                >
                  {data.scopeData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  cursor={false} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">TOTAL</span>
              <span className="text-3xl font-black text-slate-800 leading-none mt-1">
                {data.totalEmissions.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">tCO2e</span>
            </div>
          </div>

          <div className="flex justify-center gap-5 mt-8 flex-wrap shrink-0">
            {data.scopeData.map((item: any) => (
              <div key={item.name} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                {item.name}
              </div>
            ))}
          </div>
        </div>

        {/* DREAPTA: EVOLUȚIE + TOP SURSE */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
          
          {/* GRAFIC EVOLUȚIE */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-7 flex flex-col flex-[1.1] min-h-0">
            <h3 className="text-lg font-bold text-slate-700 mb-4 shrink-0">Evoluție Lunară (tCO2e)</h3>
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart key={data.totalEmissions} data={data.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEmisiiLarge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                  <Area type="monotone" dataKey="emisii" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEmisiiLarge)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TOP SURSE - Mărimile originale restabilite */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col flex-[0.9] min-h-0 justify-center">
            <h3 className="text-base font-bold text-slate-700 mb-6 shrink-0">Top Surse Generatoare</h3>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2"> 
              {data.topSources.map((source: any) => (
                <div key={source.id} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${source.bgColor} ${source.colorColor}`}>
                        {getIconForSource(source.category)}
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-800 leading-tight">{source.name}</p>
                        <p className="text-xs font-bold text-slate-400">{source.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-800 leading-none">{source.value} <span className="text-sm font-medium text-slate-400">tCO2e</span></p>
                      <p className="text-xs font-bold text-slate-400">{source.percent}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${source.percent}%`,
                        backgroundColor: source.category === 'Scope 2' ? '#3b82f6' : 
                                         source.category === 'Scope 1' ? '#10b981' : '#a855f7'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard; 