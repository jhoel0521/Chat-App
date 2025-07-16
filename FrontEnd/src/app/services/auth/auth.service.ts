import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { ApiService, ApiResponse } from '../api';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  name: string;
  email?: string;
  is_anonymous: boolean;
  profile_photo?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface GuestInitRequest {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.initializeAuthState();
  }

  /**
   * Inicializar estado de autenticación desde localStorage
   */
  private initializeAuthState(): void {
    const token = localStorage.getItem(environment.tokenKey);
    const userStr = localStorage.getItem(environment.userKey);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
      } catch (error) {
        this.clearAuthData();
      }
    }
  }

  /**
   * Iniciar sesión con email y password
   */
  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.apiService.post<AuthResponse>('login', credentials).pipe(
      tap(response => {
        if (response.data) {
          this.setAuthData(response.data);
        }
      })
    );
  }

  /**
   * Registrar nuevo usuario
   */
  register(userData: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.apiService.post<AuthResponse>('register', userData).pipe(
      tap(response => {
        if (response.data) {
          this.setAuthData(response.data);
        }
      })
    );
  }

  /**
   * Iniciar sesión como usuario anónimo
   */
  guestInit(guestData: GuestInitRequest): Observable<ApiResponse<AuthResponse>> {
    return this.apiService.post<AuthResponse>('guest/init', guestData).pipe(
      tap(response => {
        if (response.data) {
          this.setAuthData(response.data);
        }
      })
    );
  }

  /**
   * Convertir usuario anónimo a registrado
   */
  upgradeGuest(userData: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.apiService.patch<AuthResponse>('guest/upgrade', userData).pipe(
      tap(response => {
        if (response.data) {
          this.setAuthData(response.data);
        }
      })
    );
  }

  /**
   * Cerrar sesión
   */
  logout(): Observable<ApiResponse<any>> {
    return this.apiService.post('logout').pipe(
      tap(() => {
        this.clearAuthData();
      })
    );
  }

  /**
   * Renovar token JWT
   */
  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const refreshToken = localStorage.getItem(environment.refreshTokenKey);
    return this.apiService.post<AuthResponse>('token/refresh', { 
      refresh_token: refreshToken 
    }).pipe(
      tap(response => {
        if (response.data) {
          this.updateTokens(response.data);
        }
      })
    );
  }

  /**
   * Obtener perfil del usuario actual
   */
  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.apiService.get<User>('me').pipe(
      tap(response => {
        if (response.data) {
          this.currentUserSubject.next(response.data);
          localStorage.setItem(environment.userKey, JSON.stringify(response.data));
        }
      })
    );
  }

  /**
   * Guardar datos de autenticación
   */
  private setAuthData(authResponse: AuthResponse): void {
    localStorage.setItem(environment.tokenKey, authResponse.access_token);
    if (authResponse.refresh_token) {
      localStorage.setItem(environment.refreshTokenKey, authResponse.refresh_token);
    }
    localStorage.setItem(environment.userKey, JSON.stringify(authResponse.user));
    
    this.currentUserSubject.next(authResponse.user);
    this.isLoggedInSubject.next(true);
  }

  /**
   * Actualizar solo los tokens
   */
  private updateTokens(authResponse: AuthResponse): void {
    localStorage.setItem(environment.tokenKey, authResponse.access_token);
    if (authResponse.refresh_token) {
      localStorage.setItem(environment.refreshTokenKey, authResponse.refresh_token);
    }
  }

  /**
   * Limpiar datos de autenticación
   */
  private clearAuthData(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem(environment.userKey);
    
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(environment.tokenKey);
  }

  /**
   * Verificar si el usuario es anónimo
   */
  isGuest(): boolean {
    const user = this.currentUserSubject.value;
    return user?.is_anonymous ?? false;
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtener el token actual
   */
  getToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }
}
