import { Module } from '@nestjs/common';
import { PublicLinksService } from './public-links.service';
import { PublicLinksController } from './public-links.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicLinksController],
  providers: [PublicLinksService],
  exports: [PublicLinksService],
})
export class PublicLinksModule {}

