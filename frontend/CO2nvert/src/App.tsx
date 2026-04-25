import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './features/dashboard/Dashboard'; 
import ActionSelection from './features/dashboard/ActionSelection';
import ProcessBatch from './features/upload/ProcessBatch'; 

// NOU: Importă DataProvider-ul pe care l-am creat (asigură-te că pui folderul corect unde l-ai salvat)
// De exemplu, dacă l-ai pus într-un folder 'context', calea ar fi './context/DataContext'
import { DataProvider } from './DataContext'; 

// Componente temporare (Placeholders) pentru paginile viitoare
const ReportsPage = () => <div className="p-4 bg-white rounded-xl shadow-sm">Secțiunea Rapoarte Anuale - În lucru</div>;
const SettingsPage = () => <div className="p-4 bg-white rounded-xl shadow-sm">Secțiunea Setări - În lucru</div>;

function App() {
  return (
    // AM ADĂUGAT AICI: Învelim întreaga aplicație în DataProvider
    <DataProvider>
      <Router>
        <MainLayout>
          <Routes>
            {/* Pagina principală cu grafice (Va CITI datele din Context) */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Pagina de selecție acțiune */}
            <Route path="/upload" element={<ActionSelection />} />
            
            {/* NOU: Pagina unde vezi cele 3 secțiuni după upload (Aici probabil vei ACTUALIZA datele din Context) */}
            <Route path="/process-batch/:batchId" element={<ProcessBatch />} />
            
            {/* Rutele viitoare */}
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </MainLayout>
      </Router>
    </DataProvider>
  );
}

export default App;