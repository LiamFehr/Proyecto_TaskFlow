$ErrorActionPreference = "Stop"

# Configuración
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$VPS_PATH = "/root/taskflow-v520"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

Write-Host ">> RESTARTING SERVICES (502 Fix - Corrected Path)..."

$remoteScript = @"
echo "--- STOPPING SERVICES ---"
# Stop by name if running
docker stop taskflow-backend taskflow-agente taskflow-frontend || true
docker rm taskflow-backend taskflow-agente taskflow-frontend || true

echo "--- STARTING SERVICES ---"
cd $VPS_PATH
# Confirm we are in the right place
ls -la docker-compose.yml

echo "Recreating Backend..."
docker compose up -d --force-recreate backend
sleep 10

echo "Recreating Agent..."
docker compose up -d --force-recreate agente
sleep 5

echo "Recreating Frontend..."
docker compose up -d --force-recreate frontend

echo "--- VERIFICATION ---"
docker ps
echo "Port 8000 (Backend):"
netstat -plnt | grep 8000
echo "Port 3000 (Frontend):"
netstat -plnt | grep 3000

echo "--- BACKEND LOGS ---"
docker logs --tail 20 taskflow-backend
"@ -replace "`r", ""

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript

Write-Host "DONE."
