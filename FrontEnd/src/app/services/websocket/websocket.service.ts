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

        console.log('🔌 Configurando Echo para canales PÚBLICOS...');
        console.log('🔌 Sin autenticación requerida');

        // Configurar Pusher globalmente
        (window as any).Pusher = Pusher;

        // Configurar Echo para Laravel Reverb - SIN AUTENTICACIÓN
        console.log('🔌 Configuración Echo (público):', {
            broadcaster: 'reverb',
            key: wsConfig.key,
            wsHost: wsConfig.wsHost,
            wsPort: wsConfig.wsPort,
            forceTLS: wsConfig.forceTLS,
            enabledTransports: wsConfig.enabledTransports
        });

        try {
            this.echo = new Echo({
                broadcaster: 'reverb',
                key: wsConfig.key,
                wsHost: wsConfig.wsHost,
                wsPort: wsConfig.wsPort,
                wssPort: wsConfig.wssPort,
                forceTLS: wsConfig.forceTLS,
                enabledTransports: wsConfig.enabledTransports
                // NO AUTH - Solo canales públicos
            });

            console.log('✅ Echo creado exitosamente (sin autenticación)');
            
            // Esperar a que el connector se inicialice
            setTimeout(() => {
                this.setupConnectionEvents();
            }, 100);
            
        } catch (error) {
            console.error('❌ Error al crear Echo:', error);
            return;
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
        console.log(`🔌 Suscribiendo a canal público: room.${roomId}`);

        try {
            // Usar canal PÚBLICO (NO requiere autenticación)
            const channel = this.echo.channel(`room.${roomId}`);

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

            console.log('✅ Suscripción a canal público exitosa');

        } catch (error) {
            console.error('❌ Error suscribiendo a canal público:', error);
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
}
