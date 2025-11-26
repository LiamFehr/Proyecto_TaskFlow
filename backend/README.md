# TaskFlow Backend - Documentación

## 📋 Descripción General

Backend RESTful API desarrollado con **Spring Boot 3.2.0** para la gestión de productos. Implementa arquitectura en capas (Controller → Service → Repository) con buenas prácticas de desarrollo, incluyendo DTOs, manejo global de excepciones, validaciones y documentación automática con Swagger.

---

## 🚀 Tecnologías Utilizadas

### Core Framework
- **Spring Boot 3.2.0** - Framework principal
- **Java 17** - Versión de Java
- **Maven** - Gestor de dependencias

### Spring Modules
- **Spring Web** - API REST
- **Spring Data JPA** - Persistencia de datos
- **Spring Security** - Seguridad y CORS
- **Spring Validation** - Validación de datos
- **Spring Actuator** - Monitoreo y métricas

### Base de Datos
- **PostgreSQL** - Base de datos relacional
- **Flyway** - Migraciones de base de datos

### Herramientas
- **Lombok** - Reducción de código boilerplate
- **MapStruct** - Mapeo Entity ↔ DTO
- **SpringDoc OpenAPI** - Documentación Swagger/OpenAPI

---

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/proyecto/
│   │   │   ├── Application.java              # Clase principal
│   │   │   ├── config/
│   │   │   │   └── SecurityConfig.java       # Configuración de seguridad y CORS
│   │   │   ├── controller/
│   │   │   │   └── ProductController.java    # Endpoints REST
│   │   │   ├── dto/
│   │   │   │   └── ProductDto.java           # Data Transfer Object
│   │   │   ├── entity/
│   │   │   │   └── Product.java              # Entidad JPA
│   │   │   ├── exception/
│   │   │   │   ├── ErrorResponse.java        # Estructura de respuesta de error
│   │   │   │   ├── GlobalExceptionHandler.java # Manejo global de excepciones
│   │   │   │   └── ProductNotFoundException.java # Excepción personalizada
│   │   │   ├── mapper/
│   │   │   │   └── ProductMapper.java        # Mapeo Entity ↔ DTO
│   │   │   ├── repository/
│   │   │   │   └── ProductRepository.java    # Acceso a datos
│   │   │   └── service/
│   │   │       ├── ProductService.java       # Interfaz de servicio
│   │   │       └── ProductServiceImpl.java   # Implementación de servicio
│   │   └── resources/
│   │       ├── application.properties         # Configuración principal
│   │       ├── application-dev.properties     # Configuración de desarrollo
│   │       └── application-prod.properties    # Configuración de producción
│   └── test/
├── pom.xml                                    # Dependencias Maven
└── README.md                                  # Este archivo
```

---

## ⚙️ Configuración

### Requisitos Previos
- Java 17 o superior
- PostgreSQL 12 o superior
- Maven 3.6 o superior

### Variables de Entorno (Producción)

Para el perfil de producción, configurar las siguientes variables de entorno:

```bash
DB_URL=jdbc:postgresql://localhost:5433/Taskflow
DB_USERNAME=postgres
DB_PASSWORD=tu_password_segura
```

### Configuración de Desarrollo

El archivo `application-dev.properties` ya está configurado con valores por defecto:

```properties
# Servidor
server.port=8000

# Base de Datos
spring.datasource.url=jdbc:postgresql://localhost:5433/Taskflow
spring.datasource.username=postgres
spring.datasource.password=liam
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

> ⚠️ **Nota**: El puerto por defecto es **8000** (no 8080)

---

## 🏃 Ejecución

### Desarrollo

```bash
# Opción 1: Con Maven Wrapper
./mvnw spring-boot:run

# Opción 2: Con Maven instalado
mvn spring-boot:run

# Opción 3: Compilar y ejecutar JAR
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Producción

```bash
# Establecer perfil de producción
export SPRING_PROFILES_ACTIVE=prod

# Configurar variables de entorno
export DB_URL=jdbc:postgresql://tu-host:5432/tu-database
export DB_USERNAME=tu-usuario
export DB_PASSWORD=tu-password

# Ejecutar
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

---

## 📡 API Endpoints

### Base URL
```
http://localhost:8000/api
```

### Productos

