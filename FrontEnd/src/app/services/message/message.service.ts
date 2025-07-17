import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../api';

export interface Message {
  id: string;
  room_id: string;
  user_id: string | null;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  guest_name?: string; // Para usuarios anónimos
  reply_to?: string | null; // Responder a otro mensaje
  file_id?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    is_anonymous: boolean;
  };
  file?: {
    id: string;
    filename: string;
    original_filename: string;
    mime_type: string;
    size: number;
    url: string;
  };
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_messages: number;
  };
}

export interface SendMessageRequest {
  message: string;
  type: 'text' | 'image' | 'file';
  file?: File;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor(private apiService: ApiService) {}

  /**
   * Obtener mensajes de una sala
   */
  getMessages(roomId: string, page: number = 1): Observable<ApiResponse<MessagesResponse>> {
    return this.apiService.get<MessagesResponse>(`rooms/${roomId}/messages?page=${page}`);
  }

  /**
   * Enviar mensaje de texto
   */
  sendMessage(roomId: string, messageData: SendMessageRequest): Observable<ApiResponse<Message>> {
    if (messageData.file) {
      // Si hay archivo, usar FormData
      const formData = new FormData();
      formData.append('message', messageData.message);
      formData.append('type', messageData.type);
      formData.append('file', messageData.file);
      
      return this.apiService.post<Message>(`rooms/${roomId}/messages`, formData);
    } else {
      // Si es solo texto, usar JSON
      return this.apiService.post<Message>(`rooms/${roomId}/messages`, {
        message: messageData.message,
        type: messageData.type
      });
    }
  }

  /**
   * Obtener mensajes en tiempo real (WebSocket)
   */
  subscribeToMessages(roomId: string): Observable<Message> {
    // TODO: Implementar WebSocket usando Laravel Reverb
    // Por ahora retornamos un Observable vacío
    return new Observable<Message>();
  }
}
