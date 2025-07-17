import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth/auth.service';
import { RoomService, Room } from '../../services/room/room.service';
import { MessageService, Message } from '../../services/message/message.service';
import { WebSocketService } from '../../services/websocket/websocket.service';
import { MessageComponent } from '../../components/message/message.component';
import { ChatFormComponent, ChatFormData } from '../../components/chat-form/chat-form.component';
import { ApiResponse } from '../../services/api';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, MessageComponent, ChatFormComponent],
  templateUrl: './room.component.html',
  styleUrl: './room.component.css'
})
export class RoomComponent implements OnInit, OnDestroy {
  roomId: string = '';
  room: Room | null = null;
  currentUser: User | null = null;
  messages: Message[] = [];

  // Estados de carga
  isLoadingRoom = true;
  isLoadingMessages = true;

  // Errores
  roomError = '';
  messagesError = '';

  // Estados WebSocket
  isWebSocketConnected = false;

  // Subscripciones
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private roomService: RoomService,
    private messageService: MessageService,
    private webSocketService: WebSocketService
  ) { }

  ngOnInit(): void {
    // Obtener ID de la sala desde la ruta
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    
    console.log('🚀 Iniciando RoomComponent con roomId:', this.roomId);
    console.log('🚀 URL actual:', window.location.href);

    if (!this.roomId) {
      console.log('❌ No se encontró roomId, redirigiendo a dashboard');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Verificar autenticación
    const authSub = this.authService.currentUser$.subscribe(user => {
      console.log('👤 Usuario actual:', user);
      this.currentUser = user;
      if (!user) {
        console.log('❌ Usuario no autenticado, redirigiendo a login');
        this.router.navigate(['/login']);
        return;
      }

      // Cargar datos de la sala
      this.loadRoom();
      this.loadMessages();
      
      // Configurar WebSocket después de cargar datos
      this.setupWebSocket();
    });

    this.subscriptions.push(authSub);
  }

  ngOnDestroy(): void {
    // Desconectar WebSocket al salir
    this.webSocketService.unsubscribeFromRoom(this.roomId);
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Configurar conexión WebSocket
   */
  private setupWebSocket(): void {
    console.log('🔌 Configurando WebSocket para la sala:', this.roomId);
    
    // Suscribirse al estado de conexión
    const connectionSub = this.webSocketService.isConnected$.subscribe(isConnected => {
      this.isWebSocketConnected = isConnected;
      console.log('🔌 Estado de conexión WebSocket:', isConnected ? 'Conectado' : 'Desconectado');
    });
    
    // Suscribirse a mensajes en tiempo real
    const roomMessagesSub = this.webSocketService.subscribeToRoom(this.roomId).subscribe(wsMessage => {
      console.log('📨 Mensaje WebSocket recibido:', wsMessage);
      
      switch (wsMessage.type) {
        case 'message.sent':
          this.handleNewMessage(wsMessage.data);
          break;
        case 'user.joined':
          this.handleUserJoined(wsMessage.data);
          break;
        case 'user.left':
          this.handleUserLeft(wsMessage.data);
          break;
        default:
          console.log('📨 Evento WebSocket no manejado:', wsMessage.type);
      }
    });

    this.subscriptions.push(connectionSub, roomMessagesSub);
  }

  /**
   * Manejar nuevo mensaje recibido por WebSocket
   */
  private handleNewMessage(messageData: any): void {
    console.log('📨 Procesando nuevo mensaje:', messageData);
    
    if (messageData.message) {
      // Agregar el mensaje a la lista si no existe ya
      const existingMessage = this.messages.find(msg => msg.id === messageData.message.id);
      if (!existingMessage) {
        this.messages.push(messageData.message);
        this.scrollToBottom();
      }
    }
  }

  /**
   * Manejar usuario que se unió a la sala
   */
  private handleUserJoined(userData: any): void {
    console.log('👤 Usuario se unió:', userData);
    // TODO: Mostrar notificación de usuario que se unió
  }

  /**
   * Manejar usuario que salió de la sala
   */
  private handleUserLeft(userData: any): void {
    console.log('👤 Usuario salió:', userData);
    // TODO: Mostrar notificación de usuario que salió
  }

  /**
   * Cargar información de la sala
   */
  loadRoom(): void {
    this.isLoadingRoom = true;
    this.roomError = '';
    this.roomService.getRoom(this.roomId).subscribe({
      next: (response: ApiResponse<Room>) => {
        this.isLoadingRoom = false;
        if (response.data) {
          this.room = response.data;
        } else {
          this.roomError = 'No se pudo cargar la información de la sala';
          console.warn('⚠️ No se pudo cargar la sala');
        }
      },
      error: (error: any) => {
        this.isLoadingRoom = false;
        this.roomError = 'Error al cargar la sala';
        console.error('❌ Error loading room:', error);
      }
    });
  }

  /**
   * Cargar mensajes de la sala
   */
  loadMessages(): void {
    this.isLoadingMessages = true;
    this.messagesError = '';
    this.messageService.getMessages(this.roomId).subscribe({
      next: (response: any) => {
        this.isLoadingMessages = false;
        // La estructura real del backend es: response.messages.data
        if (response.messages && response.messages.data) {
          this.messages = response.messages.data;
        } else {
          this.messages = [];
          console.warn('⚠️ No se encontraron mensajes o estructura incorrecta');
          console.warn('⚠️ Estructura recibida:', response);
        }
      },
      error: (error: any) => {
        this.isLoadingMessages = false;
        this.messagesError = 'Error al cargar los mensajes';
        console.error('❌ Error loading messages:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
      }
    });
  }

  /**
   * Enviar nuevo mensaje
   */
  onSendMessage(messageData: ChatFormData): void {
    if (!this.currentUser) return;

    this.messageService.sendMessage(this.roomId, messageData).subscribe({
      next: (response: ApiResponse<Message>) => {
        if (response.data) {
          // Agregar el nuevo mensaje a la lista
          this.messages.push(response.data);
          // Scroll hacia abajo
          this.scrollToBottom();
        }
      },
      error: (error: any) => {
        console.error('Error sending message:', error);
        // TODO: Mostrar mensaje de error al usuario
      }
    });
  }

  /**
   * Verificar si el usuario actual es el autor del mensaje
   */
  isMessageAuthor(message: Message): boolean {
    return this.currentUser?.id === message.user_id;
  }

  /**
   * Scroll hacia el final de los mensajes
   */
  private scrollToBottom(): void {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  /**
   * Volver al dashboard
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Verificar si el usuario es creador de la sala
   */
  isRoomCreator(): boolean {
    return this.currentUser?.id === this.room?.created_by;
  }

  /**
   * Función para trackBy en ngFor
   */
  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }
}
