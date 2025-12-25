import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Loader2, Plus, ImageOff } from 'lucide-react';
import { api } from '../../services/api';
import { MenuItem } from '../../types';

const CATEGORIES = ['Todos', 'Entradas', 'Lanches', 'Bebidas', 'Geral'];

export const PublicMenu: React.FC = () => {
  const { slug } = useParams();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      if (!slug) return;
      try {
        const data = await api.get<MenuItem[]>(`/menu/public/${slug}`);
        setMenu(data);
      } catch (error) {
        console.error("Erro ao carregar menu público", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [slug]);

  const filteredItems = menu.filter(item => {
    const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-indigo-600 bg-gray-50">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Header Mobile Sticky com Busca e Filtros */}
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-md pt-4 pb-2 -mx-4 px-4 border-b border-gray-200/50 shadow-sm">
        <div className="relative mb-4 max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar pratos, bebidas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 shadow-sm outline-none transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ease-out ${
                activeCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-105' 
                  : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-1">
        {filteredItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 animate-slide-up">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                  <Search size={40} className="text-gray-300" />
                </div>
                <p className="text-lg font-medium">Nenhum item encontrado.</p>
                <p className="text-sm">Tente mudar a categoria ou a busca.</p>
            </div>
        ) : filteredItems.map(item => (
          <div 
            key={item.id} 
            className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ease-out hover:-translate-y-2 h-full"
          >
            
            {/* Área da Imagem */}
            <div className="h-56 w-full bg-gray-100 relative overflow-hidden">
               {item.imageUrl ? (
                   <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" 
                   />
               ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                      <ImageOff size={32} />
                      <span className="text-xs mt-2 font-medium">Sem imagem</span>
                   </div>
               )}
               {/* Gradiente sutil para destacar texto se necessário */}
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
               
               {/* Preço (Posicionado na imagem para visual moderno) */}
               <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm font-bold text-gray-900 text-sm border border-gray-100/50">
                 R$ {Number(item.price).toFixed(2)}
               </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6 flex flex-col flex-1 relative">
               <h3 className="font-bold text-xl text-gray-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                 {item.name}
               </h3>
               
               <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-6 flex-1">
                 {item.description}
               </p>

               {/* Botão de Adicionar Flutuante no Card */}
               <div className="flex justify-end mt-auto pt-2">
                 <button 
                   className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 group-hover:bg-indigo-700 active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                   aria-label={`Adicionar ${item.name}`}
                 >
                    <Plus size={24} strokeWidth={2.5} />
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};