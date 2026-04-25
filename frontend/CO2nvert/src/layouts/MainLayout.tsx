import React from 'react';
import { NavLink } from 'react-router-dom';
import { Leaf, BarChart3, FileText, Settings, UploadCloud } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 1. Top Navigation Bar (Bara verde pe toată lățimea) */}
      <header className="h-16 bg-emerald-600 text-white flex items-center justify-between px-6 shadow-md z-10 relative">
        {/* Partea stângă: Logo și Nume */}
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-2 rounded-lg">
            <Leaf className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">CO2nvert</span>
        </div>

        {/* Partea dreaptă: Acțiuni Rapide și Profil Utilizator */}
        <div className="flex items-center gap-6">
          
          {/* Buton rapid pentru încărcare date */}
          <NavLink 
            to="/upload" 
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <UploadCloud size={18} />
            <span>Încarcă Date</span>
          </NavLink>

          {/* Profil */}
          <div className="flex items-center gap-3 border-l border-emerald-500 pl-6">
            <div className="text-right">
              <p className="text-sm font-medium text-emerald-50">Utilizator Companie</p>
              <p className="text-xs text-emerald-200">Green Corp S.A.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white text-emerald-700 flex items-center justify-center font-bold shadow-sm">
              GC
            </div>
          </div>

        </div>
      </header>

      {/* 2. Containerul de jos: Sidebar + Conținut Principal */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar (Acum folosește NavLink pentru rute) */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavItem icon={<BarChart3 size={20} />} label="Dashboard" to="/" />
            <NavItem icon={<FileText size={20} />} label="Rapoarte Anuale" to="/reports" />
            <NavItem icon={<Settings size={20} />} label="Setări" to="/settings" />
          </nav>
        </aside>

        {/* Main Content (Aici se randează paginile) */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
};

// Componenta actualizată pentru butoanele de meniu folosind NavLink
const NavItem = ({ icon, label, to }: { icon: React.ReactNode, label: string, to: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-emerald-50 text-emerald-700 font-semibold' 
          : 'text-slate-500 hover:bg-slate-100'
      }`
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default MainLayout;