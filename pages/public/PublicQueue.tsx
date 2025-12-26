import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Users, Clock, CheckCircle, AlertTriangle, Mail } from 'lucide-react';
import { api } from '../../services/api';
import { wsService } from '../../services/websocket';
import { customerService } from '../../services/customerService';
import { Customer } from '../../types';

type ViewState = 'JOIN' | 'EMAIL' | 'STATUS';

export const PublicQueue: React.FC = () => {
  const { slug } = useParams();
  const [view, setView] = useState<ViewState>('JOIN');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [email, setEmail] = useState('');
  
  // Customer State
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  // Queue Info State
  const [queueInfo, setQueueInfo] = useState<{
    waitingCount: number;
    averageWaitMinutes: number;
    restaurantName: string;
  } | null>(null);

  // Status State
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [position, setPosition] = useState<number>(0);
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [estimatedWaitMinutes, setEstimatedWaitMinutes] = useState<number>(15);
  const [ticketStatus, setTicketStatus] = useState<string>('WAITING');
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [calledTimeoutMinutes, setCalledTimeoutMinutes] = useState<number>(10);

  // Load queue info when on JOIN view
  useEffect(() => {
    if (slug && view === 'JOIN') {
      const loadQueueInfo = async () => {
        try {
          const data = await api.get<{
            waitingCount: number;
            averageWaitMinutes: number;
            restaurantName: string;
          }>(`/queue/public/${slug}`);
          setQueueInfo(data);
        } catch (error) {
          console.error('Erro ao carregar informações da fila', error);
        }
      };
      loadQueueInfo();
    }
  }, [slug, view]);

  // WebSocket + Fallback Polling for position updates
  useEffect(() => {
    if (view === 'STATUS' && slug && ticketId) {
      const fetchPosition = async () => {
        try {
          const data = await api.get<{
            position: number;
            waitingCount: number;
            estimatedWaitMinutes: number;
            status: string;
            restaurantName?: string;
            calledTimeoutMinutes?: number;
          }>(`/queue/public/${slug}/ticket/${ticketId}`);
          
          setPosition(data.position);
          setWaitingCount(data.waitingCount);
          setEstimatedWaitMinutes(data.estimatedWaitMinutes);
          setTicketStatus(data.status);
          if (data.restaurantName) setRestaurantName(data.restaurantName);
          if (data.calledTimeoutMinutes) setCalledTimeoutMinutes(data.calledTimeoutMinutes);
        } catch (e) {
          console.error("Erro ao atualizar posição", e);
        }
      };

      // Initial fetch
      fetchPosition();

      // Connect to WebSocket for real-time updates
      const socket = wsService.connect();
      socket.emit('join-public-queue', { slug, ticketId });

      // Listen for position updates
      socket.on('position-updated', (data: {
        position: number;
        waitingCount: number;
        estimatedWaitMinutes: number;
        status?: string;
        restaurantName?: string;
        calledTimeoutMinutes?: number;
      }) => {
        setPosition(data.position);
        setWaitingCount(data.waitingCount);
        setEstimatedWaitMinutes(data.estimatedWaitMinutes);
        if (data.status) setTicketStatus(data.status);
        if (data.restaurantName) setRestaurantName(data.restaurantName);
        if (data.calledTimeoutMinutes) setCalledTimeoutMinutes(data.calledTimeoutMinutes);
      });

      // Listen for status changes
      socket.on('status-changed', (data: { status: string; ticketId: string }) => {
        if (data.ticketId === ticketId) {
          setTicketStatus(data.status);
        }
      });

      // Listen for general queue status updates
      socket.on('queue-status-updated', (data: { waitingCount: number }) => {
        setWaitingCount(data.waitingCount);
      });

      // Fallback polling (less frequent, only if WebSocket fails)
      const interval = setInterval(fetchPosition, 30000); // 30s fallback

      return () => {
        socket.off('position-updated');
        socket.off('status-changed');
        socket.off('queue-status-updated');
        clearInterval(interval);
      };
    }
  }, [view, slug, ticketId]);

  const handleBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    
    setLoading(true);
    
    try {
      // Validar limite de pessoas (será validado no backend também)
      const partySizeNum = parseInt(partySize);
      if (partySizeNum < 1) {
        alert('Número de pessoas deve ser pelo menos 1');
        setLoading(false);
        return;
      }

      // Buscar ou criar cliente
      const customerData = await customerService.findOrCreate(phone, name);
      setCustomer(customerData);

      // Se cliente não tem email, mostrar etapa de email
      if (!customerData.email) {
        setView('EMAIL');
      } else {
        // Se já tem email, entrar direto na fila
        await joinQueueWithCustomer(customerData.id);
      }
    } catch (error: any) {
      console.error('Erro ao buscar/criar cliente', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Não foi possível processar seus dados. Tente novamente.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !slug) return;

    setLoading(true);

    try {
      // Atualizar email do cliente se fornecido
      if (email.trim()) {
        const updatedCustomer = await customerService.update(customer.id, { email: email.trim() });
        setCustomer(updatedCustomer);
      }

      // Entrar na fila
      await joinQueueWithCustomer(customer.id);
    } catch (error) {
      console.error('Erro ao atualizar cliente', error);
      // Mesmo com erro, tentar entrar na fila
      await joinQueueWithCustomer(customer.id);
    } finally {
      setLoading(false);
    }
  };

  const joinQueueWithCustomer = async (customerId: string) => {
    if (!slug) return;

    try {
      const response = await api.post<{ id: string }>(`/queue/join/${slug}`, {
        customerName: name,
        phone: phone,
        email: email.trim(),
        partySize: parseInt(partySize),
        customerId: customerId,
      });

      setTicketId(response.id);
      setView('STATUS');
    } catch (error: any) {
      console.error('Erro ao entrar na fila', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Não foi possível entrar na fila. Tente novamente.';
      alert(errorMessage);
    }
  };

  const handleSkipEmail = async () => {
    if (!customer || !slug) return;
    await joinQueueWithCustomer(customer.id);
  };


  // Show CALLED status screen
  if (view === 'STATUS' && ticketStatus === 'CALLED') {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-4 border-orange-500 p-8 text-center space-y-6 animate-pulse">
        <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white mx-auto animate-bounce">
          <AlertTriangle size={40} />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-orange-600 mb-2">VOCÊ FOI CHAMADO!</h2>
          <p className="text-lg text-gray-700">Sua mesa está pronta!</p>
        </div>

        <div className="bg-orange-100 p-6 rounded-lg border-2 border-orange-300">
          <p className="text-xl font-semibold text-orange-900">
            Por favor, dirija-se à recepção do restaurante agora!
          </p>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Importante:</strong> Você tem {calledTimeoutMinutes} minutos para comparecer.
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Restaurante:</strong> {restaurantName || 'Aguardando informações...'}
          </p>
        </div>

        <Button variant="ghost" onClick={() => window.location.reload()}>Sair da tela</Button>
      </div>
    );
  }

  // Show waiting status screen
  if (view === 'STATUS') {
    const groupsAhead = Math.max(0, position - 1);
    
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto animate-bounce">
          <CheckCircle size={32} />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Você está na fila!</h2>
          <p className="text-gray-500">Acompanhe por aqui ou aguarde nossas notificações por email e WhatsApp.</p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-800">
            <strong>Notificações automáticas:</strong><br/>
            • Você será avisado quando faltarem 3 grupos na sua frente<br/>
            • Você será avisado quando for o próximo<br/>
            • Você será avisado quando sua mesa estiver pronta
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-gray-100">
           <div>
             <div className="text-xs text-gray-400 uppercase font-semibold">Sua Posição</div>
             <div className="text-3xl font-bold text-orange-600">#{position}</div>
             {groupsAhead > 0 && (
               <div className="text-xs text-gray-500 mt-1">{groupsAhead} grupo{groupsAhead !== 1 ? 's' : ''} na frente</div>
             )}
           </div>
           <div>
             <div className="text-xs text-gray-400 uppercase font-semibold">Tempo Estimado</div>
             <div className="text-3xl font-bold text-orange-600">{estimatedWaitMinutes} min</div>
             <div className="text-xs text-gray-500 mt-1">{waitingCount} grupo{waitingCount !== 1 ? 's' : ''} aguardando</div>
           </div>
        </div>

        <div className="bg-amber-50 p-3 rounded-lg flex items-start gap-2 text-left">
           <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
           <p className="text-xs text-amber-800">
             Atualizamos esta tela automaticamente. Você também receberá notificações por email e WhatsApp. Por favor, apresente-se na recepção quando receber o aviso.
           </p>
        </div>

        <Button variant="ghost" onClick={() => window.location.reload()}>Sair da tela</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-xl font-bold text-gray-900">Entrar na Fila de Espera</h2>
        <p className="text-sm text-gray-500">Junte-se a outros grupos aguardando mesa.</p>
      </div>

      {/* Informações da Fila */}
      {queueInfo && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">{queueInfo.waitingCount}</div>
              <div className="text-sm text-gray-600">Pessoas na fila</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">{queueInfo.averageWaitMinutes}</div>
              <div className="text-sm text-gray-600">Tempo médio (últimos 5)</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleBasicInfo} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
          <input 
            required
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: Maria Silva"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input 
            required
            type="tel" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input 
            required
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            placeholder="seu@email.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Você receberá notificações por email e WhatsApp quando sua vez se aproximar.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantas Pessoas?</label>
          <select 
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            {[1,2,3,4,5,6,7,8,9,10,12,15].map(n => (
              <option key={n} value={n}>{n} pessoas</option>
            ))}
          </select>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          <Users size={18} className="mr-2"/> Entrar na Fila
        </Button>
      </form>

      <div className="text-center">
         <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
           <Mail size={12}/> Você receberá notificações quando faltarem 3 grupos, 1 grupo e quando sua mesa estiver pronta!
         </div>
      </div>
    </div>
  );
};