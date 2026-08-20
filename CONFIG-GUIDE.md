# 🔀 Guía de Configuración Dev/Prod - TaskFlow

## 📦 Resumen de Archivos

Para facilitar el desarrollo local y el deploy en producción, se crearon **configuraciones paralelas** que puedes intercambiar rápidamente.

### ✅ Archivos CREADOS (para desarrollo)
| Archivo | Descripción |
|---------|-------------|
| `.env.dev` | Variables de entorno para localhost |
| `docker-compose.dev.yml` | Docker Compose para desarrollo local |
| `scripts/switch-to-dev.ps1` | Script de cambio rápido a DEV |
| `scripts/switch-to-prod.ps1` | Script de cambio rápido a PROD |

### 🔒 Archivos EXISTENTES (producción - NO tocar)
| Archivo | Descripción |
|---------|-------------|
| `.env` | Variables de entorno de PRODUCCIÓN (VPS) |
| `docker-compose.prod.yml` | Docker Compose de PRODUCCIÓN |
| `nginx/nginx.conf` | Nginx con SSL (producción) |
| `frontend/nginx.conf` | Nginx interno del frontend |

---

## 🚀 Uso Rápido

### Trabajar en Desarrollo Local

```powershell
# 1. Cambiar a configuración de desarrollo
.\scripts\switch-to-dev.ps1

# 2. Levantar contenedores de desarrollo
docker-compose -f docker-compose.dev.yml up -d

# 3. Acceder a:
# - Frontend: http://localhost:5173
# - Backend:  http://localhost:8081
# - Agente:   http://localhost:8001

# 4. Cuando termines
docker-compose -f docker-compose.dev.yml down
```

### Deploy a Producción

```powershell
# 1. Cambiar a configuración de producción
.\scripts\switch-to-prod.ps1

# 2. Seguir DEPLOY_INSTRUCTIONS.md
# - Build de imágenes
# - Tag con versión
# - Push al VPS
# - Deploy
```

---

## 🎯 Diferencias Clave

| Aspecto | Desarrollo (`.env.dev`) | Producción (`.env`) |
|---------|-------------------------|---------------------|
| **URLs** | localhost | victorpetruccio.online |
| **Puertos** | 8081, 5173, 8001 | 8000, 3000, 8001 |
| **Base de Datos** | `taskflow_dev` | `taskflow` |
| **Credenciales** | postgres/password | Credenciales seguras |
| **Perfil Spring** | `dev` | `prod` |
| **SSL** | No | Sí (nginx) |

---

## ⚡ Scripts de Cambio Rápido

### `switch-to-dev.ps1`
- ✅ Hace backup de `.env` actual → `.env.prod.backup`
- ✅ Copia `.env.dev` → `.env`
- ✅ Muestra instrucciones para iniciar desarrollo

### `switch-to-prod.ps1`
- ✅ Restaura `.env` desde `.env.prod.backup`
- ✅ Limpia archivo temporal
- ✅ Muestra instrucciones para deploy

---

## 📋 Checklist Antes de Deploy

Antes de hacer deploy a producción, asegúrate de:

- [ ] Ejecutar `.\scripts\switch-to-prod.ps1`
- [ ] Verificar que `.env` tiene `SPRING_PROFILES_ACTIVE=prod`
- [ ] Verificar credenciales de producción en `.env`
- [ ] Hacer build de las imágenes con tag de versión
- [ ] Seguir `DEPLOY_INSTRUCTIONS.md`

---

## 🔍 Verificar Configuración Actual

```powershell
# Ver qué configuración está activa
Get-Content .env | Select-Object -First 1

# Si muestra "SPRING_PROFILES_ACTIVE=dev" → Desarrollo
# Si muestra "SPRING_PROFILES_ACTIVE=prod" → Producción
```

---

## 📚 Documentación Adicional

- **Desarrollo**: Ver `README-DEV.md`
- **Deploy**: Ver `DEPLOY_INSTRUCTIONS.md`
- **Scripts**: Ver `scripts/README-SCRIPTS.md`

---

## ⚠️ IMPORTANTE

1. **NUNCA** ejecutes `switch-to-dev.ps1` en el VPS de producción
2. **NUNCA** subas `.env` o `.env.dev` a Git (están en `.gitignore`)
3. **SIEMPRE** verifica la configuración antes de ejecutar docker-compose
4. Los archivos de producción (`.env`, `docker-compose.prod.yml`) **NO se deben modificar** en desarrollo
