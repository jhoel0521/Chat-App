# 🧠 Chat App – Proyecto de Programación Web II

Autor: **Jhoel Cruz**  
Universidad: **UPDS** – 6to Semestre de Ingeniería de Sistemas  
Materia: **Programación Web II**

---

## 📘 Descripción del proyecto

Esta aplicación es una plataforma de **chat HTTP con polling** desarrollada como proyecto universitario. Combina tecnologías modernas como **PHP (Laravel)**, **MariaDB**, y **Angular** para ofrecer un sistema completo de salas de chat que permite:

- Chatear en **salas públicas o privadas**
- Soporte para **usuarios anónimos** o **registrados**
- Diferentes **tipos de mensajes** (texto, imágenes y archivos)
- Funcionalidad en **tiempo real** mediante polling HTTP
- Persistencia de mensajes para usuarios registrados
- Registro en caliente: un usuario anónimo puede registrarse y conservar sus mensajes

---

## 🛠️ Tecnologías utilizadas

| Componente    | Tecnología                                           |
| ------------- | ---------------------------------------------------- |
| Backend       | Laravel 12.x (PHP 8.4)                               |
| Base de datos | MariaDB 10.x                                         |
| Comunicación  | API REST con HTTP Polling                           |
| Frontend      | Angular 20.x + DaisyUI + Tailwind CSS               |
| Autenticación | JWT (JSON Web Tokens)                               |

---

## 🧪 Ejemplo de Interacción - 2 Usuarios en Sala de Chat

### 📋 Datos de Prueba (DebugSeeder)

```json
{
  "usuarios": [
    {
      "id": "uuid-admin-001",
      "nombre": "Admin User",
      "email": "admin@mytimer.com",
      "password": "password",
      "tipo": "registrado"
    },
    {
      "id": "uuid-jhoel-002", 
      "nombre": "Jhoel",
      "email": "jhoel0521@gmail.com",
      "password": "password",
      "tipo": "registrado"
    }
  ],
  "sala": {
    "id": "019818d2-3be7-73aa-909f-387b36b70c35",
    "nombre": "Chat Debug Room",
    "descripcion": "Room for debugging and testing",
    "es_privada": false,
    "creado_por": "uuid-admin-001"
  }
}
```

### 🔄 Flujo Completo de Interacción

#### 1️⃣ **Autenticación de Usuario 1 (Admin)**

**REQUEST**
```json
POST /api/login
Content-Type: application/json

{
  "email": "admin@mytimer.com",
  "password": "password"
}
```

**RESPONSE**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "uuid-admin-001",
      "name": "Admin User",
      "email": "admin@mytimer.com",
      "is_anonymous": false
    }
  }
}
```

#### 2️⃣ **Autenticación de Usuario 2 (Jhoel)**

**REQUEST**
```json
POST /api/login
Content-Type: application/json

{
  "email": "jhoel0521@gmail.com",
  "password": "password"
}
```

**RESPONSE**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer", 
    "expires_in": 3600,
    "user": {
      "id": "uuid-jhoel-002",
      "name": "Jhoel",
      "email": "jhoel0521@gmail.com",
      "is_anonymous": false
    }
  }
}
```

#### 3️⃣ **Usuario 1 (Admin) se une a la sala**

**REQUEST**
```json
POST /api/rooms/019818d2-3be7-73aa-909f-387b36b70c35/join
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

**RESPONSE**
```json
{
  "success": true,
  "message": "Te has unido a la sala exitosamente",
  "data": {
    "room": {
      "id": "019818d2-3be7-73aa-909f-387b36b70c35",
      "name": "Chat Debug Room",
      "description": "Room for debugging and testing",
      "is_private": false,
      "created_by": "uuid-admin-001",
      "users_count": 1
    }
  }
}
```

#### 4️⃣ **Usuario 2 (Jhoel) se une a la sala**

**REQUEST**
```json
POST /api/rooms/019818d2-3be7-73aa-909f-387b36b70c35/join
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

**RESPONSE**
```json
{
  "success": true,
  "message": "Te has unido a la sala exitosamente",
  "data": {
    "room": {
      "id": "019818d2-3be7-73aa-909f-387b36b70c35",
      "name": "Chat Debug Room",
      "description": "Room for debugging and testing",
      "is_private": false,
      "created_by": "uuid-admin-001",
      "users_count": 2
    }
  }
}
```

#### 5️⃣ **Admin carga mensajes iniciales**

