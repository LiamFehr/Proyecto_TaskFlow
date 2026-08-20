# ================================================
# Switch to Production Configuration
# ================================================
# Este script restaura las configuraciones de producción

Write-Host "🔄 Cambiando a configuración de PRODUCCIÓN..." -ForegroundColor Cyan

# 1. Restaurar .env de producción
Write-Host "📝 Restaurando variables de entorno de producción..." -ForegroundColor Yellow
if (Test-Path ".env.prod.backup") {
    Copy-Item -Path ".env.prod.backup" -Destination ".env" -Force
    Remove-Item ".env.prod.backup" -Force
    Write-Host "   ✅ .env restaurado desde backup" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  No se encontró backup, asegúrate que .env tenga las credenciales correctas" -ForegroundColor Yellow
}

# 2. Usar docker-compose.prod.yml
Write-Host "🐳 Usando docker-compose.prod.yml..." -ForegroundColor Yellow

Write-Host ""
Write-Host "✅ CONFIGURACIÓN DE PRODUCCIÓN ACTIVADA" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Para deploy en producción:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Siguiente paso: Seguir instrucciones en DEPLOY_INSTRUCTIONS.md" -ForegroundColor Yellow
Write-Host ""
