import React, { useState, useEffect } from 'react';
import { useResto } from '../../context/RestoContext';
import { QueueStatus, ReservationStatus } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, CalendarDays, DollarSign, Star, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface QueueMetrics {
  total: number;
  completed: number;
  noShows: number;
  cancelled: number;
  averageWaitMinutes: number;
  noShowRate: number;
}

interface ReservationMetrics {
  total: number;
  confirmed: number;
  checkedIn: number;
  completed: number;
  noShows: number;
  cancelled: number;
  noShowRate: number;
  attendanceRate: number;
}

interface CapacityMetrics {
  date: string;
  queueItemsServed: number;
  reservationsServed: number;
  totalPeopleServed: number;
}

const STATIC_CHART_DATA = [
  { name: 'Seg', clientes: 40 },
  { name: 'Ter', clientes: 30 },
  { name: 'Qua', clientes: 45 },
  { name: 'Qui', clientes: 55 },
  { name: 'Sex', clientes: 80 },
  { name: 'Sab', clientes: 95 },
  { name: 'Dom', clientes: 70 },
];

export const Dashboard: React.FC = () => {
  const { queue, reservations } = useResto();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [reservationMetrics, setReservationMetrics] = useState<ReservationMetrics | null>(null);
  const [capacityMetrics, setCapacityMetrics] = useState<CapacityMetrics | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let startDate: Date | undefined;
      let endDate: Date | undefined = new Date();
      endDate.setHours(23, 59, 59, 999);

      if (period === 'today') {
        startDate = today;
      } else if (period === 'week') {
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
      }

      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const queryString = new URLSearchParams(params).toString();
      const queueQuery = queryString ? `/metrics/queue?${queryString}` : '/metrics/queue';
      const reservationQuery = queryString ? `/metrics/reservations?${queryString}` : '/metrics/reservations';
      const capacityQuery = `/metrics/capacity?date=${today.toISOString().split('T')[0]}`;

      const [queueData, reservationData, capacityData] = await Promise.all([
        api.get<QueueMetrics>(queueQuery),
        api.get<ReservationMetrics>(reservationQuery),
        api.get<CapacityMetrics>(capacityQuery),
      ]);

      setQueueMetrics(queueData);
      setReservationMetrics(reservationData);
      setCapacityMetrics(capacityData);
    } catch (error: any) {
      console.error('Erro ao carregar métricas', error);
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  // Calculate Real-time Stats (usando dados do contexto para tempo real)
  const queueCount = queue.filter(q => q.status === QueueStatus.WAITING).length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReservations = reservations.filter(r => 
    new Date(r.date).toISOString().split('T')[0] === todayStr && 
    r.status !== ReservationStatus.CANCELLED
  ).length;

  // Faturamento estimado baseado em métricas reais
  const estimatedRevenue = capacityMetrics 
    ? capacityMetrics.totalPeopleServed * 120 // Estimativa: R$ 120 por pessoa
    : (queue.filter(q => q.status === QueueStatus.DONE).length * 120) + 1500;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard em Tempo Real</h2>
          <p className="text-gray-500">Visão geral da operação.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'today'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'week'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'month'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 dias
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-500 text-sm font-medium">Faturamento Estimado</div>
              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={16}/></div>
            </div>
            <div className="text-3xl font-bold text-green-600">R$ {estimatedRevenue.toLocaleString('pt-BR')}</div>
            {capacityMetrics && (
              <p className="text-xs text-gray-400 mt-1">{capacityMetrics.totalPeopleServed} pessoas atendidas</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-500 text-sm font-medium">Fila Atual</div>
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><Users size={16}/></div>
            </div>
            <div className="text-3xl font-bold text-yellow-600">{queueCount} Grupos</div>
            {queueMetrics && queueMetrics.averageWaitMinutes > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Tempo médio: {queueMetrics.averageWaitMinutes} min
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-500 text-sm font-medium">Reservas Hoje</div>
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><CalendarDays size={16}/></div>
            </div>
            <div className="text-3xl font-bold text-orange-600">{todayReservations}</div>
            {reservationMetrics && (
              <p className="text-xs text-gray-400 mt-1">
                {reservationMetrics.confirmed} confirmadas
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-500 text-sm font-medium">Taxa de No-Show</div>
              <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={16}/></div>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {queueMetrics ? `${queueMetrics.noShowRate.toFixed(1)}%` : '0%'}
            </div>
            {queueMetrics && (
              <p className="text-xs text-gray-400 mt-1">
                {queueMetrics.completed} concluídos
              </p>
            )}
          </div>
        </div>
      )}

      {/* Métricas Detalhadas */}
      {!loading && (queueMetrics || reservationMetrics) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {queueMetrics && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-orange-600" />
                Métricas de Fila ({period === 'today' ? 'Hoje' : period === 'week' ? '7 dias' : '30 dias'})
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total de itens:</span>
                  <span className="font-semibold">{queueMetrics.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Concluídos:</span>
                  <span className="font-semibold text-green-600">{queueMetrics.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cancelados:</span>
                  <span className="font-semibold text-gray-600">{queueMetrics.cancelled}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">No-Shows:</span>
                  <span className="font-semibold text-red-600">{queueMetrics.noShows}</span>
                </div>
                {queueMetrics.averageWaitMinutes > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Clock size={14} />
                      Tempo médio de espera:
                    </span>
                    <span className="font-semibold">{queueMetrics.averageWaitMinutes} min</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {reservationMetrics && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CalendarDays size={20} className="text-orange-600" />
                Métricas de Reservas ({period === 'today' ? 'Hoje' : period === 'week' ? '7 dias' : '30 dias'})
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">{reservationMetrics.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Confirmadas:</span>
                  <span className="font-semibold text-blue-600">{reservationMetrics.confirmed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-semibold text-green-600">{reservationMetrics.checkedIn}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Concluídas:</span>
                  <span className="font-semibold text-green-600">{reservationMetrics.completed}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-gray-600">Taxa de comparecimento:</span>
                  <span className="font-semibold text-green-600">{reservationMetrics.attendanceRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-96">
        <h3 className="text-lg font-semibold mb-6">Fluxo Semanal (Histórico)</h3>
        <p className="text-sm text-gray-500 mb-4">
          Gráfico semanal será implementado na próxima fase com dados históricos reais
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={STATIC_CHART_DATA}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="clientes" fill="#ea580c" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};