**REQUEST**
```json
GET /api/messages?room_id=019818d2-3be7-73aa-909f-387b36b70c35&page=1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**RESPONSE**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": "msg-001",
        "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
        "user_id": "uuid-admin-001",
        "message": "Hola! Este es un mensaje de prueba del admin",
        "message_type": "text",
        "created_at": "2025-01-18T10:00:00Z",
        "user": {
          "id": "uuid-admin-001",
          "name": "Admin User",
          "is_anonymous": false
        }
      },
      {
        "id": "msg-002",
        "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
        "user_id": "uuid-jhoel-002",
        "message": "Hola admin! Mensaje de respuesta para testing",
        "message_type": "text",
        "created_at": "2025-01-18T10:01:00Z",
        "user": {
          "id": "uuid-jhoel-002",
          "name": "Jhoel",
          "is_anonymous": false
        }
      }
    ],
    "last_page": 1,
    "per_page": 20,
    "total": 2
  }
}
```

#### 6️⃣ **Admin envía un nuevo mensaje**

**REQUEST**
```json
POST /api/messages
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
  "message": "¡Bienvenido al sistema de chat! Todo funciona perfectamente 🎉",
  "message_type": "text"
}
```

**RESPONSE**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg-003",
      "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
      "user_id": "uuid-admin-001",
      "message": "¡Bienvenido al sistema de chat! Todo funciona perfectamente 🎉",
      "message_type": "text",
      "created_at": "2025-01-18T14:30:15Z",
      "updated_at": "2025-01-18T14:30:15Z",
      "user": {
        "id": "uuid-admin-001",
        "name": "Admin User",
        "is_anonymous": false
      }
    }
  }
}
```

#### 7️⃣ **Jhoel detecta el nuevo mensaje via polling**

**REQUEST (automático cada 2 segundos)**
```json
GET /api/messages?room_id=019818d2-3be7-73aa-909f-387b36b70c35&page=1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**RESPONSE**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": "msg-001",
        "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
        "user_id": "uuid-admin-001",
        "message": "Hola! Este es un mensaje de prueba del admin",
        "message_type": "text",
        "created_at": "2025-01-18T10:00:00Z",
        "user": {
          "id": "uuid-admin-001",
          "name": "Admin User",
          "is_anonymous": false
        }
      },
      {
        "id": "msg-002",
        "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
        "user_id": "uuid-jhoel-002",
        "message": "Hola admin! Mensaje de respuesta para testing",
        "message_type": "text",
        "created_at": "2025-01-18T10:01:00Z",
        "user": {
          "id": "uuid-jhoel-002",
          "name": "Jhoel",
          "is_anonymous": false
        }
      },
      {
        "id": "msg-003",
        "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
        "user_id": "uuid-admin-001",
        "message": "¡Bienvenido al sistema de chat! Todo funciona perfectamente 🎉",
        "message_type": "text",
        "created_at": "2025-01-18T14:30:15Z",
        "user": {
          "id": "uuid-admin-001",
          "name": "Admin User",
          "is_anonymous": false
        }
      }
    ],
    "last_page": 1,
    "per_page": 20,
    "total": 3
  }
}
```

#### 8️⃣ **Jhoel responde al mensaje**

**REQUEST**
```json
POST /api/messages
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
  "message": "¡Excelente! El sistema HTTP polling funciona muy bien 👍 Gracias por la implementación",
  "message_type": "text"
}
```

**RESPONSE**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg-004",
      "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
      "user_id": "uuid-jhoel-002",
      "message": "¡Excelente! El sistema HTTP polling funciona muy bien 👍 Gracias por la implementación",
      "message_type": "text",
      "created_at": "2025-01-18T14:31:45Z",
      "updated_at": "2025-01-18T14:31:45Z",
      "user": {
        "id": "uuid-jhoel-002",
        "name": "Jhoel",
        "is_anonymous": false
      }
    }
  }
}
```

#### 9️⃣ **Admin recibe el mensaje via polling**