| Método | Endpoint | Descripción | Parámetros |
|--------|----------|-------------|------------|
| `GET` | `/api/products` | Obtener todos los productos (paginado) | `page`, `size`, `sort` |
| `GET` | `/api/products/{id}` | Obtener producto por ID | `id` (Long) |
| `GET` | `/api/products/search` | Buscar productos por texto | `q` (String), `page`, `size` |
| `GET` | `/api/products/code/{code}` | Buscar por código | `code` (String) |
| `GET` | `/api/products/barcode/{barcode}` | Buscar por código de barras | `barcode` (String) |

### Ejemplos de Uso

#### 1. Obtener todos los productos (paginado)
```bash
GET http://localhost:8000/api/products?page=0&size=20
```

**Respuesta:**
```json
{
  "content": [
    {
      "id": 1,
      "code": "PROD001",
      "barcode": "1234567890123",
      "description": "Producto de ejemplo",
      "price": 99.99,
      "hidden": false,
      "searchable": true
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 1,
  "totalPages": 1
}
```

#### 2. Buscar producto por ID
```bash
GET http://localhost:8000/api/products/1
```

**Respuesta:**
```json
{
  "id": 1,
  "code": "PROD001",
  "barcode": "1234567890123",
  "description": "Producto de ejemplo",
  "price": 99.99,
  "hidden": false,
  "searchable": true
}
```

#### 3. Buscar productos por texto
```bash
GET http://localhost:8000/api/products/search?q=ejemplo&page=0&size=10
```

#### 4. Buscar por código
```bash
GET http://localhost:8000/api/products/code/PROD001
```

#### 5. Buscar por código de barras
```bash
GET http://localhost:8000/api/products/barcode/1234567890123
```

---

## 📚 Documentación Swagger

La documentación interactiva de la API está disponible en:

```
http://localhost:8000/swagger-ui/index.html
```

También puedes acceder al JSON de OpenAPI en:

```
http://localhost:8000/v3/api-docs
```

---

## 🗄️ Modelo de Datos

### Entidad: Product

| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `id` | Long | Identificador único (auto-generado) | - |
| `code` | String | Código del producto (único) | - |
| `barcode` | String | Código de barras | - |
| `description` | String | Descripción del producto | `@NotBlank` |
| `price` | BigDecimal | Precio del producto | `@NotNull`, `@PositiveOrZero` |
| `hidden` | Boolean | Producto oculto | - |
| `searchable` | Boolean | Producto buscable | - |

**Tabla en base de datos:** `items_active` (schema: `public`)

---

## 🏗️ Arquitectura

### Patrón de Capas

```
┌─────────────────────────────────────┐
│         Controller Layer            │  ← REST Endpoints
│     (ProductController.java)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          Service Layer              │  ← Lógica de negocio
│  (ProductService + Implementation)  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│        Repository Layer             │  ← Acceso a datos
│     (ProductRepository.java)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          Database (PostgreSQL)      │
└─────────────────────────────────────┘
```

### Componentes Principales

#### 1. **Controller** (`ProductController.java`)
- Maneja las peticiones HTTP
- Valida parámetros de entrada
- Retorna respuestas HTTP con códigos de estado apropiados

#### 2. **Service** (`ProductService.java` + `ProductServiceImpl.java`)
- Contiene la lógica de negocio
- Orquesta operaciones entre repositorios
- Maneja transacciones

#### 3. **Repository** (`ProductRepository.java`)
- Extiende `JpaRepository`
- Proporciona métodos CRUD automáticos
- Define queries personalizadas

#### 4. **Entity** (`Product.java`)
- Mapea la tabla de base de datos
- Define validaciones a nivel de entidad
- Usa anotaciones JPA

#### 5. **DTO** (`ProductDto.java`)
- Objeto de transferencia de datos
- Desacopla la API de la estructura interna
- Evita exponer entidades directamente

#### 6. **Mapper** (`ProductMapper.java`)
- Convierte Entity ↔ DTO usando MapStruct
- Generación automática de código de mapeo

---

## 🔒 Seguridad

### Configuración Actual

- **CSRF**: Deshabilitado (apropiado para APIs REST)
- **CORS**: Habilitado para todos los orígenes (`*`)
- **Autenticación**: Deshabilitada para `/api/**` y Swagger
- **Métodos HTTP permitidos**: GET, POST, PUT, DELETE, OPTIONS

