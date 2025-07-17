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
  ) {}

  ngOnInit(): void {
    // Verificar autenticación
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        // Cargar mis salas y salas populares
        this.loadMyRooms();
        this.loadPopularRooms();
      }
    });
  }

  /**
   * Cargar mis salas
   */
  loadMyRooms(): void {
    this.isLoadingMyRooms = true;
    this.roomService.getMyRooms().subscribe({
      next: (response) => {
        this.isLoadingMyRooms = false;
        console.log('My rooms loaded:', response);
        if (response.success && response.rooms) {
          this.myRooms = response.rooms;
        } else {
          this.myRooms = [];
        }
      },
      error: (error) => {
        this.isLoadingMyRooms = false;
        console.error('Error loading my rooms:', error);
        this.myRooms = [];
      }
    });
  }

  /**
   * Cargar las 10 salas más populares
   */
  loadPopularRooms(): void {
    this.isLoadingRooms = true;
    this.errorMessage = '';
    this.roomService.getRooms().subscribe({
      next: (response) => {
        this.isLoadingRooms = false;
        // El service ahora devuelve directamente RoomsResponse
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
   * Unirse a una sala
   */
  joinRoom(room: Room): void {
    console.log('Joining room:', room.name);
    this.roomService.joinRoom(room.id).subscribe({
      next: (response) => {
        // Redirigir a la sala o mostrar mensaje de éxito
        console.log('Joined room successfully:', response);
        // TODO: Implementar navegación a la sala de chat
        // this.router.navigate(['/chat', room.id]);
      },
      error: (error) => {
        console.error('Error joining room:', error);
        // TODO: Mostrar mensaje de error al usuario
      }
    });
  }

  /**
   * Navegar a crear nueva sala
   */
  createRoom(): void {
    this.router.navigate(['/rooms/create']);
  }

  /**
   * Navegar a editar sala
   */
  editRoom(room: Room): void {
    this.router.navigate(['/rooms/edit', room.id]);
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
        // Forzar logout local si hay error
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Refrescar lista de salas
   */
  refreshRooms(): void {
    this.loadMyRooms();
    this.loadPopularRooms();
  }

  /**
   * Verificar si el usuario es creador de la sala
   */
  isRoomCreator(room: Room): boolean {
    return this.currentUser?.id === room.created_by;
  }

  /**
   * Verificar si el usuario ya está en la sala
   */
  isUserInRoom(room: Room): boolean {
    // Por ahora, asumimos que si está en "mis salas", está en la sala
    return this.myRooms.some(myRoom => myRoom.id === room.id);
  }

  /**
   * Obtener el texto del botón según el estado del usuario
   */
  getButtonText(room: Room): string {
    if (this.isRoomCreator(room)) {
      return 'Editar';
    } else if (this.isUserInRoom(room)) {
      return 'Ir a sala';
    } else {
      return 'Unirse';
    }
  }

  /**
   * Manejar click en el botón de la sala
   */
  handleRoomAction(room: Room): void {
    if (this.isRoomCreator(room)) {
      this.editRoom(room);
    } else if (this.isUserInRoom(room)) {
      this.goToRoom(room);
    } else {
      this.joinRoom(room);
    }
  }

  /**
   * Ir a una sala
   */
  goToRoom(room: Room): void {
    console.log('Going to room:', room.name);
    // TODO: Implementar navegación a la sala de chat
    // this.router.navigate(['/chat', room.id]);
  }

  /**
   * Obtener tiempo relativo para mostrar última actividad
   */
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
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
}
