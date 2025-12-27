import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Users, Clock, CheckCircle, AlertTriangle, Mail, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { wsService } from '../../services/websocket';
import { useToast } from '../../context/ToastContext';
import { validateEmail, validatePhone, validateRequired } from '../../utils/validation';
import { formatPhone } from '../../utils/format';
import { Skeleton } from '../../components/ui/Skeleton';

type ViewState = 'JOIN' | 'STATUS';

export const PublicQueue: React.FC = () => {
  const { slug } = useParams();
  const toast = useToast();
  const [view, setView] = useState<ViewState>('JOIN');
  const [loading, setLoading] = useState(false);
  const [loadingQueueInfo, setLoadingQueueInfo] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [email, setEmail] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    partySize?: string;
  }>({});
  
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
  const previousStatusRef = useRef<string>('WAITING');

  // Load queue info when on JOIN view
  useEffect(() => {
    if (slug && view === 'JOIN') {
      setLoadingQueueInfo(true);
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
          toast.error('Erro ao carregar informações da fila');
        } finally {
          setLoadingQueueInfo(false);
        }
      };
      loadQueueInfo();
    }
  }, [slug, view, toast]);

  // Forçar atualização visual quando status muda para CALLED
  useEffect(() => {
    if (ticketStatus?.toUpperCase() === 'CALLED' && view === 'STATUS') {
      console.log('🔔 Status é CALLED! Forçando atualização da tela...');
      // Força re-render garantindo que o estado está atualizado
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [ticketStatus, view]);

  // WebSocket + Fallback Polling for position updates
  useEffect(() => {
    if (view === 'STATUS' && slug && ticketId) {
      const isWebSocketDisabled = import.meta.env.VITE_DISABLE_WEBSOCKET === 'true';
      
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
          
          // Atualizar status sempre (normalizar para maiúsculas)
          const normalizedStatus = data.status?.toUpperCase() || 'WAITING';
          const wasCalled = normalizedStatus === 'CALLED' && previousStatusRef.current !== 'CALLED';
          
          // Sempre atualizar o status
          setTicketStatus(normalizedStatus);
          
          // Detectar mudança para CALLED e mostrar aviso
          if (wasCalled) {
            console.log('🔔 Status mudou para CALLED! Atualizando tela...');
            toast.success('🔔 Você foi chamado(a)! Dirija-se ao balcão.', 10000); // 10 segundos
            // Scroll para o topo para garantir que a tela seja visível
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
          }
          
          previousStatusRef.current = normalizedStatus;
          if (data.restaurantName) setRestaurantName(data.restaurantName);
          if (data.calledTimeoutMinutes) setCalledTimeoutMinutes(data.calledTimeoutMinutes);
        } catch (e: any) {
          console.error("Erro ao atualizar posição", e);
          // Não mostra toast para evitar spam, apenas loga
        }
      };

      // Initial fetch
      fetchPosition();

      // Configurar WebSocket (se habilitado) - camada adicional de atualização em tempo real
      let socket: ReturnType<typeof wsService.connect> | null = null;
      let unsubscribeError: (() => void) | null = null;

      if (!isWebSocketDisabled) {
        // Connect to WebSocket for real-time updates
        socket = wsService.connect();
        
        // Aguarda conexão antes de emitir eventos
        const setupSocket = async () => {
          const connected = await wsService.waitForConnection(5000);
          
          if (connected) {
            wsService.safeEmit('join-public-queue', { slug, ticketId });
          } else {
            console.warn('WebSocket não conectado a tempo, usando apenas polling');
          }
        };

        setupSocket();

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
          
          // Atualizar status sempre (normalizar para maiúsculas)
          if (data.status) {
            const normalizedStatus = data.status.toUpperCase();
            const wasCalled = normalizedStatus === 'CALLED' && previousStatusRef.current !== 'CALLED';
            
            // Sempre atualizar o status
            setTicketStatus(normalizedStatus);
            
            // Detectar mudança para CALLED e mostrar aviso
            if (wasCalled) {
              console.log('🔔 Status mudou para CALLED via WebSocket! Atualizando tela...');
              toast.success('🔔 Você foi chamado(a)! Dirija-se ao balcão.', 10000); // 10 segundos
              // Scroll para o topo para garantir que a tela seja visível
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 100);
            }
            
            previousStatusRef.current = normalizedStatus;
          }
          if (data.restaurantName) setRestaurantName(data.restaurantName);
          if (data.calledTimeoutMinutes) setCalledTimeoutMinutes(data.calledTimeoutMinutes);
        });

        // Listen for status changes
        socket.on('status-changed', (data: { status: string; ticketId: string }) => {
          if (data.ticketId === ticketId) {
            // Atualizar status sempre (normalizar para maiúsculas)
            const normalizedStatus = data.status.toUpperCase();
            const wasCalled = normalizedStatus === 'CALLED' && previousStatusRef.current !== 'CALLED';
            setTicketStatus(normalizedStatus);
            
            // Detectar mudança para CALLED e mostrar aviso
            if (wasCalled) {
              console.log('🔔 Status mudou para CALLED via status-changed! Atualizando tela...');
              toast.success('🔔 Você foi chamado(a)! Dirija-se ao balcão.', 10000); // 10 segundos
              // Scroll para o topo para garantir que a tela seja visível
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 100);
            }
            
            previousStatusRef.current = normalizedStatus;
          }
        });

        // Listen for general queue status updates
        socket.on('queue-status-updated', (data: { waitingCount: number }) => {
          setWaitingCount(data.waitingCount);
        });

        // Listen for errors
        socket.on('error', (error: any) => {
          console.error('Erro no WebSocket:', error);
          // Não mostra toast para evitar spam, apenas loga
        });

        // Listen for connection errors
        unsubscribeError = wsService.onError((error) => {
          console.error('Erro de conexão WebSocket:', error);
          // Não mostra toast para tentativas de reconexão intermediárias
          if (error.message.includes('Máximo de tentativas') || error.message.includes('Não foi possível conectar')) {
            toast.warning('Conexão em tempo real indisponível. Usando atualização periódica.');
          }
        });
      }

      // Polling automático - SEMPRE ativo como fallback
      // Mais frequente quando WebSocket está desabilitado ou indisponível
      const pollInterval = isWebSocketDisabled ? 5000 : 30000; // 5s se desabilitado, 30s se habilitado
      const interval = setInterval(fetchPosition, pollInterval);

      return () => {
        // Cleanup WebSocket listeners
        if (socket) {
          socket.off('position-updated');
          socket.off('status-changed');
          socket.off('queue-status-updated');
          socket.off('error');
        }
        if (unsubscribeError) {
          unsubscribeError();
        }
        // Cleanup polling
        clearInterval(interval);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, slug, ticketId]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (value && !validateRequired(value)) {
      setErrors({ ...errors, name: 'Nome é obrigatório' });
    } else {
      setErrors({ ...errors, name: undefined });
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setPhone(formatted);
    if (value && !validatePhone(value)) {
      setErrors({ ...errors, phone: 'Telefone inválido' });
    } else {
      setErrors({ ...errors, phone: undefined });
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !validateEmail(value)) {
      setErrors({ ...errors, email: 'Email inválido' });
    } else {
      setErrors({ ...errors, email: undefined });
    }
  };

  const handleBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    
    // Reset errors
    const newErrors: typeof errors = {};

    // Validar campos
    if (!validateRequired(name)) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!validateRequired(phone)) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    if (!validateRequired(email)) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email inválido';
    }

    const partySizeNum = parseInt(partySize);
    if (partySizeNum < 1) {
      newErrors.partySize = 'Número de pessoas deve ser pelo menos 1';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }
    
    setLoading(true);
    
    try {
      // Entrar diretamente na fila (sem etapa intermediária de customer)
      const response = await api.post<{ id: string }>(`/queue/join/${slug}`, {
        customerName: name,
        phone: phone,
        email: email.trim(),
        partySize: parseInt(partySize),
      });

      setTicketId(response.id);
      setView('STATUS');
      toast.success('Você entrou na fila com sucesso!');
    } catch (error: any) {
      console.error('Erro ao entrar na fila', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Não foi possível entrar na fila. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // Show CALLED status screen (verificar com normalização)
  const isCalled = ticketStatus?.toUpperCase() === 'CALLED';
  
  // Debug log (apenas em desenvolvimento)
  if (view === 'STATUS' && typeof window !== 'undefined') {
    console.log('🔍 Renderização:', { view, ticketStatus, isCalled, shouldShowCalled: view === 'STATUS' && isCalled });
  }
  
  if (view === 'STATUS' && isCalled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-orange-500 p-8 text-center space-y-6 max-w-md w-full animate-pulse">
          <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center text-white mx-auto animate-bounce">
            <AlertTriangle size={48} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-orange-600 mb-2 animate-pulse">VOCÊ FOI CHAMADO!</h2>
            <p className="text-xl text-gray-700 font-semibold">Sua mesa está pronta!</p>
          </div>

          <div className="bg-orange-100 p-6 rounded-lg border-2 border-orange-300 animate-pulse">
            <p className="text-2xl font-bold text-orange-900">
              🔔 Dirija-se à recepção AGORA!
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>⏰ Importante:</strong> Você tem {calledTimeoutMinutes} minutos para comparecer.
            </p>
          </div>

          {restaurantName && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>📍 Restaurante:</strong> {restaurantName}
              </p>
            </div>
          )}

          <div className="pt-4">
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Sair da tela
            </Button>
          </div>
        </div>
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
      {loadingQueueInfo ? (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <Skeleton height={40} width="100%" className="mb-2" />
              <Skeleton height={16} width="60%" className="mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton height={40} width="100%" className="mb-2" />
              <Skeleton height={16} width="60%" className="mx-auto" />
            </div>
          </div>
        </div>
      ) : queueInfo && (
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
            onChange={(e) => handleNameChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ex: Maria Silva"
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input 
            required
            type="tel" 
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input 
            required
            type="email" 
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="seu@email.com"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.email}
            </p>
          )}
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