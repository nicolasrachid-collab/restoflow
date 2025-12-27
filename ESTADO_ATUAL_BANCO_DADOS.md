# 📊 Estado Atual - Configuração de Banco de Dados

**Data:** 27 de dezembro de 2024  
**Branch:** `2025-12-27-safa-13fa0`  
**Status:** Pronto para implementar banco de dados funcional

---

## ✅ O que já foi feito

### Frontend
- ✅ Interface `Restaurant` atualizada em `types.ts` com novos campos:
  - `logoUrl`, `description`, `phone`, `email`, `customDomain`, `socialMedia`
- ✅ Componente `ImageUpload.tsx` criado (com drag & drop e geração com IA)
- ✅ Componente `ColorPicker.tsx` criado
- ✅ Página `RestaurantSettings.tsx` refatorada com todas as seções
- ✅ Mock data atualizado para suportar novos campos

### Backend
- ✅ Schema do Prisma existe em `backend/prisma/schema.prisma`
- ✅ DTO existe em `backend/src/restaurants/dto/restaurant-settings.dto.ts`
- ✅ Service existe em `backend/src/restaurants/restaurants.service.ts`
- ✅ Controller existe em `backend/src/restaurants/restaurants.controller.ts`

---

## 🔨 O que precisa ser feito

### 1. Atualizar Schema do Prisma

**Arquivo:** `backend/prisma/schema.prisma`

Adicionar ao model `Restaurant` (após linha 62):

```prisma
  // Novos campos para identidade visual e configurações
  themeColor              String?         @map("theme_color")
  logoUrl                 String?         @map("logo_url")
  description             String?
  phone                   String?
  email                   String?
  customDomain            String?         @map("custom_domain")
  socialMedia             Json?          @map("social_media") // { instagram?: string, facebook?: string }
```

### 2. Atualizar DTO

**Arquivo:** `backend/src/restaurants/dto/restaurant-settings.dto.ts`

Adicionar após linha 48:

```typescript
  // Novos campos
  @IsOptional()
  @IsString()
  themeColor?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  customDomain?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;
```

E adicionar no topo do arquivo (após imports):

```typescript
class SocialMediaDto {
  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  facebook?: string;
}
```

E adicionar ao import:
```typescript
import { IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
```

### 3. Atualizar Service

**Arquivo:** `backend/src/restaurants/restaurants.service.ts`

Atualizar método `getRestaurantConfig` (linha 71-96) para incluir no select:

```typescript
      themeColor: true,
      logoUrl: true,
      description: true,
      phone: true,
      email: true,
      customDomain: true,
      socialMedia: true,
```

### 4. Criar Migration

Após aplicar as mudanças acima, executar:

```bash
cd backend
npx prisma migrate dev --name add_restaurant_identity_fields
```

### 5. Configurar Frontend para usar Backend

**Arquivo:** `.env` (raiz do projeto)

Alterar de:
```env
VITE_USE_MOCK=true
```

Para:
```env
# VITE_USE_MOCK=true
VITE_USE_SERVER=true
```

### 6. Verificar Backend .env

**Arquivo:** `backend/.env`

Garantir que existe:
```env
DATABASE_URL="postgresql://restoflow:restoflow123@localhost:5432/restoflow?schema=public"
JWT_SECRET="seu-jwt-secret-aqui"
PORT=3001
```

---

## 📋 Checklist de Implementação

### Backend
- [ ] Schema do Prisma atualizado
- [ ] DTO atualizado com validações
- [ ] Service atualizado para retornar novos campos
- [ ] Migration criada e executada
- [ ] Backend `.env` configurado

### Frontend
- [ ] `.env` configurado com `VITE_USE_SERVER=true`
- [ ] `VITE_USE_MOCK=true` comentado/removido

### Testes
- [ ] Backend inicia sem erros
- [ ] Frontend conecta ao backend
- [ ] Configurações do restaurante salvam corretamente
- [ ] Dados persistem após recarregar página

---

## 🚀 Comandos para Executar

### 1. Iniciar Banco de Dados
```bash
cd backend
docker-compose up -d db
```

### 2. Executar Migration
```bash
cd backend
npx prisma migrate dev --name add_restaurant_identity_fields
```

### 3. Iniciar Backend
```bash
cd backend
npm run start:dev
```

### 4. Iniciar Frontend
```bash
# Na raiz do projeto
npm run dev
```

---

## 📝 Notas Importantes

1. **Docker:** Certifique-se de que o Docker está rodando antes de iniciar o banco
2. **Portas:** Backend na porta 3001, Frontend na porta 5173
3. **Banco de Dados:** PostgreSQL rodando via Docker Compose
4. **Migration:** A migration criará as novas colunas no banco de dados

---

## 🔗 Arquivos Relacionados

- `backend/prisma/schema.prisma` - Schema do banco de dados
- `backend/src/restaurants/dto/restaurant-settings.dto.ts` - Validações
- `backend/src/restaurants/restaurants.service.ts` - Lógica de negócio
- `backend/src/restaurants/restaurants.controller.ts` - Endpoints da API
- `types.ts` - Interface TypeScript do frontend
- `pages/admin/RestaurantSettings.tsx` - Tela de configurações
- `.env` (raiz) - Configuração do frontend
- `backend/.env` - Configuração do backend

---

## 📌 Próximos Passos Após Implementação

1. Testar upload de logo
2. Testar alteração de cores
3. Testar salvamento de informações de contato
4. Verificar persistência no banco de dados
5. Testar em diferentes navegadores

---

**Última atualização:** 27/12/2024 - Estado salvo antes de aplicar mudanças no banco de dados

