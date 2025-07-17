import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { ConfigService } from '../config.service';
import { AuthService } from '../auth/auth.service';
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
    channel: string;
}

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private echo: any = null;
    private connectionStatus = new BehaviorSubject<boolean>(false);
    private messagesSubject = new Subject<WebSocketMessage>();

    // Estados públicos
    public isConnected$ = this.connectionStatus.asObservable();
    public messages$ = this.messagesSubject.asObservable();

    constructor(
        private configService: ConfigService,
        private authService: AuthService
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
        const wsConfig = this.configService.websocketConfig;
        const token = this.authService.getToken();

        console.log('🔌 Configurando Echo...');
        console.log('🔌 Token disponible:', token ? 'SÍ' : 'NO');
        console.log('🔌 Token (full):', token);
        console.log('🔌 Auth endpoint:', `${this.configService.baseUrl}/broadcasting/auth`);

        if (!token) {
            console.error('❌ No hay token de autenticación disponible');
            return;
        }

        // Configurar Pusher globalmente
        (window as any).Pusher = Pusher;

        // Configurar Echo para Laravel Reverb
        console.log('🔌 Configuración Echo:', {
            broadcaster: 'reverb',
            key: wsConfig.key,
            wsHost: wsConfig.wsHost,
            wsPort: wsConfig.wsPort,
            wssPort: wsConfig.wssPort,
            forceTLS: wsConfig.forceTLS,
            enabledTransports: wsConfig.enabledTransports,
            authEndpoint: `${this.configService.baseUrl}/broadcasting/auth`
        });

        try {
            this.echo = new Echo({
                broadcaster: 'reverb',
                key: wsConfig.key,
                wsHost: wsConfig.wsHost,
                wsPort: wsConfig.wsPort,
                wssPort: wsConfig.wssPort,
                forceTLS: wsConfig.forceTLS,
                enabledTransports: wsConfig.enabledTransports,

                // Configuración de autenticación
                auth: {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                },

                // Endpoint de autenticación completo
                authEndpoint: `${this.configService.baseUrl}/broadcasting/auth`,
            });

            console.log('✅ Echo creado exitosamente');
        } catch (error) {
            console.error('❌ Error al crear Echo:', error);
            return;
        }

        // Verificar que Echo se haya inicializado correctamente
        if (!this.echo) {
            console.error('❌ Echo no se inicializó correctamente');
            return;
        }

        console.log('🔌 Echo inicializado:', this.echo);
        console.log('🔌 Echo connector:', this.echo.connector);

        // Configurar eventos de conexión
        this.setupConnectionEvents();
    }

    /**
     * Configurar eventos de conexión
     */
    private setupConnectionEvents(): void {
        if (!this.echo || !this.echo.connector || !this.echo.connector.socket) {
            console.error('❌ Echo connector no está disponible');
            return;
        }

        this.echo.connector.socket.on('connect', () => {
            console.log('✅ WebSocket conectado');
            this.connectionStatus.next(true);
        });

        this.echo.connector.socket.on('disconnect', () => {
            console.log('❌ WebSocket desconectado');
            this.connectionStatus.next(false);
        });

        this.echo.connector.socket.on('error', (error: any) => {
            console.error('❌ Error de conexión WebSocket:', error);
            this.connectionStatus.next(false);
        });
    }

    /**
     * Suscribirse a una sala de chat
     */
    subscribeToRoom(roomId: string): Observable<any> {
        const roomMessages = new Subject<any>();

        if (!this.echo) {
            console.error('Echo no está inicializado');
            return roomMessages.asObservable();
        }

        console.log(`🔌 Suscribiendo a canal: room.${roomId}`);

        // Usar canal privado (requiere autenticación)
        const channel = this.echo.private(`private-room.${roomId}`);

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

        return roomMessages.asObservable();
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
}
