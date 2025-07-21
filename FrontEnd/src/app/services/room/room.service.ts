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
   * @return Observable con la respuesta de la API
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
   * @return Observable con la respuesta de la API
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
   * @param roomId ID de la sala
   * @return Observable con la respuesta de la API
   */
  getRoom(roomId: string): Observable<ApiResponse<Room>> {
    return this.apiService.get<Room>(`rooms/${roomId}`);
  }

  /**
   * Crear nueva sala
   * @param roomData Datos de la sala a crear
   * @return Observable con la respuesta de la API
   */
  createRoom(roomData: CreateRoomRequest): Observable<ApiResponse<Room>> {
    return this.apiService.post<Room>('rooms', roomData);
  }

  /**
   * Actualizar una sala existente
   * @param roomId ID de la sala a actualizar
   * @param roomData Datos a actualizar
   */
  updateRoom(roomId: string, roomData: Partial<CreateRoomRequest>): Observable<ApiResponse<Room>> {
    return this.apiService.put<Room>(`rooms/${roomId}`, roomData);
  }

  /**
   * Unirse a una sala
   * @param roomId ID de la sala a la que unirse
   * @return Observable con la respuesta de la API
   */
  joinRoom(roomId: string): Observable<ApiResponse<any>> {
    return this.apiService.post(`rooms/${roomId}/join`);
  }

  /**
   * Abandonar una sala
   * @param roomId ID de la sala a abandonar
   * @return Observable con la respuesta de la API
   */
  leaveRoom(roomId: string): Observable<ApiResponse<any>> {
    return this.apiService.post(`rooms/${roomId}/leave`);
  }

  /**
   * Obtener salas más populares (ordenadas por actividad)
   * @param limit Número máximo de salas a obtener
   * @returns Observable con la respuesta de la API
   */
  getPopularRooms(limit: number = 10): Observable<ApiResponse<Room[]>> {
    return this.apiService.get<Room[]>(`rooms?limit=${limit}&sort=popular`);
  }

  /**
   * Buscar salas por nombre
   * @param query Término de búsqueda
   * @returns Observable con la respuesta de la API
   */
  searchRooms(query: string): Observable<ApiResponse<Room[]>> {
    return this.apiService.get<Room[]>(`rooms?search=${encodeURIComponent(query)}`);
  }
  /**
   * Eliminar una sala
   * @param roomId ID de la sala a eliminar
   * @returns Observable con la respuesta de la API
   */
  deleteRoom(roomId: string): Observable<ApiResponse<any>> {
    return this.apiService.delete(`rooms/${roomId}`);
  }
}
