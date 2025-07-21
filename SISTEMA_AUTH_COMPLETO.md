# 🔐 Sistema de Autenticación y Registro Completo

## 📋 Resumen del Sistema

El sistema de autenticación ahora incluye **endpoints específicos** para cada tipo de usuario con validaciones y permisos adecuados.

---

## 🎯 Tipos de Usuario y Registro

### 👤 **CUSTOMER (Cliente)**
- Registro público disponible
- Crea automáticamente perfil de cliente
- Acceso al carrito de compras
- Gestión de su propio perfil

### 🛠️ **SELLER (Vendedor)**
- Solo puede ser creado por Admin
- Acceso a gestión de inventario
- Puede crear/editar motocicletas
- Manejo de ventas

### 🔑 **ADMIN (Administrador)**
- Requiere clave secreta para registro
- Acceso completo al sistema
- Puede crear sellers
- Gestión de usuarios y configuración

---

## 🚀 Endpoints Disponibles

### **📝 Registro de Usuarios**

#### 1. Registro de Cliente (Público)
```bash
POST /api/auth/register/customer
Content-Type: application/json

{
  "email": "cliente@email.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "+1234567890",
  "address": "Calle Principal 123",
  "city": "Ciudad de México",
  "state": "CDMX",
  "zipCode": "12345"
}
```

**Respuesta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "cliente@email.com",
    "role": "customer",
    "customer": {
      "id": "customer-uuid",
      "firstName": "Juan",
      "lastName": "Pérez"
    }
  }
}
```

#### 2. Registro de Admin (Requiere Clave Secreta)
```bash
POST /api/auth/register/admin
Content-Type: application/json

{
  "email": "admin@motoshop.com",
  "password": "admin123456",
  "adminSecretKey": "MOTORCYCLE_ADMIN_2025"
}
```

#### 3. Registro de Seller (Solo por Admin)
```bash
POST /api/auth/register/seller
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "email": "vendedor@motoshop.com",
  "password": "seller123",
  "firstName": "María",
  "lastName": "González",
  "phone": "+1234567890"
}
```

#### 4. Registro General (Básico)
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "password123",
  "role": "customer" // opcional
}
```

---

### **🔑 Login Universal y Específico**

#### 1. Login Universal (Todos los tipos)
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "password123"
}
```

#### 2. Login Específico para Cliente
```bash
POST /api/auth/login/customer
Content-Type: application/json

{
  "email": "cliente@email.com",
  "password": "password123"
}
```

**Respuesta Cliente:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "cliente@email.com",
    "role": "customer",
    "customer": {
      "id": "customer-uuid",
      "firstName": "Juan",
      "lastName": "Pérez"
    }
  }
}
```

#### 3. Login Específico para Admin
```bash
POST /api/auth/login/admin
Content-Type: application/json

{
  "email": "admin@motoshop.com",
  "password": "admin123456"
}
```

**Respuesta Admin:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "admin@motoshop.com",
    "role": "admin"
  }
}
```

#### 4. Login Específico para Seller
```bash
POST /api/auth/login/seller
Content-Type: application/json

{
  "email": "vendedor@motoshop.com",
  "password": "seller123"
}
```

**Respuesta Seller:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "vendedor@motoshop.com",
    "role": "seller"
  }
}
```

---

### **👤 Perfil de Usuario**

```bash
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

---

### **🚪 Logout**

```bash
POST /api/auth/logout
Authorization: Bearer <jwt-token>
```

---

## 🔐 Configuración de Seguridad

### **Variables de Entorno**
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1h

# Admin Secret Key
ADMIN_SECRET_KEY=MOTORCYCLE_ADMIN_2025
```

### **Validaciones de Seguridad**

#### **Contraseñas:**
- Cliente: Mínimo 6 caracteres
- Admin: Mínimo 8 caracteres
- Seller: Mínimo 6 caracteres
- Hash con bcrypt (12 rounds)

#### **Permisos:**
- Crear Seller: Solo Admin
- Crear Admin: Requiere clave secreta
- Crear Cliente: Público

---

## 🎨 Ejemplos de Uso con cURL

### **Registro de Cliente:**
```bash
curl -X POST http://localhost:3000/api/auth/register/customer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@email.com",
    "password": "password123",
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "+1234567890"
  }'
```

