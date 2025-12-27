# ⚡ Instruções Rápidas - Modo Offline

## 🚀 Passo a Passo

### 1. Crie o arquivo `.env` na raiz do projeto

Copie o conteúdo abaixo e salve como `.env`:

```env
VITE_USE_MOCK=true
VITE_DISABLE_WEBSOCKET=true
```

### 2. Execute o frontend

```bash
npm run dev
```

### 3. Acesse no navegador

Abra: `http://localhost:5173`

### 4. Faça login

**Use qualquer email e senha!** Por exemplo:
- Email: `admin@demo.com`
- Senha: `123456`

## ✅ Pronto!

O sistema deve abrir normalmente. Você verá no console do navegador:
```
🔧 Modo MOCK ativado - Sistema rodando sem backend
```

## 🐛 Se não abrir

1. **Verifique se o arquivo `.env` existe** na raiz do projeto
2. **Verifique se tem `VITE_USE_MOCK=true`** no arquivo `.env`
3. **Reinicie o servidor** (Ctrl+C e `npm run dev` novamente)
4. **Abra o console do navegador** (F12) e veja se há erros

## 📝 Nota

- O arquivo `.env` deve estar na **raiz do projeto** (mesmo nível do `package.json`)
- Não precisa de backend rodando
- Não precisa de banco de dados
- Não precisa de Docker

