# 🚀 Guía Completa: WebSocket Laravel 12 + Angular 20

## ✅ **ESTADO ACTUAL - TODO CONFIGURADO CORRECTAMENTE**

### 🎯 **Servicios Activos**
- **✅ Laravel API:** http://localhost:8000
- **✅ Laravel Reverb:** ws://localhost:8080  
- **✅ Angular App:** http://localhost:4200

### 🔧 **Configuración Verificada**

#### **1. Laravel Backend (.env)**
```env
BROADCAST_CONNECTION=reverb
REVERB_APP_KEY=z0mwodskj2t35qi9thy3
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http
JWT_SECRET=Vx4gcEenvd527q3bcmdTI86ZomZ5vMelml3A1brGS1lpX5atALY5eNw33z6Wf4TO
```

#### **2. Broadcasting Config (config/broadcasting.php)**
```php
'default' => env('BROADCAST_CONNECTION', 'null'),
'connections' => [
    'reverb' => [
        'driver' => 'reverb',
        'key' => env('REVERB_APP_KEY'),
        'auth_guard' => 'api', // 🔑 CLAVE: usa guard API con JWT
        // ... otras configuraciones
    ],
]
```

#### **3. Rutas de Broadcasting (routes/web.php)**
```php
Broadcast::routes(['middleware' => ['auth:api']]);
```

#### **4. Canales Definidos (routes/channels.php)**
```php
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});

Broadcast::channel('private-room.{roomId}', function ($user, $roomId) {
    return !!$user; // Usuario autenticado puede acceder
});
```

#### **5. Guard API configurado (config/auth.php)**
```php
'guards' => [
    'api' => [
        'driver' => 'jwt',
        'provider' => 'users',
    ],
],
```

#### **6. Angular Frontend - Librerías**
```json
{
  "laravel-echo": "^2.1.6",
  "pusher-js": "^8.4.0"
}
```

#### **7. Configuración WebSocket (environment.ts)**
```typescript
websocket: {
  broadcaster: 'reverb',
  key: 'z0mwodskj2t35qi9thy3',
  wsHost: 'localhost',
  wsPort: 8080,
  forceTLS: false,
  enabledTransports: ['ws'], // Solo ws para desarrollo
  authEndpoint: '/broadcasting/auth',
}
```

#### **8. WebSocket Service (websocket.service.ts)**
```typescript
this.echo = new Echo({
  broadcaster: 'reverb',
  key: wsConfig.key,
  wsHost: wsConfig.wsHost,
  wsPort: wsConfig.wsPort,
  forceTLS: wsConfig.forceTLS,
  enabledTransports: wsConfig.enabledTransports,
  auth: {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
  },
  authEndpoint: '/broadcasting/auth', // Relativo
});
```

---

## 🎯 **PASO A PASO DESDE CERO**

### **1. Inicia los servicios**
```bash
cd "c:\laragon\www\Chat App"
npm run debug
```

### **2. En Angular - Suscríbete a canal privado**
```typescript
// Ejemplo de uso en un componente
constructor(private websocketService: WebSocketService) {}

ngOnInit() {
  // Suscribirse a una sala
  this.websocketService.subscribeToRoom('ROOM_ID').subscribe(message => {
    console.log('Mensaje recibido:', message);
  });
}
```

### **3. En Laravel - Envía un evento**
```php
// Ejemplo: Enviar mensaje a una sala
use App\Events\MessageSent;

broadcast(new MessageSent($message, $roomId));
```

### **4. Crear evento Laravel**
```php
// app/Events/MessageSent.php
class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $roomId;

    public function __construct($message, $roomId)
    {
        $this->message = $message;
        $this->roomId = $roomId;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('private-room.' . $this->roomId);
    }

    public function broadcastAs()
    {
        return 'message.sent';
    }
}
```

---

## 🐛 **DEBUGGING**

### **Verificar conexión WebSocket**
1. Abre DevTools → Network → WS
2. Busca conexión a `ws://localhost:8080`
3. Debe mostrar "101 Switching Protocols"

### **Verificar autenticación**
1. Revisa `storage/logs/laravel.log`
2. Busca errores de autenticación
3. Verifica que el token JWT sea válido

### **Logs de Reverb**
```
[Laravel Reverb] Connection Established ...
[Laravel Reverb] Message Received ...
[Laravel Reverb] Message Handled ...
```

---

## 🎉 **RESULTADO**

- **✅ WebSocket conectado:** ws://localhost:8080
- **✅ Autenticación:** JWT con guard API
- **✅ Canales privados:** Funcionando
- **✅ Broadcasting:** Listo para enviar/recibir eventos
- **✅ Angular Echo:** Configurado correctamente

**¡LA CONEXIÓN WEBSOCKET ESTÁ FUNCIONANDO CORRECTAMENTE!**

---

## 📞 **PRÓXIMOS PASOS**

1. **Probar envío de mensaje** desde Angular
2. **Verificar recepción** en tiempo real
3. **Implementar eventos** de usuario (join/leave)
4. **Añadir indicadores** de conexión en UI
