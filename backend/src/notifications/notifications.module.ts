import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationTemplatesService } from './notification-templates.service';

@Global()
@Module({
  providers: [NotificationsService, NotificationTemplatesService],
  exports: [NotificationsService, NotificationTemplatesService],
})
export class NotificationsModule {}