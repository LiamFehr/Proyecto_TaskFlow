$ErrorActionPreference = "Stop"

# Configuración
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$VPS_PATH = "/root/taskflow-v518"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

Write-Host ">> DIAGNOSTICO DE BACKEND..."

$remoteScript = @"
echo "--- CONTAINERS ACTIVES ---"
docker ps

echo "--- LOGS BACKEND Last 200 ---"
docker logs taskflow-backend --tail 200

echo "--- LOGS FRONTEND nginx ---"
docker logs taskflow-frontend --tail 20
"@ -replace "`r", ""

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript
