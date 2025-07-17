export const environment = {
  production: false,

  // 🌐 API Configuration
  apiUrl: 'http://localhost:8000/api',
  baseUrl: 'http://localhost:8000',

  // 🔐 Authentication
  tokenKey: 'chat_app_token',
  refreshTokenKey: 'chat_app_refresh_token',
  userKey: 'chat_app_user',
  guestKey: 'chat_app_guest',

  // 🚫 Rutas excluidas del token Authorization (no requieren autenticación)
  excludedAuthRoutes: [
    '/login',
    '/register',
    '/guest/init',
    '/token/refresh',
  ],

  // 🔌 WebSocket Configuration (Laravel Reverb)
  websocket: {
    broadcaster: 'reverb',
    key: 'z0mwodskj2t35qi9thy3',
    wsHost: 'localhost', // Host fijo para desarrollo
    wsPort: 8080,
    wssPort: 443, // Cambiar a 443 para producción
    forceTLS: false,
    enabledTransports: ['ws', 'wss'], // Restaurar ambos para compatibilidad
    authEndpoint: 'http://localhost:8000/broadcasting/auth', // URL completa
    auth: {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    }
  },

  // 📁 File Upload
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },

  // ⏱️ Timeouts and Intervals
  timeouts: {
    apiRequest: 30000, // 30 seconds
    tokenRefresh: 300000, // 5 minutes
    heartbeat: 30000, // 30 seconds
    reconnectDelay: 5000 // 5 seconds
  },

  // 📱 App Configuration
  app: {
    name: 'Chat App',
    version: '1.0.0',
    description: 'Real-time chat application',
    author: 'Jhoel Cruz - UPDS'
  },

  // 🎨 UI Configuration
  ui: {
    messagesPerPage: 50,
    autoScrollDelay: 100,
    typingIndicatorDelay: 3000,
    notificationDuration: 5000
  }
};
