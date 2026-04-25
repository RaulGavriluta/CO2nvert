import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, FileText, Settings, UploadCloud } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 1. Top Navigation Bar */}
      <header className="h-16 bg-emerald-600 text-white flex items-center justify-between px-6 shadow-md z-10 relative">
        
        {/* Partea stângă: Logo și Nume */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xl font-black tracking-tight">
            <span className="text-white">CO2</span>
            <span className="text-emerald-200">nvert</span>
          </span>
        </div>

        {/* --- MODIFICARE: Butonul mutat în MIJLOC --- */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <NavLink 
            to="/upload" 
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg border border-emerald-400/30 active:scale-95"
          >
            <UploadCloud size={20} />
            <span>Încarcă Date</span>
          </NavLink>
        </div>

        {/* Partea dreaptă: Profil Utilizator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-emerald-50">Utilizator Companie</p>
            <p className="text-xs text-emerald-200">Green Corp S.A.</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white text-emerald-700 flex items-center justify-center font-bold shadow-sm border border-emerald-100">
            GC
          </div>
        </div>

      </header>

      {/* 2. Containerul de jos: Sidebar + Conținut Principal */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavItem icon={<BarChart3 size={20} />} label="Dashboard" to="/" />
            <NavItem icon={<FileText size={20} />} label="Rapoarte Anuale" to="/reports" />
            <NavItem icon={<Settings size={20} />} label="Setări" to="/settings" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
};

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