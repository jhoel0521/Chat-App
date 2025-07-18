import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { ApiService, ApiResponse } from '../api';
import { environment } from '../../../environments/environment';

export interface Room {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  allow_anonymous?: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  users_count?: number;
  messages_count?: number;
  last_activity?: string;
  creator?: {
    id: string;
    name: string;
  };
}

export interface RoomsResponse {
  success: boolean;
  rooms: Room[];
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
  is_private?: boolean;
  allow_anonymous?: boolean;
}

export interface JoinRoomRequest {
  password?: string; // Para salas privadas con password
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  constructor(private apiService: ApiService) { }

  /**
   * Obtener lista de salas públicas
   */
  getRooms(): Observable<RoomsResponse> {
    return this.apiService.get<RoomsResponse>('rooms').pipe(
      map((response: any) => {
        if (response.success && response.rooms) {
          return response;
        }
        return { success: false, rooms: [] };
      })
    );
  }

  /**
   * Obtener mis salas (donde soy creador o estoy unido)
   */
  getMyRooms(): Observable<RoomsResponse> {
    return this.apiService.get<RoomsResponse>('my-rooms').pipe(
      map((response: any) => {
        console.log('My rooms loaded:', response);
        if (response.success && response.rooms) {
          return response;
        }
        return { success: false, rooms: [] };
      })
    );
  }

  /**
   * Obtener detalles de una sala específica
   */
  getRoom(roomId: string): Observable<ApiResponse<Room>> {
    return this.apiService.get<Room>(`rooms/${roomId}`);
  }

  /**
   * Crear nueva sala
   */
  createRoom(roomData: CreateRoomRequest): Observable<ApiResponse<Room>> {
    return this.apiService.post<Room>('rooms', roomData);
  }

  /**
   * Actualizar una sala existente
   */
  updateRoom(roomId: string, roomData: Partial<CreateRoomRequest>): Observable<ApiResponse<Room>> {
    return this.apiService.put<Room>(`rooms/${roomId}`, roomData);
  }

  /**
   * Unirse a una sala
   */
  joinRoom(roomId: string, joinData?: JoinRoomRequest): Observable<ApiResponse<any>> {
    return this.apiService.post(`rooms/${roomId}/join`, joinData || {});
  }

  /**
   * Abandonar una sala
   */
  leaveRoom(roomId: string): Observable<ApiResponse<any>> {
    return this.apiService.post(`rooms/${roomId}/leave`);
  }

  /**
   * Obtener salas más populares (ordenadas por actividad)
   */
  getPopularRooms(limit: number = 10): Observable<ApiResponse<Room[]>> {
    return this.apiService.get<Room[]>(`rooms?limit=${limit}&sort=popular`);
  }

  /**
   * Buscar salas por nombre
   */
  searchRooms(query: string): Observable<ApiResponse<Room[]>> {
    return this.apiService.get<Room[]>(`rooms?search=${encodeURIComponent(query)}`);
  }
}
