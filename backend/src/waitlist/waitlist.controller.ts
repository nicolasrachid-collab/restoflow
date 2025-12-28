import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('waitlist')
export class WaitlistController {
  constructor(
    private readonly waitlistService: WaitlistService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Request() req,
    @Query('includeNotified') includeNotified?: string,
  ) {
    const include = includeNotified === 'true';
    return this.waitlistService.findAll(req.user.restaurantId, include);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats(@Request() req) {
    return this.waitlistService.getStats(req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() body: any) {
    return this.waitlistService.create(req.user.restaurantId, {
      customerName: body.customerName,
      phone: body.phone,
      email: body.email,
      partySize: body.partySize,
      preferredDate: body.preferredDate ? new Date(body.preferredDate) : undefined,
      preferredTime: body.preferredTime,
      customerId: body.customerId,
    });
  }

  // Rota pública para adicionar à waitlist quando reservas estão lotadas
  @Post('public/:slug')
  async createPublic(@Param('slug') slug: string, @Body() body: any) {
    // Buscar restaurante pelo slug
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { slug },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    return this.waitlistService.create(restaurant.id, {
      customerName: body.customerName,
      phone: body.phone,
      email: body.email,
      partySize: body.partySize,
      preferredDate: body.preferredDate ? new Date(body.preferredDate) : undefined,
      preferredTime: body.preferredTime,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/notified')
  async markAsNotified(@Request() req, @Param('id') id: string) {
    return this.waitlistService.markAsNotified(req.user.restaurantId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.waitlistService.remove(req.user.restaurantId, id);
  }
}
