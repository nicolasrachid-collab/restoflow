---
name: Implementação de Regras de Negócio Completas
overview: ""
todos: []
---

# Plano: Implemen

tação Completa de Regras de Negócio

## Análise Arquitetural e Decisões

### 1. Estrutura de Roles (UserRole)

**Decisão**: ADMIN e OPERATOR

- **ADMIN**: Pode executar qualquer ação dentro da empresa
- **OPERATOR**: Não pode criar usuários, alterar configurações ou excluir registros
- **Justificativa**: MASTER não faz sentido em multitenancy; CLIENT não é usuário do sistema (é Customer)

### 2. Estados da Fila (QueueStatus)

**Decisão**: WAITING, NOTIFIED, CALLED, NO_SHOW, CANCELLED, DONE

- Remover SEATED (substituído por DONE)
- NOTIFIED: Cliente avisado que está próximo
- NO_SHOW: Cliente não compareceu após ser chamado
- DONE: Atendimento concluído

### 3. Estados de Reserva (ReservationStatus)

**Decisão**: PENDING, CONFIRMED, CHECKED_IN, CANCELLED, NO_SHOW, COMPLETED

- CHECKED_IN: Cliente chegou (útil para métricas)
- NO_SHOW: Cliente não compareceu

### 4. Horário de Funcionamento

**Decisão**: Horário por dia da semana (evoluir para exceções depois)

- Modelo `OperatingHours` com dia da semana, hora abertura, hora fechamento
- Validação em tempo real

### 5. Limites da Fila

**Decisão**: Limite de pessoas por grupo + limite total de grupos aguardando

- Configurável por restaurante

## Implementação

### Fase 1: Schema e Modelos Base

**Arquivo**: `backend/prisma/schema.prisma`

1. **Atualizar UserRole enum**

- ADMIN, OPERATOR (remover STAFF, MASTER, CLIENT)

2. **Atualizar QueueStatus enum**

- WAITING, NOTIFIED, CALLED, NO_SHOW, CANCELLED, DONE

3. **Atualizar ReservationStatus enum**

- PENDING, CONFIRMED, CHECKED_IN, CANCELLED, NO_SHOW, COMPLETED

4. **Adicionar campos ao Restaurant**

- `isActive` (Boolean, default: true)
- `queueActive` (Boolean, default: true)
- `maxPartySize` (Int, default: 20)
- `maxWaitingGroups` (Int, default: 50)
- `averageTableTimeMinutes` (Int, default: 45)
- `calledTimeoutMinutes` (Int, default: 10)

5. **Adicionar campos ao User**

- `isActive` (Boolean, default: true)
- `mustChangePassword` (Boolean, default: false)
- `lastLoginAt` (DateTime?)

6. **Criar modelo OperatingHours**

- `id` (UUID)
- `restaurantId` (FK)
- `dayOfWeek` (Int, 0-6, 0=domingo)
- `isOpen` (Boolean)
- `openTime` (String, formato "HH:mm")
- `closeTime` (String, formato "HH:mm")

7. **Adicionar campos ao QueueItem**

- `notifiedAt` (DateTime?)
- `calledAt` (DateTime?)
- `noShowAt` (DateTime?)
- `position` (Int, para reordenação manual)
- `manualOrder` (Boolean, default: false)

8. **Adicionar campos ao Reservation**

- `checkedInAt` (DateTime?)
- `noShowAt` (DateTime?)
- `originalReservationId` (String?, FK para reagendamento)

9. **Criar modelo AuditLog**

- `id` (UUID)
- `restaurantId` (FK)
- `userId` (String?, FK opcional)
- `entityType` (String: "QueueItem", "Reservation", "User", etc)
- `entityId` (String)
- `action` (String: "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE")
- `oldValue` (Json?)
- `newValue` (Json?)
- `metadata` (Json?)
- `createdAt` (DateTime)

10. **Adicionar campos ao MenuItem**

    - `isActive` (Boolean, default: true)
    - `available` (Boolean, default: true)
    - `categoryId` (String?, FK opcional)

11. **Criar modelo Category** (para menu)

    - `id` (UUID)
    - `restaurantId` (FK)
    - `name` (String)
    - `isActive` (Boolean, default: true)
    - `displayOrder` (Int)
    - `menuItems` (MenuItem[])

12. **Criar modelo MenuItemVariant** (variáveis do produto)

    - `id` (UUID)
    - `menuItemId` (FK)
    - `name` (String)
    - `isRequired` (Boolean, default: false)
    - `priceModifier` (Float, default: 0)
    - `displayOrder` (Int)

### Fase 2: Backend - Validações e Regras

**Arquivo**: `backend/src/restaurants/restaurants.service.ts` (novo)

- `checkOperatingHours(restaurantId: string): Promise<boolean>`
- `isRestaurantActive(restaurantId: string): Promise<boolean>`