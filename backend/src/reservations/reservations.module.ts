import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomersModule } from '../customers/customers.module';
import { PublicLinksModule } from '../public-links/public-links.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, CustomersModule, PublicLinksModule, RestaurantsModule, AuditModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}