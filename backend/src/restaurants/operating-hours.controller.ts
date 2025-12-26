import { Controller, Get, Put, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OperatingHoursService } from './operating-hours.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateOperatingHoursDto } from './dto/operating-hours.dto';

@Controller('restaurants/operating-hours')
export class OperatingHoursController {
  constructor(private readonly operatingHoursService: OperatingHoursService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    return this.operatingHoursService.findAll(req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async updateAll(@Request() req, @Body() updateDto: UpdateOperatingHoursDto) {
    return this.operatingHoursService.updateAll(
      req.user.restaurantId,
      updateDto,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':dayOfWeek')
  async updateDay(
    @Request() req,
    @Param('dayOfWeek') dayOfWeek: string,
    @Body() body: { isOpen: boolean; openTime?: string; closeTime?: string },
  ) {
    return this.operatingHoursService.updateDay(
      req.user.restaurantId,
      parseInt(dayOfWeek, 10),
      body,
      req.user.userId,
    );
  }
}

