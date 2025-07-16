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
