# Script para testar e diagnosticar problemas

Write-Host "🔍 Testando sistema RestoFlow..." -ForegroundColor Cyan
Write-Host ""

# 1. Verifica .env
Write-Host "1️⃣ Verificando .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    Write-Host "   ✅ .env existe" -ForegroundColor Green
    if ($envContent -match "VITE_USE_MOCK=true") {
        Write-Host "   ✅ VITE_USE_MOCK=true configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ VITE_USE_MOCK não está configurado!" -ForegroundColor Red
        Write-Host "   Adicionando VITE_USE_MOCK=true ao .env..." -ForegroundColor Yellow
        Add-Content ".env" "`nVITE_USE_MOCK=true`nVITE_DISABLE_WEBSOCKET=true"
        Write-Host "   ✅ Configuração adicionada!" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ .env não existe! Criando..." -ForegroundColor Red
    @"
VITE_USE_MOCK=true
VITE_DISABLE_WEBSOCKET=true
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "   ✅ .env criado!" -ForegroundColor Green
}

# 2. Verifica node_modules
Write-Host ""
Write-Host "2️⃣ Verificando dependências..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ node_modules não existe!" -ForegroundColor Red
    Write-Host "   Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# 3. Limpa cache do Vite
Write-Host ""
Write-Host "3️⃣ Limpando cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cache limpo" -ForegroundColor Green
}

# 4. Verifica arquivos principais
Write-Host ""
Write-Host "4️⃣ Verificando arquivos..." -ForegroundColor Yellow
$files = @("index.tsx", "App.tsx", "services/api.ts", "services/mockData.ts")
$allOk = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file não existe!" -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host ""
    Write-Host "❌ Alguns arquivos estão faltando!" -ForegroundColor Red
    exit 1
}

# 5. Inicia servidor
Write-Host ""
Write-Host "5️⃣ Iniciando servidor..." -ForegroundColor Yellow
Write-Host "   Aguarde alguns segundos e acesse: http://localhost:5173" -ForegroundColor Gray
Write-Host "   Pressione Ctrl+C para parar" -ForegroundColor Gray
Write-Host ""

# Aguarda 3 segundos e abre navegador
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

# Inicia servidor
npm run dev

