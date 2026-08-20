$ErrorActionPreference = "Stop"
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

Write-Host ">> DEPLOYING RESPONSIVE UI UPDATE (v5.20-mobile)..."

$SCP_EXE = "C:\Program Files\Git\usr\bin\scp.exe"

# 1. Build Frontend
Write-Host "1. Building Frontend..."
docker build -t taskflow-app-frontend:v5.20-mobile ./frontend

# 2. Save Image
Write-Host "2. Saving Frontend Image..."
docker save taskflow-app-frontend:v5.20-mobile -o taskflow-frontend-mobile.tar

# 3. Upload
Write-Host "3. Uploading Update..."
& $SCP_EXE $SSH_OPTS taskflow-frontend-mobile.tar "${VPS_USER}@${VPS_IP}:/root/taskflow-v520/"

# 4. Deploy on VPS
Write-Host "4. Deploying on VPS..."
$remoteScript = @"
cd /root/taskflow-v520
echo "--- LOADING IMAGE ---"
docker load -i taskflow-frontend-mobile.tar

echo "--- UPDATING FRONTEND SERVICE ---"
# Update docker-compose to use the new image tag if needed, or just force recreate
# For this hotfix, we can just retag it as v5.20 to match docker-compose or update the compose file.
# Let's retag to override v5.20 for simplicity in this session, avoiding compose file edits.
docker tag taskflow-app-frontend:v5.20-mobile taskflow-app-frontend:v5.20

echo "--- RECREATING CONTAINER ---"
docker-compose -f docker-compose.prod.yml up -d --no-deps --force-recreate frontend

echo "--- CLEANUP ---"
rm taskflow-frontend-mobile.tar
echo "DEPLOYMENT COMPLETE."
"@

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript
Write-Host "DONE."
