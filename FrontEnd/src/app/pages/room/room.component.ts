import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
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
  isLoadingMoreMessages = false;

  // Errores
  roomError = '';
  messagesError = '';

  // Polling de mensajes
  private pollingSubscription?: Subscription;
  private isPollingActive = false;

  // Paginación
  hasMoreMessages = false;
  currentPage = 1;

  // Subscripciones
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private roomService: RoomService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.roomId) this.router.navigate(['/dashboard']);

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) this.router.navigate(['/login']);

      this.loadRoom();
      this.startMessagePolling();
    });
  }

  ngOnDestroy(): void {
    // Detener polling al salir
    this.stopMessagePolling();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Iniciar polling de mensajes HTTP
   */
  private startMessagePolling(): void {
    if (this.isPollingActive) return;

    console.log('🔄 Iniciando polling de mensajes cada', environment.polling.messagesInterval, 'ms');
    this.isPollingActive = true;

    // Cargar mensajes inicialmente
    this.loadMessages();

    // Configurar polling automático
    this.pollingSubscription = interval(environment.polling.messagesInterval)
      .pipe(
        switchMap(() => this.messageService.getMessages(this.roomId, 1))
      )
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.updateMessagesFromPolling(response.data);
          }
        },
        error: (error) => {
          console.error('❌ Error en polling de mensajes:', error);
        }
      });
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
   * Actualizar mensajes desde polling (evitar duplicados)
   */
  private updateMessagesFromPolling(data: MessagesResponse): void {
    if (data.data && Array.isArray(data.data)) {
      // Crear un mapa de mensajes existentes por ID
      const existingIds = new Set(this.messages.map(m => m.id));
      
      // Filtrar solo mensajes nuevos
      const newMessages = data.data.filter((msg: Message) => !existingIds.has(msg.id));
      
      if (newMessages.length > 0) {
        console.log('� Nuevos mensajes detectados:', newMessages.length);
        
        // Agregar nuevos mensajes y ordenar por fecha
        this.messages = [...this.messages, ...newMessages].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        this.scrollToBottom();
      }

      // Actualizar paginación
      this.hasMoreMessages = data.current_page < data.last_page;
    }
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
   * Cargar mensajes por HTTP
   */
  loadMessages(): void {
    this.isLoadingMessages = true;
    this.messagesError = '';

    console.log('📚 Cargando mensajes por HTTP...');

    this.messageService.getMessages(this.roomId, this.currentPage).subscribe({
      next: (response) => {
        this.isLoadingMessages = false;
        if (response.data) {
          this.messages = response.data.data || [];
          this.hasMoreMessages = response.data.current_page < response.data.last_page;
          console.log('✅ Mensajes cargados:', this.messages.length);
          this.scrollToBottom();
        } else {
          this.messagesError = 'No se pudieron cargar los mensajes';
        }
      },
      error: (error: any) => {
        this.isLoadingMessages = false;
        this.messagesError = 'Error al cargar mensajes';
        console.error('❌ Error loading messages:', error);
      }
    });
  }

  /**
   * Cargar más mensajes antiguos (paginación HTTP)
   */
  loadMoreMessages(): void {
    if (!this.hasMoreMessages || this.isLoadingMoreMessages) return;

    this.isLoadingMoreMessages = true;
    this.currentPage++;
    
    console.log('📚 Cargando página', this.currentPage, 'de mensajes...');

    this.messageService.getMessages(this.roomId, this.currentPage).subscribe({
      next: (response) => {
        this.isLoadingMoreMessages = false;
        if (response.data) {
          // Agregar mensajes antiguos al inicio
          const olderMessages = response.data.data || [];
          this.messages = [...olderMessages, ...this.messages];
          
          this.hasMoreMessages = response.data.current_page < response.data.last_page;
          
          console.log('✅ Más mensajes cargados. Total:', this.messages.length);
        }
      },
      error: (error: any) => {
        this.isLoadingMoreMessages = false;
        this.currentPage--; // Revertir incremento en caso de error
        console.error('❌ Error loading more messages:', error);
      }
    });
  }

  /**
   * Enviar nuevo mensaje por HTTP
   */
  onSendMessage(messageData: ChatFormData): void {
    if (!this.currentUser) return;

    console.log('📨 Enviando mensaje por HTTP:', messageData);

    this.messageService.sendMessage(this.roomId, messageData.message).subscribe({
      next: (response) => {
        if (response.data?.message) {
          console.log('✅ Mensaje enviado correctamente');
          
          // Agregar el mensaje inmediatamente a la lista
          this.messages.push(response.data.message);
          this.scrollToBottom();
        } else {
          console.error('❌ Error en respuesta del mensaje:', response);
        }
      },
      error: (error: any) => {
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
