# Script para iniciar RestoFlow

Write-Host "🚀 Iniciando RestoFlow..." -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está rodando
Write-Host "📦 Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if (-not $dockerRunning) {
    Write-Host "⚠️ Docker não está rodando. Iniciando containers..." -ForegroundColor Yellow
    cd backend
    docker-compose up -d
    Start-Sleep -Seconds 3
    cd ..
} else {
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
}

# Verificar se containers estão rodando
Write-Host "🗄️ Verificando banco de dados..." -ForegroundColor Yellow
$dbRunning = docker ps --filter "name=restoflow_db" --format "{{.Names}}" 2>$null
if (-not $dbRunning) {
    Write-Host "⚠️ Banco de dados não está rodando. Iniciando..." -ForegroundColor Yellow
    cd backend
    docker-compose up -d
    Start-Sleep -Seconds 5
    cd ..
}

# Iniciar Backend em nova janela
Write-Host "📦 Iniciando Backend..." -ForegroundColor Green
$backendPath = Join-Path $PWD "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🚀 Backend RestoFlow' -ForegroundColor Cyan; npm run start:dev"

# Aguardar backend iniciar
Write-Host "⏳ Aguardando backend iniciar (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar Frontend em nova janela
Write-Host "🎨 Iniciando Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🎨 Frontend RestoFlow' -ForegroundColor Cyan; npm run dev"

# Aguardar frontend iniciar
Write-Host "⏳ Aguardando frontend iniciar (10 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar se servidores estão rodando
Write-Host ""
Write-Host "🔍 Verificando servidores..." -ForegroundColor Yellow

try {
    $backend = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ Backend: RODANDO (http://localhost:3001)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend: Ainda iniciando..." -ForegroundColor Yellow
}

try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ Frontend: RODANDO (http://localhost:5173)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Frontend: Ainda iniciando..." -ForegroundColor Yellow
}

# Abrir navegador
Write-Host ""
Write-Host "🌐 Abrindo navegador..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "✅ Servidores iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173"
Write-Host "   Backend:  http://localhost:3001"
Write-Host "   Health:   http://localhost:3001/health"
Write-Host ""
Write-Host "🔐 Login:" -ForegroundColor Cyan
Write-Host "   Email: admin@restoflow.com"
Write-Host "   Senha: 123456"
Write-Host ""

