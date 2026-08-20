#!/bin/bash
# ==============================================
# Switch to DEVELOPMENT environment
# ==============================================

echo "🔧 Cambiando a entorno de DESARROLLO..."

# 1. Copiar .env.dev como .env
if [ -f .env.dev ]; then
    cp .env.dev .env
    echo "✅ Copiado .env.dev → .env"
else
    echo "❌ Error: .env.dev no encontrado"
    exit 1
fi

# 2. Bajar cualquier contenedor de prod que esté corriendo
if docker ps -a | grep -q "taskflow-postgres-prod"; then
    echo "🛑 Deteniendo contenedores de producción..."
    docker-compose -f docker-compose.prod.yml down
fi

# 3. Levantar contenedores de dev
echo "🚀 Levantando PostgreSQL de desarrollo..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "✅ Entorno de DESARROLLO activado"
echo ""
echo "📦 Servicios disponibles:"
echo "  - PostgreSQL: localhost:5433"
echo "  - pgAdmin: http://localhost:5050"
echo ""
echo "🔑 Credenciales:"
echo "  - DB: taskflow_dev / taskflow_dev / dev_password_123"
echo "  - pgAdmin: dev@taskflow.local / admin"
echo ""
echo "▶️  Para arrancar el backend:"
echo "  cd backend"
echo "  mvn spring-boot:run -Dspring-boot.run.profiles=development"
