import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RoomService, Room } from '../../services/room/room.service';
import { AuthService } from '../../services/auth/auth.service';

// Interface para editar sala
interface EditRoomRequest {
  name: string;
  description?: string;
  is_private: boolean;
  allow_anonymous: boolean;
}

@Component({
  selector: 'app-edit-room',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-room.html',
  styleUrl: './edit-room.css'
})
export class EditRoomComponent implements OnInit {
  roomId: string = '';
  currentRoom: Room | null = null;
  isLoading = false;
  isLoadingRoom = true;
  errorMessage = '';
  successMessage = '';

  // Datos del formulario
  roomData: EditRoomRequest = {
    name: '',
    description: '',
    is_private: false,
    allow_anonymous: true
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private roomService: RoomService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Verificar autenticación
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Obtener ID de la sala desde la ruta
    this.route.params.subscribe(params => {
      this.roomId = params['id'];
      if (this.roomId) {
        this.loadRoom();
      } else {
        this.errorMessage = 'ID de sala no válido';
        this.isLoadingRoom = false;
      }
    });
  }

  /**
   * Cargar información actual de la sala
   */
  loadRoom(): void {
    this.isLoadingRoom = true;
    this.errorMessage = '';

    this.roomService.getRoom(this.roomId).subscribe({
      next: (response) => {
        this.isLoadingRoom = false;
        
        // Verificar si la respuesta viene envuelta en ApiResponse o directamente
        let roomData: any;
        if (response.data) {
          roomData = response.data;
        } else {
          roomData = response as any;
        }

        if (roomData) {
          this.currentRoom = roomData;
          // Llenar el formulario con los datos actuales
          this.roomData = {
            name: roomData.name,
            description: roomData.description || '',
            is_private: roomData.is_private,
            allow_anonymous: roomData.allow_anonymous
          };
        } else {
          this.errorMessage = 'No se pudo cargar la información de la sala';
        }
      },
      error: (error) => {
        this.isLoadingRoom = false;
        console.error('Error al cargar sala:', error);
        this.errorMessage = error.error?.message || 'Error al cargar la información de la sala';
        
        // Si no tiene permisos o la sala no existe, redirigir
        if (error.status === 403 || error.status === 404) {
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        }
      }
    });
  }

  /**
   * Actualizar sala
   */
  onUpdateRoom(): void {
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

    // Preparar datos para enviar (solo cambios)
    const updateData: Partial<EditRoomRequest> = {
      name: this.roomData.name,
      description: this.roomData.description,
      is_private: this.roomData.is_private,
      allow_anonymous: this.roomData.allow_anonymous
    };

    this.roomService.updateRoom(this.roomId, updateData).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Verificar si la respuesta viene envuelta en ApiResponse o directamente
        let roomResponse: any;
        if (response.data) {
          roomResponse = response.data;
        } else {
          roomResponse = response as any;
        }

        this.successMessage = 'Sala actualizada exitosamente';
        
        // Actualizar información local
        if (roomResponse) {
          this.currentRoom = roomResponse;
        }

        // Redirigir después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al actualizar sala:', error);
        this.errorMessage = error.error?.message || 'Error al actualizar la sala';
      }
    });
  }

  /**
   * Cancelar edición
   */
  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Volver atrás
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Resetear formulario
   */
  onReset(): void {
    if (this.currentRoom) {
      this.roomData = {
        name: this.currentRoom.name,
        description: this.currentRoom.description || '',
        is_private: this.currentRoom.is_private,
        allow_anonymous: this.currentRoom.allow_anonymous
      };
    }
    this.errorMessage = '';
    this.successMessage = '';
  }
}
