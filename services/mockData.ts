// Dados mockados para desenvolvimento offline (sem backend)
import { QueueItem, MenuItem, Reservation, QueueStatus, ReservationStatus, Category, PublicLink } from '../types';
import { queueStorage, menuStorage, reservationsStorage, restaurantStorage, categoriesStorage, publicLinksStorage } from './localStorage';

// Simula delay de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Dados padrão (usados se localStorage estiver vazio)
const defaultQueue: QueueItem[] = [
  {
    id: '1',
    customerName: 'João Silva',
    partySize: 2,
    phone: '(11) 99999-1111',
    email: 'joao@email.com',
    status: QueueStatus.WAITING,
    joinedAt: new Date(Date.now() - 10 * 60000), // 10 minutos atrás
    position: 1,
    manualOrder: false,
    estimatedWaitMinutes: 15,
  },
  {
    id: '2',
    customerName: 'Maria Santos',
    partySize: 4,
    phone: '(11) 99999-2222',
    email: 'maria@email.com',
    status: QueueStatus.WAITING,
    joinedAt: new Date(Date.now() - 5 * 60000), // 5 minutos atrás
    position: 2,
    manualOrder: false,
    estimatedWaitMinutes: 20,
  },
  {
    id: '3',
    customerName: 'Pedro Costa',
    partySize: 3,
    phone: '(11) 99999-3333',
    status: QueueStatus.NOTIFIED,
    joinedAt: new Date(Date.now() - 20 * 60000),
    notifiedAt: new Date(Date.now() - 2 * 60000),
    position: 3,
    manualOrder: false,
    estimatedWaitMinutes: 25,
  },
];

const defaultMenu: MenuItem[] = [
  {
    id: '1',
    name: 'Hambúrguer Clássico',
    description: 'Pão, carne, queijo, alface, tomate',
    price: 25.90,
    category: 'Lanches',
    categoryId: '1',
    isActive: true,
    available: true,
  },
  {
    id: '2',
    name: 'Pizza Margherita',
    description: 'Molho de tomate, mussarela, manjericão',
    price: 45.00,
    category: 'Pizzas',
    categoryId: '2',
    isActive: true,
    available: true,
  },
  {
    id: '3',
    name: 'Coca-Cola',
    description: 'Refrigerante 350ml',
    price: 6.50,
    category: 'Bebidas',
    categoryId: '3',
    isActive: true,
    available: true,
  },
];

const defaultReservations: Reservation[] = [
  {
    id: '1',
    customerName: 'Ana Oliveira',
    phone: '(11) 99999-4444',
    email: 'ana@email.com',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
    partySize: 4,
    status: ReservationStatus.CONFIRMED,
    notes: 'Mesa perto da janela',
  },
  {
    id: '2',
    customerName: 'Carlos Mendes',
    phone: '(11) 99999-5555',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Depois de amanhã
    partySize: 2,
    status: ReservationStatus.PENDING,
  },
];

const defaultRestaurant = {
  id: '1',
  name: 'Restaurante Demo',
  slug: 'demo',
  address: 'Rua Exemplo, 123',
  isActive: true,
  queueActive: true,
  maxPartySize: 10,
  averageTableTimeMinutes: 60,
  calledTimeoutMinutes: 10,
  themeColor: '#f97316',
};

// Carregar dados do localStorage ou usar padrões
// Se localStorage estiver vazio, usa os dados padrão e salva
const initData = <T>(storage: { load: (defaultValue: T) => T; save: (data: T) => void }, defaultValue: T, isEmpty: (data: T) => boolean): T => {
  const loaded = storage.load(defaultValue);
  // Se não havia dados salvos (retornou os padrões), salva para persistir
  if (isEmpty(loaded)) {
    storage.save(defaultValue);
    return defaultValue;
  }
  return loaded;
};

let mockQueue: QueueItem[] = initData(queueStorage, defaultQueue, (data) => data.length === 0);
let mockMenu: MenuItem[] = initData(menuStorage, defaultMenu, (data) => data.length === 0);
let mockReservations: Reservation[] = initData(reservationsStorage, defaultReservations, (data) => data.length === 0);
let mockRestaurant = restaurantStorage.load(defaultRestaurant);
if (!mockRestaurant) {
  restaurantStorage.save(defaultRestaurant);
  mockRestaurant = defaultRestaurant;
}

