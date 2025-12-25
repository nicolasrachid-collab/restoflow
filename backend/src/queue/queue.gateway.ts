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
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove client from all restaurant rooms
    this.restaurantRooms.forEach((sockets, restaurantId) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.restaurantRooms.delete(restaurantId);
      }
    });
  }

  @SubscribeMessage('join-restaurant')
  async handleJoinRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { restaurantId: string },
  ) {
    const { restaurantId } = data;
    if (!restaurantId) {
      client.emit('error', { message: 'restaurantId é obrigatório' });
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
  }

  @SubscribeMessage('join-public-queue')
  async handleJoinPublicQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { slug: string; ticketId?: string },
  ) {
    const { slug, ticketId } = data;
    if (!slug) {
      client.emit('error', { message: 'slug é obrigatório' });
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
  }

  // Emit queue update to restaurant room
  emitQueueUpdate(restaurantId: string, queueData: any) {
    this.server.to(`restaurant:${restaurantId}`).emit('queue-updated', queueData);
  }

  // Emit position update to ticket room
  emitPositionUpdate(ticketId: string, positionData: any) {
    this.server.to(`ticket:${ticketId}`).emit('position-updated', positionData);
  }

  // Emit general queue status to public room
  emitPublicQueueUpdate(slug: string, statusData: any) {
    this.server.to(`public-queue:${slug}`).emit('queue-status-updated', statusData);
  }
}

