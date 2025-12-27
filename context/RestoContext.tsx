import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { QueueItem, MenuItem, Reservation, QueueStatus, ReservationStatus } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { api } from '../services/api';
import { wsService } from '../services/websocket';

interface RestoContextType {
  queue: QueueItem[];
  menu: MenuItem[];
  reservations: Reservation[];
  isLoadingData: boolean;
  
  // Actions
  refreshData: () => Promise<void>;
  addQueueItem: (item: any) => Promise<void>;
  updateQueueStatus: (id: string, status: QueueStatus) => Promise<void>;
  addMenuItem: (item: MenuItem) => Promise<void>;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  removeMenuItem: (id: string) => Promise<void>;
  addReservation: (item: any) => Promise<void>;
  updateReservationStatus: (id: string, status: ReservationStatus) => Promise<void>;
}

const RestoContext = createContext<RestoContextType | undefined>(undefined);

export const RestoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const socketRef = useRef<ReturnType<typeof wsService.getSocket> | null>(null);
  const toastRef = useRef(toast);
  
  // Atualiza ref quando toast muda
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingData(true);
    try {
      const [queueData, menuData, reservationData] = await Promise.all([
        api.get<QueueItem[]>('/queue'),
        api.get<MenuItem[]>('/menu'),
        api.get<Reservation[]>('/reservations')
      ]);

      setQueue(queueData);
      setMenu(menuData);
      setReservations(reservationData);
    } catch (error: any) {
      console.error("Erro ao carregar dados", error);
      const errorMessage = error?.message || 'Erro ao carregar dados. Tente novamente.';
      toastRef.current.error(errorMessage);
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated]);

  // WebSocket setup for real-time updates
  useEffect(() => {
    if (isAuthenticated && user?.restaurantId) {
      // Se WebSocket está desabilitado, usa apenas polling
      const isWebSocketDisabled = import.meta.env.VITE_DISABLE_WEBSOCKET === 'true';
      
      if (!isWebSocketDisabled) {
        // Connect to WebSocket
        const socket = wsService.connect();
        socketRef.current = socket;

        // Aguarda conexão antes de emitir eventos
        const setupSocket = async () => {
          const connected = await wsService.waitForConnection(5000);
          
          if (connected) {
            // Join restaurant room
            wsService.safeEmit('join-restaurant', { restaurantId: user.restaurantId });
          } else {
            console.warn('WebSocket não conectado a tempo, usando polling');
            toastRef.current.warning('Conexão em tempo real indisponível. Usando atualização periódica.');
          }
        };

        setupSocket();

        // Listen for queue updates
        socket.on('queue-updated', (queueData: QueueItem[]) => {
          setQueue(queueData);
        });

        // Listen for errors
        socket.on('error', (error: any) => {
          console.error('Erro no WebSocket:', error);
          toastRef.current.error(error?.message || 'Erro na conexão em tempo real');
        });

        // Listen for connection status
        const unsubscribeError = wsService.onError((error) => {
          console.error('Erro de conexão WebSocket:', error);
          // Não mostra toast para tentativas de reconexão intermediárias
          if (error.message.includes('Máximo de tentativas') || error.message.includes('Não foi possível conectar')) {
            toastRef.current.error(error.message);
          }
        });

        // Initial data load
        refreshData();

        return () => {
          socket.off('queue-updated');
          socket.off('error');
          unsubscribeError();
          wsService.disconnect();
        };
      } else {
        // WebSocket desabilitado - usando apenas polling silenciosamente
      }

      // Polling automático (sempre ativo, mais frequente se WebSocket desabilitado)
      const pollInterval = isWebSocketDisabled ? 5000 : 30000; // 5s se desabilitado, 30s se habilitado
      
      const pollData = async () => {
        try {
          await refreshData();
        } catch (error) {
          console.error('Erro no polling:', error);
        }
      };

      // Poll inicial
      pollData();
      
      // Poll periódico
      const interval = setInterval(pollData, pollInterval);

      return () => {
        if (!isWebSocketDisabled) {
          const socket = socketRef.current;
          if (socket) {
            socket.off('queue-updated');
            socket.off('error');
          }
          wsService.disconnect();
        }
        clearInterval(interval);
      };
    } else {
      // Disconnect when not authenticated
      wsService.disconnect();
      socketRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.restaurantId]);

  // --- ACTIONS ---

  const addQueueItem = async (item: any) => {
    try {
      await api.post('/queue', {
        customerName: item.customerName,
        phone: item.phone,
        partySize: item.partySize,
      });
      refreshData();
      toast.success('Cliente adicionado à fila com sucesso!');
    } catch (e: any) {
      console.error("Erro ao adicionar na fila", e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Erro ao adicionar na fila';
      toast.error(errorMessage);
    }
  };

  const updateQueueStatus = async (id: string, status: QueueStatus) => {
    // Optimistic Update
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    try {
      await api.patch(`/queue/${id}/status`, { status });
      toast.success('Status atualizado com sucesso!');
    } catch (e: any) {
      console.error("Erro ao atualizar status", e);
      refreshData();
      const errorMessage = e?.response?.data?.message || e?.message || 'Erro ao atualizar status';
      toast.error(errorMessage);
    }
  };

  const addMenuItem = async (item: MenuItem) => {
    try {
      await api.post('/menu', {
        name: item.name,
        description: item.description,
        price: Number(item.price),
        category: item.category,
        imageUrl: item.imageUrl
      });
      refreshData();
      toast.success('Item do menu adicionado com sucesso!');
    } catch (e: any) {
      console.error("Erro ao criar item", e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Erro ao criar item';
      toast.error(errorMessage);
    }
  };

  const updateMenuItem = async (id: string, item: Partial<MenuItem>) => {
    setMenu(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));
    try {
      await api.patch(`/menu/${id}`, {
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        imageUrl: item.imageUrl
      });
      refreshData();
      toast.success('Item atualizado com sucesso!');
    } catch (e: any) {
      console.error("Erro ao atualizar item", e);
      refreshData();
      const errorMessage = e?.response?.data?.message || e?.message || 'Erro ao atualizar item';
      toast.error(errorMessage);
    }
  };

  const removeMenuItem = async (id: string) => {
    setMenu(prev => prev.filter(i => i.id !== id));
    try {
      await api.delete(`/menu/${id}`);
      toast.success('Item removido com sucesso!');
    } catch (e: any) {
      refreshData();
      const errorMessage = e?.response?.data?.message || e?.message || 'Erro ao remover item';
      toast.error(errorMessage);
    }
  };

  const addReservation = async (item: any) => {
     // Admin manual add
    try {
      await api.post('/reservations', item);
      refreshData();
      toast.success('Reserva criada com sucesso!');
    } catch (e: any) {
      console.error("Erro ao criar reserva", e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Erro ao criar reserva';
      toast.error(errorMessage);
    }
  };

  const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    // Optimistic Update
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    try {
       await api.patch(`/reservations/${id}/status`, { status });
       toast.success('Status da reserva atualizado com sucesso!');
    } catch (e: any) {
      console.error("Erro ao atualizar reserva", e);
      refreshData();
      const errorMessage = e?.response?.data?.message || e?.message || 'Erro ao atualizar reserva';
      toast.error(errorMessage);
    }
  };

  return (
    <RestoContext.Provider value={{
      queue, menu, reservations, isLoadingData,
      refreshData,
      addQueueItem, updateQueueStatus,
      addMenuItem, updateMenuItem, removeMenuItem,
      addReservation, updateReservationStatus
    }}>
      {children}
    </RestoContext.Provider>
  );
};

export const useResto = () => {
  const context = useContext(RestoContext);
  if (!context) throw new Error("useResto must be used within a RestoProvider");
  return context;
};