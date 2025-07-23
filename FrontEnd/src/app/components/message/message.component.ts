import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../services/message/message.service';
import { User } from '../../services/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.css'
})
export class MessageComponent {
  @Input() message!: Message;
  @Input() currentUser!: User | null;
  @Input() isAuthor: boolean = false;

  /**
   * Verificar si el mensaje es del sistema
   */
  isSystemMessage(): boolean {
    return this.message.message_type === 'system';
  }

  /**
   * Verificar si el mensaje tiene archivo
   */
  hasFile(): boolean {
    return this.message.message_type === 'file' || this.message.message_type === 'image';
  }

  /**
   * Verificar si el archivo es una imagen
   */
  isImageFile(): boolean {
    return this.message.message_type === 'image' ||
      (this.message.file?.mime_type?.startsWith('image/') ?? false);
  }

  /**
   * Obtener el nombre del usuario
   */
  getUserName(): string {
    if (this.isSystemMessage()) {
      return 'Sistema';
    }

    // Si es un usuario anónimo con guest_name
    if (this.message.guest_name) {
      return this.message.guest_name;
    }

    // Si tiene usuario asociado
    if (this.message.user?.name) {
      return this.message.user.name;
    }

    return 'Usuario anónimo';
  }

  /**
   * Obtener la inicial para el avatar
   */
  getAvatarInitial(): string {
    const name = this.getUserName();
    return name.charAt(0).toUpperCase();
  }

  /**
   * Verificar si el usuario del mensaje tiene foto de perfil
   */
  hasProfilePhoto(): boolean {
    return !!(this.message.user?.profile_photo);
  }

  /**
   * Obtener URL de la foto de perfil del usuario del mensaje
   */
  getProfilePhotoUrl(): string {
    if (this.message.user?.profile_photo) {
      const { baseUrl } = environment;
      return baseUrl + this.message.user.profile_photo;
    }
    return '';
  }

  /**
   * Obtener la hora formateada
   */
  getFormattedTime(): string {
    const date = new Date(this.message.created_at);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener el tamaño del archivo formateado
   */
  getFileSize(): string {
    if (!this.message.file?.size) return '';

    const size = this.message.file.size;
    if (size < 1024) return `${size} B`;
    if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1048576).toFixed(1)} MB`;
  }

  /**
   * Descargar archivo
   */
  downloadFile(): void {
    if (this.message.file?.url) {
      window.open(this.message.file.url, '_blank');
    }
  }
}