### **Login Universal:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@email.com",
    "password": "password123"
  }'
```

### **Login Cliente Específico:**
```bash
curl -X POST http://localhost:3000/api/auth/login/customer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@email.com",
    "password": "password123"
  }'
```

### **Login Admin Específico:**
```bash
curl -X POST http://localhost:3000/api/auth/login/admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@motoshop.com",
    "password": "admin123456"
  }'
```

### **Login Seller Específico:**
```bash
curl -X POST http://localhost:3000/api/auth/login/seller \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendedor@motoshop.com",
    "password": "seller123"
  }'
```

### **Ver Perfil:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Registro de Admin:**
```bash
curl -X POST http://localhost:3000/api/auth/register/admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@motoshop.com",
    "password": "admin123456",
    "adminSecretKey": "MOTORCYCLE_ADMIN_2025"
  }'
```

---

## 🔄 Flujo de Registro por Tipo de Usuario

### **Cliente (Customer)**
1. **POST** `/api/auth/register/customer` ✅
2. Se crea User con role='customer'
3. Se crea Customer profile automáticamente
4. Se vinculan User ↔ Customer
5. Login automático + tokens JWT

### **Admin**
1. **POST** `/api/auth/register/admin` ✅
2. Verificar adminSecretKey
3. Se crea User con role='admin'
4. Login automático + tokens JWT

### **Seller (por Admin)**
1. Admin autenticado hace **POST** `/api/auth/register/seller` ✅
2. Verificar que quien crea es Admin
3. Se crea User con role='seller'
4. Se retornan tokens para el nuevo seller

---

## 🔒 Guards y Seguridad

### **JWT Strategy**
- Valida tokens en cada request protegido
- Extrae información del usuario
- Verifica estado activo del usuario

### **Role Guards**
- `@Roles(UserRole.ADMIN)` - Solo admin
- `@Roles(UserRole.SELLER)` - Solo vendedor
- `@Roles(UserRole.CUSTOMER)` - Solo cliente
- `@Roles(UserRole.ADMIN, UserRole.SELLER)` - Admin o vendedor

### **Local Strategy**
- Valida email/password en login
- Se usa en conjunto con LocalAuthGuard

---

## ✅ Estado Final del Sistema

### **✅ Implementado:**
- ✅ Login universal para todos los roles
- ✅ **Login específico para Cliente** con validación de rol
- ✅ **Login específico para Admin** con validación de rol
- ✅ **Login específico para Seller** con validación de rol
- ✅ Registro específico de Cliente (con perfil automático)
- ✅ Registro de Admin (con clave secreta)
- ✅ Registro de Seller (solo por Admin)
- ✅ JWT con roles y permisos
- ✅ Validaciones de seguridad
- ✅ Documentación completa con Swagger
- ✅ Guards y estrategias de autenticación

### **🎯 Ventajas de Login Específico:**
- **🔒 Seguridad Mejorada**: Cada tipo valida que el usuario tenga el rol correcto
- **📱 UX Optimizada**: Interfaces específicas en el frontend
- **🚫 Prevención de Errores**: Evita que un cliente acceda por login de admin
- **📊 Respuestas Personalizadas**: Datos específicos según el tipo de usuario
- **🔍 Logs Específicos**: Rastreo detallado por tipo de acceso
- **⚡ Validaciones Rápidas**: Fallos rápidos si el rol no coincide

### **🔐 Características de Seguridad:**
- Contraseñas hasheadas con bcrypt
- JWT con expiración configurable
- Roles con permisos específicos
- Validación de clave secreta para Admin
- Verificación de estado activo de usuario
- Protección contra registros duplicados

### **📊 Tipos de Usuario Completos:**
- **CUSTOMER**: Acceso al carrito, perfil, compras
- **SELLER**: Gestión de inventario, ventas, motocicletas
- **ADMIN**: Control total del sistema, gestión de usuarios

¡El sistema de autenticación está **100% completo** y funcional!

---

## 🚀 Próximos Pasos para Integración

1. **Frontend**: Implementar formularios de registro específicos
2. **Validación**: Agregar validaciones adicionales en el cliente
3. **Roles**: Configurar rutas protegidas por rol en el frontend
4. **Tokens**: Implementar refresh token automático
5. **Perfil**: Crear páginas de perfil específicas por tipo de usuario
