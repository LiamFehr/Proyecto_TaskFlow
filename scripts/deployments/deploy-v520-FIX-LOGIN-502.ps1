$ErrorActionPreference = "Stop"

# Configuración
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$VPS_PATH = "/root/taskflow-v520"
$SCP_EXE = "C:\Program Files\Git\usr\bin\scp.exe"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

Write-Host ">> FIXING 502 LOGIN (PORT 8000 ALIGNMENT)..."

# 1. Upload new docker-compose.yml
Write-Host "1. Uploading aligned docker-compose.yml..."
& $SCP_EXE $SSH_OPTS docker-compose.prod.yml "${VPS_USER}@${VPS_IP}:${VPS_PATH}/docker-compose.yml"

# 2. Force SERVER_PORT=8000 in .env and Restart
Write-Host "2. Enforcing Port 8000 and Restarting..."
$remoteScript = @"
cd $VPS_PATH

echo "--- UPDATING .ENV ---"
# Remove existing lines to avoid duplicates
sed -i '/SERVER_PORT/d' .env
# Append clean configuration
echo "SERVER_PORT=8000" >> .env
echo "TASKFLOW_API_PORT=8000" >> .env

echo "--- VERIFYING .ENV ---"
grep SERVER_PORT .env

echo "--- RECREATING BACKEND ---"
docker compose up -d --force-recreate backend

echo "--- WAITING FOR STARTUP ---"
sleep 10
docker logs --tail 20 taskflow-backend
"@ -replace "`r", ""

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript

Write-Host "DONE."
