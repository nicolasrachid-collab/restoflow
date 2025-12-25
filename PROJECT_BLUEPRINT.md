# RestoFlow SaaS - Blueprint Técnico & Roadmap

**Versão:** 1.1.1 (PATCH)
**Data:** 15 Outubro 2025
**Status:** ✅ Backend Online | ✅ Frontend Conectado | 🟡 Em Validação

---

## 1. Visão Geral do Produto
O RestoFlow é uma plataforma SaaS multitenant projetada para modernizar a gestão de filas, reservas e cardápios de restaurantes através de IA generativa e fluxos em tempo real.

O projeto atual consiste em:
- **Frontend React:** Dashboard Administrativo + Páginas Públicas (Fila/Menu/Reserva).
- **Backend NestJS:** API REST com Autenticação JWT, Gestão de Fila e Notificações.
- **Banco de Dados PostgreSQL:** Schema completo para multitenancy rodando em Docker.

---

## 2. Status da Execução (Dev Log)

### ✅ Etapas Concluídas
1. **Planejamento:** Definição de escopo, personas e fluxos.
2. **Modelagem:** Schema Prisma definido e migrado para PostgreSQL.
3. **Backend:** 
   - Autenticação JWT (Login/Registro).
   - CRUD de Menus, Filas e Reservas.
   - Health Check Implementado.
4. **Frontend:**
   - Integração via Proxy (/api).
   - Indicador de Status do Servidor na tela de Login.
   - Telas Públicas e Privadas funcionais.

### 🟡 Em Andamento (Validação)
- Testes End-to-End dos fluxos de fila.
- Validação de geração de imagens com Gemini API.

---

## 3. Instruções de Execução (Obrigatório)

Para que o sistema funcione corretamente, você deve manter **dois terminais** abertos:

### Terminal 1: Backend (API & Banco)
```bash
cd backend

# 1. Subir Banco de Dados
docker-compose up -d

# 2. Aplicar Schema e Dados de Teste
npx prisma db push
npx prisma db seed

# 3. Rodar Servidor (Porta 3001)
npm run start:dev
```

### Terminal 2: Frontend (Aplicação)
```bash
# Na raiz do projeto
npm install
npm run dev
```
Acesse: `http://localhost:5173`

---

## 4. Credenciais de Teste

**Administrador Demo:**
- **Email:** `admin@restoflow.com`
- **Senha:** `123456`

**URLs Públicas (Simulação Cliente):**
- Fila: `/r/demo-grill/fila`
- Menu: `/r/demo-grill/menu`
- Reservas: `/r/demo-grill/reservas`
