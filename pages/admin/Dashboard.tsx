import React from 'react';
import { useResto } from '../../context/RestoContext';
import { QueueStatus, ReservationStatus } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, CalendarDays, DollarSign, Star } from 'lucide-react';

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

  // Calculate Real-time Stats
  const queueCount = queue.filter(q => q.status === QueueStatus.WAITING).length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReservations = reservations.filter(r => 
    new Date(r.date).toISOString().split('T')[0] === todayStr && 
    r.status !== ReservationStatus.CANCELLED
  ).length;

  // Mock revenue calculation based on queue throughput
  const doneCount = queue.filter(q => q.status === QueueStatus.DONE).length;
  const estimatedRevenue = (doneCount * 120) + 1500; // Mock base + dynamic

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard em Tempo Real</h2>
        <p className="text-gray-500">Visão geral da operação de hoje.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500 text-sm font-medium">Faturamento Estimado</div>
                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={16}/></div>
            </div>
            <div className="text-3xl font-bold text-green-600">R$ {estimatedRevenue.toLocaleString('pt-BR')}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500 text-sm font-medium">Fila Atual</div>
                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><Users size={16}/></div>
            </div>
            <div className="text-3xl font-bold text-yellow-600">{queueCount} Grupos</div>
            <p className="text-xs text-gray-400 mt-1">Tempo de espera: {queueCount * 15} min</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500 text-sm font-medium">Reservas Hoje</div>
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><CalendarDays size={16}/></div>
            </div>
            <div className="text-3xl font-bold text-orange-600">{todayReservations}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500 text-sm font-medium">Avaliação Google</div>
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Star size={16}/></div>
            </div>
            <div className="text-3xl font-bold text-gray-800">4.8</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-96">
        <h3 className="text-lg font-semibold mb-6">Fluxo Semanal (Histórico)</h3>
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