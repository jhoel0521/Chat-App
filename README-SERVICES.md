# Chat App - Iniciador de Servicios

Este script automatiza el inicio de todos los servicios necesarios para la aplicación Chat App.

## 🚀 Servicios que inicia

1. **Laravel API** (Backend) - Puerto 8000
   - Servidor web principal con las APIs REST
   - Maneja autenticación, salas, mensajes, etc.

2. **Laravel Reverb** (WebSocket) - Puerto 8080
   - Servidor WebSocket para comunicación en tiempo real
   - Maneja mensajes instantáneos, notificaciones, etc.

3. **Angular** (Frontend) - Puerto 4200
   - Aplicación web cliente
   - Interfaz de usuario para el chat

## 📋 Requisitos

- **Node.js** (v14 o superior)
- **PHP** (v8.1 o superior)
- **Angular CLI** (se instala automáticamente si no está presente)
- **Composer** (para dependencias de Laravel)

## 🔧 Instalación

1. Clona el repositorio
2. Instala las dependencias del backend:
   ```bash
   cd BackEnd
   composer install
   ```

3. Instala las dependencias del frontend:
   ```bash
   cd FrontEnd
   npm install
   ```

4. Configura el archivo `.env` en el directorio BackEnd (copia de `.env.example`)

## 🎯 Uso

### Opción 1: Ejecutar con Node.js
```bash
node start-services.js
```

### Opción 2: Ejecutar con npm
```bash
npm run start
# o
npm run dev
# o
npm run services
```

### Opción 3: Ejecutar con batch (Windows)
```cmd
start-services.bat
```

## 🔗 URLs de los servicios

Una vez iniciados todos los servicios:

- **Frontend (Angular)**: http://localhost:4200
- **Backend API (Laravel)**: http://localhost:8000
- **WebSocket (Reverb)**: ws://localhost:8080

## 🛑 Detener servicios

Para detener todos los servicios:
- Presiona `Ctrl+C` en la terminal donde se ejecuta el script

## 🐛 Solución de problemas

### Error: Puerto ocupado
El script automáticamente libera los puertos 8000, 8080 y 4200 antes de iniciar los servicios.

### Error: Comando no encontrado
Verifica que tengas instalados:
- Node.js
- PHP
- Angular CLI (se instala automáticamente)

### Error: No se puede conectar a la base de datos
Asegúrate de que:
1. El archivo `.env` esté configurado correctamente
2. La base de datos esté corriendo
3. Las credenciales de la base de datos sean correctas

### Error: Permisos en Windows
Ejecuta el terminal como administrador si tienes problemas de permisos.

## 📝 Logs

El script muestra logs en tiempo real de todos los servicios con colores:
- 🟢 Verde: Laravel API
- 🟣 Magenta: Laravel Reverb (WebSocket)
- 🔵 Azul: Angular
- 🔴 Rojo: Errores

## 🔧 Personalización

Puedes modificar los puertos editando el archivo `start-services.js`:
- `8000`: Puerto de Laravel API
- `8080`: Puerto de Laravel Reverb
- `4200`: Puerto de Angular

## 📄 Licencia

MIT License
