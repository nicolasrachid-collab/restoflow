import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CustomersService } from '../customers/customers.service';
import { PublicLinksService } from '../public-links/public-links.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { AuditService } from '../audit/audit.service';
import { QueueStatus } from '@prisma/client';

@Injectable()
export class QueueService {
  private queueGateway: any; // Will be injected via setter

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private customersService: CustomersService,
    private publicLinksService: PublicLinksService,
    private restaurantsService: RestaurantsService,
    private auditService: AuditService,
  ) {}

  setGateway(gateway: any) {
    this.queueGateway = gateway;
  }

  async joinQueue(slugOrCode: string, data: { customerName: string; phone: string; partySize: number; customerId?: string }, userId?: string) {
    // Verificar se é um código de link personalizado
    let restaurant;
    const publicLink = await this.publicLinksService.getLinkByCode(slugOrCode);
    
    if (publicLink) {
      restaurant = publicLink.restaurant;
    } else {
      restaurant = await (this.prisma as any).restaurant.findUnique({
        where: { slug: slugOrCode }
      });
    }
    
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    // Validações de negócio
    if (!restaurant.isActive) {
      throw new ForbiddenException('Restaurante está desativado');
    }

    if (!restaurant.queueActive) {
      throw new ForbiddenException('Fila de espera está desativada');
    }

    // Validar horário de funcionamento (apenas para entrada pública, não para admin)
    if (!userId) {
      const isOpen = await this.restaurantsService.checkOperatingHours(restaurant.id);
      if (!isOpen) {
        throw new ForbiddenException('Restaurante está fechado no momento');
      }
    }

    // Validar limite de pessoas
    if (data.partySize > restaurant.maxPartySize) {
      throw new BadRequestException(`Número de pessoas excede o limite de ${restaurant.maxPartySize}`);
    }

    if (data.partySize < 1) {
      throw new BadRequestException('Número de pessoas deve ser pelo menos 1');
    }

    // Validar telefone único ativo na fila
    const existingActive = await (this.prisma as any).queueItem.findFirst({
      where: {
        restaurantId: restaurant.id,
        phone: data.phone,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.CALLED],
        },
      },
    });

    if (existingActive) {
      throw new BadRequestException('Você já está na fila. Aguarde sua vez.');
    }

    // Se customerId fornecido, buscar dados do Customer
    let customerData = { customerName: data.customerName, phone: data.phone };
    if (data.customerId) {
      try {
        const customer = await this.customersService.findById(data.customerId);
        customerData = {
          customerName: customer.name,
          phone: customer.phone,
        };
      } catch (e) {
        // Se customer não encontrado, usar dados fornecidos
      }
    }

    // Calcular posição inicial
    const waitingCount = await (this.prisma as any).queueItem.count({
      where: {
        restaurantId: restaurant.id,
        status: QueueStatus.WAITING,
      },
    });

    const ticket = await (this.prisma as any).queueItem.create({
      data: {
        customerName: customerData.customerName,
        phone: customerData.phone,
        partySize: data.partySize,
        status: QueueStatus.WAITING,
        restaurantId: restaurant.id,
        customerId: data.customerId || null,
        position: waitingCount + 1,
      },
    });

    // Registrar em audit log
    await this.auditService.logAction(
      restaurant.id,
      userId || null,
      'QueueItem',
      ticket.id,
      'CREATE',
      null,
      ticket,
    );

    // Emit WebSocket event
    if (this.queueGateway) {
      const queue = await this.getQueue(restaurant.id);
      this.queueGateway.emitQueueUpdate(restaurant.id, queue);
      this.queueGateway.emitPublicQueueUpdate(restaurant.slug, await this.getPublicQueueStatus(restaurant.slug));
    }

    return ticket;
  }

  async getQueue(restaurantId: string) {
    return (this.prisma as any).queueItem.findMany({
      where: { restaurantId },
      orderBy: [
        { manualOrder: 'desc' },
        { position: 'asc' },
        { joinedAt: 'asc' },
      ],
    });
  }

  async addManually(restaurantId: string, data: { customerName: string; phone: string; partySize: number }, userId: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    // Validar limite de pessoas
    if (data.partySize > restaurant.maxPartySize) {
      throw new BadRequestException(`Número de pessoas excede o limite de ${restaurant.maxPartySize}`);
    }

    // Validar telefone único ativo
    const existingActive = await (this.prisma as any).queueItem.findFirst({
      where: {
        restaurantId,
        phone: data.phone,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.CALLED],
        },
      },
    });

    if (existingActive) {
      throw new BadRequestException('Cliente já está na fila');
    }

    const waitingCount = await (this.prisma as any).queueItem.count({
      where: {
        restaurantId,
        status: QueueStatus.WAITING,
      },
    });

    const ticket = await (this.prisma as any).queueItem.create({
      data: {
        ...data,
        status: QueueStatus.WAITING,
        restaurantId,
        position: waitingCount + 1,
      },
    });

    // Registrar em audit log
    await this.auditService.logAction(
      restaurantId,
      userId,
      'QueueItem',
      ticket.id,
      'CREATE',
      null,
      ticket,
      { source: 'manual' },
    );

    // Emit WebSocket event
    if (this.queueGateway) {
      const queue = await this.getQueue(restaurantId);
      this.queueGateway.emitQueueUpdate(restaurantId, queue);
    }

    return ticket;
  }

  // Novo método para consulta pública
  async getPublicQueueStatus(slugOrCode: string) {
    // Verificar se é um código de link personalizado
    let restaurant;
    const publicLink = await this.publicLinksService.getLinkByCode(slugOrCode);
    
    if (publicLink) {
      restaurant = publicLink.restaurant;
    } else {
      restaurant = await (this.prisma as any).restaurant.findUnique({
        where: { slug: slugOrCode }
      });
    }
    
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    // Conta quantos estão esperando
    const waitingCount = await (this.prisma as any).queueItem.count({
      where: { 
        restaurantId: restaurant.id,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED],
        },
      },
    });

    return { waitingCount, restaurantName: restaurant.name };
  }

  // Retorna a posição exata de um ticket na fila
  async getTicketPosition(slugOrCode: string, ticketId: string) {
    // Verificar se é um código de link personalizado
    let restaurant;
    const publicLink = await this.publicLinksService.getLinkByCode(slugOrCode);
    
    if (publicLink) {
      restaurant = publicLink.restaurant;
    } else {
      restaurant = await (this.prisma as any).restaurant.findUnique({
        where: { slug: slugOrCode }
      });
    }
    
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    const ticket = await (this.prisma as any).queueItem.findFirst({
      where: { 
        id: ticketId,
        restaurantId: restaurant.id
      }
    });

    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    // Se não está aguardando ou notificado, retorna posição 0
    if (ticket.status !== QueueStatus.WAITING && ticket.status !== QueueStatus.NOTIFIED) {
      return {
        position: 0,
        waitingCount: 0,
        status: ticket.status,
        restaurantName: restaurant.name,
        estimatedWaitMinutes: 0,
      };
    }

    // Conta quantos tickets WAITING/NOTIFIED foram criados ANTES deste ticket
    const position = await (this.prisma as any).queueItem.count({
      where: {
        restaurantId: restaurant.id,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED],
        },
        OR: [
          { position: { lt: ticket.position } },
          { position: ticket.position, joinedAt: { lt: ticket.joinedAt } },
        ],
      },
    });

    // Total de pessoas esperando (incluindo este ticket)
    const waitingCount = await (this.prisma as any).queueItem.count({
      where: {
        restaurantId: restaurant.id,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED],
        },
      },
    });

    // Estimativa baseada no tempo médio por mesa
    const estimatedWaitMinutes = Math.max(
      restaurant.averageTableTimeMinutes || 45,
      position * (restaurant.averageTableTimeMinutes || 45),
    );

    return {
      position: position + 1, // Posição (1-based)
      waitingCount,
      status: ticket.status,
      restaurantName: restaurant.name,
      estimatedWaitMinutes,
      ticketId: ticket.id,
    };
  }

  async updateStatus(restaurantId: string, id: string, status: QueueStatus, userId: string) {
    const item = await (this.prisma as any).queueItem.findFirst({
      where: { id, restaurantId },
      include: { restaurant: true },
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    const oldStatus = item.status;
    const updateData: any = { status };

    // Atualizar timestamps conforme mudança de status
    if (status === QueueStatus.NOTIFIED && oldStatus === QueueStatus.WAITING) {
      updateData.notifiedAt = new Date();
    } else if (status === QueueStatus.CALLED && oldStatus !== QueueStatus.CALLED) {
      updateData.calledAt = new Date();
    } else if (status === QueueStatus.NO_SHOW && oldStatus === QueueStatus.CALLED) {
      updateData.noShowAt = new Date();
    }

    const updated = await (this.prisma as any).queueItem.update({
      where: { id },
      data: updateData,
    });

    // Registrar em audit log
    await this.auditService.logAction(
      restaurantId,
      userId,
      'QueueItem',
      id,
      'STATUS_CHANGE',
      { status: oldStatus },
      { status: status, ...updateData },
    );

    // Notificações
    if (status === QueueStatus.CALLED) {
      await this.notifications.sendQueueAlert(
        item.phone,
        item.customerName,
        item.restaurant.name,
      );
    } else if (status === QueueStatus.NOTIFIED) {
      // Notificar que está próximo (opcional)
      // await this.notifications.sendQueueNotification(...)
    }

    // Emit WebSocket events
    if (this.queueGateway) {
      const queue = await this.getQueue(restaurantId);
      this.queueGateway.emitQueueUpdate(restaurantId, queue);

      if (status === QueueStatus.WAITING || status === QueueStatus.NOTIFIED || status === QueueStatus.CALLED) {
        const restaurant = await (this.prisma as any).restaurant.findUnique({
          where: { id: restaurantId },
        });
        if (restaurant) {
          const positionData = await this.getTicketPosition(restaurant.slug, id);
          this.queueGateway.emitPositionUpdate(id, positionData);
          this.queueGateway.emitPublicQueueUpdate(restaurant.slug, await this.getPublicQueueStatus(restaurant.slug));
        }
      }
    }

    return updated;
  }

  async notifyCustomer(restaurantId: string, id: string, userId: string) {
    return this.updateStatus(restaurantId, id, QueueStatus.NOTIFIED, userId);
  }

  async reorderQueue(restaurantId: string, items: { id: string; position: number }[], userId: string) {
    // Atualizar posições manualmente
    for (const item of items) {
      await (this.prisma as any).queueItem.update({
        where: { id: item.id },
        data: {
          position: item.position,
          manualOrder: true,
        },
      });

      await this.auditService.logAction(
        restaurantId,
        userId,
        'QueueItem',
        item.id,
        'UPDATE',
        null,
        { position: item.position, manualOrder: true },
        { action: 'reorder' },
      );
    }

    // Emit WebSocket event
    if (this.queueGateway) {
      const queue = await this.getQueue(restaurantId);
      this.queueGateway.emitQueueUpdate(restaurantId, queue);
    }

    return { success: true };
  }

  async checkNoShows(restaurantId: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) return;

    const timeoutMinutes = restaurant.calledTimeoutMinutes || 10;
    const timeoutDate = new Date();
    timeoutDate.setMinutes(timeoutDate.getMinutes() - timeoutMinutes);

    const noShows = await (this.prisma as any).queueItem.findMany({
      where: {
        restaurantId,
        status: QueueStatus.CALLED,
        calledAt: {
          lt: timeoutDate,
        },
      },
    });

    for (const item of noShows) {
      await this.updateStatus(restaurantId, item.id, QueueStatus.NO_SHOW, 'system');
    }

    return noShows.length;
  }
}