import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Loader2, Plus, ImageOff, Filter, X, SlidersHorizontal } from 'lucide-react';
import { api } from '../../services/api';
import { MenuItem } from '../../types';

const CATEGORIES = ['Todos', 'Entradas', 'Lanches', 'Bebidas', 'Geral'];

export const PublicMenu: React.FC = () => {
  const { slug } = useParams();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  // Variantes selecionadas por item: { itemId: { variantId: true } }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    const fetchMenu = async () => {
      if (!slug) return;
      try {
        const response = await api.get<{ categories: any[]; items: MenuItem[] } | MenuItem[]>(`/menu/public/${slug}`);
        // A resposta pode ser um objeto com categories e items, ou apenas um array
        const menuData = Array.isArray(response) ? response : (response.items || []);
        setMenu(menuData);
        // Calcular range de preços (considerando preço base + variantes)
        if (menuData.length > 0) {
          const prices = menuData.map((item: MenuItem) => {
            const basePrice = item.price;
            const maxVariantPrice = item.variants?.reduce((max, v) => Math.max(max, v.priceModifier), 0) || 0;
            return basePrice + maxVariantPrice;
          });
          const maxPrice = Math.max(...prices);
          setPriceRange([0, Math.ceil(maxPrice / 10) * 10]); // Arredondar para próximo múltiplo de 10
        }
      } catch (error) {
        console.error("Erro ao carregar menu público", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [slug]);

  // Obter categorias únicas do menu
  const availableCategories = useMemo(() => {
    const cats = new Set(menu.map(item => item.category).filter(Boolean));
    return ['Todos', ...Array.from(cats)];
  }, [menu]);

  const filteredItems = useMemo(() => {
    let filtered = menu.filter(item => {
      const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
      return matchesCategory && matchesSearch && matchesPrice;
    });

    // Ordenar
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'price-asc') {
        return a.price - b.price;
      } else {
        return b.price - a.price;
      }
    });

    return filtered;
  }, [menu, activeCategory, searchTerm, priceRange, sortBy]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-orange-600 bg-gray-50">
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
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 shadow-sm outline-none transition-all"
          />
        </div>
        
        <div className="flex gap-2 items-center mb-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl border transition-colors flex items-center gap-2 ${
              showFilters
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title="Filtros avançados"
          >
            <SlidersHorizontal size={18} />
            <span className="text-sm font-medium">Filtros</span>
          </button>
        </div>

        {/* Painel de Filtros Avançados */}
        {showFilters && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 animate-fade-in mb-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filtros</h3>
              <button
                onClick={() => {
                  setPriceRange([0, Math.max(500, priceRange[1])]);
                  setSortBy('name');
                  setActiveCategory('Todos');
                  setSearchTerm('');
                }}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Limpar tudo
              </button>
            </div>

            {/* Ordenação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="name">Nome (A-Z)</option>
                <option value="price-asc">Preço: Menor para Maior</option>
                <option value="price-desc">Preço: Maior para Menor</option>
              </select>
            </div>

            {/* Faixa de Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço: R$ {priceRange[0]} - R$ {priceRange[1]}
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="0"
                  max={priceRange[1] || 500}
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="flex-1"
                />
                <input
                  type="range"
                  min={priceRange[0]}
                  max={Math.max(priceRange[1] || 500, 500)}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="flex-1"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>R$ 0</span>
                <span>R$ {priceRange[1]}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ease-out ${
                activeCategory === cat 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 scale-105' 
                  : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Contador de resultados */}
        {!loading && (
          <div className="text-sm text-gray-500 text-center pt-2">
            {filteredItems.length} {filteredItems.length === 1 ? 'item encontrado' : 'itens encontrados'}
          </div>
        )}
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
                 R$ {(() => {
                   const basePrice = Number(item.price);
                   const variantsPrice = item.variants?.reduce((sum, variant) => {
                     if (selectedVariants[item.id]?.[variant.id]) {
                       return sum + variant.priceModifier;
                     }
                     return sum;
                   }, 0) || 0;
                   return (basePrice + variantsPrice).toFixed(2);
                 })()}
               </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6 flex flex-col flex-1 relative">
               <h3 className="font-bold text-xl text-gray-900 leading-tight mb-2 group-hover:text-orange-600 transition-colors">
                 {item.name}
               </h3>
               
               <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-4 flex-1">
                 {item.description}
               </p>

               {/* Variantes */}
               {item.variants && item.variants.length > 0 && (
                 <div className="mb-4 space-y-2">
                   {item.variants.map((variant) => (
                     <label 
                       key={variant.id}
                       className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                         selectedVariants[item.id]?.[variant.id]
                           ? 'bg-orange-50 border-orange-300'
                           : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                       }`}
                     >
                       <input
                         type="checkbox"
                         checked={selectedVariants[item.id]?.[variant.id] || false}
                         onChange={(e) => {
                           const newSelected = { ...selectedVariants };
                           if (!newSelected[item.id]) newSelected[item.id] = {};
                           newSelected[item.id][variant.id] = e.target.checked;
                           setSelectedVariants(newSelected);
                         }}
                         className="rounded text-orange-600 focus:ring-orange-500"
                       />
                       <span className="text-sm text-gray-700 flex-1">{variant.name}</span>
                       {variant.priceModifier !== 0 && (
                         <span className="text-xs font-medium text-gray-600">
                           {variant.priceModifier > 0 ? '+' : ''}R$ {variant.priceModifier.toFixed(2)}
                         </span>
                       )}
                       {variant.isRequired && (
                         <span className="text-xs text-orange-600 font-medium">Obrigatória</span>
                       )}
                     </label>
                   ))}
                 </div>
               )}

               {/* Botão de Adicionar Flutuante no Card */}
               <div className="flex justify-end mt-auto pt-2">
                 <button 
                   className="w-12 h-12 bg-orange-600 text-white rounded-full shadow-lg shadow-orange-200 flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 group-hover:bg-orange-700 active:scale-95 focus:outline-none focus:ring-4 focus:ring-orange-100"
                   aria-label={`Adicionar ${item.name}`}
                   onClick={() => {
                     // Validar variantes obrigatórias
                     if (item.variants) {
                       const requiredVariants = item.variants.filter(v => v.isRequired);
                       const hasAllRequired = requiredVariants.every(v => selectedVariants[item.id]?.[v.id]);
                       if (requiredVariants.length > 0 && !hasAllRequired) {
                         alert(`Por favor, selecione todas as variantes obrigatórias: ${requiredVariants.map(v => v.name).join(', ')}`);
                         return;
                       }
                     }
                     // Aqui poderia adicionar ao carrinho
                     console.log('Adicionar ao carrinho:', item, selectedVariants[item.id]);
                   }}
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