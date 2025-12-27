# 🚀 Guia de Setup - RestoFlow

## Pré-requisitos

- Node.js 18+ instalado
- Docker Desktop instalado e rodando (para o banco de dados)
- Git instalado

## 📥 Passo 1: Clonar/Atualizar o Repositório

Se você já tem o projeto local:
```bash
cd "C:\Users\Nicolas Rachid\Desktop\restoflow"
git pull origin 2025-12-26-h7fy
```

Se você está clonando pela primeira vez:
```bash
git clone https://github.com/nicolasrachid-collab/restoflow.git
cd restoflow
git checkout 2025-12-26-h7fy
```

## 📦 Passo 2: Instalar Dependências

### Frontend (Raiz do projeto)
```bash
npm install
```

### Backend
```bash
cd backend
npm install
cd ..
```

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### Frontend (.env na raiz)
Crie/edite o arquivo `.env` na raiz do projeto:
```env
# Desabilitar WebSocket em desenvolvimento local (recomendado)
VITE_DISABLE_WEBSOCKET=true

# Modo OFFLINE - Rodar sem backend (usa dados mockados)
# VITE_USE_MOCK=true

# URL do WebSocket (opcional, padrão: http://localhost:3001)
# VITE_WS_URL=http://localhost:3001

# API Key do Google Gemini (opcional - para funcionalidades de IA)
# VITE_API_KEY=sua-chave-aqui
```

### Backend (.env em backend/)
Crie/edite o arquivo `backend/.env`:
```env
# Banco de Dados
DATABASE_URL=postgresql://restoflow_admin:secure_password_123@localhost:5432/restoflow_production

# JWT Secret
JWT_SECRET=seu-jwt-secret-aqui

# Porta do servidor (opcional, padrão: 3001)
PORT=3001
```

## 🗄️ Passo 4: Configurar Banco de Dados

```bash
cd backend

# 1. Subir o PostgreSQL via Docker
docker-compose up -d

# 2. Aplicar o schema do banco
npx prisma db push

# 3. Popular com dados de teste
npx prisma db seed

cd ..
```

## 🏃 Passo 5: Executar o Projeto

### Opção A: Com Backend (Modo Normal)

Você precisa de **2 terminais** abertos:

#### Terminal 1: Backend
```bash
cd backend
npm run start:dev
```
O backend estará rodando em: `http://localhost:3001`

#### Terminal 2: Frontend
```bash
# Na raiz do projeto
npm run dev
```
O frontend estará rodando em: `http://localhost:5173`

### Opção B: Sem Backend (Modo Offline/Mock) 🆕

**Perfeito para desenvolvimento rápido, demonstrações ou quando o backend não está disponível!**

1. **Configure o modo mock** no arquivo `.env` na raiz:
```env
VITE_USE_MOCK=true
VITE_DISABLE_WEBSOCKET=true
```

2. **Execute apenas o frontend:**
```bash
# Na raiz do projeto
npm run dev
```

3. **Acesse:** `http://localhost:5173`

**O que funciona no modo mock:**
- ✅ Login/Registro (qualquer email/senha funciona)
- ✅ Dashboard administrativo
- ✅ Gerenciamento de fila (com dados de exemplo)
- ✅ Gerenciamento de menu (com itens de exemplo)
- ✅ Gerenciamento de reservas (com dados de exemplo)
- ✅ Páginas públicas (fila, menu, reservas)
- ✅ Todas as funcionalidades de UI

**Dados mockados incluídos:**
- 3 itens na fila
- 3 itens no menu
- 2 reservas
- Restaurante "Restaurante Demo"
- Usuário admin: qualquer email/senha

## 🔐 Credenciais de Teste

**Login Administrador:**
- Email: `admin@restoflow.com`
- Senha: `123456`

**URLs Públicas (para testar como cliente):**
- Menu: `http://localhost:5173/r/demo-grill/menu`
- Fila: `http://localhost:5173/r/demo-grill/fila`
- Reservas: `http://localhost:5173/r/demo-grill/reservas`

## ✅ Verificação

1. Backend rodando: Acesse `http://localhost:3001/health` - deve retornar `{"status":"ok"}`
2. Frontend rodando: Acesse `http://localhost:5173` - deve abrir a tela de login
3. Sem erros de conexão: Com `VITE_DISABLE_WEBSOCKET=true`, não deve aparecer erros de WebSocket no console

## 🐛 Troubleshooting

### Problema: Erro de conexão com banco de dados
**Solução:**
```bash
cd backend
docker-compose down
docker-compose up -d
npx prisma db push
```

### Problema: Erros de WebSocket no console
**Solução:** Certifique-se de que o arquivo `.env` na raiz tem `VITE_DISABLE_WEBSOCKET=true` e reinicie o servidor frontend.

### Problema: Porta já em uso
**Solução:** Altere a porta no `vite.config.ts` (frontend) ou `backend/.env` (backend)

## 📝 Notas Importantes

- O WebSocket está **desabilitado por padrão** para desenvolvimento local
- Para habilitar WebSocket, mude `VITE_DISABLE_WEBSOCKET=false` no `.env` e reinicie
- O sistema usa **polling automático** (a cada 5s) quando WebSocket está desabilitado
- **Modo Mock:** Use `VITE_USE_MOCK=true` para rodar sem backend - perfeito para desenvolvimento rápido!
- Todas as mudanças estão na branch `2025-12-26-h7fy`

## 🎯 Modo Offline (Mock) - Detalhes

O modo mock permite rodar o sistema completo sem precisar do backend, banco de dados ou Docker. Ideal para:

- 🚀 **Desenvolvimento rápido** - Teste UI sem configurar backend
- 📱 **Demonstrações** - Mostre o sistema funcionando rapidamente
- 🐛 **Debug** - Isole problemas do frontend
- 💻 **Desenvolvimento offline** - Trabalhe sem internet

**Como ativar:**
1. Adicione `VITE_USE_MOCK=true` no `.env`
2. Execute apenas `npm run dev`
3. Use qualquer email/senha para fazer login

**Limitações do modo mock:**
- Dados são armazenados apenas em memória (perdidos ao recarregar)
- Não persiste mudanças entre sessões
- Não conecta com banco de dados real
- WebSocket sempre desabilitado

