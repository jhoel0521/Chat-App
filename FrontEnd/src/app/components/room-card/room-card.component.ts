import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '../../services/room/room.service';
import { User } from '../../services/auth/auth.service';

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-card.component.html',
  styleUrl: './room-card.component.css'
})
export class RoomCardComponent {
  @Input() room!: Room;
  @Input() currentUser!: User | null;
  @Input() isUserInRoom: boolean = false;
  
  @Output() roomAction = new EventEmitter<Room>();
  @Output() editRoom = new EventEmitter<Room>();

  /**
   * Verificar si el usuario es creador de la sala
   */
  isRoomCreator(): boolean {
    return this.currentUser?.id === this.room.created_by;
  }

  /**
   * Obtener el texto del botón según el estado del usuario
   */
  getButtonText(): string {
    if (this.isRoomCreator()) {
      return 'Ir a sala';
    } else if (this.isUserInRoom) {
      return 'Ir a sala';
    } else {
      return 'Unirse';
    }
  }

  /**
   * Obtener el icono del botón según el estado del usuario
   */
  getButtonIcon(): string {
    if (this.isRoomCreator()) {
      return '🚪';
    } else if (this.isUserInRoom) {
      return '🚪';
    } else {
      return '🚀';
    }
  }

  /**
   * Obtener el color del botón según el estado del usuario
   */
  getButtonClass(): string {
    if (this.isRoomCreator()) {
      return 'btn-success';
    } else if (this.isUserInRoom) {
      return 'btn-success';
    } else {
      return 'btn-primary';
    }
  }

  /**
   * Manejar click en el botón principal
   */
  onRoomAction(): void {
    this.roomAction.emit(this.room);
  }

  /**
   * Manejar click en el botón de editar (solo para creadores)
   */
  onEditRoom(event: Event): void {
    event.stopPropagation();
    this.editRoom.emit(this.room);
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
}
