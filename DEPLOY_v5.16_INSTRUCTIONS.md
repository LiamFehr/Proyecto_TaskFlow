# 🚀 TaskFlow v5.16 - Deployment Instructions

**Fecha:** 2026-01-15  
**Versión:** v5.16 (Backend) + v5.15 (Frontend) + v1.0 (Agente)  
**Estado:** Listo para deploy - Builds completados

---

## 📊 RESUMEN DE CAMBIOS

### **Problema Original**
- Chat del agente fallaba con `ERR_INCOMPLETE_CHUNKED_ENCODING`
- Arquitectura compleja: Browser → CloudPanel Nginx → Docker Nginx → Backend Java → Agente Python (externo)
- Muchas capas de proxy causaban timeouts
- Agente muy pesado (~9GB con TTS/ML)

### **Solución Implementada**
1. ✅ **Purga del Agente**: Eliminado TTS/Audio/n8n (reducido de ~9GB a ~500MB)
2. ✅ **Integración como Microservicio**: Agente ahora dentro de `docker-compose.prod.yml`
3. ✅ **Red Interna**: Backend → Agente directo (sin CloudPanel en el medio)
4. ✅ **Optimización**: Solo chat + LLM + TaskFlow integration

---

## 🗂️ ESTRUCTURA ACTUAL

```
TaskFlow-app/
├── agente/                    ← NUEVO (Agente optimizado)
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── integrations/
│   │   └── main.py           (Actualizado - sin TTS)
│   ├── Dockerfile
│   ├── requirements.txt       (Solo 12 packages)
│   ├── .env                   (Configurado con GROQ_API_KEY)
│   └── .dockerignore
├── backend/
│   └── taskflow-backend-v516.tar  ← Build listo
├── frontend/
│   └── (usa v5.15 existente)
├── docker-compose.prod.yml    ← ACTUALIZADO
├── .env                       ← ACTUALIZADO
└── taskflow-agente-v10.tar    ← Build listo
```

---

## 📋 PRÓXIMOS PASOS

### **Paso 1: Empaquetar y Subir al VPS**

```powershell
# En tu PC (Windows PowerShell)
cd c:\Users\liamf\Proyectos\TaskFlow-app

# 1. Empaquetar agente (si no completó)
docker save -o taskflow-agente-v10.tar taskflow-agente:v1.0

# 2. Subir backend v5.16
scp -o StrictHostKeyChecking=no backend/taskflow-backend-v516.tar root@149.50.148.187:/root/

# 3. Subir agente v1.0
scp -o StrictHostKeyChecking=no taskflow-agente-v10.tar root@149.50.148.187:/root/

# 4. Subir configuración
scp -o StrictHostKeyChecking=no docker-compose.prod.yml .env root@149.50.148.187:/root/

# 5. Subir carpeta del agente completa
scp -r -o StrictHostKeyChecking=no agente root@149.50.148.187:/root/
```

**Contraseña:** `VHP%LiamServidor14`

---

### **Paso 2: Deploy en VPS**

```bash
# SSH al servidor
ssh root@149.50.148.187

# Cargar imágenes
docker load -i taskflow-backend-v516.tar
docker load -i taskflow-agente-v10.tar

# Parar stack actual
docker compose -p taskflow down

# Limpiar imágenes antiguas (opcional)
docker image prune -af

# Deploy completo
docker compose -p taskflow -f docker-compose.prod.yml up -d --build

# Verificar logs
docker compose -p taskflow logs -f
```

---

## ✅ VERIFICACIÓN POST-DEPLOY

```bash
# 1. Health check del agente
curl http://localhost:8000/health

# 2. Logs del backend
docker compose -p taskflow logs backend | grep "Started Application"

# 3. Logs del agente
docker compose -p taskflow logs agente | head -50

# 4. Test desde navegador
# https://victorpetruccio.online → Hard Refresh (Ctrl+Shift+R) → Abrir chat
```

---

## 🔧 ARCHIVOS CLAVE MODIFICADOS

### **docker-compose.prod.yml** - Añadido servicio agente
```yaml
agente:
  build:
    context: ./agente
    dockerfile: Dockerfile
  image: taskflow-agente:v1.0
  container_name: taskflow-agente
  environment:
    - TASKFLOW_API_URL=http://backend:8080/api
    - GROQ_API_KEY=${GROQ_API_KEY}
  networks:
    - taskflow-network
```

### **.env** - Añadido GROQ_API_KEY
```bash
AI_AGENT_URL=http://agente:8000
GROQ_API_KEY=${GROQ_API_KEY}
```

### **agente/requirements.txt** - Simplificado
```
fastapi>=0.109.0
uvicorn>=0.27.0
python-dotenv>=1.0.1
groq>=0.4.0
httpx>=0.26.0
pydantic>=2.6.0
python-multipart
pandas
openpyxl
xlrd>=2.0.1
pdfplumber>=0.10.0
cachetools
```

---

## 🚨 ROLLBACK (Si falla)

```bash
docker compose -p taskflow down
sed -i 's/v5.16/v5.14/g' docker-compose.prod.yml
# Comentar servicio agente (líneas 29-49)
docker compose -p taskflow up -d
```

---

## 📞 DEBUGGING

```bash
# Ver todos los servicios
docker compose -p taskflow ps

# Logs específicos
docker compose -p taskflow logs --tail 100 agente
docker compose -p taskflow logs --tail 100 backend

# Test conectividad Backend-Agente
docker exec taskflow-backend curl http://agente:8000/health
```

---

**Generado:** 2026-01-15  
**Estado:** ✅ Builds completados, listo para deploy  
**Versiones:** Backend v5.16 | Frontend v5.15 | Agente v1.0
