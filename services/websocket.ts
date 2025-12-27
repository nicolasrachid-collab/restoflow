import { io, Socket } from 'socket.io-client';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type ErrorCallback = (error: Error) => void;
type StatusCallback = (status: ConnectionStatus) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private status: ConnectionStatus = 'disconnected';
  private errorCallbacks: Set<ErrorCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();

  private isWebSocketDisabled(): boolean {
    return import.meta.env.VITE_DISABLE_WEBSOCKET === 'true';
  }

  private createMockSocket(): Socket {
    // Retorna um objeto mock que simula um socket desconectado
    return {
      connected: false,
      emit: () => {},
      on: () => this as any,
      off: () => this as any,
      once: () => this as any,
      disconnect: () => {},
      removeAllListeners: () => this as any,
    } as any;
  }

  connect(namespace: string = '/queue'): Socket {
    // Se WebSocket está desabilitado, retorna um mock socket
    if (this.isWebSocketDisabled()) {
      console.log('🔇 WebSocket desabilitado em modo desenvolvimento');
      this.setStatus('disconnected');
      return this.createMockSocket();
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    // Se já existe um socket desconectado, limpa antes de criar novo
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.setStatus('connecting');

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
    this.socket = io(`${wsUrl}${namespace}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      this.reconnectAttempts = 0;
      this.setStatus('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado:', reason);
      this.setStatus('disconnected');
      
      // Se foi desconexão forçada pelo servidor ou erro, notifica
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        this.notifyError(new Error(`WebSocket desconectado: ${reason}`));
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      this.reconnectAttempts++;
      this.setStatus('error');
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('⚠️ Máximo de tentativas de reconexão atingido');
        this.notifyError(new Error('Não foi possível conectar ao servidor. Verifique sua conexão.'));
      } else {
        this.notifyError(new Error(`Tentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`));
      }
    });

    // Tratamento de erros de eventos
    this.socket.on('error', (error: any) => {
      console.error('❌ Erro no WebSocket:', error);
      this.notifyError(new Error(error?.message || 'Erro no WebSocket'));
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.setStatus('disconnected');
      this.reconnectAttempts = 0;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    if (this.isWebSocketDisabled()) {
      return false; // Sempre retorna false quando desabilitado
    }
    return this.socket?.connected || false;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  // Emite evento apenas se estiver conectado
  safeEmit(event: string, data?: any): boolean {
    if (this.isWebSocketDisabled()) {
      console.log(`🔇 WebSocket desabilitado - evento '${event}' ignorado`);
      return false;
    }
    if (!this.socket?.connected) {
      console.warn(`⚠️ Tentativa de emitir evento '${event}' sem conexão WebSocket`);
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  // Aguarda conexão antes de emitir
  async waitForConnection(timeout: number = 5000): Promise<boolean> {
    if (this.isWebSocketDisabled()) {
      return false; // Retorna false imediatamente quando desabilitado
    }
    if (this.isConnected()) {
      return true;
    }

    return new Promise((resolve) => {
      let resolved = false;
      const startTime = Date.now();

      const checkConnection = () => {
        if (resolved) return;
        
        if (this.isConnected()) {
          resolved = true;
          resolve(true);
          return;
        }

        // Verifica timeout
        if (Date.now() - startTime >= timeout) {
          resolved = true;
          resolve(false);
          return;
        }

        // Continua verificando
        setTimeout(checkConnection, 100);
      };

      // Listener para quando conectar
      const onConnect = () => {
        if (!resolved) {
          resolved = true;
          if (this.socket) {
            this.socket.off('connect', onConnect);
          }
          resolve(true);
        }
      };

      if (this.socket) {
        this.socket.once('connect', onConnect);
      }

      // Inicia verificação
      checkConnection();
    });
  }

  // Callbacks para notificações
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  private setStatus(status: ConnectionStatus) {
    if (this.status !== status) {
      this.status = status;
      this.statusCallbacks.forEach(callback => callback(status));
    }
  }

  private notifyError(error: Error) {
    this.errorCallbacks.forEach(callback => callback(error));
  }
}

export const wsService = new WebSocketService();

