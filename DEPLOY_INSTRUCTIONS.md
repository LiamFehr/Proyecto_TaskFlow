# TaskFlow v5.16 - Deployment Instructions
Fecha: 2026-01-15T14:45:00-03:00
Versión: Backend v5.16 | Agente v1.0 | Frontend v5.15

## ESTADO: ✅ Archivos Verificados y Listos

### Archivos Verificados:
- [OK] Backend v5.16: 294.2 MB (taskflow-backend-v516.tar)
- [OK] Agente v1.0: 130.36 MB (taskflow-agente-v10.tar)  
- [OK] Docker Compose (docker-compose.prod.yml)
- [OK] Environment file (.env)
- [OK] Agente Dockerfile
- [OK] Agente requirements.txt

### Imágenes Docker Locales:
- [OK] taskflow-app-backend:v5.16
- [OK] taskflow-agente:v1.0
- [OK] taskflow-app-frontend:v5.15

---

## PASO 1: Subir Archivos al VPS

### OPCIÓN A: WinSCP (Más Fácil - Recomendado)

1. **Descargar WinSCP**:
   - https://winscp.net/download/WinSCP-6.3.1-Setup.exe

2. **Conectar al VPS**:
   - Protocol: SFTP
   - Host: 149.50.148.187
   - Port: 22
   - Username: root
   - Password: VHP%LiamServidor14

3. **Subir estos archivos** (arrastrar y soltar a `/root/`):
   ```
   c:\Users\liamf\Proyectos\TaskFlow-app\backend\taskflow-backend-v516.tar
   c:\Users\liamf\Proyectos\TaskFlow-app\taskflow-agente-v10.tar
   c:\Users\liamf\Proyectos\TaskFlow-app\docker-compose.prod.yml
   c:\Users\liamf\Proyectos\TaskFlow-app\.env
   c:\Users\liamf\Proyectos\TaskFlow-app\agente (carpeta completa)
   ```

### OPCIÓN B: PuTTY + PSCP (Línea de Comandos)

1. **Descargar PuTTY**:
   - https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html
   - Instalar y añadir al PATH

2. **Ejecutar en PowerShell**:
   ```powershell
   # Backend
   pscp -pw "VHP%LiamServidor14" "c:\Users\liamf\Proyectos\TaskFlow-app\backend\taskflow-backend-v516.tar" root@149.50.148.187:/root/

   # Agente
   pscp -pw "VHP%LiamServidor14" "c:\Users\liamf\Proyectos\TaskFlow-app\taskflow-agente-v10.tar" root@149.50.148.187:/root/

   # Docker Compose
   pscp -pw "VHP%LiamServidor14" "c:\Users\liamf\Proyectos\TaskFlow-app\docker-compose.prod.yml" root@149.50.148.187:/root/

   # .env
   pscp -pw "VHP%LiamServidor14" "c:\Users\liamf\Proyectos\TaskFlow-app\.env" root@149.50.148.187:/root/

   # Agente (carpeta)
   pscp -r -pw "VHP%LiamServidor14" "c:\Users\liamf\Proyectos\TaskFlow-app\agente" root@149.50.148.187:/root/
   ```

### OPCIÓN C: WSL (Si tienes Windows Subsystem for Linux)

```bash
scp /mnt/c/Users/liamf/Proyectos/TaskFlow-app/backend/taskflow-backend-v516.tar root@149.50.148.187:/root/
scp /mnt/c/Users/liamf/Proyectos/TaskFlow-app/taskflow-agente-v10.tar root@149.50.148.187:/root/
scp /mnt/c/Users/liamf/Proyectos/TaskFlow-app/docker-compose.prod.yml root@149.50.148.187:/root/
scp /mnt/c/Users/liamf/Proyectos/TaskFlow-app/.env root@149.50.148.187:/root/
scp -r /mnt/c/Users/liamf/Proyectos/TaskFlow-app/agente root@149.50.148.187:/root/
```

---

## PASO 2: Deployment en el VPS

1. **Conectar al VPS**:
   ```bash
   ssh root@149.50.148.187
   # Password: VHP%LiamServidor14
   ```

