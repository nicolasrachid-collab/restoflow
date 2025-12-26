import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateRestaurantConfigDto } from './dto/restaurant-settings.dto';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('config')
  async getConfig(@Request() req) {
    return this.restaurantsService.getRestaurantConfig(req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('config')
  async updateConfig(@Request() req, @Body() updateDto: UpdateRestaurantConfigDto) {
    return this.restaurantsService.updateConfig(
      req.user.restaurantId,
      updateDto,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('queue-active')
  async toggleQueueActive(@Request() req) {
    return this.restaurantsService.toggleQueueActive(req.user.restaurantId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('active')
  async toggleActive(@Request() req) {
    return this.restaurantsService.toggleActive(req.user.restaurantId, req.user.userId);
  }
}

