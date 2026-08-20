# ================================================================
# TaskFlow v5.16 - Comandos Manuales de Deployment
# ================================================================
# Copia y pega estos comandos en Git Bash (NO PowerShell)
# ================================================================

# PASO 1: LIMPIEZA EN EL VPS
# ----------------------------------------------------------------
ssh root@149.50.148.187 << 'EOF'
cd /root
echo "Deteniendo TaskFlow..."
docker compose -p taskflow down || true

echo "Eliminando contenedores huerfanos..."
docker container prune -f

echo "Eliminando imagenes antiguas de TaskFlow..."
docker images | grep taskflow | awk '{print $3}' | xargs -r docker rmi -f || true

echo "Eliminando archivos .tar antiguos..."
rm -f /root/taskflow-*.tar
rm -f /root/agente-*.tar

echo "Limpiando carpetas antiguas..."
rm -rf /root/agente || true

echo "Limpieza general de Docker..."
docker image prune -af
docker volume prune -f || true

echo "Espacio en disco:"
df -h / | grep -v Filesystem

echo "Limpieza completada!"
EOF


# PASO 2: SUBIR ARCHIVOS AL VPS
# ----------------------------------------------------------------
cd "c:\Users\liamf\Proyectos\TaskFlow-app"

scp backend/taskflow-backend-v516.tar root@149.50.148.187:/root/
scp taskflow-agente-v10.tar root@149.50.148.187:/root/
scp docker-compose.prod.yml root@149.50.148.187:/root/
scp .env root@149.50.148.187:/root/
scp -r agente root@149.50.148.187:/root/


# PASO 3: DEPLOYMENT
# ----------------------------------------------------------------
ssh root@149.50.148.187 << 'EOF'
cd /root

echo "Cargando imagen Backend v5.16..."
docker load -i taskflow-backend-v516.tar

echo "Cargando imagen Agente v1.0..."
docker load -i taskflow-agente-v10.tar

echo "Verificando imagenes:"
docker images | grep taskflow

echo "Desplegando TaskFlow v5.16..."
docker compose -p taskflow -f docker-compose.prod.yml up -d --build

echo "Esperando inicializacion..."
sleep 15

echo "Estado de servicios:"
docker compose -p taskflow ps

echo "Deployment completado!"
EOF


# PASO 4: VERIFICACIÓN
# ----------------------------------------------------------------
ssh root@149.50.148.187 << 'EOF'
echo "Health check del agente:"
docker exec taskflow-backend curl -s http://agente:8000/health

echo ""
echo "Logs del agente (ultimas 20 lineas):"
docker compose -p taskflow logs agente --tail 20
EOF


# ================================================================
# URLs FINALES
# ================================================================
# Frontend: https://victorpetruccio.online
# Backend:  https://backend.vps-5505344-x.dattaweb.com
# ================================================================
