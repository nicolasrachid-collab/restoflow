import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Cast 'this' to 'any' prevents TypeScript errors when Prisma Client is not fully generated
    await (this as any).$connect();
  }

  async onModuleDestroy() {
    // Cast 'this' to 'any' prevents TypeScript errors when Prisma Client is not fully generated
    await (this as any).$disconnect();
  }
}