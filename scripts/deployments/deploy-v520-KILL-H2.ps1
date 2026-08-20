$ErrorActionPreference = "Stop"

# Configuración
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$SCP_EXE = "C:\Program Files\Git\usr\bin\scp.exe"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

Write-Host ">> NUCLEAR NGINX RESTART (H2 KILL)..."

# 1. Upload new config
Write-Host "1. Uploading nginx.conf with 'http2 off;'..."
& $SCP_EXE $SSH_OPTS nginx/nginx-hard-reset.conf "${VPS_USER}@${VPS_IP}:/etc/nginx/nginx.conf"

# 2. Restart Nginx
Write-Host "2. Killing and Restarting Nginx..."
$remoteScript = @"
echo "--- KILLING OLD PROCESSES ---"
killall -9 nginx || true
systemctl stop nginx || true
sleep 2

echo "--- VALIDATING CONFIG ---"
nginx -t
if [ \$? -eq 0 ]; then
    echo "--- STARTING FRESH ---"
    systemctl start nginx
    sleep 2
    systemctl status nginx --no-pager
    
    echo "--- VERIFYING ALPN ---"
    echo | openssl s_client -connect 127.0.0.1:443 -alpn h2,http/1.1 2>&1 | grep ALPN
else
    echo "!!! CONFIG ERROR !!!"
fi
"@ -replace "`r", ""

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript

Write-Host "DONE."
