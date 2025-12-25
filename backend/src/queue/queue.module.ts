import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueGateway } from './queue.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { CustomersModule } from '../customers/customers.module';
import { PublicLinksModule } from '../public-links/public-links.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [NotificationsModule, CustomersModule, PublicLinksModule, RestaurantsModule, AuditModule],
  controllers: [QueueController],
  providers: [
    QueueService,
    QueueGateway,
    {
      provide: 'QUEUE_SERVICE_INIT',
      useFactory: (queueService: QueueService, queueGateway: QueueGateway) => {
        queueService.setGateway(queueGateway);
        return true;
      },
      inject: [QueueService, QueueGateway],
    },
  ],
  exports: [QueueGateway],
})
export class QueueModule {}