2. **Ejecutar deployment**:
   ```bash
   cd /root

   # Cargar imágenes Docker
   docker load -i taskflow-backend-v516.tar
   docker load -i taskflow-agente-v10.tar

   # Verificar que se cargaron
   docker images | grep taskflow

   # Parar stack actual
   docker compose -p taskflow down

   # Limpiar imágenes antiguas (opcional)
   docker image prune -af

   # Deploy nuevo stack
   docker compose -p taskflow -f docker-compose.prod.yml up -d --build

   # Ver logs en tiempo real
   docker compose -p taskflow logs -f
   ```

---

## PASO 3: Verificación Post-Deployment

### Health Checks:

```bash
# Health check del agente (desde dentro del backend)
docker exec taskflow-backend curl -s http://agente:8000/health

# Estado de todos los servicios
docker compose -p taskflow ps

# Logs individuales
docker compose -p taskflow logs backend --tail 50
docker compose -p taskflow logs agente --tail 50
docker compose -p taskflow logs postgres --tail 20
docker compose -p taskflow logs redis --tail 20
```

### Verificar en el Navegador:

1. **Frontend**: https://victorpetruccio.online
   - Hard Refresh: Ctrl + Shift + R
   
2. **Backend API**: https://backend.vps-5505344-x.dattaweb.com/swagger-ui.html

3. **Probar el Chat del Agente**:
   - Abrir TaskFlow → Click en icono del agente
   - Enviar mensaje de prueba

---

## COMANDOS ÚTILES PARA DEBUGGING

```bash
# Ver estado de servicios
docker compose -p taskflow ps

# Ver logs en tiempo real
docker compose -p taskflow logs -f

# Logs específicos de un servicio
docker compose -p taskflow logs agente -f
docker compose -p taskflow logs backend -f

# Reiniciar un servicio
docker compose -p taskflow restart agente
docker compose -p taskflow restart backend

# Ver uso de recursos
docker stats

# Inspeccionar red
docker network inspect taskflow_taskflow-network

# Acceder a un contenedor
docker exec -it taskflow-backend /bin/bash
docker exec -it taskflow-agente /bin/bash

# Ver variables de entorno
docker exec taskflow-agente env | grep GROQ
docker exec taskflow-backend env | grep AI_AGENT
```

---

## ROLLBACK (Si algo falla)

```bash
cd /root

# Parar todo
docker compose -p taskflow down

# Volver a versión anterior
sed -i 's/v5.16/v5.14/g' docker-compose.prod.yml

# Comentar servicio agente (opcional)
nano docker-compose.prod.yml
# Comentar líneas 29-49 (servicio agente)

# Levantar versión anterior
docker compose -p taskflow up -d

# Verificar
docker compose -p taskflow ps
```

---

## ARQUITECTURA DEPLOYADA

```
Internet
   ↓
CloudPanel Nginx (149.50.148.187:443)
   ↓
   ├── victorpetruccio.online → taskflow-frontend:80 (v5.15)
   └── backend.vps-*.dattaweb.com → taskflow-backend:8080 (v5.16)
                                        ↓
                                     Red Interna Docker
                                        ↓
                                     taskflow-agente:8000 (v1.0)
                                        ↑
                                     GROQ API (LLM)
```

### Servicios Desplegados:

1. **taskflow-postgres** - PostgreSQL 16
2. **taskflow-redis** - Redis 7
3. **taskflow-agente** - Python/FastAPI (v1.0) ← **NUEVO**
4. **taskflow-backend** - Java/Spring Boot (v5.16)
5. **taskflow-frontend** - React/Nginx (v5.15)

### Volúmenes Persistentes:

- `postgres_data` - Base de datos
- `redis_data` - Cache Redis
- `agente_uploads` - Archivos subidos al agente

---

## URLs FINALES

- **Frontend**: https://victorpetruccio.online
- **Backend**: https://backend.vps-5505344-x.dattaweb.com
- **Agente**: http://agente:8000 (solo red interna)

---

## GENERADO

- **Fecha**: 2026-01-15T14:45:00-03:00
- **Versión**: v5.16 (Backend) + v5.15 (Frontend) + v1.0 (Agente)
- **Estado**: ✅ Listo para deployment
