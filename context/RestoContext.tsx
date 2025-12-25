import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { QueueItem, MenuItem, Reservation, QueueStatus, ReservationStatus } from '../types';
import { useAuth } from './AuthContext';
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
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const socketRef = useRef<ReturnType<typeof wsService.getSocket> | null>(null);

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
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated]);

  // WebSocket setup for real-time updates
  useEffect(() => {
    if (isAuthenticated && user?.restaurantId) {
      // Connect to WebSocket
      const socket = wsService.connect();
      socketRef.current = socket;

      // Join restaurant room
      socket.emit('join-restaurant', { restaurantId: user.restaurantId });

      // Listen for queue updates
      socket.on('queue-updated', (queueData: QueueItem[]) => {
        setQueue(queueData);
      });

      // Initial data load
      refreshData();

      return () => {
        socket.off('queue-updated');
        wsService.disconnect();
      };
    } else {
      // Disconnect when not authenticated
      wsService.disconnect();
      socketRef.current = null;
    }
  }, [isAuthenticated, user?.restaurantId, refreshData]);

  // --- ACTIONS ---

  const addQueueItem = async (item: any) => {
    try {
      await api.post('/queue', {
        customerName: item.customerName,
        phone: item.phone,
        partySize: item.partySize,
      });
      refreshData();
    } catch (e) {
      console.error("Erro ao adicionar na fila", e);
      alert("Erro ao adicionar na fila");
    }
  };

  const updateQueueStatus = async (id: string, status: QueueStatus) => {
    // Optimistic Update
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    try {
      await api.patch(`/queue/${id}/status`, { status });
    } catch (e) {
      console.error("Erro ao atualizar status", e);
      refreshData();
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
    } catch (e) {
      console.error("Erro ao criar item", e);
      alert("Erro ao criar item");
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
    } catch (e) {
      console.error("Erro ao atualizar item", e);
      refreshData();
      alert("Erro ao atualizar item");
    }
  };

  const removeMenuItem = async (id: string) => {
    setMenu(prev => prev.filter(i => i.id !== id));
    try {
      await api.delete(`/menu/${id}`);
    } catch (e) {
      refreshData();
    }
  };

  const addReservation = async (item: any) => {
     // Admin manual add
    try {
      await api.post('/reservations', item);
      refreshData();
    } catch (e) {
      console.error("Erro ao criar reserva", e);
      alert("Erro ao criar reserva");
    }
  };

  const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    // Optimistic Update
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    try {
       await api.patch(`/reservations/${id}/status`, { status });
    } catch (e) {
      console.error("Erro ao atualizar reserva", e);
      refreshData();
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