import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { Calendar, TrendingUp, Users, Clock, AlertCircle, DollarSign, BarChart3, Download, FileText } from 'lucide-react';
import { exportToCSV, exportToPDF, dataToHTMLTable, createReportHTML } from '../../services/exportUtils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

interface HistoricalDataPoint {
  date: string;
  queueCompleted: number;
  queueNoShows: number;
  queueCancelled: number;
  reservationsConfirmed: number;
  reservationsCompleted: number;
  reservationsNoShows: number;
  totalPeople: number;
}

const COLORS = ['#ea580c', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export const Reports: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [reservationMetrics, setReservationMetrics] = useState<ReservationMetrics | null>(null);
  const [capacityMetrics, setCapacityMetrics] = useState<CapacityMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    if (period === 'today') {
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (period === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (period === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      setStartDate(monthAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  }, [period]);

  useEffect(() => {
    if (startDate && endDate) {
      loadMetrics();
    }
  }, [startDate, endDate]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const queueQuery = `/metrics/queue?startDate=${startDate}&endDate=${endDate}`;
      const reservationQuery = `/metrics/reservations?startDate=${startDate}&endDate=${endDate}`;
      const capacityQuery = `/metrics/capacity?date=${endDate}`;
      const historicalQuery = `/metrics/historical?startDate=${startDate}&endDate=${endDate}`;

      const [queueData, reservationData, capacityData, historical] = await Promise.all([
        api.get<QueueMetrics>(queueQuery),
        api.get<ReservationMetrics>(reservationQuery),
        api.get<CapacityMetrics>(capacityQuery),
        api.get<HistoricalDataPoint[]>(historicalQuery).catch(() => []), // Fallback para array vazio
      ]);

      setQueueMetrics(queueData);
      setReservationMetrics(reservationData);
      setCapacityMetrics(capacityData);
      setHistoricalData(historical);
    } catch (error: any) {
      console.error('Erro ao carregar relatórios', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const queueChartData = queueMetrics ? [
    { name: 'Concluídos', value: queueMetrics.completed, color: COLORS[1] },
    { name: 'No-Shows', value: queueMetrics.noShows, color: COLORS[3] },
    { name: 'Cancelados', value: queueMetrics.cancelled, color: COLORS[2] },
  ] : [];

  const reservationChartData = reservationMetrics ? [
    { name: 'Confirmadas', value: reservationMetrics.confirmed, color: COLORS[0] },
    { name: 'Check-in', value: reservationMetrics.checkedIn, color: COLORS[1] },
    { name: 'Concluídas', value: reservationMetrics.completed, color: COLORS[1] },
    { name: 'No-Shows', value: reservationMetrics.noShows, color: COLORS[3] },
    { name: 'Canceladas', value: reservationMetrics.cancelled, color: COLORS[2] },
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios e Analytics</h2>
          <p className="text-gray-500">Análise detalhada do desempenho do restaurante</p>
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
          <div className="flex gap-2 ml-4 border-l border-gray-300 pl-4">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
              title="Exportar para Excel (CSV)"
            >
              <Download size={16} />
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
              title="Exportar para PDF"
            >
              <FileText size={16} />
              PDF
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500 text-sm font-medium">Total Atendido</div>
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Users size={16} />
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {capacityMetrics?.totalPeopleServed || 0}
              </div>
              <p className="text-xs text-gray-400 mt-1">pessoas atendidas</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500 text-sm font-medium">Taxa de No-Show</div>
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <AlertCircle size={16} />
                </div>
              </div>
              <div className="text-3xl font-bold text-red-600">
                {queueMetrics ? `${queueMetrics.noShowRate.toFixed(1)}%` : '0%'}
              </div>
              <p className="text-xs text-gray-400 mt-1">fila e reservas</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500 text-sm font-medium">Tempo Médio de Espera</div>
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {queueMetrics && queueMetrics.averageWaitMinutes > 0
                  ? `${queueMetrics.averageWaitMinutes} min`
                  : 'N/A'}
              </div>
              <p className="text-xs text-gray-400 mt-1">tempo médio na fila</p>
            </div>
          </div>

          {/* Relatório de Fila */}
          {queueMetrics && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-orange-600" />
                Relatório de Fila
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Resumo</h4>
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
                      <span className="text-gray-600">No-Shows:</span>
                      <span className="font-semibold text-red-600">{queueMetrics.noShows}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cancelados:</span>
                      <span className="font-semibold text-gray-600">{queueMetrics.cancelled}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-600">Taxa de No-Show:</span>
                      <span className="font-semibold text-red-600">
                        {queueMetrics.noShowRate.toFixed(1)}%
                      </span>
                    </div>
                    {queueMetrics.averageWaitMinutes > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-gray-600">Tempo médio de espera:</span>
                        <span className="font-semibold">{queueMetrics.averageWaitMinutes} min</span>
                      </div>
                    )}
                  </div>
                </div>
                {queueChartData.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Distribuição</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={queueChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {queueChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Relatório de Reservas */}
          {reservationMetrics && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Calendar size={20} className="text-orange-600" />
                Relatório de Reservas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Resumo</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">{reservationMetrics.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Confirmadas:</span>
                      <span className="font-semibold text-blue-600">
                        {reservationMetrics.confirmed}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-semibold text-green-600">
                        {reservationMetrics.checkedIn}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Concluídas:</span>
                      <span className="font-semibold text-green-600">
                        {reservationMetrics.completed}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">No-Shows:</span>
                      <span className="font-semibold text-red-600">
                        {reservationMetrics.noShows}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Canceladas:</span>
                      <span className="font-semibold text-gray-600">
                        {reservationMetrics.cancelled}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-600">Taxa de Comparecimento:</span>
                      <span className="font-semibold text-green-600">
                        {reservationMetrics.attendanceRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-600">Taxa de No-Show:</span>
                      <span className="font-semibold text-red-600">
                        {reservationMetrics.noShowRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                {reservationChartData.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Distribuição</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={reservationChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {reservationChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Capacidade */}
          {capacityMetrics && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <BarChart3 size={20} className="text-orange-600" />
                Utilização de Capacidade - {new Date(capacityMetrics.date).toLocaleDateString('pt-BR')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {capacityMetrics.queueItemsServed}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Itens da Fila Atendidos</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {capacityMetrics.reservationsServed}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Reservas Atendidas</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {capacityMetrics.totalPeopleServed}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total de Pessoas Atendidas</div>
                </div>
              </div>
            </div>
          )}

          {/* Gráficos Históricos */}
          {historicalData.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-orange-600" />
                Evolução Temporal ({period === 'today' ? 'Hoje' : period === 'week' ? '7 dias' : '30 dias'})
              </h3>
              <div className="space-y-8">
                {/* Gráfico de Atendimentos */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Atendimentos por Dia</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('pt-BR');
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="queueCompleted" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Fila Concluídos"
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="reservationsCompleted" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Reservas Concluídas"
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalPeople" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Total Pessoas"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Gráfico de No-Shows */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">No-Shows por Dia</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('pt-BR');
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="queueNoShows" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Fila No-Shows"
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="reservationsNoShows" 
                        stroke="#f97316" 
                        strokeWidth={2}
                        name="Reservas No-Shows"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

