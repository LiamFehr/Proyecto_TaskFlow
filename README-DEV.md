# TaskFlow - Guía de Desarrollo

## 📁 Estructura de Archivos de Configuración

Este proyecto mantiene **configuraciones separadas** para desarrollo y producción:

### Archivos de Desarrollo (NO se despliegan)
- **`.env.dev`** - Variables de entorno para desarrollo local
- **`docker-compose.dev.yml`** - Configuración Docker para desarrollo
- Estos archivos usan:
  - Credenciales simples (`postgres/password`)
  - URLs locales (`localhost:8081`, `localhost:5173`)
  - Base de datos `taskflow_dev`
  - Puertos locales (8081, 5173, 8001)
  - Hot-reload habilitado para el agente

### Archivos de Producción (NO modificar)
- **`.env`** - Variables de entorno de producción (VPS)
- **`docker-compose.prod.yml`** - Configuración Docker para producción
- Estos archivos contienen:
  - Credenciales seguras de producción
  - URLs del VPS (victorpetruccio.online)
  - Base de datos `taskflow` en producción
  - Configuraciones optimizadas

---

## 🚀 Comandos de Desarrollo

### Iniciar el entorno de desarrollo
```bash
# Usando el archivo .env.dev
docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
```

### Ver logs de desarrollo
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

### Detener el entorno de desarrollo
```bash
docker-compose -f docker-compose.dev.yml down
```

### Reconstruir contenedores de desarrollo
```bash
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

### Acceder a la base de datos de desarrollo
```bash
docker exec -it taskflow-postgres-dev psql -U postgres -d taskflow_dev
```

---

## 🌐 URLs de Desarrollo

Cuando ejecutes el entorno de desarrollo, podrás acceder a:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8081
- **AI Agent**: http://localhost:8001
- **PostgreSQL**: localhost:5433 (puerto externo)
- **Redis**: localhost:6379

---

## 📝 Notas Importantes

1. **NUNCA modifiques `.env` o `docker-compose.prod.yml`** - Estos están en uso en producción
2. **Trabaja siempre con `.env.dev` y `docker-compose.dev.yml`** para desarrollo
3. Los volúmenes de desarrollo usan sufijo `_dev` para no interferir con datos de producción
4. Los contenedores de desarrollo tienen sufijo `-dev` en sus nombres
5. El agente en desarrollo está configurado con `--reload` para hot-reloading

---

## 🔄 Workflow de Desarrollo

1. **Desarrolla localmente**: Usa `docker-compose.dev.yml` con `.env.dev`
2. **Prueba tus cambios**: Verifica que todo funcione en tu máquina
3. **Commitea el código**: Sube solo los cambios de código, NO los archivos de configuración
4. **Deploy a producción**: Usa las instrucciones en `DEPLOY_INSTRUCTIONS.md`

---

## ⚠️ Seguridad

- **.env.dev** puede contener claves simples o de prueba
- **.env** contiene credenciales reales - NUNCA lo compartas ni lo subas a Git
- Ambos archivos están en `.gitignore`
