# ================================================
# Switch to Development Configuration
# ================================================
# Este script cambia rápidamente a las configuraciones de desarrollo local

Write-Host "🔄 Cambiando a configuración de DESARROLLO..." -ForegroundColor Cyan

# 1. Copiar .env.dev a .env (temporal, solo para desarrollo local)
Write-Host "📝 Configurando variables de entorno para desarrollo..." -ForegroundColor Yellow
Copy-Item -Path ".env" -Destination ".env.prod.backup" -Force
Copy-Item -Path ".env.dev" -Destination ".env" -Force

# 2. Usar docker-compose.dev.yml
Write-Host "🐳 Usando docker-compose.dev.yml..." -ForegroundColor Yellow

Write-Host ""
Write-Host "✅ CONFIGURACIÓN DE DESARROLLO ACTIVADA" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Para iniciar en modo desarrollo:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 URLs de desarrollo:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8081" -ForegroundColor Cyan
Write-Host "   Agente:   http://localhost:8001" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Este modo es SOLO para desarrollo local" -ForegroundColor Yellow
Write-Host "   NO usar estas configuraciones en producción" -ForegroundColor Yellow
Write-Host ""
