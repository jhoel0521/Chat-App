import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth/auth.service';
import { RoomService, Room, RoomsResponse } from '../../services/room/room.service';
import { RoomCardComponent } from '../../components/room-card/room-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RoomCardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  popularRooms: Room[] = [];
  myRooms: Room[] = [];
  isLoadingRooms = true;
  isLoadingMyRooms = true;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private roomService: RoomService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadMyRooms();
    this.loadPopularRooms();
  }

  /**
   * Cargar información del usuario actual
   */
  loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (response) => {
        this.currentUser = response.data || null;
      },
      error: (error) => {
        console.error('Error loading current user:', error);
      }
    });
  }

  /**
   * Cargar mis salas
   */
  loadMyRooms(): void {
    this.isLoadingMyRooms = true;
    this.errorMessage = '';
    this.roomService.getMyRooms().subscribe({
      next: (response) => {
        this.isLoadingMyRooms = false;
        if (response.success && response.rooms) {
          this.myRooms = response.rooms;
        } else {
          this.myRooms = [];
        }
      },
      error: (error) => {
        this.isLoadingMyRooms = false;
        this.errorMessage = 'Error al cargar tus salas';
        console.error('Error loading my rooms:', error);
      }
    });
  }

  /**
   * Cargar salas populares
   */
  loadPopularRooms(): void {
    this.isLoadingRooms = true;
    this.errorMessage = '';
    this.roomService.getRooms().subscribe({
      next: (response) => {
        this.isLoadingRooms = false;
        if (response.success && response.rooms) {
          this.popularRooms = response.rooms;
        } else {
          this.popularRooms = [];
        }
      },
      error: (error) => {
        this.isLoadingRooms = false;
        this.errorMessage = 'Error al cargar las salas';
        console.error('Error loading rooms:', error);
      }
    });
  }

  /**
   * Manejar acciones de sala (entrar, unirse, etc.)
   */
  handleRoomAction(room: Room): void {
    const buttonText = this.getButtonText(room);

    switch (buttonText) {
      case 'Entrar':
        this.enterRoom(room);
        break;
      case 'Unirse':
        this.joinRoom(room);
        break;
      case 'Salir':
        this.leaveRoom(room);
        break;
      default:
        console.log('Acción no reconocida:', buttonText);
    }
  }

  /**
   * Entrar a una sala
   */
  private enterRoom(room: Room): void {
    this.router.navigate(['/rooms', room.id]);
  }

  /**
   * Unirse a una sala
   */
  private joinRoom(room: Room): void {
    this.roomService.joinRoom(room.id).subscribe({
      next: () => {
        this.router.navigate(['/rooms', room.id]);
      },
      error: (error) => {
        console.error('Error joining room:', error);
        this.errorMessage = 'Error al unirse a la sala';
      }
    });
  }

  /**
   * Salir de una sala
   */
  private leaveRoom(room: Room): void {
    this.roomService.leaveRoom(room.id).subscribe({
      next: () => {
        this.loadMyRooms();
        this.loadPopularRooms();
      },
      error: (error) => {
        console.error('Error leaving room:', error);
        this.errorMessage = 'Error al salir de la sala';
      }
    });
  }

  /**
   * Editar una sala
   */
  editRoom(room: Room): void {
    this.router.navigate(['/rooms/edit', room.id]);
  }

  /**
   * Obtener el texto del botón según el estado del usuario
   */
  private getButtonText(room: Room): string {
    if (this.isRoomCreator(room)) {
      return 'Entrar';
    }

    if (this.isUserInRoom(room)) {
      return 'Entrar';
    }

    return 'Unirse';
  }

  /**
   * Verificar si el usuario es creador de la sala
   */
  private isRoomCreator(room: Room): boolean {
    return this.currentUser?.id === room.created_by;
  }

  /**
   * Verificar si el usuario está en la sala
   */
  isUserInRoom(room: Room): boolean {
    return this.myRooms.some(myRoom => myRoom.id === room.id);
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Navegar a crear sala
   */
  createRoom(): void {
    this.router.navigate(['/rooms/create']);
  }

  /**
   * Formatear fecha relativa
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    return `${diffDays} d`;
  }

  /**
   * Calcular total de usuarios en todas las salas
   */
  getTotalUsers(): number {
    return this.popularRooms.reduce((sum, room) => sum + (room.users_count || 0), 0);
  }

  /**
   * Calcular total de mensajes en todas las salas
   */
  getTotalMessages(): number {
    return this.popularRooms.reduce((sum, room) => sum + (room.messages_count || 0), 0);
  }

  /**
   * Refrescar las salas
   */
  refreshRooms(): void {
    this.loadMyRooms();
    this.loadPopularRooms();
  }
}
