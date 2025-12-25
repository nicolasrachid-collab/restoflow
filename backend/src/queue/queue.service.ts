import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CustomersService } from '../customers/customers.service';
import { PublicLinksService } from '../public-links/public-links.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { AuditService } from '../audit/audit.service';
import { QueueStatus } from '@prisma/client';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
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

  async joinQueue(slugOrCode: string, data: { customerName: string; phone: string; email: string; partySize: number; customerId?: string }, userId?: string) {
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

    // Validar email obrigatório
    if (!data.email || !data.email.trim()) {
      throw new BadRequestException('Email é obrigatório para receber notificações');
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      throw new BadRequestException('Email inválido');
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
    let customerData = { customerName: data.customerName, phone: data.phone, email: data.email.trim() };
    if (data.customerId) {
      try {
        const customer = await this.customersService.findById(data.customerId);
        customerData = {
          customerName: customer.name,
          phone: customer.phone,
          email: data.email.trim(),
        };
        
        // Atualizar email do customer se fornecido e diferente
        if (data.email.trim() && customer.email !== data.email.trim()) {
          await this.customersService.update(data.customerId, { email: data.email.trim() });
        }
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
        email: customerData.email,
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

    // Recalcular posições e verificar notificações (assíncrono, não bloqueia)
    this.recalculatePositions(restaurant.id).then(() => {
      this.checkAndNotifyPositions(restaurant.id).catch(err => {
        // Log apenas, não bloqueia
        console.error('Erro ao verificar notificações:', err);
      });
    }).catch(err => {
      console.error('Erro ao recalcular posições:', err);
    });

    // Emit WebSocket event
    if (this.queueGateway) {
      const queue = await this.getQueue(restaurant.id);
      this.queueGateway.emitQueueUpdate(restaurant.id, queue);
      const publicStatus = await this.getPublicQueueStatus(restaurant.slug);
      this.queueGateway.emitPublicQueueUpdate(restaurant.slug, publicStatus);
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

    // Recalcular posições após adicionar manualmente
    this.recalculatePositions(restaurantId).catch(err => {
      console.error('Erro ao recalcular posições:', err);
    });

    // Emit WebSocket event
    if (this.queueGateway) {
      const queue = await this.getQueue(restaurantId);
      this.queueGateway.emitQueueUpdate(restaurantId, queue);
      const restaurant = await (this.prisma as any).restaurant.findUnique({
        where: { id: restaurantId },
      });
      if (restaurant) {
        const publicStatus = await this.getPublicQueueStatus(restaurant.slug);
        this.queueGateway.emitPublicQueueUpdate(restaurant.slug, publicStatus);
      }
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

    // Calcular tempo médio baseado nos últimos 5 atendidos
    const last5Completed = await (this.prisma as any).queueItem.findMany({
      where: {
        restaurantId: restaurant.id,
        status: QueueStatus.DONE,
        calledAt: { not: null },
      },
      orderBy: { calledAt: 'desc' },
      take: 5,
    });

    let averageWaitMinutes = restaurant.averageTableTimeMinutes || 45;
    if (last5Completed.length > 0) {
      const totalWaitTime = last5Completed.reduce((sum: number, item: any) => {
        const waitTime = (new Date(item.calledAt).getTime() - new Date(item.joinedAt).getTime()) / 60000;
        return sum + waitTime;
      }, 0);
      averageWaitMinutes = Math.round(totalWaitTime / last5Completed.length);
    }

    return { 
      waitingCount, 
      restaurantName: restaurant.name,
      averageWaitMinutes,
    };
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
    if (status === QueueStatus.CALLED && item.email) {
      // Enviar notificação de chamado via novo método
      await this.sendNotification(item, item.restaurant, 'CALLED');
    }

    // Recalcular posições e verificar notificações (assíncrono)
    this.recalculatePositions(restaurantId).then(() => {
      this.checkAndNotifyPositions(restaurantId).catch(err => {
        console.error('Erro ao verificar notificações:', err);
      });
    }).catch(err => {
      console.error('Erro ao recalcular posições:', err);
    });

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
          const publicStatus = await this.getPublicQueueStatus(restaurant.slug);
          this.queueGateway.emitPublicQueueUpdate(restaurant.slug, publicStatus);
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

  // Recalcular posições de todos os itens na fila
  async recalculatePositions(restaurantId: string) {
    const queueItems = await (this.prisma as any).queueItem.findMany({
      where: {
        restaurantId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.CALLED],
        },
      },
      orderBy: [
        { manualOrder: 'desc' },
        { joinedAt: 'asc' },
      ],
    });

    // Atualizar posições
    for (let i = 0; i < queueItems.length; i++) {
      await (this.prisma as any).queueItem.update({
        where: { id: queueItems[i].id },
        data: { position: i + 1 },
      });
    }

    return queueItems;
  }

  // Verificar posições e enviar notificações automáticas
  async checkAndNotifyPositions(restaurantId: string) {
    try {
      // Primeiro, recalcular posições
      const queueItems = await this.recalculatePositions(restaurantId);

      const restaurant = await (this.prisma as any).restaurant.findUnique({
        where: { id: restaurantId },
      });

      if (!restaurant) return;

      // Verificar cada item e enviar notificações quando necessário
      for (let i = 0; i < queueItems.length; i++) {
        const item = queueItems[i];
        const position = i + 1;

        // Só notificar se tiver email
        if (!item.email) continue;

        try {
          // Posição 3: Primeira notificação (faltam 3 grupos)
          if (position === 3 && item.status === QueueStatus.WAITING && !item.notifiedAt) {
            await this.sendNotification(item, restaurant, 'POSITION_3');
            // Marcar como notificado e atualizar status
            await (this.prisma as any).queueItem.update({
              where: { id: item.id },
              data: {
                status: QueueStatus.NOTIFIED,
                notifiedAt: new Date(),
              },
            });
          }
          // Posição 1: Segunda notificação (é o próximo)
          else if (position === 1 && item.status === QueueStatus.NOTIFIED && item.notifiedAt) {
            // Verificar se já notificou posição 1 (não enviar duplicado)
            const lastNotified = item.notifiedAt;
            const now = new Date();
            // Se notificou há mais de 1 minuto, pode enviar notificação de posição 1
            if ((now.getTime() - new Date(lastNotified).getTime()) > 60000) {
              await this.sendNotification(item, restaurant, 'POSITION_1');
              // Atualizar timestamp de notificação
              await (this.prisma as any).queueItem.update({
                where: { id: item.id },
                data: { notifiedAt: new Date() },
              });
            }
          }
          // CALLED: Notificar quando for chamado (já tratado no updateStatus, mas manter aqui como fallback)
          else if (item.status === QueueStatus.CALLED && item.calledAt) {
            // Verificar se já notificou sobre ser chamado
            const calledTime = new Date(item.calledAt);
            const now = new Date();
            // Se foi chamado há menos de 2 minutos, ainda pode enviar notificação
            if ((now.getTime() - calledTime.getTime()) < 120000) {
              await this.sendNotification(item, restaurant, 'CALLED');
            }
          }
        } catch (error) {
          // Não bloquear processo se notificação falhar
          this.logger.error(`Erro ao enviar notificação para ticket ${item.id}:`, error);
        }
      }
    } catch (error) {
      // Não bloquear processo se houver erro
      this.logger.error(`Erro ao verificar notificações para restaurante ${restaurantId}:`, error);
    }
  }

  // Enviar notificações (email + WhatsApp)
  private async sendNotification(item: any, restaurant: any, type: 'POSITION_3' | 'POSITION_1' | 'CALLED') {
    if (!item.email || !item.phone) return;

    const messages = {
      POSITION_3: {
        email: {
          subject: `Faltam 3 grupos na sua frente - ${restaurant.name}`,
          body: `Olá ${item.customerName},\n\nFaltam apenas 3 grupos na sua frente na fila do ${restaurant.name}!\n\nPrepare-se, você será chamado em breve.\n\nAtenciosamente,\nEquipe ${restaurant.name}`,
        },
        whatsapp: `Olá ${item.customerName}, faltam apenas 3 grupos na sua frente no ${restaurant.name}! Prepare-se, você será chamado em breve.`,
      },
      POSITION_1: {
        email: {
          subject: `Você é o próximo! - ${restaurant.name}`,
          body: `Olá ${item.customerName},\n\nVocê é o próximo na fila do ${restaurant.name}!\n\nFique atento, você será chamado em instantes.\n\nAtenciosamente,\nEquipe ${restaurant.name}`,
        },
        whatsapp: `Olá ${item.customerName}, você é o próximo na fila do ${restaurant.name}! Fique atento, você será chamado em instantes.`,
      },
      CALLED: {
        email: {
          subject: `Sua mesa está pronta! - ${restaurant.name}`,
          body: `Olá ${item.customerName},\n\nSua mesa no ${restaurant.name} está pronta!\n\nPor favor, dirija-se à recepção.\n\nAtenciosamente,\nEquipe ${restaurant.name}`,
        },
        whatsapp: `Olá ${item.customerName}, sua mesa no ${restaurant.name} está pronta! Por favor, dirija-se à recepção.`,
      },
    };

    const msg = messages[type];

    // Enviar email e WhatsApp em paralelo (não bloqueia se um falhar)
    await Promise.allSettled([
      this.notifications.sendEmail(item.email, msg.email.subject, msg.email.body),
      this.notifications.sendWhatsApp(item.phone, msg.whatsapp),
    ]);
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