import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from '../customers/customers.service';
import { PublicLinksService } from '../public-links/public-links.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { AuditService } from '../audit/audit.service';
import { ReservationStatus } from '@prisma/client';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
    private publicLinksService: PublicLinksService,
    private restaurantsService: RestaurantsService,
    private auditService: AuditService,
  ) {}

  // Admin: List all reservations for the tenant
  async findAll(restaurantId: string) {
    return (this.prisma as any).reservation.findMany({
      where: { restaurantId },
      orderBy: { date: 'asc' }
    });
  }

  // Admin/Public: Create reservation
  async create(restaurantId: string, data: any, userId?: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    if (!restaurant.isActive) {
      throw new ForbiddenException('Restaurante está desativado');
    }

    // Validar data não no passado
    const reservationDate = new Date(data.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    reservationDate.setHours(0, 0, 0, 0);

    if (reservationDate < now) {
      throw new BadRequestException('Não é possível fazer reserva para datas passadas');
    }

    // Validar limite de pessoas
    if (data.partySize > restaurant.maxPartySize) {
      throw new BadRequestException(`Número de pessoas excede o limite de ${restaurant.maxPartySize}`);
    }

    if (data.partySize < 1) {
      throw new BadRequestException('Número de pessoas deve ser pelo menos 1');
    }

    // Validar email obrigatório para reservas públicas
    if (!userId && !data.email) {
      throw new BadRequestException('Email é obrigatório para reservas');
    }

    // Se customerId fornecido, buscar dados do Customer
    let customerData = { 
      customerName: data.customerName, 
      phone: data.phone, 
      email: data.email 
    };
    if (data.customerId) {
      try {
        const customer = await this.customersService.findById(data.customerId);
        customerData = {
          customerName: customer.name,
          phone: customer.phone,
          email: customer.email || data.email,
        };
      } catch (e) {
        // Se customer não encontrado, usar dados fornecidos
      }
    }

    const reservation = await (this.prisma as any).reservation.create({
      data: {
        customerName: customerData.customerName,
        phone: customerData.phone,
        email: customerData.email,
        partySize: data.partySize,
        date: new Date(data.date),
        notes: data.notes,
        status: ReservationStatus.PENDING, // Mudado para PENDING conforme regras
        restaurantId,
        customerId: data.customerId || null,
      }
    });

    // Registrar em audit log
    await this.auditService.logAction(
      restaurantId,
      userId || null,
      'Reservation',
      reservation.id,
      'CREATE',
      null,
      reservation,
    );

    return reservation;
  }

  // Public: Create reservation by Slug or Code
  async createPublic(slugOrCode: string, data: any) {
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

    // Validar horário de funcionamento
    const reservationDate = new Date(data.date);
    const dayOfWeek = reservationDate.getDay();
    const restaurantConfig = await this.restaurantsService.getRestaurantConfig(restaurant.id);
    const dayHours = restaurantConfig.operatingHours?.find((oh: any) => oh.dayOfWeek === dayOfWeek);

    if (!dayHours || !dayHours.isOpen) {
      throw new ForbiddenException('Restaurante não funciona neste dia da semana');
    }

    // Validar data não no passado
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    reservationDate.setHours(0, 0, 0, 0);

    if (reservationDate < now) {
      throw new BadRequestException('Não é possível fazer reserva para datas passadas');
    }

    // Validar limite de pessoas
    if (data.partySize > restaurant.maxPartySize) {
      throw new BadRequestException(`Número de pessoas excede o limite de ${restaurant.maxPartySize}`);
    }

    // Validar email obrigatório
    if (!data.email) {
      throw new BadRequestException('Email é obrigatório para reservas');
    }

    // Se customerId fornecido, buscar dados do Customer
    let customerData = { 
      customerName: data.customerName, 
      phone: data.phone, 
      email: data.email 
    };
    if (data.customerId) {
      try {
        const customer = await this.customersService.findById(data.customerId);
        customerData = {
          customerName: customer.name,
          phone: customer.phone,
          email: customer.email || data.email,
        };
      } catch (e) {
        // Se customer não encontrado, usar dados fornecidos
      }
    }

    const reservation = await (this.prisma as any).reservation.create({
      data: {
        customerName: customerData.customerName,
        phone: customerData.phone,
        email: customerData.email,
        partySize: data.partySize,
        date: new Date(data.date),
        notes: data.notes,
        status: ReservationStatus.PENDING,
        restaurantId: restaurant.id,
        customerId: data.customerId || null,
      }
    });

    // Registrar em audit log
    await this.auditService.logAction(
      restaurant.id,
      null,
      'Reservation',
      reservation.id,
      'CREATE',
      null,
      reservation,
      { source: 'public' },
    );

    return reservation;
  }

  // Admin: Update Status
  async updateStatus(restaurantId: string, id: string, status: ReservationStatus, userId: string) {
    const reservation = await (this.prisma as any).reservation.findFirst({
      where: { id, restaurantId }
    });
    if (!reservation) throw new NotFoundException('Reserva não encontrada');

    const oldStatus = reservation.status;
    const updateData: any = { status };

    // Atualizar timestamps conforme mudança de status
    if (status === ReservationStatus.CHECKED_IN && oldStatus !== ReservationStatus.CHECKED_IN) {
      updateData.checkedInAt = new Date();
    } else if (status === ReservationStatus.NO_SHOW && oldStatus !== ReservationStatus.NO_SHOW) {
      updateData.noShowAt = new Date();
    }

    const updated = await (this.prisma as any).reservation.update({
      where: { id },
      data: updateData
    });

    // Registrar em audit log
    await this.auditService.logAction(
      restaurantId,
      userId,
      'Reservation',
      id,
      'STATUS_CHANGE',
      { status: oldStatus },
      { status: status, ...updateData },
    );

    return updated;
  }

  // Reagendamento
  async reschedule(restaurantId: string, id: string, newDate: Date, userId: string) {
    const original = await (this.prisma as any).reservation.findFirst({
      where: { id, restaurantId }
    });
    if (!original) throw new NotFoundException('Reserva não encontrada');

    // Validar data não no passado
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const reservationDate = new Date(newDate);
    reservationDate.setHours(0, 0, 0, 0);

    if (reservationDate < now) {
      throw new BadRequestException('Não é possível reagendar para datas passadas');
    }

    // Criar nova reserva vinculada à original
    const newReservation = await (this.prisma as any).reservation.create({
      data: {
        customerName: original.customerName,
        phone: original.phone,
        email: original.email,
        partySize: original.partySize,
        date: newDate,
        notes: original.notes,
        status: ReservationStatus.PENDING,
        restaurantId: original.restaurantId,
        customerId: original.customerId,
        originalReservationId: original.id,
      }
    });

    // Cancelar reserva original
    await (this.prisma as any).reservation.update({
      where: { id: original.id },
      data: { status: ReservationStatus.CANCELLED }
    });

    // Registrar em audit log
    await this.auditService.logAction(
      restaurantId,
      userId,
      'Reservation',
      newReservation.id,
      'CREATE',
      null,
      newReservation,
      { action: 'reschedule', originalReservationId: original.id },
    );

    await this.auditService.logAction(
      restaurantId,
      userId,
      'Reservation',
      original.id,
      'STATUS_CHANGE',
      { status: original.status },
      { status: ReservationStatus.CANCELLED },
      { reason: 'rescheduled', newReservationId: newReservation.id },
    );

    return newReservation;
  }
}