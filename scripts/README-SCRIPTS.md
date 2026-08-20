# 🔄 Scripts de Cambio Rápido - Dev/Prod

Este directorio contiene scripts para cambiar rápidamente entre configuraciones de **desarrollo** y **producción**.

---

## 📁 Scripts Disponibles

### 1. **`switch-to-dev.ps1`** - Cambiar a Desarrollo
Configura el entorno para desarrollo local:
- ✅ Respaldo de `.env` actual
- ✅ Copia `.env.dev` a `.env`
- ✅ Instrucciones para usar `docker-compose.dev.yml`

**Uso:**
```powershell
.\scripts\switch-to-dev.ps1
```

### 2. **`switch-to-prod.ps1`** - Cambiar a Producción
Restaura configuración de producción:
- ✅ Restaura `.env` original desde backup
- ✅ Instrucciones para usar `docker-compose.prod.yml`

**Uso:**
```powershell
.\scripts\switch-to-prod.ps1
```

---

## 🚀 Workflow Recomendado

### Desarrollo Local
```powershell
# 1. Cambiar a modo desarrollo
.\scripts\switch-to-dev.ps1

# 2. Iniciar contenedores de desarrollo
docker-compose -f docker-compose.dev.yml up -d

# 3. Desarrollar y probar
# Frontend: http://localhost:5173
# Backend:  http://localhost:8081
# Agente:   http://localhost:8001

# 4. Cuando termines
docker-compose -f docker-compose.dev.yml down
```

### Deploy a Producción
```powershell
# 1. Cambiar a modo producción
.\scripts\switch-to-prod.ps1

# 2. Seguir instrucciones en DEPLOY_INSTRUCTIONS.md
# - Build de imágenes
# - Push al VPS
# - Deploy con docker-compose.prod.yml
```

---

## ⚠️ Notas Importantes

1. **NUNCA** ejecutes `switch-to-dev.ps1` en el VPS de producción
2. Los scripts crean backups automáticos de `.env` para seguridad
3. Siempre verifica qué archivo `.env` está activo antes de ejecutar comandos
4. Los archivos `.env.dev` y `.env.prod.backup` están en `.gitignore`

---

## 🔍 Verificar Configuración Actual

Para ver qué configuración está activa:
```powershell
# Ver primeras líneas de .env
Get-Content .env | Select-Object -First 5
```

Si dice `SPRING_PROFILES_ACTIVE=dev` → Estás en **desarrollo**  
Si dice `SPRING_PROFILES_ACTIVE=prod` → Estás en **producción**
