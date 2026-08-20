$ErrorActionPreference = "Stop"
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

Write-Host ">> CREATING STABLE BACKUP (v5.20)..."

# Using single quotes @' '@ to prevent PowerShell from interpreting $ variables
$remoteScript = @'
cd /root/taskflow-v520

echo "--- 1. DB BACKUP ---"
mkdir -p backups
# Format: backup_v520_stable_YYYYMMDD_HHMMSS.sql
BACKUP_FILE="backups/backup_v520_stable_$(date +%Y%m%d_%H%M%S).sql"
docker exec taskflow-postgres pg_dump -U taskflow -d taskflow_db > "$BACKUP_FILE"
echo "Database backed up to: $BACKUP_FILE"
ls -lh "$BACKUP_FILE"

echo "--- 2. TAGGING STABLE IMAGES ---"
# Tagging current running version as stable rollback point
docker tag taskflow-app-backend:v5.20 taskflow-app-backend:v5.20-stable
docker tag taskflow-app-frontend:v5.20 taskflow-app-frontend:v5.20-stable
echo "Images tagged with :v5.20-stable"

echo "--- BACKUP COMPLETE ---"
'@

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript
Write-Host "DONE."
