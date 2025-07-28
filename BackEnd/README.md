

# Chat App Backend - Guía de Instalación y Documentación de Endpoints

## Instalación y Primeros Pasos

1. **Clona el repositorio y entra a la carpeta BackEnd:**
   ```bash
   git clone [https://github.com/jhoel0521/Chat-App](https://github.com/jhoel0521/Chat-App)
   cd "Chat App/BackEnd"
   ```

2. **Instala las dependencias de PHP:**
   ```bash
   composer install
   ```

3. **Copia el archivo de entorno y configura tus variables:**
   ```bash
   copy .env.example .env
   # O en Linux/Mac: cp .env.example .env
   ```

4. **Genera la clave de la aplicación y la clave JWT:**
   ```bash
   php artisan key:generate
   php artisan jwt:secret
   ```

5. **Migra la base de datos:**
   ```bash
   php artisan migrate
   ```

6. **(Opcional) Carga datos de ejemplo:**
   ```bash
   php artisan migrate:seed --class=DebugSeeder
   ```

7. **Inicia el servidor de desarrollo:**
   ```bash
   php artisan serve
   ```

---

## Acceso rápido con datos de ejemplo

Si ejecutaste el seeder `DebugSeeder`, puedes iniciar sesión con:

- **Usuario:** admin@mytimer.com
- **Contraseña:** password

O bien:
- **Usuario:** jhoel0521@gmail.com
- **Contraseña:** password

Ejemplo de login:
```json
POST /api/login
{
  "email": "admin@mytimer.com",
  "password": "password"
}
```

---

# API Chat App - Documentación de Endpoints

Esta guía describe las rutas disponibles en la API del backend del Chat App, los parámetros requeridos y ejemplos de uso y respuesta para cada endpoint principal.

## Autenticación y Usuarios

### POST `/api/register`
**Descripción:** Registrar un nuevo usuario.
**Body:**
```json
{
  "name": "Nombre",
  "email": "correo@ejemplo.com",
  "password": "123456",
  "password_confirmation": "123456"
}
```
**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user": { ... },
  "token": "...",
  "expires_in": 3600
}
```

### POST `/api/login`
**Descripción:** Iniciar sesión.
**Body:**
```json
{
  "email": "correo@ejemplo.com",
  "password": "123456"
}
```
**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Sesión iniciada exitosamente",
  "user": { ... },
  "token": "...",
  "expires_in": 3600
}
```

### POST `/api/guest/init`
**Descripción:** Iniciar sesión como invitado.
**Body:**
```json
{
  "name": "Invitado"
}
```
**Respuesta:**
```json
{
  "success": true,
  "message": "Sesión anónima iniciada",
  "user": { ... },
  "token": "...",
  "expires_in": 3600
}
```

### PATCH `/api/guest/upgrade`
**Descripción:** Convertir usuario invitado en registrado.
**Body:**
```json
{
  "email": "correo@ejemplo.com",
  "password": "123456",
  "password_confirmation": "123456"
}
```
**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario convertido exitosamente. Tus mensajes se han conservado.",
  "user": { ... },
  "token": "..."
}
```

### POST `/api/logout`
**Descripción:** Cerrar sesión (requiere token).
**Respuesta:**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

### GET `/api/me`
**Descripción:** Obtener datos del usuario autenticado.
**Respuesta:**
```json
{
  "success": true,
  "data": { ... }
}
```

### POST `/api/token/refresh`
**Descripción:** Renovar token JWT.
**Respuesta:**
```json
{
  "success": true,
  "token": "...",
  "expires_in": 3600
}
```

## Perfil de Usuario

### GET `/api/profile`
**Descripción:** Obtener perfil del usuario.

### PATCH `/api/profile`
**Descripción:** Actualizar nombre/email.
**Body:**
```json
{
  "name": "Nuevo Nombre",
  "email": "nuevo@correo.com"
}
```

### PATCH `/api/profile/password`
**Descripción:** Cambiar contraseña.
**Body:**
```json
{
  "current_password": "actual",
  "new_password": "nueva",
  "new_password_confirmation": "nueva"
}
```

### POST `/api/profile/photo`
**Descripción:** Subir foto de perfil.
**Body:** FormData con campo `profile_photo` (imagen).

### DELETE `/api/profile/photo`
**Descripción:** Eliminar foto de perfil.

### POST `/api/profile/delete` o DELETE `/api/profile`
**Descripción:** Eliminar cuenta (requiere contraseña si no es anónimo).

## Salas (Rooms)

### GET `/api/rooms`
**Descripción:** Listar salas públicas populares.

### GET `/api/my-rooms`
**Descripción:** Listar salas donde el usuario es creador o está unido.

### POST `/api/rooms`
**Descripción:** Crear una nueva sala.
**Body:**
```json
{
  "name": "Sala 1",
  "description": "Descripción",
  "is_private": false
}
```

### GET `/api/rooms/{room}`
**Descripción:** Obtener detalles de una sala.

### PUT `/api/rooms/{room}`
**Descripción:** Actualizar sala (solo creador).
**Body:**
```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripción",
  "is_private": false
}
```

### DELETE `/api/rooms/{room}`
**Descripción:** Eliminar sala (solo creador).

### POST `/api/rooms/{room}/join`
**Descripción:** Unirse a una sala.

### POST `/api/rooms/{room}/leave`
**Descripción:** Abandonar una sala.

### GET `/api/check/{room}`
**Descripción:** Verificar acceso y estado en la sala.

## Mensajes

### GET `/api/messages?room_id={room_id}`
**Descripción:** Listar mensajes de una sala (requiere estar unido).
**Parámetros opcionales:** `last_timestamp` como limitador para tener mensajes después de la marca temporal.

### POST `/api/messages`
**Descripción:** Enviar mensaje a una sala.
**Body:**
```json
{
  "room_id": "uuid-sala",
  "message": "Hola mundo",
  "message_type": "text"
}
```

## Archivos

### POST `/api/files/upload`
**Descripción:** Subir archivo a un mensaje.
**Body:** FormData con campos `file` (archivo) y `message_id` (uuid).

### GET `/api/files/{file}`
**Descripción:** Descargar o mostrar archivo subido.

---

**Notas:**
- Todos los endpoints `/api/*` requieren autenticación JWT salvo `/register`, `/login` y `/guest/init`.
- Usar el header `Authorization: Bearer {token}` para endpoints protegidos.
- Las respuestas de error incluyen el campo `success: false` y un mensaje descriptivo.
