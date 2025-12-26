import { Module } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { OperatingHoursService } from './operating-hours.service';
import { OperatingHoursController } from './operating-hours.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [RestaurantsController, OperatingHoursController],
  providers: [RestaurantsService, OperatingHoursService],
  exports: [RestaurantsService, OperatingHoursService],
})
export class RestaurantsModule {}

