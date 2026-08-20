$ErrorActionPreference = "Stop"
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$VPS_PATH = "/root/taskflow-v519"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

$remoteScript = @"
cd $VPS_PATH

echo "--- RESCUE START: Backend & Frontend ---"
docker stop taskflow-backend taskflow-frontend || true
docker rm taskflow-backend taskflow-frontend || true

# Bring up Backend first (No Deps to avoid Postgres conflict)
echo "--- Starting BACKEND ---"
docker compose -f docker-compose.prod.yml up -d --no-deps backend

echo "--- Starting FRONTEND ---"
docker compose -f docker-compose.prod.yml up -d --no-deps frontend

echo "--- CHECKING STATUS ---"
docker ps
"@ -replace "`r", ""

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript
