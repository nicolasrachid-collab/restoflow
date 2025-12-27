# 🚀 Modo Standalone - Rodar sem Backend (PADRÃO)

## O que é?

O RestoFlow funciona **por padrão sem backend, banco de dados ou Docker**. Tudo funciona com dados mockados (simulados) armazenados no **localStorage do navegador**, garantindo persistência entre sessões.

## ⚡ Como Usar

### Modo Padrão (Standalone)

**Não precisa de configuração!** O sistema já funciona standalone por padrão.

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Execute o frontend:**
   ```bash
   npm run dev
   ```

3. **Acesse o sistema:**
   Abra `http://localhost:5173` no navegador.

4. **Faça login:**
   **Use qualquer email e senha!** Por exemplo:
   - Email: `admin@demo.com`
   - Senha: `123456`

### Configuração Opcional

Se quiser desabilitar o modo mock (não recomendado sem backend):

Crie arquivo `.env` na raiz:
```env
VITE_USE_MOCK=false
VITE_USE_SERVER=true
```

## ✅ O que funciona

- ✅ **Login/Registro** - Qualquer credencial funciona
- ✅ **Dashboard** - Visualização completa
- ✅ **Gerenciamento de Fila** - Adicionar, editar, mudar status
- ✅ **Gerenciamento de Menu** - Criar, editar, remover itens
- ✅ **Gerenciamento de Reservas** - Criar, editar, mudar status
- ✅ **Páginas Públicas** - Fila pública, menu público, reservas públicas
- ✅ **Todas as funcionalidades de UI** - Tudo funciona normalmente!
- ✅ **Persistência Local** - Dados salvos no localStorage (persistem entre sessões)

## 📊 Dados Iniciais

Na primeira execução, o sistema vem com dados de exemplo:

**Fila:**
- João Silva (2 pessoas) - Posição 1
- Maria Santos (4 pessoas) - Posição 2
- Pedro Costa (3 pessoas) - Posição 3

**Menu:**
- Hambúrguer Clássico - R$ 25,90
- Pizza Margherita - R$ 45,00
- Coca-Cola - R$ 6,50

**Reservas:**
- Ana Oliveira - Amanhã, 4 pessoas
- Carlos Mendes - Depois de amanhã, 2 pessoas

**Nota:** Após a primeira execução, os dados são salvos no localStorage. Você pode modificar, adicionar ou remover itens e tudo será persistido.

## 💾 Persistência

- ✅ **Dados persistem** - Todas as mudanças são salvas automaticamente no localStorage
- ✅ **Entre sessões** - Dados permanecem após recarregar a página
- ✅ **Limpeza manual** - Para resetar, limpe o localStorage do navegador

## ⚠️ Limitações

- **Dados locais** - Dados ficam apenas no navegador atual (não sincronizam entre dispositivos)
- **Sem WebSocket** - Atualizações em tempo real não funcionam (usa polling)
- **Sem backend** - Funcionalidades que dependem do servidor não funcionam
- **Limite de armazenamento** - localStorage tem limite de ~5-10MB (suficiente para um restaurante)

## 🎯 Quando Usar

- 🚀 **Uso imediato** - Funciona sem configuração
- 📱 **Demonstrações** - Mostre o sistema funcionando rapidamente
- 🐛 **Debug** - Isole problemas do frontend
- 💻 **Desenvolvimento offline** - Trabalhe sem internet
- 🎨 **Prototipagem** - Teste novas interfaces rapidamente
- 🏪 **Uso standalone** - Sistema completo sem infraestrutura

## 🔄 Usar Backend Real (Opcional)

Para usar o backend real, configure:

1. **Crie arquivo `.env` na raiz:**
   ```env
   VITE_USE_SERVER=true
   ```

2. **Execute o backend:**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

3. **Execute o frontend:**
   ```bash
   npm run dev
   ```

## 💡 Dicas

- Os dados são salvos automaticamente no localStorage
- Você pode adicionar, editar e remover itens normalmente
- Todas as validações de formulário funcionam
- O sistema simula delays de rede para parecer mais realista
- Para resetar os dados, limpe o localStorage do navegador

## 🗑️ Limpar Dados

Para resetar todos os dados salvos:

1. Abra o Console do navegador (F12)
2. Execute:
   ```javascript
   localStorage.clear()
   ```
3. Recarregue a página

---

**Pronto!** O sistema funciona completamente standalone, sem necessidade de backend ou configuração adicional! 🎉