**REQUEST (automático cada 2 segundos)**
```json
GET /api/messages?room_id=019818d2-3be7-73aa-909f-387b36b70c35&page=1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**RESPONSE (contiene el nuevo mensaje de Jhoel)**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": "msg-001",
        "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
        "user_id": "uuid-admin-001",
        "message": "Hola! Este es un mensaje de prueba del admin",
        "message_type": "text",
        "created_at": "2025-01-18T10:00:00Z",
        "user": {
          "id": "uuid-admin-001",
          "name": "Admin User",
          "is_anonymous": false
        }
      },
      {
        "id": "msg-002",
        "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
        "user_id": "uuid-jhoel-002",
        "message": "Hola admin! Mensaje de respuesta para testing",
        "message_type": "text",
        "created_at": "2025-01-18T10:01:00Z",
        "user": {
          "id": "uuid-jhoel-002",
          "name": "Jhoel",
          "is_anonymous": false
        }
      },
      {
        "id": "msg-003",
        "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
        "user_id": "uuid-admin-001",
        "message": "¡Bienvenido al sistema de chat! Todo funciona perfectamente 🎉",
        "message_type": "text",
        "created_at": "2025-01-18T14:30:15Z",
        "user": {
          "id": "uuid-admin-001",
          "name": "Admin User",
          "is_anonymous": false
        }
      },
      {
        "id": "msg-004",
        "room_id": "019818d2-3be7-73aa-909f-387b36b70c35",
        "user_id": "uuid-jhoel-002",
        "message": "¡Excelente! El sistema HTTP polling funciona muy bien 👍 Gracias por la implementación",
        "message_type": "text",
        "created_at": "2025-01-18T14:31:45Z",
        "user": {
          "id": "uuid-jhoel-002",
          "name": "Jhoel",
          "is_anonymous": false
        }
      }
    ],
    "last_page": 1,
    "per_page": 20,
    "total": 4
  }
}
```

### ⚙️ **Configuración del Polling**

```typescript
// Frontend Angular - environment.ts
export const environment = {
  // ... otras configuraciones
  polling: {
    messagesInterval: 2000,    // Polling cada 2 segundos
    presenceInterval: 5000,    // Verificar presencia cada 5 segundos
    enabled: true              // Habilitar polling
  }
};
```

### 🎯 **Ventajas del Sistema HTTP Polling**

| Ventaja | Descripción |
|---------|-------------|
| ✅ **Simplicidad** | No requiere configuración WebSocket compleja |
| ✅ **Compatibilidad** | Funciona en cualquier navegador y red |
| ✅ **Debugging** | Fácil depuración con herramientas HTTP estándar |
| ✅ **Escalabilidad** | Simple de escalar horizontalmente |
| ✅ **Confiabilidad** | Resiliente a caídas de conexión |

---

## 🗃️ Modelo de Base de Datos

### 📊 Diagrama Entidad-Relación

El sistema utiliza un modelo relacional optimizado para manejar salas de chat en tiempo real con soporte para usuarios anónimos y registrados.

