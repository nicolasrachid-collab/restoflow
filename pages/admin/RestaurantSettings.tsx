import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { ColorPicker } from '../../components/ui/ColorPicker';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Settings,
  Save,
  Power,
  PowerOff,
  Image as ImageIcon,
  Palette,
  Globe,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Restaurant } from '../../types';

interface RestaurantConfig extends Restaurant {
  minReservationAdvanceHours?: number;
  maxReservationAdvanceDays?: number;
}

export const RestaurantSettings: React.FC = () => {
  const toast = useToast();
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['identity', 'domain', 'contact', 'operational', 'status'])
  );

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    phone: '',
    email: '',
    customDomain: '',
    themeColor: '#f97316',
    logoUrl: null as string | null,
    socialMedia: {
      instagram: '',
      facebook: '',
    },
    maxPartySize: 20,
    averageTableTimeMinutes: 45,
    calledTimeoutMinutes: 10,
    minReservationAdvanceHours: 2,
    maxReservationAdvanceDays: 30,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await api.get<RestaurantConfig>('/restaurants/config');
      setConfig(data);
      setFormData({
        name: data.name || '',
        address: data.address || '',
        description: data.description || '',
        phone: data.phone || '',
        email: data.email || '',
        customDomain: data.customDomain || '',
        themeColor: data.themeColor || '#f97316',
        logoUrl: data.logoUrl || null,
        socialMedia: data.socialMedia || { instagram: '', facebook: '' },
        maxPartySize: data.maxPartySize || 20,
        averageTableTimeMinutes: data.averageTableTimeMinutes || 45,
        calledTimeoutMinutes: data.calledTimeoutMinutes || 10,
        minReservationAdvanceHours: data.minReservationAdvanceHours || 2,
        maxReservationAdvanceDays: data.maxReservationAdvanceDays || 30,
      });
      setHasChanges(false);
    } catch (error: any) {
      console.error('Erro ao carregar configurações', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao carregar configurações';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('socialMedia.')) {
      const socialField = field.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    setHasChanges(true);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const validateForm = (): boolean => {
    // Validações básicas
    if (!formData.name.trim()) {
      toast.error('O nome do restaurante é obrigatório');
      return false;
    }

    // Validação de email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Email inválido');
      return false;
    }

    // Validação de domínio customizado
    if (
      formData.customDomain &&
      !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(
        formData.customDomain
      )
    ) {
      toast.error('Formato de domínio inválido');
      return false;
    }

    // Validação de cor hexadecimal
    if (
      formData.themeColor &&
      !/^#[0-9A-Fa-f]{6}$/.test(formData.themeColor)
    ) {
      toast.error('Cor inválida. Use formato hexadecimal (ex: #f97316)');
      return false;
    }

    // Validações numéricas
    if (formData.maxPartySize < 1 || formData.maxPartySize > 100) {
      toast.error('O tamanho máximo do grupo deve estar entre 1 e 100');
      return false;
    }
    if (
      formData.averageTableTimeMinutes < 5 ||
      formData.averageTableTimeMinutes > 300
    ) {
      toast.error('O tempo médio de mesa deve estar entre 5 e 300 minutos');
      return false;
    }
    if (
      formData.calledTimeoutMinutes < 1 ||
      formData.calledTimeoutMinutes > 60
    ) {
      toast.error('O timeout de chamada deve estar entre 1 e 60 minutos');
      return false;
    }
    if (
      formData.minReservationAdvanceHours < 0 ||
      formData.minReservationAdvanceHours > 168
    ) {
      toast.error(
        'A antecedência mínima deve estar entre 0 e 168 horas (7 dias)'
      );
      return false;
    }
    if (
      formData.maxReservationAdvanceDays < 1 ||
      formData.maxReservationAdvanceDays > 365
    ) {
      toast.error('A antecedência máxima deve estar entre 1 e 365 dias');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await api.patch('/restaurants/config', {
        ...formData,
        socialMedia: formData.socialMedia.instagram || formData.socialMedia.facebook
          ? formData.socialMedia
          : undefined,
      });
      setHasChanges(false);
      await loadConfig();
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar configurações', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao salvar configurações';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleQueue = async () => {
    try {
      await api.patch('/restaurants/queue-active', {});
      await loadConfig();
      toast.success(
        `Fila ${config?.queueActive ? 'desativada' : 'ativada'} com sucesso!`
      );
    } catch (error: any) {
      console.error('Erro ao alterar status da fila', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao alterar status da fila';
      toast.error(errorMessage);
    }
  };

  const handleToggleRestaurant = async () => {
    if (!config) return;
    setShowConfirmModal(true);
  };

  const confirmToggleRestaurant = async () => {
    if (!config) return;
    setShowConfirmModal(false);

    try {
      await api.patch('/restaurants/active', {});
      await loadConfig();
      toast.success(
        `Restaurante ${config.isActive ? 'desativado' : 'ativado'} com sucesso!`
      );
    } catch (error: any) {
      console.error('Erro ao alterar status do restaurante', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao alterar status do restaurante';
      toast.error(errorMessage);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  const baseUrl = window.location.origin;
  const slug = config?.slug || 'demo';
  const publicUrls = {
    menu: `${baseUrl}/r/${slug}/menu`,
    queue: `${baseUrl}/r/${slug}/fila`,
    reservations: `${baseUrl}/r/${slug}/reservas`,
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

  const SectionHeader: React.FC<{
    id: string;
    icon: React.ReactNode;
    title: string;
    description?: string;
  }> = ({ id, icon, title, description }) => {
    const isExpanded = expandedSections.has(id);
    return (
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Configurações do Restaurante
          </h2>
          <p className="text-gray-500">
            Gerencie todas as informações e configurações do seu restaurante
          </p>
        </div>
        <Button
          onClick={handleSave}
          isLoading={saving}
          disabled={!hasChanges}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        >
          <Save size={18} className="mr-2" />
          Salvar Alterações
        </Button>
      </div>

      {/* Seção 1: Identidade Visual */}
      <div className="space-y-4">
        <SectionHeader
          id="identity"
          icon={<ImageIcon size={20} />}
          title="Identidade Visual"
          description="Logo, nome, descrição e cores do tema"
        />
        {expandedSections.has('identity') && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <ImageUpload
              value={formData.logoUrl}
              onChange={(value) => handleInputChange('logoUrl', value)}
              label="Logo do Restaurante"
              recommendedSize="512x512px"
              allowAIGeneration={true}
              aiPrompt={formData.name || 'Restaurante'}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome do Restaurante *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all"
                placeholder="Ex: Restaurante Demo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descrição / Sobre
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all resize-none"
                placeholder="Descreva seu restaurante, especialidades, história..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta descrição aparecerá nas páginas públicas
              </p>
            </div>

            <ColorPicker
              value={formData.themeColor}
              onChange={(value) => handleInputChange('themeColor', value)}
              label="Cor do Tema"
            />
          </div>
        )}
      </div>

      {/* Seção 2: Domínio e URLs */}
      <div className="space-y-4">
        <SectionHeader
          id="domain"
          icon={<Globe size={20} />}
          title="Domínio e URLs Públicas"
          description="Slug, domínio customizado e links públicos"
        />
        {expandedSections.has('domain') && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Slug (Identificador)
              </label>
              <input
                type="text"
                value={config.slug}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed font-mono"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                <span className="text-orange-600 font-semibold">ℹ️</span>
                <span>
                  O slug não pode ser alterado. É usado nas URLs públicas. Se
                  precisar mudar, será necessário criar um novo restaurante.
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Domínio Customizado (Opcional)
              </label>
              <input
                type="text"
                value={formData.customDomain}
                onChange={(e) =>
                  handleInputChange('customDomain', e.target.value)
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all font-mono"
                placeholder="exemplo.com.br"
              />
              <p className="text-xs text-gray-500 mt-2">
                Configure seu próprio domínio (requer configuração de DNS)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URLs Públicas
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <LinkIcon size={18} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500">Menu</p>
                    <p className="text-sm text-gray-900 font-mono truncate">
                      {publicUrls.menu}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => copyToClipboard(publicUrls.menu, 'URL do Menu')}
                      className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Copiar URL"
                    >
                      <Copy size={16} />
                    </button>
                    <a
                      href={publicUrls.menu}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Abrir em nova aba"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <LinkIcon size={18} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500">Fila</p>
                    <p className="text-sm text-gray-900 font-mono truncate">
                      {publicUrls.queue}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => copyToClipboard(publicUrls.queue, 'URL da Fila')}
                      className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Copiar URL"
                    >
                      <Copy size={16} />
                    </button>
                    <a
                      href={publicUrls.queue}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Abrir em nova aba"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <LinkIcon size={18} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500">
                      Reservas
                    </p>
                    <p className="text-sm text-gray-900 font-mono truncate">
                      {publicUrls.reservations}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        copyToClipboard(publicUrls.reservations, 'URL de Reservas')
                      }
                      className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Copiar URL"
                    >
                      <Copy size={16} />
                    </button>
                    <a
                      href={publicUrls.reservations}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Abrir em nova aba"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção 3: Informações de Contato */}
      <div className="space-y-4">
        <SectionHeader
          id="contact"
          icon={<Mail size={20} />}
          title="Informações de Contato"
          description="Endereço, telefone, email e redes sociais"
        />
        {expandedSections.has('contact') && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin size={16} />
                Endereço Completo
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all"
                placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone size={16} />
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all"
                  placeholder="contato@restaurante.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Redes Sociais
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                    <Instagram size={14} />
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.socialMedia.instagram}
                    onChange={(e) =>
                      handleInputChange('socialMedia.instagram', e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all"
                    placeholder="@restaurante"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                    <Facebook size={14} />
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={formData.socialMedia.facebook}
                    onChange={(e) =>
                      handleInputChange('socialMedia.facebook', e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all"
                    placeholder="restaurante.oficial"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção 4: Configurações Operacionais */}
      <div className="space-y-4">
        <SectionHeader
          id="operational"
          icon={<Settings size={20} />}
          title="Configurações Operacionais"
          description="Fila, reservas e tempos de atendimento"
        />
        {expandedSections.has('operational') && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tamanho Máximo do Grupo
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxPartySize}
                  onChange={(e) =>
                    handleInputChange('maxPartySize', parseInt(e.target.value, 10))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número máximo de pessoas por grupo
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tempo Médio de Mesa (minutos)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={formData.averageTableTimeMinutes}
                  onChange={(e) =>
                    handleInputChange(
                      'averageTableTimeMinutes',
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usado para calcular tempo estimado de espera
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Timeout de Chamada (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.calledTimeoutMinutes}
                  onChange={(e) =>
                    handleInputChange(
                      'calledTimeoutMinutes',
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tempo que o cliente tem para comparecer após ser chamado
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Antecedência Mínima de Reserva (horas)
                </label>
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={formData.minReservationAdvanceHours}
                  onChange={(e) =>
                    handleInputChange(
                      'minReservationAdvanceHours',
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tempo mínimo de antecedência necessário para fazer uma reserva
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Antecedência Máxima de Reserva (dias)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.maxReservationAdvanceDays}
                  onChange={(e) =>
                    handleInputChange(
                      'maxReservationAdvanceDays',
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tempo máximo de antecedência permitido para fazer uma reserva
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção 5: Status do Sistema */}
      <div className="space-y-4">
        <SectionHeader
          id="status"
          icon={<Power size={20} />}
          title="Status do Sistema"
          description="Ativar ou desativar funcionalidades"
        />
        {expandedSections.has('status') && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
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
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmToggleRestaurant}
        title={
          config?.isActive ? 'Desativar Restaurante' : 'Ativar Restaurante'
        }
        message={`Tem certeza que deseja ${config?.isActive ? 'desativar' : 'ativar'} o restaurante? ${
          config?.isActive
            ? 'Todas as funcionalidades serão bloqueadas.'
            : 'O restaurante voltará a funcionar normalmente.'
        }`}
        confirmLabel={config?.isActive ? 'Desativar' : 'Ativar'}
        variant={config?.isActive ? 'danger' : 'info'}
      />
    </div>
  );
};
