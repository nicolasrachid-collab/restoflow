# Script para iniciar RestoFlow

Write-Host "🚀 Iniciando RestoFlow..." -ForegroundColor Cyan
Write-Host ""

# Função para verificar se porta está em uso
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
    return $connection
}

# Função para aguardar serviço estar pronto
function Wait-ForService {
    param(
        [string]$Url,
        [string]$ServiceName,
        [int]$MaxAttempts = 30,
        [int]$DelaySeconds = 2
    )
    
    Write-Host "⏳ Aguardando $ServiceName estar pronto..." -ForegroundColor Yellow
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $ServiceName está pronto!" -ForegroundColor Green
                return $true
            }
        } catch {
            Write-Host "   Tentativa $i/$MaxAttempts..." -ForegroundColor Gray
        }
        Start-Sleep -Seconds $DelaySeconds
    }
    Write-Host "⚠️ $ServiceName não respondeu após $($MaxAttempts * $DelaySeconds) segundos" -ForegroundColor Yellow
    return $false
}

# Verificar se Docker está rodando
Write-Host "📦 Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker está rodando" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker não está rodando. Por favor, inicie o Docker Desktop." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker não está acessível. Por favor, inicie o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Verificar e iniciar banco de dados
Write-Host "🗄️ Verificando banco de dados..." -ForegroundColor Yellow
$dbContainer = docker ps --filter "name=restoflow_db" --format "{{.Names}}" 2>$null

if (-not $dbContainer) {
    Write-Host "⚠️ Container do banco não está rodando. Iniciando..." -ForegroundColor Yellow
    Push-Location backend
    docker-compose up -d db
    Pop-Location
    
    Write-Host "⏳ Aguardando banco inicializar..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
    
    # Verificar se banco está realmente acessível
    $dbReady = $false
    for ($i = 1; $i -le 10; $i++) {
        try {
            $testConnection = docker exec restoflow_db pg_isready -U restoflow_admin 2>$null
            if ($LASTEXITCODE -eq 0) {
                $dbReady = $true
                break
            }
        } catch {}
        Start-Sleep -Seconds 2
    }
    
    if ($dbReady) {
        Write-Host "✅ Banco de dados está pronto" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Banco de dados pode não estar totalmente pronto, mas continuando..." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Container do banco está rodando" -ForegroundColor Green
}

# Verificar se arquivo .env existe no backend
Write-Host "🔍 Verificando configuração..." -ForegroundColor Yellow
$backendEnvPath = Join-Path $PWD "backend\.env"
if (-not (Test-Path $backendEnvPath)) {
    Write-Host "❌ Arquivo backend/.env não encontrado!" -ForegroundColor Red
    Write-Host "   Por favor, crie o arquivo .env na pasta backend/ com DATABASE_URL" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
}

# Verificar se porta 3001 está livre
if (Test-Port -Port 3001) {
    Write-Host "⚠️ Porta 3001 já está em uso. Backend pode já estar rodando." -ForegroundColor Yellow
    $useExisting = Read-Host "Deseja usar o backend existente? (S/N)"
    if ($useExisting -ne "S" -and $useExisting -ne "s") {
        Write-Host "Por favor, pare o processo na porta 3001 e tente novamente." -ForegroundColor Yellow
        exit 1
    }
    $backendRunning = $true
} else {
    $backendRunning = $false
}

# Iniciar Backend se não estiver rodando
if (-not $backendRunning) {
    Write-Host "📦 Iniciando Backend..." -ForegroundColor Green
    $backendPath = Join-Path $PWD "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🚀 Backend RestoFlow' -ForegroundColor Cyan; npm run start:dev"
    
    # Aguardar backend estar realmente pronto usando health check
    $backendReady = Wait-ForService -Url "http://localhost:3001/health" -ServiceName "Backend" -MaxAttempts 30 -DelaySeconds 2
    
    if (-not $backendReady) {
        Write-Host "⚠️ Backend pode não estar totalmente pronto, mas continuando..." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Backend já está rodando" -ForegroundColor Green
}

# Verificar health check detalhado
Write-Host "🔍 Verificando saúde do backend..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
    if ($healthResponse.status -eq "ok") {
        Write-Host "✅ Backend está saudável" -ForegroundColor Green
        if ($healthResponse.checks.database.status -eq "healthy") {
            Write-Host "✅ Banco de dados está conectado" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Banco de dados pode ter problemas: $($healthResponse.checks.database.message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Backend está com status: $($healthResponse.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Não foi possível verificar saúde do backend: $_" -ForegroundColor Yellow
}

# Verificar se porta 5173 está livre
if (Test-Port -Port 5173) {
    Write-Host "⚠️ Porta 5173 já está em uso. Frontend pode já estar rodando." -ForegroundColor Yellow
    $useExisting = Read-Host "Deseja usar o frontend existente? (S/N)"
    if ($useExisting -ne "S" -and $useExisting -ne "s") {
        Write-Host "Por favor, pare o processo na porta 5173 e tente novamente." -ForegroundColor Yellow
        exit 1
    }
    $frontendRunning = $true
} else {
    $frontendRunning = $false
}

# Iniciar Frontend se não estiver rodando
if (-not $frontendRunning) {
    Write-Host "🎨 Iniciando Frontend..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🎨 Frontend RestoFlow' -ForegroundColor Cyan; npm run dev"
    
    # Aguardar frontend estar pronto
    $frontendReady = Wait-ForService -Url "http://localhost:5173" -ServiceName "Frontend" -MaxAttempts 20 -DelaySeconds 2
    
    if (-not $frontendReady) {
        Write-Host "⚠️ Frontend pode não estar totalmente pronto, mas continuando..." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Frontend já está rodando" -ForegroundColor Green
}

# Verificação final
Write-Host ""
Write-Host "🔍 Verificação final dos servidores..." -ForegroundColor Yellow

try {
    $backend = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ Backend: RODANDO (http://localhost:3001)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend: Não está respondendo" -ForegroundColor Yellow
}

try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ Frontend: RODANDO (http://localhost:5173)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Frontend: Não está respondendo" -ForegroundColor Yellow
}

# Abrir navegador
Write-Host ""
Write-Host "🌐 Abrindo navegador..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "✅ Inicialização concluída!" -ForegroundColor Green
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
Write-Host "💡 Dica: Os servidores estão rodando em janelas separadas do PowerShell." -ForegroundColor Gray
Write-Host "   Feche essas janelas para parar os servidores." -ForegroundColor Gray
Write-Host ""

