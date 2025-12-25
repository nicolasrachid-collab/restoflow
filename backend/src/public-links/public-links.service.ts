import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class PublicLinksService {
  constructor(private prisma: PrismaService) {}

  private generateCode(): string {
    // Gera código único de 8 caracteres alfanuméricos
    return randomBytes(4).toString('hex').toUpperCase();
  }

  async getDefaultLink(restaurantId: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true, name: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    return {
      type: 'default',
      slug: restaurant.slug,
      restaurantName: restaurant.name,
      queueUrl: `/r/${restaurant.slug}/fila`,
      reservationUrl: `/r/${restaurant.slug}/reservas`,
      menuUrl: `/r/${restaurant.slug}/menu`,
    };
  }

  async generateLink(restaurantId: string, name?: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    // Gera código único
    let code = this.generateCode();
    let exists = true;

    // Garante que o código é único
    while (exists) {
      const existing = await (this.prisma as any).publicLink.findUnique({
        where: { code },
      });
      if (!existing) {
        exists = false;
      } else {
        code = this.generateCode();
      }
    }

    const link = await (this.prisma as any).publicLink.create({
      data: {
        restaurantId,
        code,
        name: name || `Link ${new Date().toLocaleDateString('pt-BR')}`,
        slug: restaurant.slug,
      },
    });

    return {
      ...link,
      queueUrl: `/r/${link.code}/fila`,
      reservationUrl: `/r/${link.code}/reservas`,
      menuUrl: `/r/${link.code}/menu`,
    };
  }

  async getAllLinks(restaurantId: string) {
    const links = await (this.prisma as any).publicLink.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });

    return links.map((link: any) => ({
      ...link,
      queueUrl: `/r/${link.code}/fila`,
      reservationUrl: `/r/${link.code}/reservas`,
      menuUrl: `/r/${link.code}/menu`,
    }));
  }

  async deactivateLink(id: string, restaurantId: string) {
    const link = await (this.prisma as any).publicLink.findFirst({
      where: { id, restaurantId },
    });

    if (!link) {
      throw new NotFoundException('Link não encontrado');
    }

    return (this.prisma as any).publicLink.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activateLink(id: string, restaurantId: string) {
    const link = await (this.prisma as any).publicLink.findFirst({
      where: { id, restaurantId },
    });

    if (!link) {
      throw new NotFoundException('Link não encontrado');
    }

    return (this.prisma as any).publicLink.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async getLinkByCode(code: string) {
    const link = await (this.prisma as any).publicLink.findUnique({
      where: { code },
      include: { restaurant: true },
    });

    if (!link || !link.isActive) {
      return null;
    }

    return {
      ...link,
      queueUrl: `/r/${link.code}/fila`,
      reservationUrl: `/r/${link.code}/reservas`,
      menuUrl: `/r/${link.code}/menu`,
    };
  }
}

