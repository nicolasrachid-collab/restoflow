import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { QueueService } from './queue.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/queue',
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QueueGateway.name);
  private restaurantRooms = new Map<string, Set<string>>(); // restaurantId -> Set of socketIds

  constructor(private queueService: QueueService) {}

  handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);
      
      // Tratamento de erros do cliente
      client.on('error', (error) => {
        this.logger.error(`Erro no cliente ${client.id}: ${error}`, error instanceof Error ? error.stack : '');
      });
    } catch (error) {
      this.logger.error(`Erro ao processar conexão: ${error}`, error instanceof Error ? error.stack : '');
    }
  }

  handleDisconnect(client: Socket) {
    try {
      this.logger.log(`Client disconnected: ${client.id}`);
      
      // Remove client from all restaurant rooms
      this.restaurantRooms.forEach((sockets, restaurantId) => {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.restaurantRooms.delete(restaurantId);
        }
      });
    } catch (error) {
      this.logger.error(`Erro ao processar desconexão: ${error}`, error instanceof Error ? error.stack : '');
    }
  }

  @SubscribeMessage('join-restaurant')
  async handleJoinRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { restaurantId: string },
  ) {
    try {
      const { restaurantId } = data;
      if (!restaurantId) {
        client.emit('error', { message: 'restaurantId é obrigatório' });
        this.logger.warn(`Client ${client.id} tentou entrar sem restaurantId`);
        return;
      }

      // Join room for this restaurant
      await client.join(`restaurant:${restaurantId}`);
      
      // Track room membership
      if (!this.restaurantRooms.has(restaurantId)) {
        this.restaurantRooms.set(restaurantId, new Set());
      }
      this.restaurantRooms.get(restaurantId)!.add(client.id);

      this.logger.log(`Client ${client.id} joined restaurant room: ${restaurantId}`);
      client.emit('joined', { restaurantId });
    } catch (error) {
      this.logger.error(`Erro ao processar join-restaurant: ${error}`, error instanceof Error ? error.stack : '');
      client.emit('error', { message: 'Erro ao entrar na sala do restaurante' });
    }
  }

  @SubscribeMessage('join-public-queue')
  async handleJoinPublicQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { slug: string; ticketId?: string },
  ) {
    try {
      const { slug, ticketId } = data;
      if (!slug) {
        client.emit('error', { message: 'slug é obrigatório' });
        this.logger.warn(`Client ${client.id} tentou entrar sem slug`);
        return;
      }

      // Join room for public queue by slug
      await client.join(`public-queue:${slug}`);
      
      if (ticketId) {
        // Also join ticket-specific room for position updates
        await client.join(`ticket:${ticketId}`);
      }

      this.logger.log(`Client ${client.id} joined public queue: ${slug}`);
      client.emit('joined', { slug, ticketId });
    } catch (error) {
      this.logger.error(`Erro ao processar join-public-queue: ${error}`, error instanceof Error ? error.stack : '');
      client.emit('error', { message: 'Erro ao entrar na fila pública' });
    }
  }

  // Emit queue update to restaurant room
  emitQueueUpdate(restaurantId: string, queueData: any) {
    try {
      if (!restaurantId) {
        this.logger.warn('Tentativa de emitir queue-updated sem restaurantId');
        return;
      }
      this.server.to(`restaurant:${restaurantId}`).emit('queue-updated', queueData);
    } catch (error) {
      this.logger.error(`Erro ao emitir queue-updated: ${error}`, error instanceof Error ? error.stack : '');
    }
  }

  // Emit position update to ticket room
  emitPositionUpdate(ticketId: string, positionData: any) {
    try {
      if (!ticketId) {
        this.logger.warn('Tentativa de emitir position-updated sem ticketId');
        return;
      }
      this.server.to(`ticket:${ticketId}`).emit('position-updated', positionData);
    } catch (error) {
      this.logger.error(`Erro ao emitir position-updated: ${error}`, error instanceof Error ? error.stack : '');
    }
  }

  // Emit general queue status to public room
  emitPublicQueueUpdate(slug: string, statusData: any) {
    try {
      if (!slug) {
        this.logger.warn('Tentativa de emitir queue-status-updated sem slug');
        return;
      }
      this.server.to(`public-queue:${slug}`).emit('queue-status-updated', statusData);
      this.logger.debug(`Emitted 'queue-status-updated' to public-queue:${slug}`, statusData);
    } catch (error) {
      this.logger.error(`Erro ao emitir queue-status-updated: ${error}`, error instanceof Error ? error.stack : '');
    }
  }

  // Emit status change event to ticket room
  emitStatusChanged(ticketId: string, statusData: { ticketId: string; status: string; position: number }) {
    try {
      if (!ticketId) {
        this.logger.warn('Tentativa de emitir status-changed sem ticketId');
        return;
      }
      this.server.to(`ticket:${ticketId}`).emit('status-changed', statusData);
      this.logger.debug(`Emitted 'status-changed' to ticket:${ticketId}`, statusData);
    } catch (error) {
      this.logger.error(`Erro ao emitir status-changed: ${error}`, error instanceof Error ? error.stack : '');
    }
  }
}

