$ErrorActionPreference = "Stop"
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

$remoteScript = @"
echo "=== ALL CONTAINERS ==="
docker ps -a

echo "`n=== NETWORK STATUS ==="
docker network inspect taskflow-network || echo "Network not found"

echo "`n=== FRONTEND LOGS Last 50 lines ==="
docker logs --tail 50 taskflow-frontend

echo "`n=== NGINX CONFIG TEST (Inside Container) ==="
docker exec taskflow-frontend nginx -t 2>&1 || echo "Container not running, cannot test config"
"@ -replace "`r", ""

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript
