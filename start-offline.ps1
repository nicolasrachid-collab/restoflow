# Script para iniciar o RestoFlow (modo standalone - padrão)

Write-Host "🚀 Iniciando RestoFlow..." -ForegroundColor Cyan
Write-Host "   Modo: Standalone (sem backend necessário)" -ForegroundColor Gray
Write-Host ""

Write-Host ""
Write-Host "📦 Verificando dependências..." -ForegroundColor Cyan

# Verifica se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules não encontrado. Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
} else {
    Write-Host "✅ Dependências já instaladas" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌐 Iniciando servidor de desenvolvimento..." -ForegroundColor Cyan
Write-Host "   O navegador será aberto automaticamente em alguns segundos..." -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Credenciais de login:" -ForegroundColor Yellow
Write-Host "   Email: qualquer email (ex: admin@demo.com)" -ForegroundColor White
Write-Host "   Senha: qualquer senha (ex: 123456)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Para parar o servidor, pressione Ctrl+C" -ForegroundColor Gray
Write-Host ""

# Função para aguardar servidor estar pronto
function Wait-ForServer {
    param([int]$MaxAttempts = 30)
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                return $true
            }
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    return $false
}

# Inicia o servidor em background
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Cyan
$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev 2>&1
}

# Aguarda servidor estar pronto
Write-Host "⏳ Aguardando servidor iniciar..." -ForegroundColor Yellow
$serverReady = Wait-ForServer

if ($serverReady) {
    Write-Host "✅ Servidor está rodando!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Abrindo navegador..." -ForegroundColor Cyan
    Start-Process "http://localhost:5173"
    Write-Host ""
    Write-Host "✅ Sistema aberto no navegador!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Para ver os logs do servidor, execute:" -ForegroundColor Yellow
    Write-Host "   Receive-Job -Id $($job.Id)" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Para parar o servidor, execute:" -ForegroundColor Yellow
    Write-Host "   Stop-Job -Id $($job.Id); Remove-Job -Id $($job.Id)" -ForegroundColor White
} else {
    Write-Host "⚠️ Servidor pode estar iniciando ainda..." -ForegroundColor Yellow
    Write-Host "   Tente acessar manualmente: http://localhost:5173" -ForegroundColor White
}

# Mostra logs do servidor
Write-Host ""
Write-Host "📋 Logs do servidor:" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
Receive-Job -Id $job.Id -Wait

