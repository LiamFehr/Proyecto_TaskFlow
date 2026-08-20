$ErrorActionPreference = "Stop"

# Configuración
$VPS_USER = "root"
$VPS_IP = "149.50.148.187"
$VPS_PATH = "/root/taskflow-v520"
$SSH_EXE = "C:\Program Files\Git\usr\bin\ssh.exe"
$SCP_EXE = "C:\Program Files\Git\usr\bin\scp.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

Write-Host ">> HARD RESET PROTOCOL (v5.20) ..."
Write-Host ">> This will rebuild everything and replace Nginx configuration."

# 1. BUILD FRONTEND
Write-Host "1. Building Frontend (v5.20)..."
Set-Location frontend
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Frontend Build Failed"; exit 1 }
Set-Location ..

docker build -t taskflow-app-frontend:v5.20 -f frontend/Dockerfile.prebuilt frontend
docker save taskflow-app-frontend:v5.20 -o frontend-v520.tar

# 2. BUILD BACKEND
Write-Host "2. Building Backend (v5.20)..."
if (-not (Test-Path "backend/app.jar")) {
    Set-Location backend
    ./mvnw clean package -DskipTests
    $jar = Get-ChildItem "target/*.jar" | Select-Object -First 1
    Copy-Item $jar.FullName -Destination "app.jar" -Force
    Set-Location ..
}
docker build -t taskflow-app-backend:v5.20 -f backend/Dockerfile.prebuilt backend
docker save taskflow-app-backend:v5.20 -o backend-v520.tar

# 3. CONFIGURE DOCKER COMPOSE
Write-Host "3. Configuring Docker Compose..."
$composeContent = Get-Content "docker-compose.prod.yml"
# UPDATE IMAGES TO v5.20
$composeContent = $composeContent -replace "v5.19-fixed", "v5.20"
$composeContent = $composeContent -replace "v5.19", "v5.20"
# ENSURE PORTS ARE MAPED CORRECTLY (Backend Host:8000 -> Container:8080)
# (Assuming file is already correct from previous step, but let's be safe)
$composeContent | Set-Content "docker-compose.reset.yml"

# 4. PACKAGE
Write-Host "4. Packaging..."
$files = @("docker-compose.reset.yml", "backend-v520.tar", "frontend-v520.tar", ".env", "nginx/nginx-hard-reset.conf")
tar -cvf reset-pkg.tar $files

# 5. UPLOAD
Write-Host "5. Uploading Doomsday Package (~800MB)..."
& $SCP_EXE $SSH_OPTS reset-pkg.tar "${VPS_USER}@${VPS_IP}:/root/"

# 6. EXECUTE HARD RESET
Write-Host "6. Executing Remote Wipe & Deploy..."
$remoteScript = @"
echo ">>> STOPPING SERVICES <<<"
systemctl stop nginx || true
docker stop \$(docker ps -aq) || true
docker rm -f \$(docker ps -aq) || true
docker network prune -f
docker system prune -a -f --volumes

echo ">>> PREPARING NEW ENVIRONMENT <<<"
rm -rf $VPS_PATH
mkdir -p $VPS_PATH
tar -xvf /root/reset-pkg.tar -C $VPS_PATH

echo ">>> UPDATING NGINX CONFIG <<<"
cp $VPS_PATH/nginx/nginx-hard-reset.conf /etc/nginx/nginx.conf
# Ensure sites-enabled doesn't conflict
rm -f /etc/nginx/sites-enabled/default
systemctl start nginx
systemctl status nginx --no-pager

echo ">>> LOADING IMAGES <<<"
cd $VPS_PATH
docker load -i backend-v520.tar
docker load -i frontend-v520.tar

echo ">>> STARTING DOCKER <<<"
mv docker-compose.reset.yml docker-compose.yml
docker compose up -d

echo ">>> WAITING FOR HEALTH <<<"
sleep 15
docker ps
netstat -tulpn | grep 8000
"@ -replace "`r", ""

& $SSH_EXE $SSH_OPTS "${VPS_USER}@${VPS_IP}" $remoteScript

Write-Host "HARD RESET COMPLETE."
