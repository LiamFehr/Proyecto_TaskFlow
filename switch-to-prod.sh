#!/bin/bash
# ==============================================
# Switch to PRODUCTION environment
# ==============================================

echo "🚀 Cambiando a entorno de PRODUCCIÓN..."

# Verificar que .env.prod existe
if [ ! -f .env.prod ]; then
    echo "❌ Error: .env.prod no encontrado"
    echo "Por favor crear .env.prod con las credenciales de producción"
    exit 1
fi

# Advertencia
echo ""
echo "⚠️  ADVERTENCIA: Vas a cambiar a PRODUCCIÓN"
echo "Asegurate de haber configurado .env.prod con valores seguros"
echo ""
read -p "¿Continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelado"
    exit 0
fi

# 1. Copiar .env.prod como .env
cp .env.prod .env
echo "✅ Copiado .env.prod → .env"

# 2. Bajar cualquier contenedor de dev que esté corriendo
if docker ps -a | grep -q "taskflow-postgres-dev"; then
    echo "🛑 Deteniendo contenedores de desarrollo..."
    docker-compose -f docker-compose.dev.yml down
fi

# 3. Levantar contenedores de prod
echo "🚀 Levantando PostgreSQL de producción..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ Entorno de PRODUCCIÓN activado"
echo ""
echo "📦 Servicios disponibles:"
echo "  - PostgreSQL: localhost:5432"
echo ""
echo "▶️  Para arrancar el backend:"
echo "  cd backend"
echo "  mvn spring-boot:run -Dspring-boot.run.profiles=production"
