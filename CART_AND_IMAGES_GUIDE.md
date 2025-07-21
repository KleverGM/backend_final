# Guía de Uso: Carrito de Compras y Manejo de Imágenes

## 🛒 Carrito de Compras

### Endpoints Disponibles

#### 1. Agregar item al carrito
```bash
POST /api/cart
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "motorcycleId": "uuid-de-la-motocicleta",
  "quantity": 1,
  "notes": "Color preferido: rojo"
}
```

#### 2. Ver carrito completo
```bash
GET /api/cart
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "totalItems": 3,
  "totalPrice": 45000.00,
  "items": [
    {
      "id": "cart-item-uuid",
      "motorcycleId": "motorcycle-uuid",
      "motorcycle": {
        "id": "motorcycle-uuid",
        "brand": "Honda",
        "model": "CBR600RR",
        "year": 2023,
        "price": 15000.00,
        "imageUrl": "http://localhost:3000/uploads/motorcycle-image.jpg",
        "inStock": true
      },
      "quantity": 2,
      "unitPrice": 15000.00,
      "totalPrice": 30000.00,
      "notes": "Color preferido: rojo",
      "createdAt": "2025-01-18T10:00:00Z"
    }
  ]
}
```

#### 3. Obtener cantidad de items en el carrito
```bash
GET /api/cart/count
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "count": 3
}
```

#### 4. Actualizar item del carrito
```bash
PUT /api/cart/:itemId
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "quantity": 3,
  "notes": "Cambio de color: azul"
}
```

#### 5. Eliminar item del carrito
```bash
DELETE /api/cart/:itemId
Authorization: Bearer <jwt-token>
```

#### 6. Vaciar carrito completo
```bash
DELETE /api/cart
Authorization: Bearer <jwt-token>
```

---

## 📸 Manejo de Imágenes

### Endpoints Disponibles

#### 1. Subir archivo
```bash
POST /api/uploads
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

Form Data:
- file: [archivo de imagen]
- entityType: "motorcycle" | "customer" | "user" (opcional)
- entityId: "uuid-del-entity" (opcional)
```

**Respuesta:**
```json
{
  "id": "upload-uuid",
  "originalName": "moto-honda.jpg",
  "filename": "file-1642512345678-123456789.jpg",
  "url": "http://localhost:3000/uploads/file-1642512345678-123456789.jpg",
  "size": 1024000,
  "mimetype": "image/jpeg",
  "entityType": "motorcycle",
  "entityId": "motorcycle-uuid",
  "createdAt": "2025-01-18T10:00:00Z"
}
```

#### 2. Obtener archivo por ID
```bash
GET /api/uploads/:uploadId
Authorization: Bearer <jwt-token>
```

#### 3. Obtener archivos por entidad
```bash
GET /api/uploads/entity/motorcycle/:motorcycleId
Authorization: Bearer <jwt-token>
```

#### 4. Asociar imagen existente a motocicleta
```bash
POST /api/images/motorcycle/:motorcycleId
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "uploadId": "upload-uuid"
}
```

#### 5. Asociar imagen de perfil a cliente
```bash
POST /api/images/customer/:customerId
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "uploadId": "upload-uuid"
}
```

#### 6. Eliminar archivo
```bash
DELETE /api/uploads/:uploadId
Authorization: Bearer <jwt-token>
```

#### 7. Estadísticas de archivos (Solo Admin)
```bash
GET /api/uploads/stats/summary
Authorization: Bearer <jwt-token>
```

---

## 🔧 Ejemplos de Uso con cURL

### Subir imagen de motocicleta:
```bash
curl -X POST http://localhost:3000/api/uploads \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/motorcycle-image.jpg" \
  -F "entityType=motorcycle" \
  -F "entityId=motorcycle-uuid-here"
```

### Agregar motocicleta al carrito:
```bash
curl -X POST http://localhost:3000/api/cart \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "motorcycleId": "motorcycle-uuid-here",
    "quantity": 1,
    "notes": "Interesado en financiamiento"
  }'
```

### Ver carrito:
```bash
curl -X GET http://localhost:3000/api/cart \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📁 Estructura de Archivos

Los archivos se guardan en:
```
public/
└── uploads/
    ├── motorcycles/    # Imágenes de motocicletas
    ├── customers/      # Fotos de perfil de clientes
    └── [otros archivos]
```

**URLs de acceso:**
- `http://localhost:3000/uploads/filename.jpg`

---

## 🔒 Permisos

### Carrito:
- **Customer**: Puede manejar su propio carrito
- **Seller/Admin**: Puede ver carritos (para soporte)

### Archivos:
- **Todos los roles**: Pueden subir archivos
- **Customer**: Solo puede asociar imágenes a su propio perfil
- **Seller/Admin**: Pueden asociar imágenes a motocicletas y perfiles de clientes

---

## ⚠️ Limitaciones

### Archivos:
- **Tamaño máximo**: 5MB
- **Tipos permitidos**: 
  - Imágenes: JPEG, PNG, GIF, WebP
  - Documentos: PDF
- **Seguridad**: Validación de tipo MIME

### Carrito:
- **Cantidad máxima por item**: 10 unidades
- **Persistencia**: Los items permanecen hasta que se eliminen o se complete la compra

---

## 🚀 Próximos Pasos

1. **Integración con Frontend**: Usar estos endpoints en React/Vue
2. **Notificaciones**: Implementar notificaciones en tiempo real para cambios de carrito
3. **Optimización de Imágenes**: Agregar redimensionamiento automático
4. **Caché**: Implementar caché para imágenes frecuentemente accedidas
