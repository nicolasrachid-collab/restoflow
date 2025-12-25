import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QueueStatus } from '@prisma/client';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  // Public: Join Queue
  @Post('join/:slug')
  async join(@Param('slug') slug: string, @Body() body: any) {
    return this.queueService.joinQueue(slug, body);
  }

  // Public: Get General Queue Status
  @Get('public/:slug')
  async getPublicStatus(@Param('slug') slug: string) {
    return this.queueService.getPublicQueueStatus(slug);
  }

  // Public: Get Ticket Position
  @Get('public/:slug/ticket/:ticketId')
  async getTicketPosition(@Param('slug') slug: string, @Param('ticketId') ticketId: string) {
    return this.queueService.getTicketPosition(slug, ticketId);
  }

  // Admin: Manage
  @UseGuards(JwtAuthGuard)
  @Get()
  async getQueue(@Request() req) {
    return this.queueService.getQueue(req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async addManually(@Request() req, @Body() body: any) {
    return this.queueService.addManually(req.user.restaurantId, body, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Request() req, @Param('id') id: string, @Body('status') status: QueueStatus) {
    return this.queueService.updateStatus(req.user.restaurantId, id, status, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/notify')
  async notifyCustomer(@Request() req, @Param('id') id: string) {
    return this.queueService.notifyCustomer(req.user.restaurantId, id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reorder')
  async reorderQueue(@Request() req, @Body() body: { items: { id: string; position: number }[] }) {
    return this.queueService.reorderQueue(req.user.restaurantId, body.items, req.user.userId);
  }
}