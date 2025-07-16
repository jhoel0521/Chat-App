import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth/auth.service';
import { RoomService, Room } from '../../services/room/room.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  popularRooms: Room[] = [];
  isLoadingRooms = true;
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
      }
    });

    // Cargar salas populares
    this.loadPopularRooms();
  }

  /**
   * Cargar las 10 salas más populares
   */
  loadPopularRooms(): void {
    this.isLoadingRooms = true;
    this.roomService.getRooms().subscribe({
      next: (response) => {
        this.isLoadingRooms = false;
        if (response.data) {
          // Simular datos de popularidad (esto vendría del backend)
          this.popularRooms = response.data.slice(0, 10).map((room, index) => ({
            ...room,
            users_count: Math.floor(Math.random() * 50) + 1,
            messages_count: Math.floor(Math.random() * 1000) + 10,
            last_activity: new Date(Date.now() - Math.random() * 86400000).toISOString()
          }));
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
    this.loadPopularRooms();
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
