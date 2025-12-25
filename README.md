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

1. **Pré-requisitos:** Node.js 18+.
2. **Instalação:**
   ```bash
   npm install
   ```
3. **Configuração:**
   O projeto espera que a chave da API do Google Gemini seja injetada via variável de ambiente `API_KEY` no processo de build ou no ambiente de execução.
4. **Execução:**
   ```bash
   npm run dev
   ```

## 🔐 Acesso ao Demo

O sistema possui um fluxo de autenticação simulado.

1. Acesse a rota raiz `/`.
2. Login automático ou use qualquer email (ex: `admin@restoflow.com`).
3. Navegue pelo painel administrativo.
4. Para testar a visão do cliente, acesse as rotas públicas:
   - Menu: `/#/r/demo-grill/menu`
   - Fila: `/#/r/demo-grill/fila`
   - Reservas: `/#/r/demo-grill/reservas`

---

**Nota:** Este é um MVP Blueprint. Dados criados não são persistidos em banco de dados real. Ao recarregar a página, o estado volta ao inicial.