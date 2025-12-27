# Script para verificar e corrigir problemas

Write-Host "🔍 Verificando problema..." -ForegroundColor Cyan
Write-Host ""

# 1. Verifica .env
Write-Host "1️⃣ Verificando .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    Write-Host "   ✅ .env existe" -ForegroundColor Green
    if ($envContent -notmatch "VITE_USE_MOCK=true") {
        Write-Host "   ❌ VITE_USE_MOCK não está configurado!" -ForegroundColor Red
        Write-Host "   Corrigindo..." -ForegroundColor Yellow
        @"
VITE_USE_MOCK=true
VITE_DISABLE_WEBSOCKET=true
"@ | Out-File -FilePath ".env" -Encoding UTF8 -Force
        Write-Host "   ✅ Corrigido!" -ForegroundColor Green
    } else {
        Write-Host "   ✅ VITE_USE_MOCK já está configurado" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ .env não existe! Criando..." -ForegroundColor Red
    @"
VITE_USE_MOCK=true
VITE_DISABLE_WEBSOCKET=true
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "   ✅ Criado!" -ForegroundColor Green
}

# 2. Limpa cache
Write-Host ""
Write-Host "2️⃣ Limpando cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".vite" -ErrorAction SilentlyContinue
Write-Host "   ✅ Cache limpo" -ForegroundColor Green

# 3. Verifica se porta está em uso
Write-Host ""
Write-Host "3️⃣ Verificando porta 5173..." -ForegroundColor Yellow
$port = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "   ⚠️  Porta 5173 está em uso" -ForegroundColor Yellow
    Write-Host "   Matando processo..." -ForegroundColor Yellow
    $port | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Processo finalizado" -ForegroundColor Green
} else {
    Write-Host "   ✅ Porta 5173 está livre" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Verificação concluída!" -ForegroundColor Green
Write-Host ""