// Dados padrão de categorias
const defaultCategories: Category[] = [
  { id: '1', restaurantId: '1', name: 'Lanches', isActive: true, displayOrder: 0 },
  { id: '2', restaurantId: '1', name: 'Pizzas', isActive: true, displayOrder: 1 },
  { id: '3', restaurantId: '1', name: 'Bebidas', isActive: true, displayOrder: 2 },
];

// Dados padrão de public links
const defaultPublicLinks: PublicLink[] = [];

// Inicializar categories e publicLinks
let mockCategories: Category[] = initData(categoriesStorage, defaultCategories, (data) => data.length === 0);
let mockPublicLinks: PublicLink[] = initData(publicLinksStorage, defaultPublicLinks, (data) => data.length === 0);

// Função para calcular tempo médio de espera baseado nas últimas 5 mesas concluídas
const calculateAverageWaitTime = (): number => {
  // Buscar últimos 5 itens com status DONE que foram chamados
  const completedItems = mockQueue
    .filter(item => 
      item.status === QueueStatus.DONE && 
      item.calledAt && 
      item.joinedAt
    )
    .sort((a, b) => {
      // Ordenar por data de chamada (mais recentes primeiro)
      const aTime = new Date(a.calledAt!).getTime();
      const bTime = new Date(b.calledAt!).getTime();
      return bTime - aTime;
    })
    .slice(0, 5); // Pegar apenas os últimos 5
  
  if (completedItems.length === 0) {
    // Fallback para o tempo médio padrão do restaurante
    return mockRestaurant.averageTableTimeMinutes || 60;
  }
  
  // Calcular tempo entre joinedAt e calledAt para cada item
  const waitTimes = completedItems.map(item => {
    const joinedTime = new Date(item.joinedAt).getTime();
    const calledTime = new Date(item.calledAt!).getTime();
    return (calledTime - joinedTime) / (1000 * 60); // Converter para minutos
  });
  
  // Calcular média
  const average = waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;
  
  // Arredondar para número inteiro
  return Math.round(average);
};

const mockUser = {
  id: '1',
  email: 'admin@demo.com',
  name: 'Admin Demo',
  role: 'ADMIN' as const,
  restaurantId: '1',
};

// Simula localStorage para autenticação
const getMockToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

const isAuthenticated = () => {
  return !!getMockToken();
};

// Interface para o Mock API
interface MockApi {
  get<T = any>(endpoint: string): Promise<T>;
  post<T = any>(endpoint: string, body?: any): Promise<T>;
  patch<T = any>(endpoint: string, body?: any): Promise<T>;
  put<T = any>(endpoint: string, body?: any): Promise<T>;
  delete<T = any>(endpoint: string): Promise<T>;
}

