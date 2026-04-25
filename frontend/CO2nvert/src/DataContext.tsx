import React, { createContext, useState, useEffect, type ReactNode } from 'react';

// 1. Define the context interface for type safety
interface DataContextType {
  data: any;
  loading: boolean;
  refreshDashboardData: () => Promise<void>;
  currentBatchId: number | null;
  setActiveBatch: (batchId: number) => void;
}

// 2. Create the context with a default undefined (will be set by provider)
export const DataContext = createContext<DataContextType | undefined>(undefined);

// 3. Create the provider
export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentBatchId, setCurrentBatchId] = useState<number | null>(null);

  // Function to fetch data from the database
  const refreshDashboardData = async () => {
    setLoading(true);
    try {
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

  // Function to update current batch
  const setActiveBatch = (batchId: number) => {
    console.log("Setting active batch to:", batchId);
    setCurrentBatchId(batchId);
  };

  // Fetch data when app starts
  useEffect(() => {
    refreshDashboardData();
  }, []);

  const value: DataContextType = {
    data,
    loading,
    refreshDashboardData,
    currentBatchId,
    setActiveBatch
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};