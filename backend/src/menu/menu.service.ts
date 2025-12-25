import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async findPublicMenu(slug: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { slug },
      include: {
        menuItems: {
           where: { available: true }
        }
      }
    });

    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');
    return restaurant.menuItems;
  }

  async findAll(restaurantId: string) {
    return (this.prisma as any).menuItem.findMany({
      where: { restaurantId }
    });
  }

  async create(restaurantId: string, data: any) {
    return (this.prisma as any).menuItem.create({
      data: {
        ...data,
        restaurantId
      }
    });
  }

  async update(restaurantId: string, id: string, data: any) {
    // Ensure item belongs to tenant
    const item = await (this.prisma as any).menuItem.findFirst({
      where: { id, restaurantId }
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    return (this.prisma as any).menuItem.update({
      where: { id },
      data
    });
  }

  async remove(restaurantId: string, id: string) {
    // Ensure item belongs to tenant
    const item = await (this.prisma as any).menuItem.findFirst({
        where: { id, restaurantId }
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    return (this.prisma as any).menuItem.delete({
      where: { id }
    });
  }
}