import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useResto } from '../../context/RestoContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { CalendarDays, Phone, Users, Check, X, Search, Clock, Link as LinkIcon, Copy, Share2, Calendar, AlertCircle } from 'lucide-react';
import { ReservationStatus } from '../../types';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export const Reservations: React.FC = () => {
  const toast = useToast();
  const { reservations, updateReservationStatus, addReservation } = useResto();
  const navigate = useNavigate();
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultLink, setDefaultLink] = useState<{ reservationUrl: string } | null>(null);

  useEffect(() => {
    const loadDefaultLink = async () => {
      try {
        const data = await api.get<{ default: { reservationUrl: string } }>('/public-links');
        setDefaultLink(data.default);
      } catch (error) {
        console.error('Erro ao carregar link padrão', error);
      }
    };
    loadDefaultLink();
  }, []);

  const baseUrl = window.location.origin;
  const reservationUrl = defaultLink ? `${baseUrl}${defaultLink.reservationUrl}` : '';

  // New Reservation Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSize, setNewSize] = useState('2');
  const [newTime, setNewTime] = useState('19:00');
  const [newNotes, setNewNotes] = useState('');
  const [rescheduleModal, setRescheduleModal] = useState<{ open: boolean; reservationId: string | null; newDate: string; newTime: string }>({
    open: false,
    reservationId: null,
    newDate: '',
    newTime: '',
  });

  // Filter reservations for the selected date
  const todaysReservations = reservations.filter(res => {
    return new Date(res.date).toISOString().split('T')[0] === filterDate;
  });

  const handleAddReservation = (e: React.FormEvent) => {
    e.preventDefault();
    
    const [year, month, day] = filterDate.split('-').map(Number);
    const [hour, minute] = newTime.split(':').map(Number);
    
    // Create date object correctly handling timezone simply for demo
    const dateObj = new Date(year, month - 1, day, hour, minute);

    addReservation({
      customerName: newName,
      phone: newPhone,
      partySize: parseInt(newSize),
      date: dateObj,
      notes: newNotes
    });

    // Reset and Close
    setNewName('');
    setNewPhone('');
    setNewNotes('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Links Públicos Section */}
      {reservationUrl && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon size={20} className="text-orange-600" />
                <h3 className="font-bold text-gray-900">Link Público de Reservas</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Compartilhe este link com seus clientes para que eles façam reservas online.
              </p>
              <div className="bg-white p-3 rounded-lg border border-orange-200 font-mono text-sm text-gray-700 break-all mb-3">
                {reservationUrl}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(reservationUrl);
                    toast.success('Link copiado!');
                  }}
                >
                  <Copy size={14} className="mr-1" /> Copiar Link
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const url = `https://wa.me/?text=${encodeURIComponent(`Faça sua reserva: ${reservationUrl}`)}`;
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
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Reservas</h2>
          <p className="text-gray-500">Visualize e confirme reservas de mesas.</p>
        </div>
        <div className="flex gap-2">
            <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-orange-500"
            />
            <Button onClick={() => setIsModalOpen(true)}>
                <CalendarDays size={18} className="mr-2" /> Nova Reserva
            </Button>
        </div>
      </div>

      {/* Modal for New Reservation */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nova Reserva Manual"
      >
        <form onSubmit={handleAddReservation} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-lg"/>
            </div>
            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input required type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-lg"/>
                </div>
                <div className="w-24">
                     <label className="block text-sm font-medium text-gray-700">Pessoas</label>
                     <input required type="number" value={newSize} onChange={e => setNewSize(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-lg"/>
                </div>
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-700">Horário ({new Date(filterDate).toLocaleDateString('pt-BR')})</label>
                 <input required type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-lg"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Notas</label>
                <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-lg" rows={2}></textarea>
            </div>
            <Button type="submit" className="w-full">Criar Reserva</Button>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleModal.open}
        onClose={() => setRescheduleModal({ open: false, reservationId: null, newDate: '', newTime: '' })}
        title="Reagendar Reserva"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!rescheduleModal.reservationId) return;
          
          try {
            const [year, month, day] = rescheduleModal.newDate.split('-').map(Number);
            const [hour, minute] = rescheduleModal.newTime.split(':').map(Number);
            const newDate = new Date(year, month - 1, day, hour, minute);
            
            await api.post(`/reservations/${rescheduleModal.reservationId}/reschedule`, {
              date: newDate.toISOString(),
            });
            
            setRescheduleModal({ open: false, reservationId: null, newDate: '', newTime: '' });
            // refreshData será chamado via WebSocket ou contexto
            toast.success('Reserva reagendada com sucesso!');
          } catch (error: any) {
            console.error('Erro ao reagendar', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao reagendar reserva';
            toast.error(errorMessage);
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Data</label>
            <input
              required
              type="date"
              value={rescheduleModal.newDate}
              onChange={(e) => setRescheduleModal({ ...rescheduleModal, newDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Novo Horário</label>
            <input
              required
              type="time"
              value={rescheduleModal.newTime}
              onChange={(e) => setRescheduleModal({ ...rescheduleModal, newTime: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRescheduleModal({ open: false, reservationId: null, newDate: '', newTime: '' })}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              <Calendar size={18} className="mr-2" /> Reagendar
            </Button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 gap-4">
        {todaysReservations.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 border-dashed">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-3">
                    <CalendarDays size={24}/>
                </div>
                <h3 className="text-gray-900 font-medium">Nenhuma reserva para este dia</h3>
                <p className="text-gray-500 text-sm mt-1">Altere a data ou adicione manualmente.</p>
            </div>
        ) : (
            todaysReservations.map(res => (
                <div key={res.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-up">
                    <div className="flex gap-4 items-center">
                        <div className="bg-orange-50 text-orange-700 font-bold text-xl p-4 rounded-lg text-center min-w-[80px]">
                            {new Date(res.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'})}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{res.customerName}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1"><Users size={14}/> {res.partySize} pessoas</span>
                                <span className="flex items-center gap-1"><Phone size={14}/> {res.phone}</span>
                            </div>
                            {res.notes && <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-2 inline-block">Nota: {res.notes}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                            ${res.status === ReservationStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${res.status === ReservationStatus.CONFIRMED ? 'bg-orange-100 text-orange-800' : ''}
                            ${res.status === ReservationStatus.CHECKED_IN ? 'bg-green-100 text-green-800' : ''}
                            ${res.status === ReservationStatus.CANCELLED ? 'bg-gray-100 text-gray-800' : ''}
                            ${res.status === ReservationStatus.NO_SHOW ? 'bg-red-100 text-red-800' : ''}
                            ${res.status === ReservationStatus.COMPLETED ? 'bg-green-100 text-green-800' : ''}
                        `}>
                            {res.status === ReservationStatus.PENDING && 'Pendente'}
                            {res.status === ReservationStatus.CONFIRMED && 'Confirmado'}
                            {res.status === ReservationStatus.CHECKED_IN && 'Chegou'}
                            {res.status === ReservationStatus.CANCELLED && 'Cancelado'}
                            {res.status === ReservationStatus.NO_SHOW && 'No-Show'}
                            {res.status === ReservationStatus.COMPLETED && 'Concluído'}
                        </span>

                        {res.status === ReservationStatus.PENDING && (
                            <>
                                <button 
                                    onClick={() => updateReservationStatus(res.id, ReservationStatus.CONFIRMED)}
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-full" 
                                    title="Confirmar Reserva"
                                >
                                    <Check size={20} />
                                </button>
                                <button 
                                    onClick={() => updateReservationStatus(res.id, ReservationStatus.CANCELLED)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                    title="Cancelar Reserva"
                                >
                                    <X size={20} />
                                </button>
                            </>
                        )}

                        {res.status === ReservationStatus.CONFIRMED && (
                            <>
                                <button 
                                    onClick={() => updateReservationStatus(res.id, ReservationStatus.CHECKED_IN)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-full" 
                                    title="Check-in"
                                >
                                    <Check size={20} />
                                </button>
                                <button 
                                    onClick={() => {
                                        const resDate = new Date(res.date);
                                        setRescheduleModal({
                                          open: true,
                                          reservationId: res.id,
                                          newDate: resDate.toISOString().split('T')[0],
                                          newTime: resDate.toTimeString().slice(0, 5),
                                        });
                                    }}
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-full"
                                    title="Reagendar"
                                >
                                    <Calendar size={20} />
                                </button>
                                <button 
                                    onClick={() => updateReservationStatus(res.id, ReservationStatus.CANCELLED)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                    title="Cancelar Reserva"
                                >
                                    <X size={20} />
                                </button>
                            </>
                        )}

                        {res.status === ReservationStatus.CHECKED_IN && (
                            <button 
                                onClick={() => updateReservationStatus(res.id, ReservationStatus.COMPLETED)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                                title="Marcar como Concluído"
                            >
                                <Check size={20} />
                            </button>
                        )}

                        {(res.status === ReservationStatus.CONFIRMED || res.status === ReservationStatus.CHECKED_IN) && (
                            <button 
                                onClick={() => updateReservationStatus(res.id, ReservationStatus.NO_SHOW)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                title="Marcar como No-Show"
                            >
                                <AlertCircle size={20} />
                            </button>
                        )}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};