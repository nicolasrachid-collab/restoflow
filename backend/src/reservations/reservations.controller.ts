import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // Public Route: Get Available Slots
  @Get('public/:slug/available-slots')
  async getAvailableSlots(@Param('slug') slug: string, @Query('date') date: string) {
    return this.reservationsService.getAvailableSlots(slug, date);
  }

  // Public Route: Create Reservation
  @Post('public/:slug')
  async createPublic(@Param('slug') slug: string, @Body() body: any) {
    return this.reservationsService.createPublic(slug, body);
  }

  // Protected Admin Routes
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    return this.reservationsService.findAll(req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createAdmin(@Request() req, @Body() body: any) {
    return this.reservationsService.create(req.user.restaurantId, {
        ...body,
        date: new Date(body.date)
    }, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Request() req, @Param('id') id: string, @Body('status') status: any) {
    return this.reservationsService.updateStatus(req.user.restaurantId, id, status, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reschedule')
  async reschedule(@Request() req, @Param('id') id: string, @Body() body: { date: string }) {
    return this.reservationsService.reschedule(req.user.restaurantId, id, new Date(body.date), req.user.userId);
  }
}