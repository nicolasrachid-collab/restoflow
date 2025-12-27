# Script simples para abrir o sistema em modo offline

Write-Host "🚀 RestoFlow - Modo Offline" -ForegroundColor Cyan
Write-Host ""

# Verifica e cria .env se necessário
if (-not (Test-Path ".env")) {
    Write-Host "📝 Criando .env..." -ForegroundColor Yellow
    @"
VITE_USE_MOCK=true
VITE_DISABLE_WEBSOCKET=true
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env criado!" -ForegroundColor Green
} else {
    # Garante que VITE_USE_MOCK está configurado
    $envContent = Get-Content ".env" -Raw
    if ($envContent -notmatch "VITE_USE_MOCK=true") {
        Add-Content ".env" "`nVITE_USE_MOCK=true`nVITE_DISABLE_WEBSOCKET=true"
        Write-Host "✅ Modo offline ativado no .env" -ForegroundColor Green
    } else {
        Write-Host "✅ Modo offline já configurado" -ForegroundColor Green
    }
}

# Verifica dependências
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependências instaladas" -ForegroundColor Green
}

# Limpa cache do Vite
Write-Host "🧹 Limpando cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue
}
Write-Host "✅ Cache limpo" -ForegroundColor Green

Write-Host ""
Write-Host "🌐 Iniciando servidor..." -ForegroundColor Cyan
Write-Host "   O navegador será aberto automaticamente" -ForegroundColor Gray
Write-Host "   Aguarde alguns segundos..." -ForegroundColor Gray
Write-Host ""

# Aguarda alguns segundos e abre navegador
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "📝 Credenciais de login:" -ForegroundColor Yellow
Write-Host "   Email: qualquer email (ex: admin@demo.com)" -ForegroundColor White
Write-Host "   Senha: qualquer senha (ex: 123456)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Para parar o servidor, pressione Ctrl+C" -ForegroundColor Gray
Write-Host ""

# Inicia servidor (bloqueia até Ctrl+C)
npm run dev

