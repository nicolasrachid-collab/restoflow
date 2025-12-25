import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findByPhone(phone: string) {
    return (this.prisma as any).customer.findUnique({
      where: { phone },
    });
  }

  async findOrCreate(phone: string, name?: string) {
    // Busca cliente existente
    let customer = await this.findByPhone(phone);

    if (!customer) {
      // Cria novo cliente
      customer = await (this.prisma as any).customer.create({
        data: {
          phone,
          name: name || 'Cliente',
        },
      });
    } else if (name && customer.name !== name) {
      // Atualiza nome se fornecido e diferente
      customer = await (this.prisma as any).customer.update({
        where: { id: customer.id },
        data: { name },
      });
    }

    return customer;
  }

  async update(id: string, data: { email?: string; name?: string }) {
    const customer = await (this.prisma as any).customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return (this.prisma as any).customer.update({
      where: { id },
      data,
    });
  }

  async findById(id: string) {
    const customer = await (this.prisma as any).customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }
}

