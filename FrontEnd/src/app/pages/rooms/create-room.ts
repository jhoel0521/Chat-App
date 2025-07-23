import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RoomService, Room, CreateRoomRequest } from '../../services/room/room.service';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-create-room',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-room.html',
  styleUrl: './create-room.css'
})
export class CreateRoomComponent implements OnInit {
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Formulario
  roomData: CreateRoomRequest = {
    name: '',
    description: '',
    is_private: false,
    allow_anonymous: true
  };

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Verificar autenticación
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Crear nueva sala
   */
  onCreateRoom(): void {
    // Validaciones básicas
    if (!this.roomData.name.trim()) {
      this.errorMessage = 'El nombre de la sala es requerido';
      return;
    }

    if (this.roomData.name.length < 3) {
      this.errorMessage = 'El nombre debe tener al menos 3 caracteres';
      return;
    }

    if (this.roomData.name.length > 50) {
      this.errorMessage = 'El nombre no puede exceder 50 caracteres';
      return;
    }

    if (this.roomData.description && this.roomData.description.length > 200) {
      this.errorMessage = 'La descripción no puede exceder 200 caracteres';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Preparar datos para enviar
    const roomData = { ...this.roomData };

    this.roomService.createRoom(roomData).subscribe({
      next: (response) => {
        this.isLoading = false;

        // Verificar si la respuesta viene envuelta en ApiResponse o directamente
        let roomResponse: any;
        if (response.data) {
          roomResponse = response.data;
        } else {
          roomResponse = response as any;
        }

        if (roomResponse && (roomResponse.success !== false)) {
          this.successMessage = 'Sala creada exitosamente';

          // Redirigir al la sala creada despues de 1 segundo
          setTimeout(() => {
            this.router.navigate(['/rooms', roomResponse.room.id]);
          }, 1000);
        } else {
          this.errorMessage = roomResponse?.message || 'Error al crear la sala';
        }
      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 401) {
          console.error('🔐 CreateRoom - Error de autorización 401');
          // Verificar tokens nuevamente después del error
          const tokenAfterError = localStorage.getItem('chat_app_token');
          console.error('🔐 CreateRoom - Token después del error:', !!tokenAfterError);
        }

        this.errorMessage = error.error?.message || 'Error de conexión al crear la sala';
      }
    });
  }

  /**
   * Cancelar y volver al dashboard
   */
  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Limpiar formulario
   */
  onReset(): void {
    this.roomData = {
      name: '',
      description: '',
      is_private: false,
      allow_anonymous: true
    };
    this.errorMessage = '';
    this.successMessage = '';
  }
}
