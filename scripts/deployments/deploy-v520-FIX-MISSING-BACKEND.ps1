$ErrorActionPreference = "Stop"

# Configuración
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$VPS_PATH = "/root/taskflow-v520"
$SCP_EXE = "C:\Program Files\Git\usr\bin\scp.exe"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

Write-Host ">> RESTORING MISSING BACKEND (v5.20)..."

# 1. BUILD & SAVE
Write-Host "1. Building Backend Image..."
docker build -t taskflow-app-backend:v5.20 -f backend/Dockerfile.prebuilt backend
docker save taskflow-app-backend:v5.20 -o backend-v520-rescue.tar

# 2. UPLOAD
Write-Host "2. Uploading Rescue Image..."
& $SCP_EXE $SSH_OPTS backend-v520-rescue.tar "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend-v520-rescue.tar"

# 3. LOAD & RESTART
Write-Host "3. Loading and Restarting..."
$remoteScript = @"
cd $VPS_PATH
echo "--- LOADING IMAGE ---"
docker load -i backend-v520-rescue.tar

echo "--- RESTARTING BACKEND ---"
docker compose up -d --force-recreate backend

echo "--- CHECKING LOGS ---"
sleep 5
docker logs --tail 20 taskflow-backend
"@ -replace "`r", ""

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript

Write-Host "DONE."
