import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Menu, Map, CalendarDays, LogOut, Menu as MenuIcon, X, AlertTriangle, Link as LinkIcon, FolderTree, Clock, Settings, UserCog, BarChart3, UserCircle, Ban, List, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: BarChart3, label: 'Relatórios', path: '/admin/reports' },
    { icon: UserCircle, label: 'Clientes', path: '/admin/customers' },
    { icon: Users, label: 'Fila de Espera', path: '/admin/queue' },
    { icon: CalendarDays, label: 'Reservas', path: '/admin/reservations' },
    { icon: Menu, label: 'Menu Inteligente', path: '/admin/menu' },
    { icon: FolderTree, label: 'Categorias', path: '/admin/categories' },
    { icon: Clock, label: 'Horários', path: '/admin/operating-hours' },
    { icon: Ban, label: 'Bloqueios', path: '/admin/time-blocks' },
    { icon: List, label: 'Lista de Espera', path: '/admin/waitlist' },
    { icon: Map, label: 'Insights & Mapa', path: '/admin/insights' },
    { icon: LinkIcon, label: 'Links Públicos', path: '/admin/links' },
    { icon: Settings, label: 'Configurações', path: '/admin/settings' },
    { icon: UserCog, label: 'Usuários', path: '/admin/users' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-bold text-orange-600 dark:text-orange-500 flex items-center gap-2">
            <span className="p-1 bg-orange-100 dark:bg-orange-900 rounded">RF</span> RestoFlow
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 dark:text-gray-400">
            <X size={24} />
          </button>
        </div>

        {/* Demo Badge */}
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/30 border-y border-amber-100 dark:border-amber-800 flex items-start gap-2">
           <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
           <div>
             <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Modo Demonstração</p>
             <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">Dados locais. Recarregue a página para resetar.</p>
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
                    ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors mb-2"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
          </button>
          <Link to="/login" className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
            <LogOut size={20} />
            Sair
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center md:hidden sticky top-0 z-10">
           <h1 className="text-lg font-bold text-orange-600 dark:text-orange-500">RestoFlow</h1>
           <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 dark:text-gray-400 p-1">
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