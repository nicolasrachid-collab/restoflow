# 🔧 Solução de Problemas - Sistema Não Carrega

## ✅ Passo a Passo para Resolver

### 1. Verifique o arquivo `.env`

O arquivo `.env` deve estar na **raiz do projeto** (mesmo nível do `package.json`) com:

```env
VITE_USE_MOCK=true
VITE_DISABLE_WEBSOCKET=true
```

**Como verificar:**
- Abra o PowerShell na pasta do projeto
- Execute: `Get-Content .env`
- Se não existir, crie com o conteúdo acima

### 2. Limpe o cache e reinstale

```powershell
# Remove cache do Vite
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# Reinstala dependências (se necessário)
npm install
```

### 3. Execute o servidor

```powershell
npm run dev
```

### 4. Verifique o console do navegador

1. Abra `http://localhost:5173`
2. Pressione **F12** para abrir o console
3. Procure por:
   - ✅ `🔧 Modo MOCK ativado - Sistema rodando sem backend` (deve aparecer)
   - ❌ Erros em vermelho

### 5. Erros comuns e soluções

#### Erro: "Failed to fetch" ou "Network error"
**Solução:** O modo mock não está ativo. Verifique se `VITE_USE_MOCK=true` está no `.env`

#### Erro: "Cannot find module"
**Solução:** Execute `npm install` novamente

#### Erro: "Port 5173 is already in use"
**Solução:** 
```powershell
# Encontra processo na porta 5173
Get-NetTCPConnection -LocalPort 5173 | Select-Object -ExpandProperty OwningProcess

# Mata o processo (substitua PID pelo número retornado)
Stop-Process -Id PID -Force
```

#### Página em branco
**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (Ctrl+F5)
3. Verifique o console (F12) para erros

### 6. Script de teste automático

Execute:
```powershell
.\testar-sistema.ps1
```

Este script:
- Verifica/cria `.env`
- Verifica dependências
- Limpa cache
- Inicia servidor
- Abre navegador

## 🐛 Se ainda não funcionar

1. **Abra o console do navegador (F12)**
2. **Copie TODOS os erros** que aparecem em vermelho
3. **Verifique se o servidor está rodando:**
   - Você deve ver no terminal: `Local: http://localhost:5173`
   - Se não aparecer, há um erro de compilação

4. **Verifique se o modo mock está ativo:**
   - No console do navegador, deve aparecer: `🔧 Modo MOCK ativado`
   - Se não aparecer, o `.env` não está sendo lido

## 📝 Checklist Rápido

- [ ] Arquivo `.env` existe na raiz?
- [ ] `VITE_USE_MOCK=true` está no `.env`?
- [ ] `node_modules` existe?
- [ ] Servidor está rodando? (terminal mostra "Local: http://localhost:5173")
- [ ] Console do navegador mostra "Modo MOCK ativado"?
- [ ] Não há erros em vermelho no console?

## 💡 Dica

Se nada funcionar, tente:
1. Feche todos os terminais
2. Delete `node_modules` e `.vite` (se existir)
3. Execute `npm install`
4. Execute `npm run dev`
5. Abra `http://localhost:5173` no navegador

