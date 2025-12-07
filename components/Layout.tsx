import React from 'react';
import { Plane, AlertTriangle, RotateCw, ArrowLeftRight, LayoutDashboard, Activity } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'delay', label: 'Delay Risk', icon: Activity },
    { id: 'maintenance', label: 'Maintenance Risk', icon: AlertTriangle },
    { id: 'rotation', label: 'Rotation Check', icon: RotateCw },
    { id: 'swap', label: 'Tail Swap Sim', icon: ArrowLeftRight },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Plane className="w-8 h-8 text-sky-400" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Tail Optimizer</h1>
              <p className="text-xs text-slate-400">Ops Control v1.0</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activePage === item.id
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">
              OP
            </div>
            <div>
              <p className="text-sm font-medium">Ops Controller</p>
              <p className="text-xs text-emerald-400">Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;