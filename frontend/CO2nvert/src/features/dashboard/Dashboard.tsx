import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Loader2, Database } from 'lucide-react';

// Tipuri de date pentru TypeScript
interface EmissionData {
  name: string;
  value: number;
}

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7'];

const Dashboard: React.FC = () => {
  // Stările pentru date, încărcare și erori (Am scos starea pentru 'selectedYear')
  const [data, setData] = useState<EmissionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Funcția care aduce TOATE datele din Python (Fără filtru de an)
  const fetchEmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Am șters ?year=... din URL
      const response = await fetch(`http://127.0.0.1:8000/dashboard/emissions/summary`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store'
      });      
      
      if (!response.ok) {
        throw new Error(`Eroare server: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Nu s-a putut stabili conexiunea cu backend-ul. Verifică dacă FastAPI rulează.");
    } finally {
      setLoading(false);
    }
  };

  // Rulăm o singură dată la deschiderea paginii
  useEffect(() => {
    fetchEmissions();
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto animate-in fade-in duration-500">
      
      {/* Header Dashboard Simplificat */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Emisii Total</h1>
          <p className="text-slate-500">Afișează toate emisiile procesate până în prezent</p>
        </div>
        {/* Am șters complet dropdown-ul cu Anul 2025/2024 */}
      </div>

      {/* Zonă de conținut condiționat (Loading / Error / Chart) */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[450px] flex flex-col justify-center">
        
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-emerald-600">
            <Loader2 className="animate-spin" size={40} />
            <p className="font-medium">Se calculează emisiile din baza de date...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 text-red-500">
            <AlertCircle size={40} />
            <p className="font-medium text-center max-w-md">{error}</p>
            <button 
              onClick={() => fetchEmissions()}
              className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
            >
              Reîncearcă conexiunea
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Database size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-bold text-lg mb-1">Nu există date înregistrate.</p>
            <p className="text-sm text-slate-400 max-w-sm">
              Mergi la "Încarcă Date" din meniu pentru a procesa primele tale facturi.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-slate-700 mb-8 text-center">
              Amprenta de Carbon - Distribuție pe Categorii
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} tCO2e`, "Emisii"]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>

                
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;