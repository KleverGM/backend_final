# Motorcycle Shop Backend

Backend de la aplicación de venta de motocicletas construido con NestJS, que incluye autenticación JWT, gestión de inventario, ventas y análisis avanzado con doble base de datos.

## 🚀 Características

### Funcionalidades Principales
- **Autenticación y Autorización**: JWT con roles (Admin, Seller, Customer)
- **Gestión de Usuarios**: Sistema completo de usuarios y clientes
- **Inventario de Motocicletas**: CRUD completo con categorías y especificaciones
- **Sistema de Ventas**: Gestión de ventas, facturas y carrito de compras
- **Análisis Avanzado**: Dashboard con métricas de ventas, inventario y actividad
- **Historial de Precios**: Seguimiento de cambios de precios y tendencias de mercado
- **Registro de Actividad**: Auditoría completa de acciones de usuarios

### Arquitectura de Base de Datos
- **PostgreSQL**: Datos transaccionales (usuarios, productos, ventas)
- **MongoDB**: Análisis, logs de actividad e historial de precios

## 🛠 Tecnologías

- **Framework**: NestJS + TypeScript
- **Base de Datos Relacional**: PostgreSQL + TypeORM
- **Base de Datos NoSQL**: MongoDB + Mongoose  
- **Autenticación**: JWT + Passport
- **Validación**: Class-validator + Class-transformer
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd bacjn_
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones de base de datos:

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=tu_password
POSTGRES_DATABASE=motorcycle_shop

# MongoDB
MONGODB_URI=mongodb://localhost:27017/motorcycle_analytics

# JWT
JWT_SECRET=tu_clave_super_secreta
```

4. **Iniciar bases de datos**

PostgreSQL:
```bash
# Crear base de datos
createdb motorcycle_shop
```

MongoDB:
```bash
# Iniciar MongoDB
mongod
```

5. **Ejecutar la aplicación**

Desarrollo:
```bash
npm run start:dev
```

Producción:
```bash
npm run build
npm run start:prod
```

## 📚 Estructura del Proyecto

```
src/
├── app.module.ts              # Módulo principal
├── main.ts                    # Punto de entrada
├── config/                    # Configuraciones
├── common/                    # Módulos compartidos
│   ├── guards/               # Guards de autenticación
│   ├── decorators/           # Decoradores personalizados
│   └── filters/              # Filtros de excepción
├── auth/                     # Autenticación y autorización
├── customers/                # Gestión de clientes
├── motorcycles/              # Gestión de motocicletas
├── categories/               # Categorías de productos
├── inventory/                # Control de inventario
├── sales/                    # Gestión de ventas
├── invoices/                 # Facturación
├── cart/                     # Carrito de compras
└── mongodb/                  # Módulos de MongoDB
    ├── analytics/            # Esquemas de análisis
    ├── logs/                 # Esquemas de logs
    ├── price-history/        # Historial de precios
    └── service/              # Servicios de análisis
```

## 🔐 Autenticación

### Endpoints de Autenticación

```bash
POST /api/auth/login          # Iniciar sesión
POST /api/auth/register       # Registrar usuario
GET  /api/auth/profile        # Obtener perfil
PUT  /api/auth/profile        # Actualizar perfil
```

### Roles de Usuario

- **Admin**: Acceso completo al sistema
- **Seller**: Gestión de ventas e inventario
- **Customer**: Navegación y compras

## 📊 API Endpoints

### Motocicletas
```bash
GET    /api/motorcycles       # Listar motocicletas
POST   /api/motorcycles       # Crear motocicleta
GET    /api/motorcycles/:id   # Obtener motocicleta
PUT    /api/motorcycles/:id   # Actualizar motocicleta
DELETE /api/motorcycles/:id   # Eliminar motocicleta
```

### Ventas
```bash
GET    /api/sales             # Listar ventas
POST   /api/sales             # Crear venta
GET    /api/sales/:id         # Obtener venta
PUT    /api/sales/:id         # Actualizar venta
```

### Análisis
```bash
GET    /api/analytics/sales           # Métricas de ventas
GET    /api/analytics/inventory       # Métricas de inventario
GET    /api/analytics/customers       # Análisis de clientes
GET    /api/analytics/dashboard       # Dashboard completo
```

## 📈 Análisis y Métricas

### Análisis de Ventas
- Ventas por período (diario, semanal, mensual)
- Top productos más vendidos
- Análisis de tendencias
- Métricas de conversión

### Análisis de Inventario
- Niveles de stock
- Rotación de productos
- Alertas de inventario bajo
- Análisis de proveedores

### Análisis de Clientes
- Segmentación de clientes
- Valor de vida del cliente (CLV)
- Patrones de comportamiento
- Análisis geográfico

### Historial de Precios
- Seguimiento de cambios de precios
- Análisis de tendencias de mercado
- Comparación con competidores
- Reportes de precio

## 🔒 Seguridad

- Autenticación JWT con expiración configurable
- Validación de entrada con class-validator
- Guards de autorización basados en roles
- Hashing de contraseñas con bcrypt
- Protección CORS configurable
- Registro de actividad para auditoría

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura de tests
npm run test:cov
```

## 📄 Documentación API

La documentación de la API está disponible en Swagger:

```
http://localhost:3000/api/docs
```

## 🐳 Docker

Ejecutar con Docker:

```bash
docker-compose up -d
```

## 🔧 Comandos Útiles

```bash
# Generar módulo
nest g module <nombre>

# Generar controlador
nest g controller <nombre>

# Generar servicio
nest g service <nombre>

# Generar guard
nest g guard <nombre>

# Linting
npm run lint

# Formateo
npm run format
```

## 📞 Soporte

Para soporte técnico o preguntas sobre la implementación, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ usando NestJS**
