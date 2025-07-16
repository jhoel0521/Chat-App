# 🧠 Chat App – Proyecto de Programación Web II

Autor: **Jhoel Cruz**  
Universidad: **UPDS** – 6to Semestre de Ingeniería de Sistemas  
Materia: **Programación Web II**

---

## 📘 Descripción del proyecto

Esta aplicación es una plataforma de **chat en tiempo real** desarrollada como proyecto universitario. Combina tecnologías modernas como **PHP (Laravel)**, **MariaDB**, **WebSockets**, y **Angular** para ofrecer un sistema completo de salas de chat que permite:

- Chatear en **salas públicas o privadas**
- Soporte para **usuarios anónimos** o **registrados**
- Diferentes **tipos de mensajes** (texto con Markdown, imágenes, audio, video y documentos)
- Funcionalidad en **tiempo real** con WebSockets
- Persistencia de mensajes para usuarios registrados
- Registro en caliente: un usuario anónimo puede registrarse y conservar sus mensajes

---

## 🛠️ Tecnologías utilizadas

| Componente        | Tecnología                  |
|-------------------|-----------------------------|
| Backend           | Laravel 12.x (PHP 8.4)       |
| Base de datos     | MariaDB 10.x                |
| Realtime          | Laravel WebSockets (`beyondcode/laravel-websockets`) |
| Frontend          | Angular 20.x                |
| Comunicación      | API REST y WebSocket        |

---

## 🗃️ Diagrama de Base de Datos

Este es el modelo de base de datos utilizado para estructurar las entidades principales del sistema:

![Modelo de datos](https://dbdiagram.io/d/Chat-67801be46b7fa355c36ede4b)

> Puedes editar este modelo en: https://dbdiagram.io
<details>
<summary>🧩 Estructura DBML</summary>
```dbml
Table users {
  id uuid [pk]
  name varchar
  email varchar [unique, null]
  password varchar [null]
  is_anonymous boolean [default: false]
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
🔄 Diagramas de proceso
A continuación se detallan los 6 flujos principales de uso, modelados con diagramas de secuencia para representar cómo interactúan los componentes del sistema.

1️⃣ Crear cuenta
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
2️⃣ Usuario anónimo elige nombre temporal
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
3️⃣ Usuario crea una sala

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

4️⃣ Chatear normalmente en una sala

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
5️⃣ Usuario anónimo se registra y conserva sus mensajes
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
6️⃣ Usuario abandona sala o pierde sesión
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
🎯 Objetivos del sistema
✅ Fomentar el uso de tecnologías modernas

✅ Desarrollar un sistema multicomponente escalable

✅ Implementar comunicación en tiempo real (WebSocket)

✅ Permitir el uso del sistema sin forzar el registro

✅ Ofrecer una base sólida para futuras mejoras (reacciones, emojis, notificaciones, etc.)

📌 Estado del proyecto
Componente	Estado
Modelo de datos	✅ Finalizado
Diagramas UML	✅ Hecho
Backend API	🔜 En desarrollo
WebSocket	🔜 En desarrollo
Frontend	🔜 En desarrollo

💬 Créditos
Este proyecto fue desarrollado por Jhoel Cruz, estudiante de la Universidad Privada Domingo Savio (UPDS), como parte del curso de Programación Web II, con fines educativos y de aprendizaje profesional.
