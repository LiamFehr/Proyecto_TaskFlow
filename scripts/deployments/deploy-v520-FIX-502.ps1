$ErrorActionPreference = "Stop"

# Configuración
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

Write-Host ">> RESTARTING SERVICES (Fixing 502)..."

$remoteScript = @"
echo "--- STOPPING SERVICES ---"
docker stop taskflow-backend taskflow-agente taskflow-frontend || true
docker rm taskflow-backend taskflow-agente taskflow-frontend || true

echo "--- STARTING BACKEND ---"
cd /root/taskflow
# Force recreation of backend
docker compose up -d --force-recreate backend
sleep 10

echo "--- STARTING AGENT ---"
docker compose up -d --force-recreate agente
sleep 5

echo "--- STARTING FRONTEND ---"
docker compose up -d --force-recreate frontend

echo "--- CHECKING PORTS ---"
netstat -plnt | grep -E '8000|8001|3000'

echo "--- BACKEND LOGS ---"
docker logs --tail 20 taskflow-backend
"@ -replace "`r", ""

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript

Write-Host "DONE."
