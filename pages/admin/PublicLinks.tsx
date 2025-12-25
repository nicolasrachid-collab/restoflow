import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LinkCard } from '../../components/admin/LinkCard';
import { Plus, Link as LinkIcon, Copy, Share2 } from 'lucide-react';
import { api } from '../../services/api';
import { PublicLink } from '../../types';

interface PublicLinksResponse {
  default: {
    type: string;
    slug: string;
    restaurantName: string;
    queueUrl: string;
    reservationUrl: string;
    menuUrl: string;
  };
  custom: (PublicLink & { queueUrl: string; reservationUrl: string; menuUrl: string })[];
}

export const PublicLinks: React.FC = () => {
  const [links, setLinks] = useState<PublicLinksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [creating, setCreating] = useState(false);

  const baseUrl = window.location.origin;

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const data = await api.get<PublicLinksResponse>('/public-links');
      setLinks(data);
    } catch (error) {
      console.error('Erro ao carregar links', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!linkName.trim()) {
      alert('Digite um nome para o link');
      return;
    }

    setCreating(true);
    try {
      await api.post('/public-links', { name: linkName.trim() });
      setLinkName('');
      setShowCreateModal(false);
      loadLinks();
    } catch (error) {
      console.error('Erro ao criar link', error);
      alert('Erro ao criar link');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await api.patch(`/public-links/${id}/deactivate`);
      loadLinks();
    } catch (error) {
      console.error('Erro ao desativar link', error);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.patch(`/public-links/${id}/activate`);
      loadLinks();
    } catch (error) {
      console.error('Erro ao ativar link', error);
    }
  };

  const handleCopy = (url: string) => {
    console.log('Link copiado:', url);
  };

  const handleShare = (url: string) => {
    console.log('Link compartilhado:', url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando links...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Links Públicos</h2>
          <p className="text-gray-500">Gerencie e compartilhe links para fila, reservas e menu.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={18} className="mr-2" /> Gerar Novo Link
        </Button>
      </div>

      {/* Link Padrão */}
      {links?.default && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <LinkIcon size={20} className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Link Padrão</h3>
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
              Sempre Ativo
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Fila de Espera</div>
              <div className="font-mono text-sm text-gray-700 mb-3 break-all">
                {baseUrl}{links.default.queueUrl}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => {
                    navigator.clipboard.writeText(`${baseUrl}${links.default.queueUrl}`);
                    alert('Link copiado!');
                  }}
                  className="flex-1"
                >
                  <Copy size={14} className="mr-1" /> Copiar
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => {
                    const url = `https://wa.me/?text=${encodeURIComponent(`Acesse nossa fila: ${baseUrl}${links.default.queueUrl}`)}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1"
                >
                  <Share2 size={14} className="mr-1" /> Compartilhar
                </Button>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Reservas</div>
              <div className="font-mono text-sm text-gray-700 mb-3 break-all">
                {baseUrl}{links.default.reservationUrl}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => {
                    navigator.clipboard.writeText(`${baseUrl}${links.default.reservationUrl}`);
                    alert('Link copiado!');
                  }}
                  className="flex-1"
                >
                  <Copy size={14} className="mr-1" /> Copiar
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => {
                    const url = `https://wa.me/?text=${encodeURIComponent(`Faça sua reserva: ${baseUrl}${links.default.reservationUrl}`)}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1"
                >
                  <Share2 size={14} className="mr-1" /> Compartilhar
                </Button>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Menu</div>
              <div className="font-mono text-sm text-gray-700 mb-3 break-all">
                {baseUrl}{links.default.menuUrl}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => {
                    navigator.clipboard.writeText(`${baseUrl}${links.default.menuUrl}`);
                    alert('Link copiado!');
                  }}
                  className="flex-1"
                >
                  <Copy size={14} className="mr-1" /> Copiar
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => {
                    const url = `https://wa.me/?text=${encodeURIComponent(`Veja nosso menu: ${baseUrl}${links.default.menuUrl}`)}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1"
                >
                  <Share2 size={14} className="mr-1" /> Compartilhar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Links Personalizados */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <LinkIcon size={20} className="text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Links Personalizados</h3>
        </div>
        {links?.custom && links.custom.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.custom.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                baseUrl={baseUrl}
                onCopy={handleCopy}
                onShare={handleShare}
                onDeactivate={handleDeactivate}
                onActivate={handleActivate}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 border-dashed">
            <LinkIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-gray-900 font-medium mb-2">Nenhum link personalizado</h3>
            <p className="text-gray-500 text-sm mb-4">
              Crie links personalizados para diferentes canais (Instagram, WhatsApp, etc.)
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={18} className="mr-2" /> Criar Primeiro Link
            </Button>
          </div>
        )}
      </div>

      {/* Modal Criar Link */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setLinkName('');
        }}
        title="Criar Link Personalizado"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Link
            </label>
            <input
              type="text"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: Instagram, WhatsApp, Cardápio Digital"
            />
            <p className="text-xs text-gray-500 mt-1">
              Este nome é apenas para organização. O link funcionará igual ao padrão.
            </p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                setLinkName('');
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateLink}
              isLoading={creating}
              className="flex-1"
            >
              <Plus size={18} className="mr-2" /> Criar Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

