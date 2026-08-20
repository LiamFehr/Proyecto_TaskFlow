# TASKFLOW 2.0 - Guía de Configuración DEV/PROD

## 🔄 Configuración Dual (Desarrollo / Producción)

Este proyecto tiene configuraciones separadas para desarrollo y producción, permitiendo cambiar entre entornos fácilmente.

---

## 📁 Estructura de Archivos

```
TaskFlow-app/
├── .env.dev                    # Variables de entorno DESARROLLO
├── .env.prod                   # Variables de entorno PRODUCCIÓN
├── .env                        # Symlink/copia del activo (git-ignored)
├── docker-compose.dev.yml      # PostgreSQL + pgAdmin para DEV
├── docker-compose.prod.yml     # PostgreSQL para PROD
├── switch-to-dev.sh            # Script para cambiar a DEV
├── switch-to-prod.sh           # Script para cambiar a PROD
└── backend/
    └── src/main/resources/
        ├── application.properties              # Config base
        ├── application-development.properties  # Config DEV
        └── application-production.properties   # Config PROD
```

---

## 🚀 Inicio Rápido

### **Desarrollo (Primera Vez)**

```bash
# 1. Cambiar a entorno de desarrollo
./switch-to-dev.sh
# O manualmente:
cp .env.dev .env

# 2. Levantar PostgreSQL de desarrollo
docker-compose -f docker-compose.dev.yml up -d

# 3. Arrancar backend en modo desarrollo
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=development

# 4. Acceder a pgAdmin (opcional)
# http://localhost:5050
# Email: dev@taskflow.local
# Password: admin
```

### **Producción**

```bash
# 1. Configurar .env.prod con valores reales
# Editar .env.prod y cambiar passwords

# 2. Cambiar a entorno de producción
./switch-to-prod.sh
# O manualmente:
cp .env.prod .env

# 3. Levantar PostgreSQL de producción
docker-compose -f docker-compose.prod.yml up -d

# 4. Arrancar backend en modo producción
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=production
```

---

## ⚙️ Diferencias entre Entornos

| Aspecto | Desarrollo | Producción |
|---------|-----------|-----------|
| **Puerto DB** | 5433 | 5432 |
| **Base de Datos** | taskflow_dev | taskflow |
| **Usuario DB** | taskflow_dev | taskflow_user |
| **pgAdmin** | ✅ Habilitado (puerto 5050) | ❌ Deshabilitado |
| **SQL Logs** | ✅ Visible (show-sql=true) | ❌ Oculto |
| **Logging** | DEBUG | WARN/INFO |
| **Actuator** | Endpoints completos | Solo /health |
| **Datos** | `./db/dev/` | `./db/prod/` |

---

## 🔧 Comandos Útiles

### **Ver qué entorno está activo**

```bash
# Ver .env actual
cat .env | head -5

# Ver contenedores corriendo
docker ps
```

### **Cambiar de entorno**

```bash
# A desarrollo
./switch-to-dev.sh

# A producción
./switch-to-prod.sh
```

### **Gestionar base de datos**

```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml up -d      # Levantar
docker-compose -f docker-compose.dev.yml down       # Bajar
docker-compose -f docker-compose.dev.yml logs -f db # Ver logs

# Producción
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml logs -f db
```

### **Conectarse a PostgreSQL**

```bash
# Desarrollo
docker exec -it taskflow-postgres-dev psql -U taskflow_dev -d taskflow_dev

# Producción
docker exec -it taskflow-postgres-prod psql -U taskflow_user -d taskflow
```

---

## 📝 Variables de Entorno

### **.env.dev (Desarrollo)**
- Credenciales débiles OK (solo local)
- `TF_SHOW_SQL=true`
- Puerto DB: 5433 (no conflicto con otros proyectos)
- pgAdmin habilitado

### **.env.prod (Producción)**
- ⚠️ **Cambiar todas las passwords**
- `TF_SHOW_SQL=false`
- Puerto DB: 5432 (estándar)
- Sin pgAdmin

---

## 🛡️ Seguridad

### **IMPORTANTE para Producción:**

1. **Cambiar JWT_SECRET** en `.env.prod`:
   ```bash
   # Generar secret seguro
   openssl rand -base64 64
   ```

2. **Cambiar TF_DB_PASSWORD**:
   - Usar password fuerte (min 16 caracteres)

3. **NO versionar** `.env` ni `.env.prod` con credenciales reales:
   - Ya está en `.gitignore`

4. **Backups**:
   - Dev: `./backups/dev/`
   - Prod: `./backups/prod/`

---

## 🧪 Testing de Configuración

### **Validar que Flyway funcionó**

```sql
-- En desarrollo
docker exec -it taskflow-postgres-dev psql -U taskflow_dev -d taskflow_dev -c "SELECT * FROM flyway_schema_history;"

-- En producción
docker exec -it taskflow-postgres-prod psql -U taskflow_user -d taskflow -c "SELECT * FROM flyway_schema_history;"
```

### **Probar endpoint**

```bash
# Desarrollo (puerto 8000)
curl http://localhost:8000/api/v2/sales

# Producción (puerto 8000)
curl http://localhost:8000/api/v2/sales
```

---

## ❓ Troubleshooting

### **"Puerto 5432 ya en uso"**
- Estás en DEV, usá puerto 5433
- O hay otro PostgreSQL corriendo: `docker ps`

### **"Flyway no ejecuta migraciones"**
- Verificar `spring.flyway.enabled=true`
- Ver logs: `mvn spring-boot:run`

### **"No puedo conectarme a la DB"**
- Verificar contenedor corriendo: `docker ps`
- Verificar credenciales en `.env`
- Verificar puerto correcto (5433 dev / 5432 prod)

---

## 📚 Más Info

- Flyway migrations: `backend/src/main/resources/db/migration/`
- Documentación completa: `sprint1_implementation_summary.md`
