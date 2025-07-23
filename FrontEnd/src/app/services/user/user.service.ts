import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from '../api';
import { User } from '../auth/auth.service';

export interface UpdateProfileRequest {
  name: string;
  email?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface UpgradeAccountRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface UserProfile extends User {
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private apiService: ApiService) { }

  /**
   * Obtener perfil del usuario actual
   */
  getProfile(): Observable<ApiResponse<UserProfile>> {
    return this.apiService.get<UserProfile>('me');
  }

  /**
   * Actualizar perfil del usuario
   */
  updateProfile(data: UpdateProfileRequest): Observable<ApiResponse<UserProfile>> {
    return this.apiService.patch<UserProfile>('profile', data);
  }

  /**
   * Cambiar contraseña
   */
  changePassword(data: ChangePasswordRequest): Observable<ApiResponse<any>> {
    return this.apiService.patch<any>('profile/password', data);
  }

  /**
   * Convertir cuenta anónima a registrada
   */
  upgradeAccount(data: UpgradeAccountRequest): Observable<ApiResponse<UserProfile>> {
    return this.apiService.patch<UserProfile>('guest/upgrade', data);
  }

  /**
   * Eliminar cuenta
   */
  deleteAccount(password?: string): Observable<ApiResponse<any>> {
    if (password) {
      return this.apiService.post<any>('profile/delete', { password });
    }
    return this.apiService.delete<any>('profile');
  }

  /**
   * Subir foto de perfil
   */
  uploadProfilePhoto(file: File): Observable<ApiResponse<UserProfile>> {
    const formData = new FormData();
    formData.append('profile_photo', file);
    console.log('Enviando archivo:', file.name, file.type, file.size); // Debug
    return this.apiService.upload<UserProfile>('profile/photo', formData);
  }

  /**
   * Eliminar foto de perfil
   */
  deleteProfilePhoto(): Observable<ApiResponse<UserProfile>> {
    return this.apiService.delete<UserProfile>('profile/photo');
  }
}
