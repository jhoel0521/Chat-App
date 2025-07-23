import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../api';

export interface Message {
  id: string;
  room_id: string;
  user_id: string | null;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  guest_name?: string;
  reply_to?: string | null;
  file_id?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    is_anonymous: boolean;
    profile_photo?: string;
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
  current_page: number;
  data: Message[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface SendMessageRequest {
  room_id: string;
  message: string;
  message_type?: 'text' | 'image' | 'file';
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor(private apiService: ApiService) { }

  /**
   * Obtener mensajes de una sala
   */
  getMessages(roomId: string, lastTimestamp?: string | null): Observable<ApiResponse<MessagesResponse>> {
    let url = `messages?room_id=${roomId}`;
    if (lastTimestamp) {
      url += `&last_timestamp=${lastTimestamp}`;
    }
    return this.apiService.get<MessagesResponse>(url);
  }

  /**
   * Enviar mensaje de texto
   */
  sendMessage(roomId: string, message: string, messageType: string = 'text'): Observable<ApiResponse<{ message: Message }>> {
    const requestData: SendMessageRequest = {
      room_id: roomId,
      message: message,
      message_type: messageType as 'text' | 'image' | 'file'
    };

    return this.apiService.post<{ message: Message }>('messages', requestData);
  }
}
