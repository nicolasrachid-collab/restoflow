import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { TimeBlock } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, X, Plus, Trash2, Edit, AlertCircle } from 'lucide-react';

export const TimeBlocks: React.FC = () => {
  const toast = useToast();
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<TimeBlock | null>(null);

  // Form state
  const [blockDate, setBlockDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const data = await api.get<TimeBlock[]>('/time-blocks');
      setBlocks(data);
    } catch (error: any) {
      console.error('Erro ao carregar bloqueios', error);
      toast.error('Erro ao carregar bloqueios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!blockDate) {
      toast.warning('Selecione uma data');
      return;
    }

    try {
      await api.post('/time-blocks', {
        date: blockDate,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        reason: reason || undefined,
      });
      setShowCreateModal(false);
      resetForm();
      loadBlocks();
      toast.success('Bloqueio criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar bloqueio', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao criar bloqueio';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (block: TimeBlock) => {
    setEditingBlock(block);
    const date = new Date(block.date);
    setBlockDate(date.toISOString().split('T')[0]);
    setStartTime(block.startTime || '');
    setEndTime(block.endTime || '');
    setReason(block.reason || '');
    setShowCreateModal(true);
  };

  const handleUpdate = async () => {
    if (!editingBlock || !blockDate) {
      toast.warning('Selecione uma data');
      return;
    }

    try {
      await api.patch(`/time-blocks/${editingBlock.id}`, {
        date: blockDate,
        startTime: startTime || null,
        endTime: endTime || null,
        reason: reason || null,
      });
      setShowCreateModal(false);
      setEditingBlock(null);
      resetForm();
      loadBlocks();
      toast.success('Bloqueio atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar bloqueio', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao atualizar bloqueio';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!blockToDelete) return;

    try {
      await api.delete(`/time-blocks/${blockToDelete.id}`);
      setShowDeleteModal(false);
      setBlockToDelete(null);
      loadBlocks();
      toast.success('Bloqueio removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover bloqueio', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao remover bloqueio';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setBlockDate('');
    setStartTime('');
    setEndTime('');
    setReason('');
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatTimeRange = (block: TimeBlock) => {
    if (!block.startTime && !block.endTime) {
      return 'Dia inteiro';
    }
    if (block.startTime && block.endTime) {
      return `${block.startTime} - ${block.endTime}`;
    }
    if (block.startTime) {
      return `A partir de ${block.startTime}`;
    }
    if (block.endTime) {
      return `Até ${block.endTime}`;
    }
    return '-';
  };

  const sortedBlocks = [...blocks].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bloqueios de Horário</h2>
          <p className="text-gray-500">Bloqueie datas e horários específicos para reservas</p>
        </div>
        <Button onClick={() => {
          setEditingBlock(null);
          resetForm();
          setShowCreateModal(true);
        }}>
          <Plus size={18} className="mr-2" />
          Novo Bloqueio
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : sortedBlocks.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum bloqueio cadastrado"
          description="Crie bloqueios para impedir reservas em datas e horários específicos"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {sortedBlocks.map((block) => (
              <div key={block.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar size={20} className="text-orange-600" />
                      <span className="font-semibold text-gray-900">
                        {formatDate(block.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 ml-8 mb-1">
                      <Clock size={16} />
                      <span>{formatTimeRange(block)}</span>
                    </div>
                    {block.reason && (
                      <div className="ml-8 text-sm text-gray-500">
                        <span className="font-medium">Motivo:</span> {block.reason}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(block)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setBlockToDelete(block);
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
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingBlock(null);
          resetForm();
        }}
        title={editingBlock ? 'Editar Bloqueio' : 'Novo Bloqueio'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horário de Início
                <span className="text-gray-400 text-xs ml-1">(Opcional - deixe vazio para dia inteiro)</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horário de Término
                <span className="text-gray-400 text-xs ml-1">(Opcional)</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                min={startTime || undefined}
              />
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <strong>Dica:</strong> Deixe ambos os horários vazios para bloquear o dia inteiro.
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo (Opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: Evento especial, Manutenção..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                setEditingBlock(null);
                resetForm();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={editingBlock ? handleUpdate : handleCreate} className="flex-1">
              {editingBlock ? 'Salvar Alterações' : 'Criar Bloqueio'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBlockToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Remover Bloqueio"
        message={`Tem certeza que deseja remover o bloqueio de ${blockToDelete ? formatDate(blockToDelete.date) : ''}?`}
        confirmLabel="Remover"
        variant="danger"
      />
    </div>
  );
};
