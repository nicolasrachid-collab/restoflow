import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('queue')
  async getQueueMetrics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.metricsService.getQueueMetrics(
      req.user.restaurantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('reservations')
  async getReservationMetrics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.metricsService.getReservationMetrics(
      req.user.restaurantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('capacity')
  async getCapacityUtilization(
    @Request() req,
    @Query('date') date?: string,
  ) {
    return this.metricsService.getCapacityUtilization(
      req.user.restaurantId,
      date ? new Date(date) : new Date(),
    );
  }
}

