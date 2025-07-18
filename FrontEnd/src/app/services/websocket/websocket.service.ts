import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { ConfigService } from '../config.service';
import { AuthService } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Declarar Pusher globalmente para Laravel Echo
declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: typeof Echo;
    }
}

export interface WebSocketMessage {
    type: string;
    data: any;
    channel?: string;
    timestamp?: string;
}

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private echo: any = null;
    private connectionStatus = new BehaviorSubject<boolean>(false);
    private messagesSubject = new Subject<WebSocketMessage>();
    private environment = environment;

    // Estados públicos
    public isConnected$ = this.connectionStatus.asObservable();
    public messages$ = this.messagesSubject.asObservable();

    constructor(
        private configService: ConfigService,
        private authService: AuthService,
        private http: HttpClient
    ) {
        this.initializeWebSocket();
    }

    /**
     * Inicializar conexión WebSocket
     */
    private initializeWebSocket(): void {
        this.setupEcho();
    }

    /**
     * Configurar Laravel Echo
     */
    private setupEcho(): void {
        const token = this.authService.getToken();
        const wsConfig = environment.websocket;

        if (typeof window !== 'undefined') {
            (window as any).Pusher = Pusher;
        }

        try {
            this.echo = new Echo({
                broadcaster: 'reverb',
                key: wsConfig.key,
                wsHost: wsConfig.wsHost,
                wsPort: wsConfig.wsPort,
                wssPort: wsConfig.wssPort,
                forceTLS: wsConfig.forceTLS,
                enabledTransports: wsConfig.enabledTransports,
                auth: {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                },
                authEndpoint: `${wsConfig.authEndpoint}`
            });

            this.setupConnectionEvents();
        } catch (error) {
            console.error('Error al inicializar Echo:', error);
        }
    }

    /**
     * Configurar eventos de conexión
     */
    private setupConnectionEvents(): void {
        if (!this.echo) {
            console.error('❌ Echo no está disponible');
            return;
        }

        // Verificar que el connector exista
        if (!this.echo.connector) {
            console.error('❌ Echo connector no está disponible');
            return;
        }

        console.log('🔌 Echo inicializado:', this.echo);
        console.log('🔌 Echo connector:', this.echo.connector);

        // Para Reverb, usar el evento 'connected' del connector
        this.echo.connector.pusher.connection.bind('connected', () => {
            console.log('✅ WebSocket conectado');
            this.connectionStatus.next(true);
        });

        this.echo.connector.pusher.connection.bind('disconnected', () => {
            console.log('❌ WebSocket desconectado');
            this.connectionStatus.next(false);
        });

        this.echo.connector.pusher.connection.bind('error', (error: any) => {
            console.error('❌ Error de conexión WebSocket:', error);
            this.connectionStatus.next(false);
        });

        this.echo.connector.pusher.connection.bind('connecting', () => {
            console.log('🔄 WebSocket conectando...');
        });

        this.echo.connector.pusher.connection.bind('state_change', (states: any) => {
            console.log('🔄 Estado WebSocket cambió:', states);
            if (states.current === 'connected') {
                this.connectionStatus.next(true);
            } else if (states.current === 'disconnected') {
                this.connectionStatus.next(false);
            }
        });
    }

    /**
     * Suscribirse a una sala de chat
     */
    subscribeToRoom(roomId: string): Observable<any> {
        const roomMessages = new Subject<any>();

        if (!this.echo) {
            console.error('❌ Echo no está inicializado');
            return roomMessages.asObservable();
        }

        // Verificar conexión primero
        if (!this.connectionStatus.value) {
            console.warn('⚠️ WebSocket no está conectado, esperando conexión...');

            // Esperar a que se conecte
            this.isConnected$.subscribe(connected => {
                if (connected) {
                    console.log('✅ WebSocket conectado, ahora suscribiendo a sala...');
                    this.performRoomSubscription(roomId, roomMessages);
                }
            });

            return roomMessages.asObservable();
        }

        // Si ya está conectado, suscribirse directamente
        this.performRoomSubscription(roomId, roomMessages);
        return roomMessages.asObservable();
    }

    /**
     * Realizar la suscripción a la sala
     */
    private performRoomSubscription(roomId: string, roomMessages: Subject<any>): void {
        console.log(`🔌 Suscribiendo a canal PRESENCE: room.${roomId}`);

        try {
            // Usar canal PRESENCE (requiere autenticación pero permite client events)
            const channel = this.echo.join(`room.${roomId}`);

            // Escuchar evento de mensaje enviado
            channel.listen('message.sent', (data: any) => {
                console.log('📨 Nuevo mensaje recibido:', data);
                roomMessages.next({
                    type: 'message.sent',
                    data: data,
                    channel: `room.${roomId}`
                });
            });

            // Escuchar evento de usuario que se unió
            channel.listen('user.joined', (data: any) => {
                console.log('👤 Usuario se unió:', data);
                roomMessages.next({
                    type: 'user.joined',
                    data: data,
                    channel: `room.${roomId}`
                });
            });

            // Escuchar evento de usuario que salió
            channel.listen('user.left', (data: any) => {
                console.log('👤 Usuario salió:', data);
                roomMessages.next({
                    type: 'user.left',
                    data: data,
                    channel: `room.${roomId}`
                });
            });

            // Escuchar evento de mensajes cargados
            channel.listen('messages.loaded', (data: any) => {
                console.log('📚 Mensajes cargados:', data);
                roomMessages.next({
                    type: 'messages.loaded',
                    data: data,
                    channel: `room.${roomId}`
                });
            });

            console.log('✅ Suscripción a canal PRESENCE exitosa');

        } catch (error) {
            console.error('❌ Error suscribiendo a canal PRESENCE:', error);
        }
    }

    /**
     * Desuscribirse de una sala
     */
    unsubscribeFromRoom(roomId: string): void {
        if (!this.echo) return;

        console.log(`🔌 Desuscribiendo de canal: room.${roomId}`);
        this.echo.leave(`room.${roomId}`);
    }

    /**
     * Desconectar WebSocket
     */
    disconnect(): void {
        if (this.echo) {
            this.echo.disconnect();
            this.connectionStatus.next(false);
        }
    }

    /**
     * Verificar si está conectado
     */
    isConnected(): boolean {
        return this.connectionStatus.value;
    }

    /**
     * Cargar mensajes por WebSocket PURO (sin HTTP)
     */
    loadMessages(roomId: string, timestamp?: string, page: number = 1): void {
        console.log('📚 Solicitando mensajes por WebSocket híbrido...');

        // ⚠️ IMPORTANTE: Configurar listener ANTES de hacer la petición
        this.setupMessageResponseListener(roomId, 'get.messages');

        // Preparar datos para la petición
        const requestData = {
            room_id: roomId,
            timestamp: timestamp || null,
            page: page
        };

        console.log('📚 Enviando solicitud de mensajes:', requestData);

        // Hacer petición HTTP a la ruta WebSocket específica
        // Esto automáticamente enviará la respuesta por broadcasting
        this.http.post(`${this.environment.apiUrl}/ws/messages/get`, requestData, {
            headers: {
                'Authorization': `Bearer ${this.authService.getToken()}`,
                'Content-Type': 'application/json'
            }
        }).subscribe({
            next: (response: any) => {
                console.log('✅ Solicitud de mensajes procesada correctamente');
                // La respuesta llegará por WebSocket broadcasting automáticamente
            },
            error: (error) => {
                console.error('❌ Error al solicitar mensajes:', error);
                // Emitir error al Subject
                this.messagesSubject.next({
                    type: 'get.messages.error',
                    data: { error: error.error?.error || 'Error al cargar mensajes' }
                });
            }
        });
    }

    /**
     * Enviar mensaje por WebSocket PURO (sin HTTP)
     */
    sendMessage(roomId: string, content: string, userId: string, type: string = 'text'): void {
        console.log('📨 Enviando mensaje por WebSocket híbrido...');

        // Preparar datos para la petición
        const requestData = {
            room_id: roomId,
            message: content,
            message_type: type
        };

        console.log('📨 Enviando mensaje:', requestData);

        // Hacer petición HTTP a la ruta WebSocket específica
        // Esto automáticamente enviará la respuesta por broadcasting
        this.http.post(`${this.environment.apiUrl}/ws/messages/send`, requestData, {
            headers: {
                'Authorization': `Bearer ${this.authService.getToken()}`,
                'Content-Type': 'application/json'
            }
        }).subscribe({
            next: (response: any) => {
                console.log('✅ Mensaje enviado correctamente');
                // La respuesta llegará por WebSocket broadcasting automáticamente
            },
            error: (error) => {
                console.error('❌ Error al enviar mensaje:', error);
                // Emitir error al Subject
                this.messagesSubject.next({
                    type: 'message.send.error',
                    data: { error: error.error?.error || 'Error al enviar mensaje' }
                });
            }
        });

        // Configurar listener para la respuesta por WebSocket
        this.setupMessageResponseListener(roomId, 'message.send');
    }

    /**
     * Configurar listeners para respuestas del servidor
     */
    private setupMessageResponseListener(roomId: string, eventType: string): void {
        if (!this.echo) {
            console.error('❌ Echo no está inicializado');
            return;
        }

        const channel = this.echo.join(`room.${roomId}`);
        const responseEvent = `${eventType}.response`;
        
        // Solo configurar el listener una vez
        if (!this.responseListeners.has(responseEvent)) {
            this.responseListeners.add(responseEvent);
            
            channel.listen(responseEvent, (data: any) => {
                console.log(`✅ Respuesta WebSocket recibida para ${eventType}:`, data);
                
                // Emitir el evento a través del Subject para que el componente lo procese
                this.messagesSubject.next({
                    type: eventType,
                    data: data.data || data,
                    timestamp: data.timestamp || new Date().toISOString()
                });
            });
        }
    }

    // Set para rastrear listeners configurados y evitar duplicados
    private responseListeners = new Set<string>();
}
