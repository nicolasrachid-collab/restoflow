# 🚀 Início Rápido - RestoFlow

## ✅ Forma Mais Simples (Recomendada)

Execute apenas:

```powershell
npm start
```

**Pronto!** O script `start.ps1` faz tudo automaticamente:
- ✅ Verifica e cria/corrige o arquivo `.env`
- ✅ Verifica e instala dependências se necessário
- ✅ Limpa cache se necessário
- ✅ Libera a porta 5173 se estiver em uso
- ✅ Inicia o servidor automaticamente

## 📋 Outras Formas de Iniciar

### Opção 1: Script PowerShell Direto
```powershell
.\start.ps1
```

### Opção 2: Comando npm tradicional
```powershell
npm run dev
```
*(Requer que `.env` já esteja configurado)*

### Opção 3: Script de modo offline
```powershell
.\start-offline.ps1
```

## 🔧 O que o script `start.ps1` faz automaticamente?

1. **Verifica `.env`**
   - Se não existir, cria com configurações corretas
   - Se existir mas estiver incompleto, adiciona o que falta
   - Garante que `VITE_USE_MOCK=true` e `VITE_DISABLE_WEBSOCKET=true` estão configurados

2. **Verifica dependências**
   - Se `node_modules` não existir, executa `npm install` automaticamente

3. **Verifica porta**
   - Se a porta 5173 estiver em uso, tenta liberar automaticamente

4. **Inicia servidor**
   - Executa `npm run dev` e mostra as credenciais de login

## 📝 Credenciais de Login

Após iniciar, use:
- **Email:** qualquer email (ex: `admin@demo.com`)
- **Senha:** qualquer senha (ex: `123456`)

## ✅ Garantia de Funcionamento

O script `start.ps1` garante que:
- ✅ O arquivo `.env` sempre está correto
- ✅ As dependências sempre estão instaladas
- ✅ A porta sempre está livre
- ✅ O servidor sempre inicia corretamente

## 🐛 Se algo der errado

1. Execute o script de diagnóstico:
   ```powershell
   .\diagnostico.ps1
   ```

2. Ou execute o script de verificação:
   ```powershell
   .\verificar-problema.ps1
   ```

3. Limpe tudo manualmente:
   ```powershell
   Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
   npm install
   npm start
   ```

## 💡 Dica

Adicione um atalho no seu editor ou terminal para executar `npm start` rapidamente!