// Função auxiliar para processar requisições POST/PATCH/PUT
const handlePostRequest = async <T = any>(endpoint: string, body?: any): Promise<T> => {
    await delay(500);
    
    if (endpoint === '/auth/login') {
      const { email, password } = body || {};
      if (email && password) {
        // Simula login bem-sucedido
        const token = 'mock_jwt_token_' + Date.now();
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(mockUser));
        }
        return {
          access_token: token, // AuthContext espera 'access_token'
          token, // Mantém para compatibilidade
          user: mockUser,
        } as T;
      }
      throw { status: 401, message: 'Credenciais inválidas' };
    }

    if (endpoint === '/auth/register') {
      const token = 'mock_jwt_token_' + Date.now();
      const newUser = { ...mockUser, email: body?.email, name: body?.name };
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
      }
      return {
        access_token: token,
        token,
        user: newUser,
      } as T;
    }

    // Queue
    if (endpoint.startsWith('/queue/join/')) {
      const slug = endpoint.split('/queue/join/')[1];
      const newItem: QueueItem = {
        id: Date.now().toString(),
        customerName: body?.customerName || '',
        partySize: body?.partySize || 1,
        phone: body?.phone || '',
        email: body?.email,
        status: QueueStatus.WAITING,
        joinedAt: new Date(),
        position: mockQueue.length + 1,
        manualOrder: false,
        estimatedWaitMinutes: 15,
      };
      mockQueue.push(newItem);
      queueStorage.save(mockQueue);
      return { id: newItem.id } as T;
    }

    if (endpoint === '/queue') {
      if (!isAuthenticated()) throw { status: 401 };
      return mockQueue as T;
    }

    if (endpoint.startsWith('/queue/') && endpoint.endsWith('/move')) {
      const id = endpoint.split('/')[2];
      const { position: newPosition } = body || {};
      const item = mockQueue.find(q => q.id === id);
      if (item && newPosition && newPosition > 0) {
        // Buscar apenas itens aguardando (WAITING ou NOTIFIED)
        const waitingItems = mockQueue.filter(q => 
          q.status === QueueStatus.WAITING || q.status === QueueStatus.NOTIFIED
        ).sort((a, b) => {
          if (a.manualOrder && b.manualOrder) {
            return a.position - b.position;
          }
          return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        });
        
        const currentIndex = waitingItems.findIndex(q => q.id === id);
        if (currentIndex >= 0) {
          // Remover item da posição atual
          waitingItems.splice(currentIndex, 1);
          // Inserir na nova posição
          const insertIndex = Math.min(newPosition - 1, waitingItems.length);
          waitingItems.splice(insertIndex, 0, item);
          
          // Atualizar posições e manualOrder
          waitingItems.forEach((q, index) => {
            q.position = index + 1;
            q.manualOrder = true;
          });
          
          queueStorage.save(mockQueue);
          return item as T;
        }
      }
      throw { status: 404 };
    }

    if (endpoint.startsWith('/queue/') && endpoint.endsWith('/status')) {
      const id = endpoint.split('/')[2];
      const { status } = body || {};
      const item = mockQueue.find(q => q.id === id);
      if (item) {
        item.status = status;
        if (status === QueueStatus.CALLED) {
          item.calledAt = new Date();
        }
        if (status === QueueStatus.NOTIFIED) {
          item.notifiedAt = new Date();
        }
        
        // Recalcular posições de todos os itens aguardando quando status muda
        const waitingItems = mockQueue.filter(q => 
          q.status === QueueStatus.WAITING || q.status === QueueStatus.NOTIFIED
        ).sort((a, b) => {
          // Ordenar por joinedAt (quem chegou primeiro) ou position (se houver ordem manual)
          if (a.manualOrder && b.manualOrder) {
            return a.position - b.position;
          }
          return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        });
        
        // Atualizar posições
        waitingItems.forEach((q, index) => {
          q.position = index + 1;
        });
        
        queueStorage.save(mockQueue);
      }
      return item as T;
    }

    if (endpoint.startsWith('/queue/public/') && endpoint.includes('/ticket/')) {
      const parts = endpoint.split('/');
      const ticketId = parts[parts.length - 1];
      const item = mockQueue.find(q => q.id === ticketId) || mockQueue[0];
      
      // Recalcular posição baseada apenas em quem está aguardando (WAITING ou NOTIFIED)
      const waitingItems = mockQueue.filter(q => 
        q.status === QueueStatus.WAITING || q.status === QueueStatus.NOTIFIED
      ).sort((a, b) => {
        // Ordenar por joinedAt (quem chegou primeiro) ou position (se houver ordem manual)
        if (a.manualOrder && b.manualOrder) {
          return a.position - b.position;
        }
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      });
      
      const actualPosition = waitingItems.findIndex(q => q.id === ticketId) + 1;
      const waitingCount = waitingItems.length;
      
      return {
        position: actualPosition || item.position,
        waitingCount: waitingCount,
        estimatedWaitMinutes: item.estimatedWaitMinutes || 15,
        status: item.status,
        restaurantName: mockRestaurant.name,
        calledTimeoutMinutes: mockRestaurant.calledTimeoutMinutes,
      } as T;
    }

    if (endpoint.startsWith('/queue/public/') && !endpoint.includes('/ticket/')) {
      const slug = endpoint.split('/queue/public/')[1];
      // Contar apenas quem está realmente aguardando (WAITING ou NOTIFIED)
      const waitingCount = mockQueue.filter(q => 
        q.status === QueueStatus.WAITING || q.status === QueueStatus.NOTIFIED
      ).length;
      
      return {
        waitingCount: waitingCount,
        averageWaitMinutes: 20,
        restaurantName: mockRestaurant.name,
      } as T;
    }

    // Menu
    if (endpoint === '/menu') {
      if (!isAuthenticated()) throw { status: 401 };
      // Se tem body, é POST
      if (body && Object.keys(body).length > 0) {
        const newItem: MenuItem = {
          id: Date.now().toString(),
          ...body,
          isActive: true,
          available: true,
        };
        mockMenu.push(newItem);
        menuStorage.save(mockMenu);
        return newItem as T;
      }
      // Senão é GET
      return mockMenu as T;
    }

    if (endpoint.startsWith('/menu/') && body) {
      const id = endpoint.split('/')[2];
      const index = mockMenu.findIndex(m => m.id === id);
      if (index >= 0) {
        mockMenu[index] = { ...mockMenu[index], ...body };
        menuStorage.save(mockMenu);
        return mockMenu[index] as T;
      }
      throw { status: 404 };
    }

    if (endpoint.startsWith('/menu/') && !body) {
      const id = endpoint.split('/')[2];
      const index = mockMenu.findIndex(m => m.id === id);
      if (index >= 0) {
        mockMenu.splice(index, 1);
        menuStorage.save(mockMenu);
        return { success: true } as T;
      }
      throw { status: 404 };
    }

    // Reservations
    if (endpoint === '/reservations') {
      if (!isAuthenticated()) throw { status: 401 };
      return mockReservations as T;
    }

    if (endpoint === '/reservations' && body) {
      const newReservation: Reservation = {
        id: Date.now().toString(),
        ...body,
        status: ReservationStatus.PENDING,
      };
      mockReservations.push(newReservation);
      reservationsStorage.save(mockReservations);
      return newReservation as T;
    }

    if (endpoint.startsWith('/reservations/') && endpoint.endsWith('/status')) {
      const id = endpoint.split('/')[2];
      const { status } = body || {};
      const reservation = mockReservations.find(r => r.id === id);
      if (reservation) {
        reservation.status = status;
        if (status === ReservationStatus.CHECKED_IN) {
          reservation.checkedInAt = new Date();
        }
        reservationsStorage.save(mockReservations);
      }
      return reservation as T;
    }

    // Customers
    if (endpoint === '/customers/find-or-create') {
      const { phone, name } = body || {};
      // Simula busca ou criação de cliente
      const mockCustomer = {
        id: Date.now().toString(),
        name: name || 'Cliente',
        phone,
        email: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return mockCustomer as T;
    }

    if (endpoint.startsWith('/customers/') && body) {
      const id = endpoint.split('/customers/')[1];
      // Simula atualização de cliente
      const mockCustomer = {
        id,
        name: body.name || 'Cliente',
        phone: '(11) 99999-0000',
        email: body.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return mockCustomer as T;
    }

    // Menu Categories
    if (endpoint === '/menu/categories') {
      if (!isAuthenticated()) throw { status: 401 };
      if (body && Object.keys(body).length > 0) {
        // POST - Criar categoria
        const newCategory: Category = {
          id: Date.now().toString(),
          restaurantId: mockRestaurant.id,
          name: body.name || 'Nova Categoria',
          isActive: body.isActive !== undefined ? body.isActive : true,
          displayOrder: mockCategories.length,
        };
        mockCategories.push(newCategory);
        categoriesStorage.save(mockCategories);
        return newCategory as T;
      }
      return mockCategories as T;
    }

    if (endpoint === '/menu/categories/reorder') {
      if (!isAuthenticated()) throw { status: 401 };
      const { items } = body || {};
      if (items && Array.isArray(items)) {
        items.forEach((item: any) => {
          const category = mockCategories.find(c => c.id === item.id);
          if (category) {
            category.displayOrder = item.displayOrder || 0;
          }
        });
        categoriesStorage.save(mockCategories);
        return { success: true } as T;
      }
      throw { status: 400 };
    }

    if (endpoint.startsWith('/menu/categories/') && body) {
      if (!isAuthenticated()) throw { status: 401 };
      const id = endpoint.split('/')[3];
      const index = mockCategories.findIndex(c => c.id === id);
      if (index >= 0) {
        mockCategories[index] = { ...mockCategories[index], ...body };
        categoriesStorage.save(mockCategories);
        return mockCategories[index] as T;
      }
      throw { status: 404 };
    }

    if (endpoint.startsWith('/menu/categories/') && !body) {
      if (!isAuthenticated()) throw { status: 401 };
      const id = endpoint.split('/')[3];
      const index = mockCategories.findIndex(c => c.id === id);
      if (index >= 0) {
        mockCategories.splice(index, 1);
        categoriesStorage.save(mockCategories);
        return { success: true } as T;
      }
      throw { status: 404 };
    }

    // Public Links
    if (endpoint === '/public-links' && body) {
      if (!isAuthenticated()) throw { status: 401 };
      const newLink: PublicLink = {
        id: Date.now().toString(),
        restaurantId: mockRestaurant.id,
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        name: body.name || 'Link Personalizado',
        slug: body.name ? body.name.toLowerCase().replace(/\s+/g, '-') : 'link-' + Date.now(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPublicLinks.push(newLink);
      publicLinksStorage.save(mockPublicLinks);
      return newLink as T;
    }

    if (endpoint.startsWith('/public-links/') && endpoint.endsWith('/activate')) {
      if (!isAuthenticated()) throw { status: 401 };
      const id = endpoint.split('/')[2];
      const link = mockPublicLinks.find(l => l.id === id);
      if (link) {
        link.isActive = true;
        link.updatedAt = new Date();
        publicLinksStorage.save(mockPublicLinks);
        return link as T;
      }
      throw { status: 404 };
    }

    if (endpoint.startsWith('/public-links/') && endpoint.endsWith('/deactivate')) {
      if (!isAuthenticated()) throw { status: 401 };
      const id = endpoint.split('/')[2];
      const link = mockPublicLinks.find(l => l.id === id);
      if (link) {
        link.isActive = false;
        link.updatedAt = new Date();
        publicLinksStorage.save(mockPublicLinks);
        return link as T;
      }
      throw { status: 404 };
    }

    // Restaurant
    if (endpoint === '/restaurants/me') {
      if (!isAuthenticated()) throw { status: 401 };
      return mockRestaurant as T;
    }

    // Health check
    if (endpoint === '/health') {
      return { status: 'ok', mode: 'mock' } as T;
    }

    throw { status: 404, message: 'Endpoint não encontrado no mock' };
};

// Mock API
export const mockApi: MockApi = {
  async post<T = any>(endpoint: string, body?: any): Promise<T> {
    return handlePostRequest<T>(endpoint, body);
  },

  async get<T = any>(endpoint: string): Promise<T> {
    await delay(300);

    // Auth check
    if (endpoint === '/auth/me') {
      if (!isAuthenticated()) throw { status: 401 };
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
      return (userStr ? JSON.parse(userStr) : mockUser) as T;
    }

    // Queue
    if (endpoint === '/queue') {
      if (!isAuthenticated()) throw { status: 401 };
      return mockQueue as T;
    }

    if (endpoint.startsWith('/queue/public/') && endpoint.includes('/ticket/')) {
      const parts = endpoint.split('/');
      const ticketId = parts[parts.length - 1];
      const item = mockQueue.find(q => q.id === ticketId);
      
      if (!item) {
        throw { status: 404, message: 'Ticket não encontrado' };
      }
      
      // Recalcular posição baseada apenas em quem está aguardando (WAITING ou NOTIFIED)
      const waitingItems = mockQueue.filter(q => 
        q.status === QueueStatus.WAITING || q.status === QueueStatus.NOTIFIED
      ).sort((a, b) => {
        // Ordenar por joinedAt (quem chegou primeiro) ou position (se houver ordem manual)
        if (a.manualOrder && b.manualOrder) {
          return a.position - b.position;
        }
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      });
      
      // Se o item está CALLED, não está mais na fila de espera
      const actualPosition = item.status === QueueStatus.CALLED ? 0 : (waitingItems.findIndex(q => q.id === ticketId) + 1);
      const waitingCount = waitingItems.length;
      const averageWaitMinutes = calculateAverageWaitTime();
      
      return {
        position: actualPosition || 0,
        waitingCount: waitingCount,
        estimatedWaitMinutes: averageWaitMinutes,
        status: item.status, // Sempre retorna o status atual do item
        restaurantName: mockRestaurant.name,
        calledTimeoutMinutes: mockRestaurant.calledTimeoutMinutes,
      } as T;
    }

    if (endpoint.startsWith('/queue/public/') && !endpoint.includes('/ticket/')) {
      const slug = endpoint.split('/queue/public/')[1];
      // Contar apenas quem está realmente aguardando (WAITING ou NOTIFIED)
      const waitingCount = mockQueue.filter(q => 
        q.status === QueueStatus.WAITING || q.status === QueueStatus.NOTIFIED
      ).length;
      const averageWaitMinutes = calculateAverageWaitTime();
      
      return {
        waitingCount: waitingCount,
        averageWaitMinutes: averageWaitMinutes,
        restaurantName: mockRestaurant.name,
      } as T;
    }

    // Menu
    if (endpoint === '/menu') {
      if (!isAuthenticated()) throw { status: 401 };
      return mockMenu as T;
    }

    // Menu Categories
    if (endpoint === '/menu/categories') {
      if (!isAuthenticated()) throw { status: 401 };
      return mockCategories as T;
    }

    // Reservations
    if (endpoint === '/reservations') {
      if (!isAuthenticated()) throw { status: 401 };
      return mockReservations as T;
    }

    // Restaurant
    if (endpoint === '/restaurants/me') {
      if (!isAuthenticated()) throw { status: 401 };
      return mockRestaurant as T;
    }

    // Public Links
    if (endpoint === '/public-links') {
      if (!isAuthenticated()) throw { status: 401 };
      return {
        default: [],
        custom: mockPublicLinks,
      } as T;
    }

    // Health check
    if (endpoint === '/health') {
      return { status: 'ok', mode: 'mock' } as T;
    }

    throw { status: 404, message: 'Endpoint não encontrado no mock' };
  },

  async patch<T = any>(endpoint: string, body?: any): Promise<T> {
    return handlePostRequest<T>(endpoint, body);
  },

  async put<T = any>(endpoint: string, body?: any): Promise<T> {
    return handlePostRequest<T>(endpoint, body);
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    await delay(300);
    
    // Cancelar entrada na fila
    if (endpoint.startsWith('/queue/') && !endpoint.includes('/status')) {
      const id = endpoint.split('/')[2];
      const index = mockQueue.findIndex(q => q.id === id);
      if (index >= 0) {
        // Atualizar status para CANCELLED ao invés de remover
        mockQueue[index].status = QueueStatus.CANCELLED;
        
        // Recalcular posições de todos os itens aguardando
        const waitingItems = mockQueue.filter(q => 
          q.status === QueueStatus.WAITING || q.status === QueueStatus.NOTIFIED
        ).sort((a, b) => {
          if (a.manualOrder && b.manualOrder) {
            return a.position - b.position;
          }
          return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        });
        
        waitingItems.forEach((q, idx) => {
          q.position = idx + 1;
        });
        
        queueStorage.save(mockQueue);
        return { success: true } as T;
      }
      throw { status: 404 };
    }
    
    if (endpoint.startsWith('/menu/categories/')) {
      if (!isAuthenticated()) throw { status: 401 };
      const id = endpoint.split('/')[3];
      const index = mockCategories.findIndex(c => c.id === id);
      if (index >= 0) {
        mockCategories.splice(index, 1);
        categoriesStorage.save(mockCategories);
        return { success: true } as T;
      }
      throw { status: 404 };
    }
    
    if (endpoint.startsWith('/menu/')) {
      if (!isAuthenticated()) throw { status: 401 };
      const id = endpoint.split('/')[2];
      const index = mockMenu.findIndex(m => m.id === id);
      if (index >= 0) {
        mockMenu.splice(index, 1);
        menuStorage.save(mockMenu);
        return { success: true } as T;
      }
      throw { status: 404 };
    }

    throw { status: 404 };
  },
};

