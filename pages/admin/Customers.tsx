import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useResto } from '../../context/RestoContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Customer, QueueItem, Reservation } from '../../types';
import { Users, Search, Edit, Mail, Phone, Calendar, Clock, AlertCircle } from 'lucide-react';

interface CustomerWithHistory extends Customer {
  queueItems?: QueueItem[];
  reservations?: Reservation[];
}

export const Customers: React.FC = () => {
  const toast = useToast();
  const { queue, reservations } = useResto();
  const [customers, setCustomers] = useState<CustomerWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithHistory | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.get<Customer[]>('/customers');
      // Enriquecer com histórico de atendimentos
      const customersWithHistory: CustomerWithHistory[] = data.map(customer => ({
        ...customer,
        queueItems: queue.filter(item => item.phone === customer.phone),
        reservations: reservations.filter(res => res.phone === customer.phone),
      }));
      setCustomers(customersWithHistory);
    } catch (error: any) {
      console.error('Erro ao carregar clientes', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao carregar clientes';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditEmail(customer.email || '');
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    if (!editName.trim()) {
      toast.warning('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/customers/${editingCustomer.id}`, {
        name: editName.trim(),
        email: editEmail.trim() || undefined,
      });
      setEditingCustomer(null);
      setEditName('');
      setEditEmail('');
      loadCustomers();
      toast.success('Cliente atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar cliente', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao atualizar cliente';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTotalVisits = (customer: CustomerWithHistory): number => {
    const queueCount = customer.queueItems?.length || 0;
    const reservationCount = customer.reservations?.length || 0;
    return queueCount + reservationCount;
  };

  const getLastVisit = (customer: CustomerWithHistory): Date | null => {
    const queueDates = customer.queueItems?.map(item => new Date(item.joinedAt)) || [];
    const reservationDates = customer.reservations?.map(res => new Date(res.date)) || [];
    const allDates = [...queueDates, ...reservationDates];
    if (allDates.length === 0) return null;
    return new Date(Math.max(...allDates.map(d => d.getTime())));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h2>
        <p className="text-gray-500">Visualize e gerencie o histórico de clientes</p>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-0 focus:ring-0 text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description={searchTerm ? 'Tente buscar com outros termos' : 'Clientes aparecerão aqui quando houver atendimentos'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const totalVisits = getTotalVisits(customer);
            const lastVisit = getLastVisit(customer);
            
            return (
              <div
                key={customer.id}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Phone size={14} />
                      {customer.phone}
                    </p>
                    {customer.email && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Mail size={14} />
                        {customer.email}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(customer);
                    }}
                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total de visitas:</span>
                    <span className="font-semibold text-orange-600">{totalVisits}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Na fila:</span>
                    <span className="font-semibold">{customer.queueItems?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Reservas:</span>
                    <span className="font-semibold">{customer.reservations?.length || 0}</span>
                  </div>
                  {lastVisit && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Clock size={14} />
                        Última visita:
                      </span>
                      <span className="font-semibold text-gray-700">
                        {lastVisit.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Edição */}
      {editingCustomer && (
        <Modal
          isOpen={!!editingCustomer}
          onClose={() => {
            setEditingCustomer(null);
            setEditName('');
            setEditEmail('');
          }}
          title="Editar Cliente"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveEdit}
                disabled={saving || !editName.trim()}
                className="flex-1"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingCustomer(null);
                  setEditName('');
                  setEditEmail('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Detalhes do Cliente */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Histórico - ${selectedCustomer.name}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Informações do Cliente */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-semibold text-gray-900">{selectedCustomer.phone}</p>
                </div>
                {selectedCustomer.email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">{selectedCustomer.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Cliente desde</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total de visitas</p>
                  <p className="font-semibold text-orange-600">{getTotalVisits(selectedCustomer)}</p>
                </div>
              </div>
            </div>

            {/* Histórico de Fila */}
            {selectedCustomer.queueItems && selectedCustomer.queueItems.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users size={20} />
                  Histórico na Fila ({selectedCustomer.queueItems.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedCustomer.queueItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.partySize} {item.partySize === 1 ? 'pessoa' : 'pessoas'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(item.joinedAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === 'DONE' ? 'bg-green-100 text-green-700' :
                          item.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700' :
                          item.status === 'NO_SHOW' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.status === 'DONE' ? 'Concluído' :
                           item.status === 'CANCELLED' ? 'Cancelado' :
                           item.status === 'NO_SHOW' ? 'No-Show' :
                           'Aguardando'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico de Reservas */}
            {selectedCustomer.reservations && selectedCustomer.reservations.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar size={20} />
                  Histórico de Reservas ({selectedCustomer.reservations.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedCustomer.reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(reservation.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-sm text-gray-500">
                            {reservation.partySize} {reservation.partySize === 1 ? 'pessoa' : 'pessoas'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          reservation.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          reservation.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700' :
                          reservation.status === 'NO_SHOW' ? 'bg-red-100 text-red-700' :
                          reservation.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {reservation.status === 'COMPLETED' ? 'Concluída' :
                           reservation.status === 'CANCELLED' ? 'Cancelada' :
                           reservation.status === 'NO_SHOW' ? 'No-Show' :
                           reservation.status === 'CONFIRMED' ? 'Confirmada' :
                           'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!selectedCustomer.queueItems || selectedCustomer.queueItems.length === 0) &&
             (!selectedCustomer.reservations || selectedCustomer.reservations.length === 0) && (
              <div className="text-center py-8">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhum histórico de atendimento encontrado</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setSelectedCustomer(null)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

