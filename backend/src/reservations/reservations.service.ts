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
    return await (this.prisma as any).reservation.findMany({
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

    if (reservationDate < now) {
      throw new BadRequestException('Não é possível fazer reserva para datas/horários passados');
    }

    // Validar antecedência mínima
    const minAdvanceHours = restaurant.minReservationAdvanceHours || 2;
    const minAdvanceDate = new Date(now);
    minAdvanceDate.setHours(minAdvanceDate.getHours() + minAdvanceHours);
    
    if (reservationDate < minAdvanceDate) {
      throw new BadRequestException(`A reserva deve ser feita com pelo menos ${minAdvanceHours} horas de antecedência`);
    }

    // Validar antecedência máxima (comparar apenas datas, sem hora)
    const maxAdvanceDays = restaurant.maxReservationAdvanceDays || 30;
    const reservationDateOnly = new Date(reservationDate);
    reservationDateOnly.setHours(0, 0, 0, 0);
    const nowDateOnly = new Date(now);
    nowDateOnly.setHours(0, 0, 0, 0);
    const maxAdvanceDate = new Date(nowDateOnly);
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + maxAdvanceDays);
    maxAdvanceDate.setHours(23, 59, 59, 999);
    
    if (reservationDateOnly > maxAdvanceDate) {
      throw new BadRequestException(`A reserva não pode ser feita com mais de ${maxAdvanceDays} dias de antecedência`);
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

    // Validar formato de telefone
    const phoneRegex = /^[\d\s\(\)\-\+]+$/;
    if (!phoneRegex.test(data.phone)) {
      throw new BadRequestException('Formato de telefone inválido');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      throw new BadRequestException('Formato de email inválido');
    }

    // Validar duplicação - mesmo telefone no mesmo dia
    const startOfDay = new Date(reservationDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reservationDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingReservation = await (this.prisma as any).reservation.findFirst({
      where: {
        restaurantId,
        phone: data.phone,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      },
    });

    if (existingReservation) {
      throw new BadRequestException('Já existe uma reserva pendente ou confirmada para este telefone neste dia');
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

    // Validar horário dentro do funcionamento
    const reservationHour = reservationDate.getHours();
    const reservationMinute = reservationDate.getMinutes();
    const reservationTime = `${String(reservationHour).padStart(2, '0')}:${String(reservationMinute).padStart(2, '0')}`;
    
    if (reservationTime < dayHours.openTime || reservationTime >= dayHours.closeTime) {
      throw new BadRequestException(`O horário da reserva deve estar entre ${dayHours.openTime} e ${dayHours.closeTime}`);
    }

    // Validar data não no passado
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const reservationDateOnly = new Date(reservationDate);
    reservationDateOnly.setHours(0, 0, 0, 0);

    if (reservationDateOnly < now) {
      throw new BadRequestException('Não é possível fazer reserva para datas passadas');
    }

    // Validar antecedência mínima
    const minAdvanceHours = restaurant.minReservationAdvanceHours || 2;
    const minAdvanceDate = new Date(now);
    minAdvanceDate.setHours(minAdvanceDate.getHours() + minAdvanceHours);
    
    if (reservationDate < minAdvanceDate) {
      throw new BadRequestException(`A reserva deve ser feita com pelo menos ${minAdvanceHours} horas de antecedência`);
    }

    // Validar antecedência máxima (comparar apenas datas, sem hora)
    const maxAdvanceDays = restaurant.maxReservationAdvanceDays || 30;
    const maxAdvanceDate = new Date(now);
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + maxAdvanceDays);
    maxAdvanceDate.setHours(23, 59, 59, 999); // Fim do dia
    
    if (reservationDateOnly > maxAdvanceDate) {
      throw new BadRequestException(`A reserva não pode ser feita com mais de ${maxAdvanceDays} dias de antecedência`);
    }

    // Validar limite de pessoas
    if (data.partySize > restaurant.maxPartySize) {
      throw new BadRequestException(`Número de pessoas excede o limite de ${restaurant.maxPartySize}`);
    }

    if (data.partySize < 1) {
      throw new BadRequestException('Número de pessoas deve ser pelo menos 1');
    }

    // Validar email obrigatório
    if (!data.email) {
      throw new BadRequestException('Email é obrigatório para reservas');
    }

    // Validar formato de telefone
    const phoneRegex = /^[\d\s\(\)\-\+]+$/;
    if (!phoneRegex.test(data.phone)) {
      throw new BadRequestException('Formato de telefone inválido');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new BadRequestException('Formato de email inválido');
    }

    // Validar duplicação - mesmo telefone no mesmo dia
    const startOfDay = new Date(reservationDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reservationDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingReservation = await (this.prisma as any).reservation.findFirst({
      where: {
        restaurantId: restaurant.id,
        phone: data.phone,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      },
    });

    if (existingReservation) {
      throw new BadRequestException('Já existe uma reserva pendente ou confirmada para este telefone neste dia');
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

  // Public: Get available time slots for a date
  async getAvailableSlots(slugOrCode: string, dateString: string) {
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

    if (!restaurant.isActive) {
      throw new ForbiddenException('Restaurante está desativado');
    }

    // Validar data
    const selectedDate = new Date(dateString);
    const dayOfWeek = selectedDate.getDay();
    const restaurantConfig = await this.restaurantsService.getRestaurantConfig(restaurant.id);
    const dayHours = restaurantConfig.operatingHours?.find((oh: any) => oh.dayOfWeek === dayOfWeek);

    if (!dayHours || !dayHours.isOpen) {
      return { availableSlots: [] };
    }

    // Buscar reservas confirmadas para o dia
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const confirmedReservations = await (this.prisma as any).reservation.findMany({
      where: {
        restaurantId: restaurant.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING],
        },
      },
      select: {
        date: true,
      },
    });

    // Gerar slots de 30 em 30 minutos
    const slots: string[] = [];
    const [openHour, openMinute] = dayHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.closeTime.split(':').map(Number);

    const openTime = new Date(selectedDate);
    openTime.setHours(openHour, openMinute, 0, 0);
    
    const closeTime = new Date(selectedDate);
    closeTime.setHours(closeHour, closeMinute, 0, 0);

    // Criar slots de 30 em 30 minutos
    const currentTime = new Date(openTime);
    while (currentTime < closeTime) {
      const timeString = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
      
      // Verificar se há reserva neste horário (com tolerância de 30 minutos)
      const hasReservation = confirmedReservations.some((res: any) => {
        const resTime = new Date(res.date);
        const diffMinutes = Math.abs((resTime.getTime() - currentTime.getTime()) / (1000 * 60));
        return diffMinutes < 30; // Considerar ocupado se houver reserva em 30 minutos
      });

      // Verificar antecedência mínima
      const now = new Date();
      const minAdvanceHours = restaurant.minReservationAdvanceHours || 2;
      const minAdvanceDate = new Date(now);
      minAdvanceDate.setHours(minAdvanceDate.getHours() + minAdvanceHours);

      if (!hasReservation && currentTime >= minAdvanceDate) {
        slots.push(timeString);
      }

      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return { availableSlots: slots };
  }
}