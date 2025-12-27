import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxRetries = 5;
  private readonly retryDelay = 2000; // 2 segundos
  private readonly connectionTimeout = 10000; // 10 segundos

  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    // Verificar se DATABASE_URL está configurada
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      const errorMsg = `DATABASE_URL não está configurada.

Para configurar:
1. Crie um arquivo .env na pasta backend/ com:
   DATABASE_URL=postgresql://restoflow_admin:secure_password_123@localhost:5432/restoflow_production?connection_limit=10&pool_timeout=20

2. Certifique-se de que o PostgreSQL está rodando:
   cd backend
   docker-compose up -d

3. Execute as migrações:
   npx prisma migrate deploy
   (ou npx prisma migrate dev para desenvolvimento)`;
      this.logger.error(errorMsg);
      // Não lançar erro aqui - deixar o sistema iniciar e tentar conectar depois
      this.logger.warn('⚠️  Continuando sem conexão inicial. O sistema tentará conectar quando necessário.');
      return;
    }

    // Verificar se DATABASE_URL tem parâmetros de pool configurados
    const hasPoolParams = databaseUrl.includes('connection_limit') || databaseUrl.includes('pool_timeout');
    if (!hasPoolParams) {
      this.logger.warn('⚠️  DATABASE_URL não tem parâmetros de connection pool. Recomendado adicionar: ?connection_limit=10&pool_timeout=20');
    }
    
    // Conectar de forma assíncrona sem bloquear a inicialização do módulo
    // Não aguardar a conexão - ela acontecerá em background
    this.connectWithRetry().catch((error) => {
      this.logger.error(`Erro ao conectar ao banco: ${error?.message}`);
      this.logger.warn('⚠️  Sistema continuará sem conexão. Tentará reconectar automaticamente nas próximas requisições.');
    });
    
    // Retornar imediatamente para não bloquear a inicialização
    // A conexão acontecerá em background
  }

  private async connectWithRetry(): Promise<void> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.log(`🔌 Tentando conectar ao banco de dados... (tentativa ${attempt}/${this.maxRetries})`);
        
        // Usar Promise.race para implementar timeout
        const connectPromise = (this as any).$connect();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout de conexão excedido')), this.connectionTimeout);
        });

        await Promise.race([connectPromise, timeoutPromise]);
        
        // Testar conexão com uma query simples (com timeout adicional)
        const testQuery = this.$queryRaw`SELECT 1 as test`;
        const testTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout no teste de query')), 5000);
        });
        await Promise.race([testQuery, testTimeout]);
        
        this.logger.log('✅ Conectado ao banco de dados com sucesso!');
        return;
      } catch (error: any) {
        lastError = error;
        const errorCode = error?.code || error?.meta?.code;
        const errorMessage = error?.message || 'Erro desconhecido';

        this.logger.warn(`⚠️  Tentativa ${attempt}/${this.maxRetries} falhou: ${errorMessage}`);

        // Se for erro de timeout ou conexão recusada, tenta novamente
        if (this.isRetryableError(error, errorCode) && attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt; // Backoff exponencial
          this.logger.log(`⏳ Aguardando ${delay}ms antes de tentar novamente...`);
          await this.sleep(delay);
          continue;
        }

        // Se não for retryable ou esgotou tentativas, lança erro
        if (attempt === this.maxRetries) {
          this.logger.error('\n❌ ERRO DE CONEXÃO APÓS MÚLTIPLAS TENTATIVAS:');
          this.logger.error(`Mensagem: ${errorMessage}`);
          this.logger.error(`Código: ${errorCode || 'N/A'}`);
          this.logger.error('\nSoluções possíveis:');
          this.logger.error('1. Verifique se o PostgreSQL está rodando: docker-compose up -d');
          this.logger.error('2. Verifique se a DATABASE_URL está correta no arquivo .env');
          this.logger.error('3. Verifique se as migrações foram executadas: npx prisma migrate deploy');
          this.logger.error('4. Verifique se o banco está acessível: docker ps');
          throw lastError;
        }
      }
    }
  }

  private isRetryableError(error: any, errorCode?: string): boolean {
    // Erros que podem ser retentados
    const retryableCodes = [
      'ECONNREFUSED', // Conexão recusada
      'ETIMEDOUT',    // Timeout
      'ENOTFOUND',    // DNS não encontrado
      'P1001',        // Prisma: Can't reach database server
      'P1017',        // Prisma: Server has closed the connection
    ];

    if (errorCode && retryableCodes.includes(errorCode)) {
      return true;
    }

    // Verificar mensagens de erro comuns
    const errorMessage = error?.message?.toLowerCase() || '';
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('refused') ||
      errorMessage.includes("can't reach")
    ) {
      return true;
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async onModuleDestroy() {
    try {
      await (this as any).$disconnect();
      this.logger.log('✅ Desconectado do banco de dados');
    } catch (error: any) {
      this.logger.error('❌ Erro ao desconectar do banco:', error?.message);
    }
  }

  // Método helper para verificar saúde da conexão
  async isHealthy(): Promise<boolean> {
    try {
      // Usar query mais específica e segura
      await this.$queryRaw`SELECT 1 as health_check`;
      return true;
    } catch (error: any) {
      this.logger.warn(`Health check falhou: ${error?.message || 'Erro desconhecido'}`);
      return false;
    }
  }
}