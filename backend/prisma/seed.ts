import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed...');

  // Variáveis de ambiente com valores padrão seguros
  const slug = process.env.SEED_RESTAURANT_SLUG || 'demo-grill';
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const restaurantName = process.env.SEED_RESTAURANT_NAME || 'RestoFlow Grill';
  const restaurantAddress = process.env.SEED_RESTAURANT_ADDRESS || 'Rua da Inovação, 100 - SP';
  const adminName = process.env.SEED_ADMIN_NAME || 'Admin Demo';

  // Validação: email e senha são obrigatórios para criar o admin
  if (!email || !password) {
    console.warn('⚠️  SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD não configurados.');
    console.warn('⚠️  Pulando criação de usuário admin. Configure as variáveis de ambiente para criar um admin.');
    console.warn('⚠️  Exemplo: SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=senha123');
  }

  // 1. Criar Restaurante Demo se não existir
  let restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantName,
        slug,
        address: restaurantAddress,
      },
    });
    console.log('✅ Restaurante criado:', restaurant.name);
  }

  // 2. Criar Usuário Admin (apenas se email e senha estiverem configurados)
  if (email && password) {
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (!userExists) {
      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(password, salt);

      await prisma.user.create({
        data: {
          email,
          name: adminName,
          passwordHash: hash,
          role: UserRole.ADMIN,
          restaurantId: restaurant.id,
        },
      });
      console.log(`✅ Usuário Admin criado: ${email}`);
    } else {
      console.log(`ℹ️  Usuário Admin já existe: ${email}`);
    }
  }

  // 3. Popular Menu Básico
  const itemsCount = await prisma.menuItem.count({ where: { restaurantId: restaurant.id }});
  if (itemsCount === 0) {
    await prisma.menuItem.createMany({
      data: [
        {
          name: 'Picanha Premium',
          description: 'Corte nobre grelhado na brasa com farofa e vinagrete.',
          price: 89.90,
          category: 'Carnes',
          restaurantId: restaurant.id,
          imageUrl: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=800&q=80'
        },
        {
          name: 'Burger Artesanal',
          description: 'Blend de 180g, queijo cheddar, bacon crocante e maionese da casa.',
          price: 34.90,
          category: 'Lanches',
          restaurantId: restaurant.id,
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
        },
        {
          name: 'Caipirinha de Limão',
          description: 'Clássica brasileira com cachaça artesanal.',
          price: 22.00,
          category: 'Bebidas',
          restaurantId: restaurant.id,
          imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80'
        }
      ]
    });
    console.log('✅ Menu inicial populado');
  }

  console.log('🚀 Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    (process as any).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });