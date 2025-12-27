import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Verificar se DATABASE_URL está configurada
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      const errorMsg = `DATABASE_URL não está configurada.

Para configurar:
1. Crie um arquivo .env na pasta backend/ com:
   DATABASE_URL=postgresql://restoflow_admin:secure_password_123@localhost:5432/restoflow_production

2. Certifique-se de que o PostgreSQL está rodando:
   cd backend
   docker-compose up -d

3. Execute as migrações:
   npx prisma migrate deploy
   (ou npx prisma migrate dev para desenvolvimento)`;
      console.error('\n[PRISMA] ❌ ERRO DE CONFIGURAÇÃO:');
      console.error(errorMsg);
      console.error('\n');
      throw new Error('DATABASE_URL não está configurada. Veja as instruções acima.');
    }
    
    try {
      console.log('[PRISMA] 🔌 Tentando conectar ao banco de dados...');
      // Cast 'this' to 'any' prevents TypeScript errors when Prisma Client is not fully generated
      await (this as any).$connect();
      console.log('[PRISMA] ✅ Conectado com sucesso!');
    } catch (error: any) {
      console.error('\n[PRISMA] ❌ ERRO DE CONEXÃO:');
      console.error('[PRISMA] Mensagem:', error?.message);
      console.error('\n[PRISMA] Soluções possíveis:');
      console.error('1. Verifique se o PostgreSQL está rodando: docker-compose up -d');
      console.error('2. Verifique se a DATABASE_URL está correta no arquivo .env');
      console.error('3. Verifique se as migrações foram executadas: npx prisma migrate deploy\n');
      throw error;
    }
  }

  async onModuleDestroy() {
    // Cast 'this' to 'any' prevents TypeScript errors when Prisma Client is not fully generated
    await (this as any).$disconnect();
  }
}