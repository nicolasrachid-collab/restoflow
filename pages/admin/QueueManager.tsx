import React, { useState, useEffect } from 'react';
import { QueueStatus } from '../../types';
import { useResto } from '../../context/RestoContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Users, Clock, Phone, CheckCircle, Plus, Link as LinkIcon, Copy, Share2, Bell, X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { validateRequired, validatePhone } from '../../utils/validation';
import { formatPhone } from '../../utils/format';

export const QueueManager: React.FC = () => {
  const { queue, updateQueueStatus, addQueueItem, isLoadingData } = useResto();
  const navigate = useNavigate();
  const toast = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [loading, setLoading] = useState(false);
  const [defaultLink, setDefaultLink] = useState<{ queueUrl: string } | null>(null);
  const [errors, setErrors] = useState<{ customerName?: string; phone?: string }>({});

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

  // Sort: Por ordem manual, depois por posição, depois por horário de entrada
  const sortedQueue = [...queue].sort((a, b) => {
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