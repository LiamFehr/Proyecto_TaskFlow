$ErrorActionPreference = "Stop"

# Configuración
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$VPS_PATH = "/root/taskflow-v520"
$SCP_EXE = "C:\Program Files\Git\usr\bin\scp.exe"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

Write-Host ">> FIXING AGENT PORT MAPPING (8001)..."

# 1. Upload new docker-compose.yml
# Need to construct it from local .prod.yml being applied to .reset.yml or directly uploading
# Since we are using .prod.yml as source for the reset script steps, I will update local .prod.yml (done)
# and then upload it directly to replace docker-compose.yml on server.

Write-Host "1. Uploading fixed docker-compose.yml..."
& $SCP_EXE $SSH_OPTS docker-compose.prod.yml "${VPS_USER}@${VPS_IP}:${VPS_PATH}/docker-compose.yml"

# 2. Restart Agent
Write-Host "2. Recreating Agent with Port Mapping..."
$remoteScript = @"
cd $VPS_PATH
# Verify content
grep -C 2 "8001:8001" docker-compose.yml || echo "WARNING: Port mapping not found in file!"

echo "--- RECREATING AGENT ---"
docker compose up -d --force-recreate agente

echo "--- VERIFYING PORT 8001 ---"
sleep 3
netstat -plnt | grep 8001
"@ -replace "`r", ""

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript

Write-Host "DONE."
