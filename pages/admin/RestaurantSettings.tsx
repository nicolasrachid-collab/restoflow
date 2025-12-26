import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { Settings, Save, Power, PowerOff } from 'lucide-react';

interface RestaurantConfig {
  id: string;
  name: string;
  slug: string;
  address: string;
  isActive: boolean;
  queueActive: boolean;
  maxPartySize: number;
  averageTableTimeMinutes: number;
  calledTimeoutMinutes: number;
}

export const RestaurantSettings: React.FC = () => {
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    maxPartySize: 20,
    averageTableTimeMinutes: 45,
    calledTimeoutMinutes: 10,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await api.get<RestaurantConfig>('/restaurants/config');
      setConfig(data);
      setFormData({
        name: data.name,
        address: data.address,
        maxPartySize: data.maxPartySize,
        averageTableTimeMinutes: data.averageTableTimeMinutes,
        calledTimeoutMinutes: data.calledTimeoutMinutes,
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao carregar configurações', error);
      alert('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Validações
    if (!formData.name.trim()) {
      alert('O nome do restaurante é obrigatório');
      return;
    }
    if (formData.maxPartySize < 1 || formData.maxPartySize > 100) {
      alert('O tamanho máximo do grupo deve estar entre 1 e 100');
      return;
    }
    if (formData.averageTableTimeMinutes < 5 || formData.averageTableTimeMinutes > 300) {
      alert('O tempo médio de mesa deve estar entre 5 e 300 minutos');
      return;
    }
    if (formData.calledTimeoutMinutes < 1 || formData.calledTimeoutMinutes > 60) {
      alert('O timeout de chamada deve estar entre 1 e 60 minutos');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/restaurants/config', formData);
      setHasChanges(false);
      await loadConfig();
      alert('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar configurações', error);
      alert(error.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleQueue = async () => {
    try {
      await api.patch('/restaurants/queue-active', {});
      await loadConfig();
    } catch (error: any) {
      console.error('Erro ao alterar status da fila', error);
      alert(error.message || 'Erro ao alterar status da fila');
    }
  };

  const handleToggleRestaurant = async () => {
    if (!config) return;
    
    if (!confirm(`Tem certeza que deseja ${config.isActive ? 'desativar' : 'ativar'} o restaurante?`)) {
      return;
    }

    try {
      await api.patch('/restaurants/active', {});
      await loadConfig();
    } catch (error: any) {
      console.error('Erro ao alterar status do restaurante', error);
      alert(error.message || 'Erro ao alterar status do restaurante');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando configurações...</div>
      </div>
    );
  }

  if (!config) {
    return <div>Erro ao carregar configurações</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações do Restaurante</h2>
          <p className="text-gray-500">Gerencie as configurações gerais do seu restaurante</p>
        </div>
        <Button onClick={handleSave} isLoading={saving} disabled={!hasChanges}>
          <Save size={18} className="mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings size={20} />
            Informações Básicas
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Restaurante
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={config.slug}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                O slug não pode ser alterado. É usado nas URLs públicas.
              </p>
            </div>
          </div>
        </div>

        {/* Configurações de Fila */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Fila</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamanho Máximo do Grupo
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.maxPartySize}
                onChange={(e) => handleInputChange('maxPartySize', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Número máximo de pessoas por grupo</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo Médio de Mesa (minutos)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={formData.averageTableTimeMinutes}
                onChange={(e) =>
                  handleInputChange('averageTableTimeMinutes', parseInt(e.target.value, 10))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usado para calcular tempo estimado de espera
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout de Chamada (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.calledTimeoutMinutes}
                onChange={(e) =>
                  handleInputChange('calledTimeoutMinutes', parseInt(e.target.value, 10))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tempo que o cliente tem para comparecer após ser chamado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status do Restaurante */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status do Sistema</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Fila Virtual</div>
              <div className="text-sm text-gray-500">
                {config.queueActive
                  ? 'Clientes podem entrar na fila'
                  : 'Fila desativada - clientes não podem entrar'}
              </div>
            </div>
            <button
              onClick={handleToggleQueue}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                config.queueActive
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.queueActive ? <Power size={18} /> : <PowerOff size={18} />}
              {config.queueActive ? 'Ativa' : 'Inativa'}
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Restaurante</div>
              <div className="text-sm text-gray-500">
                {config.isActive
                  ? 'Restaurante ativo e funcionando'
                  : 'Restaurante desativado - todas as funcionalidades estão bloqueadas'}
              </div>
            </div>
            <button
              onClick={handleToggleRestaurant}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                config.isActive
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {config.isActive ? <Power size={18} /> : <PowerOff size={18} />}
              {config.isActive ? 'Ativo' : 'Inativo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

