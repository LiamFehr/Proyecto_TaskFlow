$ErrorActionPreference = "Stop"

# Configuración
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$SCP_EXE = "C:\Program Files\Git\usr\bin\scp.exe"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

Write-Host ">> DOWNGRADING TO HTTP/1.1 (Stability Fix)..."

# 1. Upload new config
Write-Host "1. Uploading stable nginx.conf (No HTTP/2)..."
& $SCP_EXE $SSH_OPTS nginx/nginx-hard-reset.conf "${VPS_USER}@${VPS_IP}:/etc/nginx/nginx.conf"

# 2. Restart Nginx
Write-Host "2. Restarting Nginx..."
$remoteScript = @"
echo "--- TESTING CONFIG ---"
nginx -t
if [ \$? -eq 0 ]; then
    echo "--- RELOADING NGINX ---"
    systemctl restart nginx
    systemctl status nginx --no-pager
else
    echo "!!! CONFIG ERROR STILL EXISTS !!!"
fi
"@ -replace "`r", ""

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript

Write-Host "DONE. Site should load without protocol errors."
