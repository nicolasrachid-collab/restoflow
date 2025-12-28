# Script de inicializacao automatica do RestoFlow
# Garante que tudo esta configurado corretamente antes de iniciar

Write-Host "🚀 RestoFlow - Inicializacao Automatica" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# 1. Verifica e configura .env
Write-Host "1️⃣ Verificando arquivo .env..." -ForegroundColor Yellow
$envNeedsUpdate = $false

if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -notmatch "VITE_USE_MOCK=true") {
        Write-Host "   ⚠️  VITE_USE_MOCK nao esta configurado" -ForegroundColor Yellow
        $envNeedsUpdate = $true
    } else {
        Write-Host "   ✅ VITE_USE_MOCK ja esta configurado" -ForegroundColor Green
    }
    
    if ($envContent -notmatch "VITE_DISABLE_WEBSOCKET=true") {
        Write-Host "   ⚠️  VITE_DISABLE_WEBSOCKET nao esta configurado" -ForegroundColor Yellow
        $envNeedsUpdate = $true
    }
} else {
    Write-Host "   ⚠️  Arquivo .env nao existe" -ForegroundColor Yellow
    $envNeedsUpdate = $true
}

if ($envNeedsUpdate) {
    Write-Host "   🔧 Corrigindo arquivo .env..." -ForegroundColor Cyan
    
    # Le o conteudo atual se existir
    $currentContent = ""
    if (Test-Path ".env") {
        $currentContent = Get-Content ".env" -Raw
    }
    
    # Prepara novo conteudo
    $newContent = "VITE_USE_MOCK=true`r`nVITE_DISABLE_WEBSOCKET=true`r`n`r`n"
    
    # Adiciona outras configuracoes existentes (se houver)
    if ($currentContent) {
        $lines = $currentContent -split "[\r\n]+"
        foreach ($line in $lines) {
            $trimmed = $line.Trim()
            if ($trimmed -and 
                $trimmed -notmatch "^VITE_USE_MOCK" -and 
                $trimmed -notmatch "^VITE_DISABLE_WEBSOCKET" -and
                $trimmed -notmatch "^#.*VITE_USE_MOCK" -and
                $trimmed -notmatch "^#.*VITE_DISABLE_WEBSOCKET") {
                $newContent += "$trimmed`r`n"
            }
        }
    }
    
    # Adiciona comentarios uteis
    $newContent += "# URL do WebSocket (opcional, padrao: http://localhost:3001)`r`n"
    $newContent += "# VITE_WS_URL=http://localhost:3001`r`n`r`n"
    $newContent += "# API Key do Google Gemini (opcional - para funcionalidades de IA)`r`n"
    $newContent += "# VITE_API_KEY=sua-chave-aqui`r`n"
    
    Set-Content -Path ".env" -Value $newContent -Encoding UTF8
    Write-Host "   ✅ Arquivo .env configurado!" -ForegroundColor Green
}

# 2. Verifica dependencias
Write-Host ""
Write-Host "2️⃣ Verificando dependencias..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   ⚠️  node_modules nao encontrado" -ForegroundColor Yellow
    Write-Host "   📦 Instalando dependencias..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Erro ao instalar dependencias!" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Dependencias instaladas!" -ForegroundColor Green
} else {
    Write-Host "   ✅ Dependencias ja instaladas" -ForegroundColor Green
}

# 3. Limpa cache (opcional - apenas se houver problemas)
Write-Host ""
Write-Host "3️⃣ Verificando cache..." -ForegroundColor Yellow
$cacheExists = (Test-Path "node_modules\.vite") -or (Test-Path ".vite")
if ($cacheExists) {
    Write-Host "   ℹ️  Cache encontrado (sera limpo se necessario)" -ForegroundColor Gray
} else {
    Write-Host "   ✅ Cache limpo" -ForegroundColor Green
}

# 4. Verifica porta 5173
Write-Host ""
Write-Host "4️⃣ Verificando porta 5173..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "   ⚠️  Porta 5173 esta em uso" -ForegroundColor Yellow
    Write-Host "   🔄 Tentando liberar porta..." -ForegroundColor Cyan
    $portInUse | ForEach-Object { 
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Porta liberada" -ForegroundColor Green
} else {
    Write-Host "   ✅ Porta 5173 esta livre" -ForegroundColor Green
}

# 5. Resumo e inicio
Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Gray
Write-Host "✅ Tudo pronto! Iniciando servidor..." -ForegroundColor Green
Write-Host ""
Write-Host "📝 Credenciais de login:" -ForegroundColor Yellow
Write-Host "   Email: qualquer email (ex: admin@demo.com)" -ForegroundColor White
Write-Host "   Senha: qualquer senha (ex: 123456)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Para parar o servidor, pressione Ctrl+C" -ForegroundColor Gray
Write-Host ""

# Inicia o servidor
npm run dev
