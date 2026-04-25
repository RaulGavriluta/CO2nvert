import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './features/dashboard/Dashboard'; 
import ActionSelection from './features/dashboard/ActionSelection';
// Importă noua componentă (asigură-te că drumul către fișier este corect)
import ProcessBatch from './features/upload/ProcessBatch'; 

// Componente temporare (Placeholders) pentru paginile viitoare
const ReportsPage = () => <div className="p-4 bg-white rounded-xl shadow-sm">Secțiunea Rapoarte Anuale - În lucru</div>;
const SettingsPage = () => <div className="p-4 bg-white rounded-xl shadow-sm">Secțiunea Setări - În lucru</div>;

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          {/* Pagina principală cu grafice */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Pagina de selecție acțiune (unde ai butonul de Upload) */}
          <Route path="/upload" element={<ActionSelection />} />
          
          {/* NOU: Pagina unde vezi cele 3 secțiuni (Scope 1, 2, 3) după upload */}
          {/* :batchId este o variabilă care va fi luată din URL */}
          <Route path="/process-batch/:batchId" element={<ProcessBatch />} />
          
          {/* Rutele viitoare */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;