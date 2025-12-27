# Script simples para iniciar apenas o backend

Write-Host "🚀 Iniciando Backend RestoFlow..." -ForegroundColor Cyan
Write-Host ""

cd backend

# Verificar banco
Write-Host "📦 Verificando banco de dados..." -ForegroundColor Yellow
$dbRunning = docker ps --filter "name=restoflow_db" --format "{{.Names}}" 2>$null
if (-not $dbRunning) {
    Write-Host "⚠️ Banco não está rodando. Iniciando..." -ForegroundColor Yellow
    docker-compose up -d db
    Start-Sleep -Seconds 5
}

# Verificar .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tudo pronto. Iniciando backend..." -ForegroundColor Green
Write-Host ""

# Iniciar backend
npm run start:dev