**🔗 [Ver diagrama interactivo en DBDiagram.io](https://dbdiagram.io/d/Chat-67801be46b7fa355c36ede4b)**

### 📋 Entidades principales

| Tabla | Descripción | Campos clave |
|-------|-------------|--------------|
| `users` | Usuarios del sistema (anónimos y registrados) | `id` (UUID), `name`, `email`, `is_anonymous`, `profile_photo` |
| `rooms` | Salas de chat públicas y privadas | `id` (UUID), `name`, `is_private`, `allow_anonymous` |
| `room_user` | Relación usuarios-salas con historial | `room_id` (UUID), `user_id` (UUID), `joined_at`, `abandonment_in` |
| `messages` | Mensajes de todas las salas | `id`, `room_id` (UUID), `user_id` (UUID), `type`, `content` |
| `files` | Archivos multimedia compartidos | `id`, `user_id` (UUID), `path`, `original_name` |

### 🔑 Características del modelo

- **UUID como clave primaria**: Para usuarios y salas, garantizando unicidad global
- **Soporte multimodal**: Mensajes de texto, imágenes, audio, video y documentos
- **Historial completo**: Registro de entrada/salida de usuarios en salas
- **Flexibilidad de usuarios**: Mismo modelo para anónimos y registrados
- **Mensajes del sistema**: Para notificaciones automáticas (unirse/abandonar)

<details>
<summary>🧩 Código DBML completo</summary>

```dbml
Table users {
  id uuid [pk]
  name varchar
  email varchar [unique, null]
  password varchar [null]
  is_anonymous boolean [default: false]
  profile_photo varchar [null]
  created_at datetime
  updated_at datetime
}

Table rooms {
  id uuid [pk]
  name varchar
  description text
  is_private boolean [default: false]
  allow_anonymous boolean [default: true]
  created_by uuid [ref: > users.id]
  created_at datetime
  updated_at datetime
}

Table room_user {
  id int [pk, increment]
  room_id uuid [ref: > rooms.id]
  user_id uuid [ref: > users.id]
  joined_at datetime
  abandonment_in datetime [null, default: null]
}

Table messages {
  id bigint [pk, increment]
  room_id uuid [ref: > rooms.id]
  user_id uuid [ref: > users.id]
  type enum('text', 'image', 'image_with_text', 'audio', 'video', 'document', 'system')
  content text
  markdown boolean [default: false]
  reply_to bigint [ref: > messages.id]
  created_at datetime
}

Table files {
  id bigint [pk, increment]
  user_id uuid [ref: > users.id]
  path varchar
  original_name varchar
  mime_type varchar
  size int
  created_at datetime
}
```
</details>
---

## 🔄 Diagramas de Flujo del Sistema

A continuación se detallan los **6 flujos principales** del sistema, modelados con diagramas de secuencia para mostrar cómo interactúan los componentes en tiempo real.

### 1️⃣ Crear cuenta de usuario
```mermaid
sequenceDiagram
    participant Usuario
    participant Frontend (Angular)
    participant API (Laravel)
    participant DB (MariaDB)

    Usuario->>Frontend (Angular): Ingresa nombre, correo y contraseña
    Frontend (Angular)->>API (Laravel): POST /register
    API (Laravel)->>DB (MariaDB): Verifica si email existe
    alt No existe
        API (Laravel)->>DB (MariaDB): Guarda nuevo usuario
        API (Laravel)->>Frontend (Angular): 200 OK + token
        Frontend (Angular)->>Usuario: Redirige a la app como registrado
    else Email ya registrado
        API (Laravel)->>Frontend (Angular): 409 Conflict
        Frontend (Angular)->>Usuario: Muestra mensaje de error
    end
```
### 2️⃣ Usuario anónimo elige nombre temporal
```mermaid
sequenceDiagram
    participant Usuario
    participant Frontend
    participant LocalStorage

    Usuario->>Frontend: Accede sin registrarse
    Frontend->>Usuario: Pide nombre temporal
    Usuario->>Frontend: Ingresa "Invitado123"
    Frontend->>LocalStorage: Guarda UUID + nombre temporal
    Frontend->>Usuario: Interfaz lista para unirse a salas
```
### 3️⃣ Usuario crea una sala

```mermaid

sequenceDiagram
    participant Usuario Registrado
    participant Frontend
    participant API
    participant DB

    Usuario Registrado->>Frontend: Clic en "Crear sala"
    Frontend->>Usuario Registrado: Formulario de creación
    Usuario Registrado->>Frontend: Enviar formulario
    Frontend->>API: POST /rooms
    API->>DB: Inserta sala
    API->>Frontend: Retorna UUID de sala
    Frontend->>Usuario Registrado: Redirige a sala
```

### 4️⃣ Chatear normalmente en una sala

```mermaid
sequenceDiagram
    participant Usuario (Anon o Reg)
    participant Frontend
    participant WebSocket Server
    participant DB

    Usuario (Anon o Reg)->>Frontend: Escribe mensaje
    Frontend->>WebSocket Server: Emitir mensaje con metadata
    WebSocket Server->>DB: Guarda mensaje en `messages`
    WebSocket Server-->>Todos en sala: Nuevo mensaje recibido
    Frontend-->>Usuarios en sala: Renderiza mensaje

```
### 5️⃣ Usuario anónimo se registra y conserva sus mensajes
```mermaid
sequenceDiagram
    participant Usuario Anónimo
    participant Frontend
    participant API
    participant DB

    Usuario Anónimo->>Frontend: Clic en "Registrarse"
    Frontend->>API: POST /register (con token anónimo activo)
    API->>DB: Actualiza usuario anónimo (mantiene UUID)
    API->>Frontend: 200 OK + nuevo token
    Frontend->>Usuario: Bienvenido, tus mensajes se conservaron

```
### 6️⃣ Usuario abandona sala o pierde sesión
```mermaid
sequenceDiagram
    participant Usuario Anónimo
    participant Usuario
    participant Frontend
    participant WebSocket Server
    participant API
    participant DB

    Usuario Anónimo->>Frontend: Cierra navegador o se desconecta
    Frontend->>WebSocket Server: Desconectar
    WebSocket Server->>API: POST /rooms/{id}/abandon
    API->>DB: Marca `abandonment_in = NOW()`
    API->>DB: Inserta mensaje system
    WebSocket Server-->>Sala: Emitir mensaje system

    Usuario->>Frontend: Clic en "Abandonar Sala"
    Frontend->>WebSocket Server: Emitir abandono
    WebSocket Server->>API: POST /rooms/{id}/abandon
    API->>DB: Marca `abandonment_in = NOW()`
    API->>DB: Inserta mensaje system
    WebSocket Server-->>Sala: Emitir mensaje system
```
---

## 🛠️ API Routes y Sistema HTTP Polling

### 📋 Resumen de Rutas API

El backend expone una API REST completa para manejar autenticación, salas, mensajes y archivos. Todas las rutas están prefijadas con `/api/`. El sistema utiliza **HTTP Polling** para simular comunicación en tiempo real.

#### 🔐 **Autenticación**
| Método | Ruta | Controlador | Middleware | Descripción |
|--------|------|-------------|------------|-------------|
| POST | `/register` | AuthController@register | `guest` | Registrar nuevo usuario |
| POST | `/login` | AuthController@login | `guest` | Iniciar sesión con email/password |
| POST | `/logout` | AuthController@logout | `auth:api` | Cerrar sesión (invalida token) |
| GET | `/me` | AuthController@me | `auth:api` | Obtener perfil del usuario actual |
| POST | `/token/refresh` | AuthController@refresh | `auth:api` | Renovar token JWT |

#### 👤 **Usuarios Anónimos**
| Método | Ruta | Controlador | Middleware | Descripción |
|--------|------|-------------|------------|-------------|
| POST | `/guest/init` | GuestController@init | `guest` | Iniciar sesión como anónimo |
| PATCH | `/guest/upgrade` | GuestController@upgrade | `auth:api` | Convertir anónimo a registrado |

#### 🏠 **Gestión de Salas**
| Método | Ruta | Controlador | Middleware | Descripción |
|--------|------|-------------|------------|-------------|
| GET | `/rooms` | RoomController@index | - | Listar salas públicas disponibles |
| GET | `/my-rooms` | RoomController@myRooms | `auth:api` | Obtener salas del usuario |
| POST | `/rooms` | RoomController@store | `auth:api` | Crear nueva sala |
| GET | `/rooms/{room}` | RoomController@show | `auth:api` | Obtener detalles de una sala |
| POST | `/rooms/{room}/join` | RoomController@join | `auth:api` | Unirse a sala (pública o privada) |
| POST | `/rooms/{room}/leave` | RoomController@leave | `auth:api` | Abandonar sala |

#### 💬 **Mensajería HTTP**
| Método | Ruta | Controlador | Middleware | Descripción |
|--------|------|-------------|------------|-------------|
| GET | `/messages` | MessageController@index | `auth:api` | Obtener mensajes con paginación |
| POST | `/messages` | MessageController@store | `auth:api` | Enviar mensaje nuevo |

#### 📁 **Gestión de Archivos**
| Método | Ruta | Controlador | Middleware | Descripción |
|--------|------|-------------|------------|-------------|
| POST | `/files/upload` | FileController@upload | `auth:api` | Subir archivo multimedia |
| GET | `/files/{file}` | FileController@show | `auth:api` | Ver/descargar archivo |

### 🔄 **Sistema HTTP Polling**

#### ⚡ **Flujo de Comunicación HTTP Polling**
1. **📱 Usuario Frontend**: Envía mensaje via POST `/api/messages`
2. **🖥️ Laravel Backend**: Guarda mensaje en base de datos y responde con el mensaje creado
3. **🔄 Frontend Polling**: Cada cliente consulta GET `/api/messages` cada 2 segundos
4. **📱 Actualización UI**: Frontend detecta nuevos mensajes y actualiza la interfaz

#### 🎛️ **Configuración de Polling**
```typescript
// Frontend Angular - environment.ts
export const environment = {
  polling: {
    messagesInterval: 2000,    // Consultar mensajes cada 2 segundos
    presenceInterval: 5000,    // Verificar presencia cada 5 segundos  
    enabled: true              // Habilitar sistema de polling
  }
};
```

#### 💡 **Implementación Frontend (Angular)**
```typescript
// Servicio de polling para mensajes
private startMessagePolling(): void {
  this.pollingSubscription = interval(environment.polling.messagesInterval)
    .pipe(
      switchMap(() => this.messageService.getMessages(this.roomId, 1))
    )
    .subscribe({
      next: (response) => {
        if (response.data) {
          this.updateMessagesFromPolling(response.data);
        }
      },
      error: (error) => {
        console.error('❌ Error en polling de mensajes:', error);
      }
    });
}

// Actualizar mensajes evitando duplicados
private updateMessagesFromPolling(data: MessagesResponse): void {
  if (data.data && Array.isArray(data.data)) {
    const existingIds = new Set(this.messages.map(m => m.id));
    const newMessages = data.data.filter((msg: Message) => !existingIds.has(msg.id));
    
    if (newMessages.length > 0) {
      this.messages = [...this.messages, ...newMessages].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      this.scrollToBottom();
    }
  }
}
```

#### 🌟 **Ventajas del HTTP Polling**
| Ventaja | Descripción |
|---------|-------------|
| ✅ **Simplicidad** | Implementación más simple que WebSockets |
| ✅ **Compatibilidad** | Funciona en cualquier navegador y red corporativa |
| ✅ **Debugging** | Fácil de depurar con herramientas HTTP estándar |
| ✅ **Resiliente** | Automáticamente se recupera de errores de red |
| ✅ **Escalable** | Fácil de balancear carga entre servidores |

#### ⚖️ **Consideraciones de Rendimiento**
- **Intervalo optimizado**: 2 segundos balancea tiempo real vs carga del servidor
- **Detección de duplicados**: Frontend filtra mensajes ya mostrados
- **Paginación eficiente**: Solo carga mensajes nuevos cuando es necesario
- **Manejo de errores**: Continúa el polling aunque fallen requests individuales

---

## 🎯 Objetivos del Sistema

| Objetivo | Estado | Descripción |
|----------|---------|-------------|
| ✅ **Tecnologías modernas** | Logrado | Laravel 12, Angular 20, WebSockets, MariaDB |
| ✅ **Sistema escalable** | Logrado | Arquitectura multicomponente con API REST |
| ✅ **Tiempo real** | Planificado | Comunicación WebSocket bidireccional |
| ✅ **Sin registro forzado** | Logrado | Soporte completo para usuarios anónimos |
| ✅ **Base para futuras mejoras** | Logrado | Reacciones, emojis, notificaciones, etc. |

---

## 📌 Estado del proyecto

| Componente | Estado | Descripción |
|------------|--------|-------------|
| Modelo de datos | ✅ **Finalizado** | Diagrama ER y estructura DBML completa |
| Diagramas UML | ✅ **Completado** | 6 diagramas de secuencia documentados |
| Backend API | ✅ **Completado** | Laravel + MariaDB + 16 rutas API funcionales |
| WebSocket | ✅ **Completado** | 3 eventos en tiempo real con Laravel Reverb |
| Autenticación | ✅ **Completado** | JWT Auth + usuarios anónimos + upgrade |
| Base de datos | ✅ **Completado** | 5 tablas con UUID, migraciones ejecutadas |
| Frontend | � **En Desarrollo** | Angular 20.x + DaisyUI + Tailwind CSS |

### 🎉 **Logros Recientes**
- ✅ **16 rutas API** creadas y funcionando
- ✅ **5 controladores** con lógica completa
- ✅ **3 eventos WebSocket** para tiempo real
- ✅ **Canales broadcasting** configurados
- ✅ **JWT Authentication** con soporte anónimo
- ✅ **Base de datos** con UUID y relaciones completas

---

💬 Créditos
Este proyecto fue desarrollado por **Jhoel Cruz**, estudiante de la **Universidad Privada Domingo Savio (UPDS)**, como parte del curso de **Programación Web II**, con fines educativos y de aprendizaje profesional.

### 🚀 **Comandos para Ejecutar el Proyecto**

```bash
# Backend Laravel
cd BackEnd
composer install
php artisan migrate:fresh --seed --seeder=DebugSeeder
php artisan serve --host=127.0.0.1 --port=8000

# Frontend Angular  
cd FrontEnd
npm install
ng serve --host=0.0.0.0 --port=4200
```

### 👥 **Usuarios de Prueba Predefinidos**
- **Admin**: `admin@mytimer.com` / `password`
- **Jhoel**: `jhoel0521@gmail.com` / `password`
- **Sala de Debug**: `019818d2-3be7-73aa-909f-387b36b70c35`

### ⚙️ **Configuración de Polling**
El sistema está configurado para realizar polling cada **2 segundos** para una experiencia de chat en tiempo real fluida y eficiente.
