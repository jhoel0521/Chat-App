import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService, User } from '../../services/auth/auth.service';
import { RoomService, Room, CreateRoomRequest } from '../../services/room/room.service';
import { MessageService, Message } from '../../services/message/message.service';
import { MessagesListComponent } from '../../components/messages-list/messages-list.component';
import { MessageInputComponent, MessageInputData } from '../../components/message-input/message-input.component';
import { ApiResponse } from '../../services/api';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MessagesListComponent,
    MessageInputComponent
  ],
  templateUrl: './room.component.html',
  styleUrl: './room.component.css'
})
export class RoomComponent implements OnInit, OnDestroy {
  @ViewChild('renameModal') renameModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('infoModal') infoModal!: ElementRef<HTMLDialogElement>;

  roomId: string = '';
  room: Room | null = null;
  currentUser: User | null = null;
  messages: Message[] = [];
  newRoomName: string = '';

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

  // ViewChild para acceder al componente de mensajes
  @ViewChild(MessagesListComponent) messagesListComponent!: MessagesListComponent;

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
        console.log('Sala cargada:', this.room);
      },
      error: (error) => {
        this.isLoadingRoom = false;
        this.roomError = 'Error al cargar la sala';
        console.error('❌ Error loading room:', error);
      }
    });
  }

  /**
   * Enviar nuevo mensaje
   */
  onSendMessage(messageData: MessageInputData): void {
    if (!this.currentUser) return;

    this.messageService.sendMessage(this.roomId, messageData.message).subscribe({
      next: (response) => {
        if (response.data?.message) {
          // Agregar el mensaje localmente inmediatamente
          this.messages = [...this.messages, response.data.message];

          // Forzar scroll al fondo después de actualizar el array
          setTimeout(() => {
            if (this.messagesListComponent) {
              this.messagesListComponent.scrollToBottomNow();
            }
          }, 150);
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
    if (this.messagesListComponent) {
      this.messagesListComponent.scrollToBottomNow();
    }
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

  /**
   * Abrir modal de renombrar sala
   */
  openRenameModal(): void {
    if (this.room) {
      this.newRoomName = this.room.name;
      this.renameModal.nativeElement.showModal();
    }
  }

  /**
   * Renombrar sala
   */
  renameRoom(): void {
    if (!this.room || !this.newRoomName.trim()) return;

    const updateData: Partial<CreateRoomRequest> = {
      name: this.newRoomName
    };

    this.roomService.updateRoom(this.roomId, updateData).subscribe({
      next: (response: ApiResponse<Room>) => {
        if (response.data) {
          this.room = response.data;
          this.renameModal.nativeElement.close();
        }
      },
      error: (error) => {
        console.error('Error renaming room:', error);
        alert('Error al renombrar la sala');
      }
    });
  }

  /**
   * Eliminar sala
   */
  async deleteRoom(): Promise<void> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer. La sala será eliminada permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });
    if (result.isConfirmed) {
      this.roomService.deleteRoom(this.roomId).subscribe({
        next: () => {
          Swal.fire('Eliminada', 'La sala ha sido eliminada.', 'success');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error deleting room:', error);
          Swal.fire('Error', 'Error al eliminar la sala', 'error');
        }
      });
    }
  }

  /**
   * Copiar enlace de invitación
   */
  copyInviteLink(): void {
    const roomUrl = this.getInviteLink();
    navigator.clipboard.writeText(roomUrl).then(() => {
      Swal.fire({
        icon: 'success',
        title: '¡Enlace copiado!',
        text: 'El enlace de invitación ha sido copiado al portapapeles.',
        timer: 1800,
        showConfirmButton: false
      });
    }).catch(err => {
      console.error('Error al copiar el enlace:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al copiar el enlace',
      });
    });
  }

  /**
   * Obtener enlace de invitación
   */
  getInviteLink(): string {
    return `${window.location.origin}/#/rooms/${this.roomId}`;
  }

  /**
   * Abrir modal de información
   */
  openInfoModal(): void {
    this.infoModal.nativeElement.showModal();
  }

  /**
   * Abrir configuración de sala (editar)
   */
  openSettings(): void {
    this.router.navigate(['/rooms/edit', this.roomId]);
  }

  /**
   * 
   */
  leaveRoom(): void {
    if (this.room) {
      this.roomService.leaveRoom(this.room.id).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error leaving room:', error);
          alert('Error al salir de la sala');
        }
      });
    }
  }
}