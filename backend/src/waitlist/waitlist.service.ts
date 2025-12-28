import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService, NotificationChannel } from '../notifications/notifications.service';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class WaitlistService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private customersService: CustomersService,
  ) {}

  /**
   * Lista todos os itens da waitlist de um restaurante
   */
  async findAll(restaurantId: string, includeNotified: boolean = true) {
    const where: any = { restaurantId };
    
    if (!includeNotified) {
      where.notified = false;
    }

    return (this.prisma as any).waitlist.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Adiciona um cliente à waitlist
   */
  async create(restaurantId: string, data: {
    customerName: string;
    phone: string;
    email?: string;
    partySize: number;
    preferredDate?: Date;
    preferredTime?: string;
    customerId?: string;
  }) {
    // Validar telefone
    if (!data.phone || data.phone.trim().length === 0) {
      throw new BadRequestException('Telefone é obrigatório');
    }

    // Validar email se fornecido
    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new BadRequestException('Formato de email inválido');
      }
    }

    // Validar tamanho do grupo
    if (data.partySize < 1) {
      throw new BadRequestException('Número de pessoas deve ser pelo menos 1');
    }

    // Verificar se já está na waitlist (não notificado)
    const existing = await (this.prisma as any).waitlist.findFirst({
      where: {
        restaurantId,
        phone: data.phone,
        notified: false,
      },
    });

    if (existing) {
      throw new BadRequestException('Você já está na lista de espera');
    }

    // Se customerId fornecido, buscar dados do Customer
    let customerData = {
      customerName: data.customerName,
      phone: data.phone,
      email: data.email || null,
    };

    if (data.customerId) {
      try {
        const customer = await this.customersService.findById(data.customerId);
        customerData = {
          customerName: customer.name,
          phone: customer.phone,
          email: data.email || customer.email || null,
        };

        // Atualizar email do customer se fornecido
        if (data.email && customer.email !== data.email) {
          await this.customersService.update(data.customerId, { email: data.email });
        }
      } catch (e) {
        // Se customer não encontrado, usar dados fornecidos
      }
    }

    const waitlistItem = await (this.prisma as any).waitlist.create({
      data: {
        restaurantId,
        customerName: customerData.customerName,
        phone: customerData.phone,
        email: customerData.email,
        partySize: data.partySize,
        preferredDate: data.preferredDate || null,
        preferredTime: data.preferredTime || null,
        notified: false,
      },
    });

    return waitlistItem;
  }

  /**
   * Remove um item da waitlist
   */
  async remove(restaurantId: string, id: string) {
    const item = await (this.prisma as any).waitlist.findFirst({
      where: { id, restaurantId },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado na lista de espera');
    }

    return (this.prisma as any).waitlist.delete({
      where: { id },
    });
  }

  /**
   * Marca um item como notificado
   */
  async markAsNotified(restaurantId: string, id: string) {
    const item = await (this.prisma as any).waitlist.findFirst({
      where: { id, restaurantId },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado na lista de espera');
    }

    return (this.prisma as any).waitlist.update({
      where: { id },
      data: {
        notified: true,
        notifiedAt: new Date(),
      },
    });
  }

  /**
   * Notifica próximo cliente da waitlist quando uma vaga abre
   * Deve ser chamado quando uma reserva é cancelada ou quando há slots disponíveis
   */
  async notifyNextAvailable(restaurantId: string, availableDate: Date, availableTime?: string) {
    // Buscar próximo item não notificado, ordenado por data de criação
    const nextItem = await (this.prisma as any).waitlist.findFirst({
      where: {
        restaurantId,
        notified: false,
        OR: [
          { preferredDate: null },
          { preferredDate: availableDate },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!nextItem) {
      return null;
    }

    // Buscar dados do restaurante para o nome
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true },
    });

    // Notificar o cliente
    try {
      const restaurantName = restaurant?.name || 'nosso restaurante';
      const dateStr = availableDate.toLocaleDateString('pt-BR');
      const timeStr = availableTime || 'horário de sua preferência';

      if (nextItem.email) {
        try {
          await this.notificationsService.sendEmail(
            nextItem.email,
            'Vaga disponível para reserva',
            `Olá ${nextItem.customerName},\n\nUma vaga ficou disponível no ${restaurantName} para ${dateStr} às ${timeStr}.\n\nEntre em contato conosco para fazer sua reserva!\n\nAtenciosamente,\nEquipe ${restaurantName}`,
          );
        } catch (emailError) {
          // Se email falhar, tentar SMS
          console.warn('Erro ao enviar email, tentando SMS:', emailError);
          await this.notificationsService.sendSMS(
            nextItem.phone,
            `Olá ${nextItem.customerName}! Uma vaga ficou disponível no ${restaurantName} para ${dateStr}. Entre em contato conosco!`,
          );
        }
      } else {
        await this.notificationsService.sendSMS(
          nextItem.phone,
          `Olá ${nextItem.customerName}! Uma vaga ficou disponível no ${restaurantName} para ${dateStr}. Entre em contato conosco!`,
        );
      }

      // Marcar como notificado
      await this.markAsNotified(restaurantId, nextItem.id);

      return nextItem;
    } catch (error) {
      // Se falhar a notificação, não marca como notificado
      // para tentar novamente depois
      console.error('Erro ao notificar cliente da waitlist:', error);
      throw error;
    }
  }

  /**
   * Retorna estatísticas da waitlist
   */
  async getStats(restaurantId: string) {
    const total = await (this.prisma as any).waitlist.count({
      where: { restaurantId },
    });

    const pending = await (this.prisma as any).waitlist.count({
      where: {
        restaurantId,
        notified: false,
      },
    });

    const notified = await (this.prisma as any).waitlist.count({
      where: {
        restaurantId,
        notified: true,
      },
    });

    return {
      total,
      pending,
      notified,
    };
  }
}
