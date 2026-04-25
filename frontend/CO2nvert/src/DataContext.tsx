import React, { createContext, useState, useEffect, ReactNode } from 'react';

// 1. Definim Contextul
export const DataContext = createContext<any>(null);

// 2. Creăm Provider-ul și îi spunem lui TypeScript ce fel de date primește
export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Funcția care aduce datele din baza de date
  // În DataContext.tsx
  const refreshDashboardData = async () => {
    setLoading(true);
    try {
      // AM MODIFICAT AICI: Am adăugat un parametru de timp ca să forțăm browserul să aducă date noi de fiecare dată!
      const url = `http://127.0.0.1:8000/dashboard/statistics?t=${new Date().getTime()}`;
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData);
      } else {
        console.error("Eroare de la server la aducerea statisticilor");
      }
    } catch (error) {
      console.error("Eroare de rețea la preluarea datelor:", error);
    } finally {
      setLoading(false);
    }
  };

  // Când aplicația pornește, aducem automat datele
  useEffect(() => {
    refreshDashboardData();
  }, []);

  return (
    // Exportăm datele și funcția pentru a putea fi folosite în alte pagini
    <DataContext.Provider value={{ data, loading, refreshDashboardData }}>
      {children}
    </DataContext.Provider>
  );
};