> ⚠️ **Importante para Producción**: 
> - Configurar orígenes CORS específicos en lugar de `*`
> - Implementar autenticación JWT o OAuth2
> - Habilitar HTTPS

### Endpoints Públicos

- `/api/**` - Todos los endpoints de la API
- `/swagger-ui/**` - Documentación Swagger
- `/v3/api-docs/**` - OpenAPI JSON

---

## 🛠️ Manejo de Errores

### GlobalExceptionHandler

El sistema implementa un manejador global de excepciones que retorna respuestas consistentes:

#### Producto no encontrado (404)
```json
{
  "timestamp": "2025-11-26T18:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Producto no encontrado con id: 999",
  "path": "/api/products/999"
}
```

#### Error de validación (400)
```json
{
  "timestamp": "2025-11-26T18:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "La descripción es obligatoria",
  "path": "/api/products"
}
```

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
mvn test

# Tests específicos
mvn test -Dtest=ProductServiceTest

# Con cobertura
mvn clean test jacoco:report
```

---

## 📦 Dependencias Principales

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| Spring Boot | 3.2.0 | Framework principal |
| PostgreSQL Driver | Runtime | Conexión a PostgreSQL |
| Lombok | 1.18.30 | Reducción de boilerplate |
| MapStruct | 1.5.5.Final | Mapeo Entity-DTO |
| SpringDoc OpenAPI | 2.5.0 | Documentación Swagger |
| Flyway | Incluido | Migraciones de BD |

---

## 🔄 Ciclo de Vida de una Petición

```
1. Cliente HTTP → ProductController
2. Controller valida parámetros
3. Controller llama a ProductService
4. Service ejecuta lógica de negocio
5. Service llama a ProductRepository
6. Repository consulta PostgreSQL
7. PostgreSQL retorna Entity
8. Mapper convierte Entity → DTO
9. Service retorna DTO
10. Controller retorna ResponseEntity<DTO>
11. Spring serializa a JSON
12. Cliente recibe respuesta HTTP
```

---

## 📝 Logs

### Niveles de Log Configurados

```properties
# Spring Framework
logging.level.org.springframework.web=DEBUG

# Hibernate SQL
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE

# Aplicación
logging.level.com.proyecto=DEBUG
```

### Ejemplo de Logs en Desarrollo

```
2025-11-26 18:00:00 DEBUG o.s.web.servlet.DispatcherServlet : GET "/api/products"
2025-11-26 18:00:00 DEBUG org.hibernate.SQL : select p1_0.id, p1_0.barcode, p1_0.code, p1_0.description, p1_0.hidden, p1_0.price, p1_0.searchable from items_active p1_0
2025-11-26 18:00:00 DEBUG o.s.web.servlet.DispatcherServlet : Completed 200 OK
```

---

## 🚀 Despliegue

### Compilar para Producción

```bash
# Compilar JAR
mvn clean package -DskipTests

# El JAR se genera en:
# target/backend-0.0.1-SNAPSHOT.jar
```

### Ejecutar en Producción

```bash
java -jar \
  -Dspring.profiles.active=prod \
  -DDB_URL=jdbc:postgresql://prod-host:5432/taskflow \
  -DDB_USERNAME=prod_user \
  -DDB_PASSWORD=secure_password \
  target/backend-0.0.1-SNAPSHOT.jar
```

### Docker (Opcional)

```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8000
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 🐛 Troubleshooting

### Problema: No se puede conectar a PostgreSQL

**Solución:**
1. Verificar que PostgreSQL esté corriendo: `pg_isready -p 5433`
2. Verificar credenciales en `application-dev.properties`
3. Verificar que la base de datos `Taskflow` existe

### Problema: Puerto 8000 ya está en uso

**Solución:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Problema: Error de compilación con Lombok/MapStruct

**Solución:**
```bash
mvn clean install
# Reiniciar IDE
```

---

## 📞 Contacto y Soporte

Para reportar bugs o solicitar nuevas funcionalidades, crear un issue en el repositorio del proyecto.

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

**Última actualización:** 26 de Noviembre, 2025
**Versión:** 0.0.1-SNAPSHOT
