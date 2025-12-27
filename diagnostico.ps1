# Script de diagnóstico para identificar problemas

Write-Host "🔍 Diagnóstico do RestoFlow" -ForegroundColor Cyan
Write-Host ""

# 1. Verifica arquivo .env
Write-Host "1️⃣ Verificando arquivo .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ Arquivo .env existe" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "VITE_USE_MOCK=true") {
        Write-Host "   ✅ VITE_USE_MOCK está configurado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  VITE_USE_MOCK não está configurado" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Arquivo .env não existe!" -ForegroundColor Red
}

# 2. Verifica node_modules
Write-Host ""
Write-Host "2️⃣ Verificando dependências..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ node_modules não existe! Execute: npm install" -ForegroundColor Red
}

# 3. Verifica porta 5173
Write-Host ""
Write-Host "3️⃣ Verificando porta 5173..." -ForegroundColor Yellow
$portCheck = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "   ✅ Porta 5173 está em uso (servidor pode estar rodando)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Porta 5173 não está em uso (servidor não está rodando)" -ForegroundColor Yellow
}

# 4. Testa conexão com servidor
Write-Host ""
Write-Host "4️⃣ Testando conexão com servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   ✅ Servidor está respondendo (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Servidor não está respondendo: $_" -ForegroundColor Red
}

# 5. Verifica arquivos principais
Write-Host ""
Write-Host "5️⃣ Verificando arquivos principais..." -ForegroundColor Yellow
$files = @("index.tsx", "App.tsx", "services/api.ts", "services/mockData.ts")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file existe" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file não existe!" -ForegroundColor Red
    }
}

# 6. Verifica se há erros de sintaxe no TypeScript
Write-Host ""
Write-Host "6️⃣ Verificando erros de compilação..." -ForegroundColor Yellow
try {
    $tscCheck = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Sem erros de TypeScript" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Possíveis erros de TypeScript:" -ForegroundColor Yellow
        Write-Host $tscCheck
    }
} catch {
    Write-Host "   ⚠️  Não foi possível verificar TypeScript" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Abra o console do navegador (F12)" -ForegroundColor White
Write-Host "   2. Verifique se há erros em vermelho" -ForegroundColor White
Write-Host "   3. Tente acessar: http://localhost:5173" -ForegroundColor White
Write-Host "   4. Se o servidor não estiver rodando, execute: npm run dev" -ForegroundColor White
Write-Host ""

