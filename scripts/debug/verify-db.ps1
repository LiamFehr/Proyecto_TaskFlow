$ErrorActionPreference = "Stop"

# Configuración
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

Write-Host ">> VERIFICANDO TABLA PEDIDOS..."

$remoteScript = @"
echo "--- DESCRIBE PEDIDOS ---"
docker exec taskflow-postgres psql -U taskflow_user -d taskflow -c \"SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='pedidos';\"
"@ -replace "`r", ""

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript
