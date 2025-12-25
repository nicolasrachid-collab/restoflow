import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function rotateAdminPassword() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const newPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !newPassword) {
    console.error('❌ Erro: SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD devem estar configurados no .env');
    process.exit(1);
  }

  try {
    console.log(`🔄 Rotacionando senha para: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`ℹ️  Usuário ${email} não encontrado. Nada a fazer.`);
      return;
    }

    const salt = await bcrypt.genSalt();
    const newHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email },
      data: { passwordHash: newHash },
    });

    console.log(`✅ Senha rotacionada com sucesso para: ${email}`);
  } catch (error) {
    console.error('❌ Erro ao rotacionar senha:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

rotateAdminPassword();

