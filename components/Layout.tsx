import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Menu, Map, CalendarDays, LogOut, Menu as MenuIcon, X, AlertTriangle, Link as LinkIcon } from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Fila de Espera', path: '/admin/queue' },
    { icon: CalendarDays, label: 'Reservas', path: '/admin/reservations' },
    { icon: Menu, label: 'Menu Inteligente', path: '/admin/menu' },
    { icon: Map, label: 'Insights & Mapa', path: '/admin/insights' },
    { icon: LinkIcon, label: 'Links Públicos', path: '/admin/links' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h1 className="text-xl font-bold text-orange-600 flex items-center gap-2">
            <span className="p-1 bg-orange-100 rounded">RF</span> RestoFlow
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500">
            <X size={24} />
          </button>
        </div>

        {/* Demo Badge */}
        <div className="px-4 py-2 bg-amber-50 border-y border-amber-100 flex items-start gap-2">
           <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
           <div>
             <p className="text-xs font-bold text-amber-800">Modo Demonstração</p>
             <p className="text-[10px] text-amber-600 leading-tight">Dados locais. Recarregue a página para resetar.</p>
           </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-orange-50 text-orange-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link to="/login" className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={20} />
            Sair
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center md:hidden sticky top-0 z-10">
           <h1 className="text-lg font-bold text-orange-600">RestoFlow</h1>
           <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 p-1">
             <MenuIcon size={24} />
           </button>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};