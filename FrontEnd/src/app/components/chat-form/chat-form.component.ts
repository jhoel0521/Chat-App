import { Component, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ChatFormData {
  message: string;
  type: 'text' | 'image' | 'file';
  file?: File;
}

@Component({
  selector: 'app-chat-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-form.component.html',
  styleUrl: './chat-form.component.css'
})
export class ChatFormComponent {
  @Output() sendMessage = new EventEmitter<ChatFormData>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

  message: string = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading: boolean = false;

  /**
   * Manejar envío del formulario
   */
  onSubmit(): void {
    if (this.isUploading) return;
    
    const trimmedMessage = this.message.trim();
    
    // Validar que haya contenido
    if (!trimmedMessage && !this.selectedFile) {
      return;
    }

    // Determinar tipo de mensaje
    let messageType: 'text' | 'image' | 'file' = 'text';
    if (this.selectedFile) {
      messageType = this.selectedFile.type.startsWith('image/') ? 'image' : 'file';
    }

    // Emitir evento
    this.sendMessage.emit({
      message: trimmedMessage,
      type: messageType,
      file: this.selectedFile || undefined
    });

    // Limpiar formulario
    this.resetForm();
  }

  /**
   * Manejar selección de archivo
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      this.selectedFile = file;
      
      // Generar preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewUrl = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.previewUrl = null;
      }
    }
  }

  /**
   * Remover archivo seleccionado
   */
  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Manejar tecla presionada
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  /**
   * Resetear formulario
   */
  private resetForm(): void {
    this.message = '';
    this.selectedFile = null;
    this.previewUrl = null;
    this.isUploading = false;
    
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    
    // Enfocar input de mensaje
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }

  /**
   * Obtener el tamaño del archivo formateado
   */
  getFileSize(): string {
    if (!this.selectedFile) return '';
    
    const size = this.selectedFile.size;
    if (size < 1024) return `${size} B`;
    if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1048576).toFixed(1)} MB`;
  }

  /**
   * Verificar si el archivo es una imagen
   */
  isImageFile(): boolean {
    return this.selectedFile?.type.startsWith('image/') ?? false;
  }

  /**
   * Abrir selector de archivos
   */
  openFileSelector(): void {
    this.fileInput.nativeElement.click();
  }
}
