import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService, User } from '../../services/auth/auth.service';
import { RoomService, Room } from '../../services/room/room.service';
import { MessageService, Message, MessagesResponse } from '../../services/message/message.service';
import { MessageComponent } from '../../components/message/message.component';
import { ChatFormComponent, ChatFormData } from '../../components/chat-form/chat-form.component';
import { ApiResponse } from '../../services/api';
import { environment } from '../../../environments/environment';

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

  // Sincronización por timestamp
  private lastTimestamp: string | null = null;
  private pollingSubscription?: Subscription;
  private isPollingActive = false;

  // Subscripciones
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService = inject(AuthService),
    private roomService: RoomService = inject(RoomService),
    private messageService: MessageService = inject(MessageService)
  ) { }

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.roomId) this.router.navigate(['/dashboard']);

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) this.router.navigate(['/login']);

      this.loadRoom();
      this.loadInitialMessages();
    });
  }

  ngOnDestroy(): void {
    this.stopMessagePolling();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Cargar mensajes iniciales
   */
  private loadInitialMessages(): void {
    this.isLoadingMessages = true;
    this.messageService.getMessages(this.roomId).subscribe({
      next: (response) => {
        if (response.data) {
          this.processMessageResponse(response.data);
          this.startMessagePolling();
        }
        this.isLoadingMessages = false;
      },
      error: (error) => {
        this.isLoadingMessages = false;
        this.messagesError = 'Error al cargar mensajes';
        console.error('❌ Error loading initial messages:', error);
      }
    });
  }

  /**
   * Iniciar polling de mensajes
   */
  private startMessagePolling(): void {
    if (this.isPollingActive) return;

    console.log('🔄 Iniciando polling de mensajes cada', environment.polling.messagesInterval, 'ms');
    this.isPollingActive = true;

    this.pollingSubscription = timer(0, environment.polling.messagesInterval).pipe(
      switchMap(() => this.messageService.getMessages(this.roomId, this.lastTimestamp))
    ).subscribe({
      next: (response) => {
        if (response.data) {
          this.processMessageResponse(response.data);
        }
      },
      error: (error) => {
        console.error('❌ Error en polling de mensajes:', error);
      }
    });

    this.subscriptions.push(this.pollingSubscription);
  }

  /**
   * Detener polling de mensajes
   */
  private stopMessagePolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
    this.isPollingActive = false;
    console.log('⏹️ Polling de mensajes detenido');
  }

  /**
   * Procesar respuesta de mensajes
   */
  private processMessageResponse(data: any): void {
    if (data.messages && Array.isArray(data.messages)) {
      // Filtrar mensajes duplicados
      const existingIds = new Set(this.messages.map(m => m.id));
      const newMessages = data.messages.filter((msg: Message) => !existingIds.has(msg.id));

      if (newMessages.length > 0) {
        console.log(`📨 ${newMessages.length} nuevos mensajes recibidos`);
        this.messages = [...this.messages, ...newMessages];
        this.scrollToBottom();
      }
      // Actualizar timestamp para la próxima solicitud
      if (data.last_timestamp) {
        this.lastTimestamp = data.last_timestamp;
      }
    }
  }

  /**
   * Cargar información de la sala
   */
  public loadRoom(): void {
    this.isLoadingRoom = true;
    this.roomService.getRoom(this.roomId).subscribe({
      next: (response: ApiResponse<Room>) => {
        this.isLoadingRoom = false;
        this.room = response.data || null;
      },
      error: (error) => {
        this.isLoadingRoom = false;
        this.roomError = 'Error al cargar la sala';
        console.error('❌ Error loading room:', error);
      }
    });
  }

  // ...eliminada lógica de paginación y carga de mensajes antiguos...

  /**
   * Enviar nuevo mensaje
   */
  onSendMessage(messageData: ChatFormData): void {
    if (!this.currentUser) return;

    this.messageService.sendMessage(this.roomId, messageData.message).subscribe({
      next: (response) => {
        if (response.data?.message) {
          // Agregar el mensaje localmente inmediatamente
          this.messages.push(response.data.message);
          this.scrollToBottom();
        }
      },
      error: (error) => {
        console.error('❌ Error enviando mensaje:', error);
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
