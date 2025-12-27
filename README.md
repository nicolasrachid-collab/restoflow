# 🍽️ RestoFlow SaaS

> Sistema de Gestão Inteligente para Restaurantes com IA.

Este repositório contém o **Blueprint Funcional** do RestoFlow. É uma aplicação Frontend completa que simula o comportamento de um SaaS real, incluindo fluxos de Administrador e Cliente Final, alimentados por Inteligência Artificial (Google Gemini) para geração de conteúdo.

## 🌟 Funcionalidades Principais

### Para o Restaurante (Admin)
- **Dashboard em Tempo Real:** Métricas de ocupação, faturamento e filas.
- **Gestão de Fila Inteligente:** Controle visual de quem está esperando, tempos estimados e notificações.
- **Menu com IA:** Criação de pratos onde a IA escreve a descrição e gera a foto automaticamente.
- **Gestão de Reservas:** Calendário de agendamentos.
- **Market Insights:** Análise de concorrentes e tendências usando Google Search Grounding.

### Para o Cliente (Público)
- **Fila Virtual:** Entre na fila pelo celular e acompanhe sua posição sem baixar app.
- **Cardápio Digital:** Visualize fotos e preços atualizados.
- **Reservas Online:** Agende sua mesa de forma autônoma.

## 🛠️ Stack Tecnológica

- **Core:** React 19, TypeScript, Vite.
- **Estilização:** Tailwind CSS.
- **IA:** Google Gemini API (Multimodal: Texto, Imagem, Search Grounding, Maps Grounding).
- **Dados:** React Context API (Simulação de Backend em memória).
- **Icons:** Lucide React.
- **Charts:** Recharts.

## 🚀 Como Rodar

### Modo Standalone (Padrão - Sem Backend)

O projeto funciona **sem necessidade de backend, banco de dados ou Docker**. Por padrão, usa dados mockados com persistência local (localStorage).

1. **Pré-requisitos:** Node.js 18+.
2. **Início Automático (Recomendado):**
   ```bash
   npm start
   ```
   O script `start.ps1` verifica e configura tudo automaticamente!

3. **Ou início manual:**
   ```bash
   npm install  # Apenas na primeira vez
   npm run dev
   ```
4. **Acesse:** `http://localhost:5173`

**Pronto!** O sistema funciona imediatamente sem configuração adicional.

> 💡 **Dica:** Use `npm start` para garantir que tudo está configurado corretamente antes de iniciar!

### Modo com Servidor (Opcional)

Se quiser usar o backend real, configure:

1. **Crie arquivo `.env` na raiz:**
   ```env
   VITE_USE_SERVER=true
   ```

2. **Inicie o backend:**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

3. **Inicie o frontend:**
   ```bash
   npm run dev
   ```

## 🔐 Acesso ao Sistema

### Login
- **Email:** Qualquer email (ex: `admin@demo.com`)
- **Senha:** Qualquer senha (ex: `123456`)

### Funcionalidades
- ✅ **Dados persistem** entre sessões (localStorage)
- ✅ **Todas as funcionalidades** funcionam sem servidor
- ✅ **Funciona offline** completamente

### Rotas Públicas
Para testar a visão do cliente, acesse:
- Menu: `/r/demo/menu`
- Fila: `/r/demo/fila`
- Reservas: `/r/demo/reservas`

---

**Nota:** Em modo standalone (padrão), os dados são salvos no localStorage do navegador e persistem entre sessões. Não há necessidade de backend ou banco de dados.