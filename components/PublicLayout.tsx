import React from 'react';
import { useParams } from 'react-router-dom';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In a real app, use the slug to fetch restaurant branding
  const { slug } = useParams(); 

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <header className="w-full bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
             <h1 className="text-lg font-bold text-gray-900 capitalize">{slug?.replace('-', ' ') || 'Restaurante'}</h1>
             <p className="text-xs text-gray-500">Aberto • Fecha às 23h</p>
          </div>
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold text-xs">
            R
          </div>
        </div>
      </header>
      
      <main className="w-full max-w-md flex-1 p-4">
        {children}
      </main>

      <footer className="w-full text-center p-4 text-xs text-gray-400">
        Powered by RestoFlow
      </footer>
    </div>
  );
};