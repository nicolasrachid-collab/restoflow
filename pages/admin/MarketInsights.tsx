import React, { useState } from 'react';
import { searchMarketTrends, analyzeLocation } from '../../services/geminiService';
import { Button } from '../../components/ui/Button';
import { Search, MapPin, ExternalLink, TrendingUp } from 'lucide-react';
import { GroundingChunk } from '../../types';

export const MarketInsights: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trends' | 'location'>('trends');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setResultText('');
    setSources([]);

    try {
      if (activeTab === 'trends') {
        const response = await searchMarketTrends(query);
        setResultText(response.text);
        setSources(response.groundingMetadata?.groundingChunks || []);
      } else {
        // Mocked Lat/Long for Sao Paulo for demo purposes, in real app use navigator.geolocation
        const response = await analyzeLocation(query, -23.5505, -46.6333);
        setResultText(response.text);
        setSources(response.groundingMetadata?.groundingChunks || []);
      }
    } catch (e) {
      setResultText('Erro ao buscar insights. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Insights de Mercado & Inteligência</h2>
        <p className="text-gray-500">Use o poder do Google Search e Maps para tomar decisões melhores.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'trends' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp size={18} /> Tendências (Search)
        </button>
        <button
          onClick={() => setActiveTab('location')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'location' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin size={18} /> Análise Local (Maps)
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={activeTab === 'trends' ? "Ex: Tendências de sobremesas para 2024..." : "Ex: Restaurantes Italianos concorrentes próximos..."}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <Button onClick={handleSearch} isLoading={loading}>
            <Search size={18} className="mr-2" /> Pesquisar
          </Button>
        </div>

        {resultText && (
          <div className="space-y-6 animate-fade-in">
            <div className="prose prose-indigo max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Análise da IA</h3>
              <div className="p-4 bg-indigo-50 rounded-lg text-gray-800 whitespace-pre-wrap">
                {resultText}
              </div>
            </div>

            {sources.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Fontes Verificadas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sources.map((chunk, idx) => {
                    const web = chunk.web;
                    const map = chunk.maps;
                    
                    if (web) {
                      return (
                        <a key={idx} href={web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group">
                          <div className="bg-blue-100 p-2 rounded-md text-blue-600 group-hover:bg-blue-200">
                            <ExternalLink size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-medium text-sm text-gray-900 truncate">{web.title}</div>
                            <div className="text-xs text-gray-500 truncate">{web.uri}</div>
                          </div>
                        </a>
                      );
                    }

                    if (map) {
                      return (
                        <a key={idx} href={map.uri} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group">
                           <div className="bg-green-100 p-2 rounded-md text-green-600 group-hover:bg-green-200">
                            <MapPin size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-medium text-sm text-gray-900 truncate">{map.title}</div>
                            <div className="text-xs text-gray-500">Ver no Google Maps</div>
                          </div>
                        </a>
                      )
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};