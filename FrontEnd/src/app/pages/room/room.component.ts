import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth/auth.service';
import { RoomService, Room } from '../../services/room/room.service';
import { MessageService, Message } from '../../services/message/message.service';
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
    // Obtener ID de la sala desde la ruta
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.roomId) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Verificar autenticación
    const authSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      // Cargar datos de la sala
      this.loadRoom();
      this.loadMessages();
    });

    this.subscriptions.push(authSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
