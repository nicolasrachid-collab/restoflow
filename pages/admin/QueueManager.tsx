import React, { useState, useEffect } from 'react';
import { QueueStatus } from '../../types';
import { useResto } from '../../context/RestoContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Users, Clock, Phone, CheckCircle, Plus, Link as LinkIcon, Copy, Share2, Bell, X, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { validateRequired, validatePhone } from '../../utils/validation';
import { formatPhone } from '../../utils/format';

export const QueueManager: React.FC = () => {
  const { queue, updateQueueStatus, addQueueItem, moveQueueItem, isLoadingData } = useResto();
  const navigate = useNavigate();
  const toast = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [loading, setLoading] = useState(false);
  const [defaultLink, setDefaultLink] = useState<{ queueUrl: string } | null>(null);
  const [errors, setErrors] = useState<{ customerName?: string; phone?: string }>({});
  const [filters, setFilters] = useState<{
    partySize: string;
    status: QueueStatus[];
    notificationStatus: 'all' | 'notified' | 'pending';
  }>({
    partySize: 'all',
    status: [],
    notificationStatus: 'all',
  });

  useEffect(() => {
    const loadDefaultLink = async () => {
      try {
        const data = await api.get<{ default: { queueUrl: string } }>('/public-links');
        setDefaultLink(data.default);
      } catch (error) {
        console.error('Erro ao carregar link padrão', error);
      }
    };
    loadDefaultLink();
  }, []);

  const baseUrl = window.location.origin;
  const queueUrl = defaultLink ? `${baseUrl}${defaultLink.queueUrl}` : '';

  // Filtrar fila
  const filteredQueue = queue.filter(item => {
    // Filtro por tamanho da mesa
    if (filters.partySize !== 'all') {
      const sizeNum = parseInt(filters.partySize);
      if (filters.partySize === '1-2' && item.partySize > 2) return false;
      if (filters.partySize === '3-4' && (item.partySize < 3 || item.partySize > 4)) return false;
      if (filters.partySize === '5+' && item.partySize < 5) return false;
    }
    
    // Filtro por status
    if (filters.status.length > 0 && !filters.status.includes(item.status)) {
      return false;
    }
    
    // Filtro por status de notificação
    if (filters.notificationStatus !== 'all') {
      if (filters.notificationStatus === 'notified' && item.status !== QueueStatus.NOTIFIED) return false;
      if (filters.notificationStatus === 'pending' && item.status === QueueStatus.NOTIFIED) return false;
    }
    
    return true;
  });

  // Sort: Por ordem manual, depois por posição, depois por horário de entrada
  const sortedQueue = [...filteredQueue].sort((a, b) => {
    // Ordem manual primeiro
    if (a.manualOrder !== b.manualOrder) {
      return a.manualOrder ? -1 : 1;
    }
    // Depois por posição
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    // Por último por horário de entrada
    return a.joinedAt.getTime() - b.joinedAt.getTime();
  });

  const handleNotify = async (id: string) => {
    try {
      await api.post(`/queue/${id}/notify`);
      toast.success('Cliente notificado com sucesso!');
      // refreshData será chamado via WebSocket
    } catch (error: any) {
      console.error('Erro ao notificar cliente', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao notificar cliente';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Links Públicos Section */}
      {queueUrl && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon size={20} className="text-orange-600" />
                <h3 className="font-bold text-gray-900">Link Público da Fila</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Compartilhe este link com seus clientes para que eles entrem na fila virtualmente.
              </p>
              <div className="bg-white p-3 rounded-lg border border-orange-200 font-mono text-sm text-gray-700 break-all mb-3">
                {queueUrl}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(queueUrl);
                    toast.success('Link copiado para a área de transferência!');
                  }}
                >
                  <Copy size={14} className="mr-1" /> Copiar Link
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const url = `https://wa.me/?text=${encodeURIComponent(`Acesse nossa fila virtual: ${queueUrl}`)}`;
                    window.open(url, '_blank');
                  }}
                >
                  <Share2 size={14} className="mr-1" /> Compartilhar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate('/admin/links')}
                >
                  Gerenciar Links
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fila de Espera em Tempo Real</h2>
          <p className="text-gray-500">Acompanhe clientes entrando via link público.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Users size={18} className="mr-2" /> Adicionar Manualmente
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-xs font-medium uppercase mb-1">Aguardando</div>
          <div className="text-2xl font-bold text-orange-600">{queue.filter(i => i.status === QueueStatus.WAITING).length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-xs font-medium uppercase mb-1">Notificados</div>
          <div className="text-2xl font-bold text-amber-600">{queue.filter(i => i.status === QueueStatus.NOTIFIED).length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-xs font-medium uppercase mb-1">Chamados</div>
          <div className="text-2xl font-bold text-orange-600">{queue.filter(i => i.status === QueueStatus.CALLED).length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-xs font-medium uppercase mb-1">Concluídos</div>
          <div className="text-2xl font-bold text-green-600">{queue.filter(i => i.status === QueueStatus.DONE).length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-xs font-medium uppercase mb-1">No-Show</div>
          <div className="text-2xl font-bold text-red-600">{queue.filter(i => i.status === QueueStatus.NO_SHOW).length}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por tamanho da mesa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamanho da Mesa
            </label>
            <select
              value={filters.partySize}
              onChange={(e) => setFilters({ ...filters, partySize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Todos</option>
              <option value="1-2">1-2 pessoas</option>
              <option value="3-4">3-4 pessoas</option>
              <option value="5+">5+ pessoas</option>
            </select>
          </div>

          {/* Filtro por status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {[QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.CALLED, QueueStatus.DONE, QueueStatus.CANCELLED, QueueStatus.NO_SHOW].map(status => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters({ ...filters, status: [...filters.status, status] });
                      } else {
                        setFilters({ ...filters, status: filters.status.filter(s => s !== status) });
                      }
                    }}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">
                    {status === QueueStatus.WAITING && 'Aguardando'}
                    {status === QueueStatus.NOTIFIED && 'Notificado'}
                    {status === QueueStatus.CALLED && 'Chamado'}
                    {status === QueueStatus.DONE && 'Concluído'}
                    {status === QueueStatus.CANCELLED && 'Cancelado'}
                    {status === QueueStatus.NO_SHOW && 'No-Show'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filtro por status de notificação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status de Notificação
            </label>
            <select
              value={filters.notificationStatus}
              onChange={(e) => setFilters({ ...filters, notificationStatus: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Todos</option>
              <option value="notified">Notificado</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analytics Básicos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Estatísticas da Fila</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tempo médio de espera atual */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Tempo Médio de Espera</div>
            <div className="text-2xl font-bold text-orange-600">
              {(() => {
                const completedItems = queue.filter(q => 
                  q.status === QueueStatus.DONE && q.calledAt && q.joinedAt
                );
                if (completedItems.length === 0) return 'N/A';
                const waitTimes = completedItems.map(item => {
                  const joinedTime = new Date(item.joinedAt).getTime();
                  const calledTime = new Date(item.calledAt!).getTime();
                  return (calledTime - joinedTime) / (1000 * 60);
                });
                const average = waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;
                return `${Math.round(average)} min`;
              })()}
            </div>
          </div>

          {/* Total na fila */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Total na Fila</div>
            <div className="text-2xl font-bold text-gray-900">
              {queue.filter(i => i.status === QueueStatus.WAITING || i.status === QueueStatus.NOTIFIED).length}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {queue.filter(i => i.status === QueueStatus.WAITING).length} aguardando + {queue.filter(i => i.status === QueueStatus.NOTIFIED).length} notificados
            </div>
          </div>

          {/* Taxa de conclusão */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Taxa de Conclusão</div>
            <div className="text-2xl font-bold text-green-600">
              {(() => {
                const total = queue.filter(q => 
                  q.status === QueueStatus.DONE || q.status === QueueStatus.NO_SHOW || q.status === QueueStatus.CANCELLED
                ).length;
                const done = queue.filter(q => q.status === QueueStatus.DONE).length;
                if (total === 0) return '0%';
                return `${Math.round((done / total) * 100)}%`;
              })()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {queue.filter(q => q.status === QueueStatus.DONE).length} de {queue.filter(q => 
                q.status === QueueStatus.DONE || q.status === QueueStatus.NO_SHOW || q.status === QueueStatus.CANCELLED
              ).length} concluídos
            </div>
          </div>
        </div>

        {/* Histórico recente de chamadas */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Últimas Chamadas</h4>
          <div className="space-y-2">
            {queue
              .filter(q => q.status === QueueStatus.DONE && q.calledAt)
              .sort((a, b) => {
                const aTime = new Date(a.calledAt!).getTime();
                const bTime = new Date(b.calledAt!).getTime();
                return bTime - aTime;
              })
              .slice(0, 5)
              .map(item => {
                const waitTime = Math.floor((new Date(item.calledAt!).getTime() - new Date(item.joinedAt).getTime()) / 60000);
                return (
                  <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">{item.customerName}</span>
                    <span className="text-gray-500">{waitTime} min de espera</span>
                  </div>
                );
              })}
            {queue.filter(q => q.status === QueueStatus.DONE && q.calledAt).length === 0 && (
              <p className="text-sm text-gray-400 italic">Nenhuma chamada registrada ainda</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pessoas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Espera</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoadingData ? (
              <tr>
                <td colSpan={5} className="px-6 py-4">
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} height={60} width="100%" />
                    ))}
                  </div>
                </td>
              </tr>
            ) : sortedQueue.length === 0 ? (
               <tr>
                 <td colSpan={5} className="px-6 py-12">
                   <EmptyState
                     icon={Users}
                     title="Nenhum cliente na fila"
                     description="Quando clientes entrarem na fila através do link público, eles aparecerão aqui."
                     action={{
                       label: 'Adicionar Manualmente',
                       onClick: () => setShowAddModal(true),
                     }}
                   />
                 </td>
               </tr>
            ) : sortedQueue.map((item) => {
              const isInactive = item.status === QueueStatus.DONE || item.status === QueueStatus.CANCELLED || item.status === QueueStatus.NO_SHOW;
              const waitTime = Math.floor((Date.now() - new Date(item.joinedAt).getTime()) / 60000);
              const calledTime = item.calledAt ? Math.floor((Date.now() - new Date(item.calledAt).getTime()) / 60000) : null;

              return (
                <tr key={item.id} className={isInactive ? 'bg-gray-50 opacity-60' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {item.manualOrder && (
                        <span className="text-xs text-orange-600 font-bold" title="Ordem manual">⚡</span>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.customerName}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12}/> {item.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      {item.partySize} pax
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {waitTime} min
                    </div>
                    {item.status === QueueStatus.CALLED && calledTime !== null && (
                      <div className="text-xs text-amber-600 mt-1">
                        Chamado há {calledTime} min
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${item.status === QueueStatus.WAITING ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${item.status === QueueStatus.NOTIFIED ? 'bg-amber-100 text-amber-800' : ''}
                      ${item.status === QueueStatus.CALLED ? 'bg-orange-100 text-orange-800' : ''}
                      ${item.status === QueueStatus.DONE ? 'bg-green-100 text-green-800' : ''}
                      ${item.status === QueueStatus.CANCELLED ? 'bg-gray-100 text-gray-800' : ''}
                      ${item.status === QueueStatus.NO_SHOW ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {item.status === QueueStatus.WAITING && 'Aguardando'}
                      {item.status === QueueStatus.NOTIFIED && 'Notificado'}
                      {item.status === QueueStatus.CALLED && 'Chamado'}
                      {item.status === QueueStatus.DONE && 'Concluído'}
                      {item.status === QueueStatus.CANCELLED && 'Cancelado'}
                      {item.status === QueueStatus.NO_SHOW && 'No-Show'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {/* Botões de mover na fila - apenas para WAITING e NOTIFIED */}
                      {(item.status === QueueStatus.WAITING || item.status === QueueStatus.NOTIFIED) && (
                        <>
                          <button
                            onClick={() => {
                              const currentIndex = sortedQueue.findIndex(q => q.id === item.id);
                              if (currentIndex > 0) {
                                moveQueueItem(item.id, sortedQueue[currentIndex - 1].position);
                              }
                            }}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Mover para cima"
                            disabled={sortedQueue.findIndex(q => q.id === item.id) === 0}
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            onClick={() => {
                              const currentIndex = sortedQueue.findIndex(q => q.id === item.id);
                              if (currentIndex < sortedQueue.length - 1) {
                                moveQueueItem(item.id, sortedQueue[currentIndex + 1].position);
                              }
                            }}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Mover para baixo"
                            disabled={sortedQueue.findIndex(q => q.id === item.id) === sortedQueue.length - 1}
                          >
                            <ChevronDown size={16} />
                          </button>
                        </>
                      )}
                      {item.status === QueueStatus.WAITING && (
                        <>
                          <button 
                            onClick={() => handleNotify(item.id)}
                            className="text-amber-600 hover:text-amber-900 font-semibold flex items-center gap-1"
                            title="Notificar cliente"
                          >
                            <Bell size={16}/> Notificar
                          </button>
                          <button 
                            onClick={() => updateQueueStatus(item.id, QueueStatus.CALLED)}
                            className="text-orange-600 hover:text-orange-900 font-semibold"
                          >
                            Chamar
                          </button>
                        </>
                      )}
                      {item.status === QueueStatus.NOTIFIED && (
                        <button 
                          onClick={() => updateQueueStatus(item.id, QueueStatus.CALLED)}
                          className="text-orange-600 hover:text-orange-900 font-semibold"
                        >
                          Chamar
                        </button>
                      )}
                      {item.status === QueueStatus.CALLED && (
                        <>
                          <button 
                            onClick={() => updateQueueStatus(item.id, QueueStatus.DONE)}
                            className="text-green-600 hover:text-green-900 font-semibold flex items-center gap-1"
                          >
                            <CheckCircle size={16}/> Concluir
                          </button>
                          <button 
                            onClick={() => updateQueueStatus(item.id, QueueStatus.NO_SHOW)}
                            className="text-red-600 hover:text-red-900 font-semibold flex items-center gap-1"
                            title="Marcar como no-show"
                          >
                            <AlertCircle size={16}/> No-Show
                          </button>
                        </>
                      )}
                      {/* Botão WhatsApp - sempre visível se tiver telefone */}
                      {item.phone && (
                        <a
                          href={`https://wa.me/${item.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900 font-semibold flex items-center gap-1"
                          title="Abrir WhatsApp"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </a>
                      )}
                      {(item.status === QueueStatus.WAITING || item.status === QueueStatus.NOTIFIED) && (
                        <button 
                          onClick={() => updateQueueStatus(item.id, QueueStatus.CANCELLED)}
                          className="text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-1"
                          title="Cancelar"
                        >
                          <X size={16}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Manual Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false);
          setCustomerName('');
          setPhone('');
          setPartySize('2');
        }}
        title="Adicionar à Fila Manualmente"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
            <input 
              type="text" 
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setErrors({ ...errors, customerName: undefined });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                errors.customerName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: João Silva"
            />
            {errors.customerName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.customerName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setPhone(formatted);
                if (formatted && !validatePhone(formatted)) {
                  setErrors({ ...errors, phone: 'Telefone inválido' });
                } else {
                  setErrors({ ...errors, phone: undefined });
                }
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="(11) 99999-9999"
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantas Pessoas?</label>
            <select 
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {[1,2,3,4,5,6,7,8,9,10,12,15].map(n => (
                <option key={n} value={n}>{n} pessoas</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                const newErrors: typeof errors = {};
                
                if (!validateRequired(customerName)) {
                  newErrors.customerName = 'Nome é obrigatório';
                }
                
                if (!validateRequired(phone)) {
                  newErrors.phone = 'Telefone é obrigatório';
                } else if (!validatePhone(phone)) {
                  newErrors.phone = 'Telefone inválido';
                }

                if (Object.keys(newErrors).length > 0) {
                  setErrors(newErrors);
                  toast.error('Por favor, corrija os erros no formulário');
                  return;
                }

                setLoading(true);
                try {
                  await addQueueItem({
                    customerName,
                    phone,
                    partySize: parseInt(partySize),
                  });
                  setShowAddModal(false);
                  setCustomerName('');
                  setPhone('');
                  setPartySize('2');
                  setErrors({});
                } catch (error) {
                  // Error já é tratado no addQueueItem via toast
                } finally {
                  setLoading(false);
                }
              }}
              isLoading={loading}
              className="flex-1"
            >
              <Plus size={18} className="mr-2" /> Adicionar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};