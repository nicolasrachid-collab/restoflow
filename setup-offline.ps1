# Script para configurar modo offline rapidamente

Write-Host "🔧 Configurando modo OFFLINE..." -ForegroundColor Cyan

# Verifica se .env existe
if (Test-Path ".env") {
    Write-Host "⚠️  Arquivo .env já existe. Deseja sobrescrever? (S/N)" -ForegroundColor Yellow
    $resposta = Read-Host
    if ($resposta -ne "S" -and $resposta -ne "s") {
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        exit
    }
}

# Cria arquivo .env
$envContent = @"
# Modo OFFLINE - Rodar sem backend (usa dados mockados)
VITE_USE_MOCK=true

# Desabilitar WebSocket em desenvolvimento local (recomendado)
VITE_DISABLE_WEBSOCKET=true
"@

Set-Content -Path ".env" -Value $envContent

Write-Host "✅ Arquivo .env criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute: npm run dev" -ForegroundColor White
Write-Host "2. Acesse: http://localhost:5173" -ForegroundColor White
Write-Host "3. Faça login com qualquer email/senha" -ForegroundColor White
Write-Host ""

