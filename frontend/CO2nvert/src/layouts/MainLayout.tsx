import React from 'react';
import { Leaf, BarChart3, FileText, Settings } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Leaf className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-emerald-900">CO2nvert</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem icon={<BarChart3 size={20} />} label="Dashboard" active />
          <NavItem icon={<FileText size={20} />} label="Rapoarte Anuale" />
          <NavItem icon={<Settings size={20} />} label="Setări" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-8">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">Utilizator Companie</p>
              <p className="text-xs text-slate-500">Green Corp S.A.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700">
              GC
            </div>
          </div>
        </header>
        
        <div className="p-8 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
    active ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-500 hover:bg-slate-100'
  }`}>
    {icon}
    <span>{label}</span>
  </button>
);

export default MainLayout;