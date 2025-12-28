import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Waitlist } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Users, Phone, Mail, Calendar, Clock, X, Plus, Trash2, Bell, BellOff, CheckCircle2 } from 'lucide-react';

interface WaitlistStats {
  total: number;
  pending: number;
  notified: number;
}

export const WaitlistPage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<Waitlist[]>([]);
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Waitlist | null>(null);
  const [filterNotified, setFilterNotified] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  useEffect(() => {
    loadData();
  }, [filterNotified]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [waitlistData, statsData] = await Promise.all([
        api.get<Waitlist[]>(`/waitlist?includeNotified=${!filterNotified}`),
        api.get<WaitlistStats>('/waitlist/stats'),
      ]);
      setItems(waitlistData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Erro ao carregar waitlist', error);
      toast.error('Erro ao carregar lista de espera');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!customerName.trim() || !phone.trim()) {
      toast.warning('Nome e telefone são obrigatórios');
      return;
    }

    try {
      await api.post('/waitlist', {
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        partySize: parseInt(partySize) || 2,
        preferredDate: preferredDate || undefined,
        preferredTime: preferredTime || undefined,
      });
      setShowCreateModal(false);
      resetForm();
      loadData();
      toast.success('Cliente adicionado à lista de espera!');
    } catch (error: any) {
      console.error('Erro ao adicionar à waitlist', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao adicionar à lista de espera';
      toast.error(errorMessage);
    }
  };

  const handleMarkAsNotified = async (id: string) => {
    try {
      await api.patch(`/waitlist/${id}/notified`);
      loadData();
      toast.success('Cliente marcado como notificado!');
    } catch (error: any) {
      console.error('Erro ao marcar como notificado', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao atualizar';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await api.delete(`/waitlist/${itemToDelete.id}`);
      setShowDeleteModal(false);
      setItemToDelete(null);
      loadData();
      toast.success('Item removido da lista de espera!');
    } catch (error: any) {
      console.error('Erro ao remover item', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao remover item';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setPhone('');
    setEmail('');
    setPartySize('2');
    setPreferredDate('');
    setPreferredTime('');
  };

  const formatDate = (date: Date | string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const pendingItems = items.filter(item => !item.notified);
  const notifiedItems = items.filter(item => item.notified);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lista de Espera</h2>
          <p className="text-gray-500">Gerencie clientes aguardando vagas para reservas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterNotified ? 'ghost' : 'outline'}
            onClick={() => setFilterNotified(!filterNotified)}
          >
            {filterNotified ? 'Mostrar Todos' : 'Apenas Pendentes'}
          </Button>
          <Button onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}>
            <Plus size={18} className="mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
            <div className="text-sm text-orange-600 mb-1">Pendentes</div>
            <div className="text-2xl font-bold text-orange-700">{stats.pending}</div>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="text-sm text-green-600 mb-1">Notificados</div>
            <div className="text-2xl font-bold text-green-700">{stats.notified}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Lista de espera vazia"
          description="Quando as reservas estiverem lotadas, os clientes podem se inscrever na lista de espera"
        />
      ) : (
        <div className="space-y-4">
          {/* Itens Pendentes */}
          {pendingItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Bell className="text-orange-600" size={20} />
                Pendentes ({pendingItems.length})
              </h3>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Users size={20} className="text-orange-600" />
                            <span className="font-semibold text-gray-900">{item.customerName}</span>
                            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                              {item.partySize} {item.partySize === 1 ? 'pessoa' : 'pessoas'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 ml-8">
                            <div className="flex items-center gap-1">
                              <Phone size={16} />
                              <span>{item.phone}</span>
                            </div>
                            {item.email && (
                              <div className="flex items-center gap-1">
                                <Mail size={16} />
                                <span>{item.email}</span>
                              </div>
                            )}
                            {item.preferredDate && (
                              <div className="flex items-center gap-1">
                                <Calendar size={16} />
                                <span>{formatDate(item.preferredDate)}</span>
                              </div>
                            )}
                            {item.preferredTime && (
                              <div className="flex items-center gap-1">
                                <Clock size={16} />
                                <span>{item.preferredTime}</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-8 text-xs text-gray-400 mt-1">
                            Adicionado em {formatDate(item.createdAt)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarkAsNotified(item.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Marcar como notificado"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setItemToDelete(item);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Itens Notificados */}
          {notifiedItems.length > 0 && filterNotified && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BellOff className="text-green-600" size={20} />
                Notificados ({notifiedItems.length})
              </h3>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {notifiedItems.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors opacity-75">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Users size={20} className="text-gray-400" />
                            <span className="font-semibold text-gray-700">{item.customerName}</span>
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                              Notificado
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 ml-8">
                            <div className="flex items-center gap-1">
                              <Phone size={16} />
                              <span>{item.phone}</span>
                            </div>
                            {item.email && (
                              <div className="flex items-center gap-1">
                                <Mail size={16} />
                                <span>{item.email}</span>
                              </div>
                            )}
                            {item.notifiedAt && (
                              <div className="flex items-center gap-1 text-green-600">
                                <Clock size={16} />
                                <span>Notificado em {formatDate(item.notifiedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setItemToDelete(item);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Adicionar à Lista de Espera"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Nome do cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (Opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Pessoas
            </label>
            <input
              type="number"
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              min="1"
              max="20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Preferida (Opcional)
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horário Preferido (Opcional)
              </label>
              <input
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="flex-1">
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Remover da Lista de Espera"
        message={`Tem certeza que deseja remover ${itemToDelete?.customerName} da lista de espera?`}
        confirmLabel="Remover"
        variant="danger"
      />
    </div>
  );
};
