import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
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

// Interfaz para la respuesta real del backend
export interface BackendAuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
  refresh_token?: string;
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

  constructor(private apiService: ApiService, private http: HttpClient) {
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
        console.error('AuthService - Error parsing user data:', error);
        this.clearAuthData();
      }
    } else {
      this.currentUserSubject.next(null);
      this.isLoggedInSubject.next(false);
    }

  }

  /**
   * Iniciar sesión con email y password
   */
  login(credentials: LoginRequest): Observable<ApiResponse<BackendAuthResponse>> {
    return this.apiService.post<BackendAuthResponse>('login', credentials).pipe(
      tap(response => {
        // Verificar si la respuesta viene envuelta en ApiResponse o directamente
        let authResponse: BackendAuthResponse;

        if (response.data) {
          // Respuesta envuelta en ApiResponse
          authResponse = response.data;
        } else {
          // Respuesta directa del backend (esto es lo que está pasando)
          authResponse = response as any;
        }
        if (authResponse && authResponse.success) {
          // Convertir la respuesta del backend al formato interno
          const authData: AuthResponse = {
            access_token: authResponse.token,
            refresh_token: authResponse.refresh_token,
            token_type: 'Bearer',
            expires_in: 3600, // Default 1 hora
            user: authResponse.user
          };
          this.setAuthData(authData);
        } else {
          console.warn('AuthService - Login failed or no success flag');
        }
      })
    );
  }

  /**
   * Registrar nuevo usuario
   */
  register(userData: RegisterRequest): Observable<ApiResponse<BackendAuthResponse>> {
    return this.apiService.post<BackendAuthResponse>('register', userData).pipe(
      tap(response => {
        // Verificar si la respuesta viene envuelta en ApiResponse o directamente
        let authResponse: BackendAuthResponse;

        if (response.data) {
          authResponse = response.data;
        } else {
          authResponse = response as any;
        }

        if (authResponse && authResponse.success) {
          // Convertir la respuesta del backend al formato interno
          const authData: AuthResponse = {
            access_token: authResponse.token,
            refresh_token: authResponse.refresh_token,
            token_type: 'Bearer',
            expires_in: 3600, // Default 1 hora
            user: authResponse.user
          };
          this.setAuthData(authData);
        }
      })
    );
  }

  /**
   * Iniciar sesión como usuario anónimo
   */
  guestInit(guestData: GuestInitRequest): Observable<ApiResponse<BackendAuthResponse>> {
    return this.apiService.post<BackendAuthResponse>('guest/init', guestData).pipe(
      tap(response => {
        // Verificar si la respuesta viene envuelta en ApiResponse o directamente
        let authResponse: BackendAuthResponse;

        if (response.data) {
          authResponse = response.data;
        } else {
          authResponse = response as any;
        }

        if (authResponse && authResponse.success) {
          // Convertir la respuesta del backend al formato interno
          const authData: AuthResponse = {
            access_token: authResponse.token,
            refresh_token: authResponse.refresh_token,
            token_type: 'Bearer',
            expires_in: 3600, // Default 1 hora
            user: authResponse.user
          };
          this.setAuthData(authData);
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
  logout(): Promise<void> {
    console.log('🔒 Cerrar sesión');
    return new Promise((resolve) => {
      try {
        this.apiService.post('logout', {}).subscribe({
          next: () => {
            this.clearAuthData();
            resolve();
          },
          error: (error) => {
            console.error('Error during logout:', error);
            this.clearAuthData();
            resolve();
          }
        });
      } catch (error) {
        console.error('Error in logout:', error);
        this.clearAuthData();
        resolve();
      }
    });
  }
  /**
   * Renovar token JWT
   */
  refreshToken(): Observable<any> {
    const accessToken = localStorage.getItem(environment.tokenKey);

    return this.http.post(`${environment.apiUrl}/refresh`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }).pipe(
      tap((response: any) => {
        console.warn('Refresh token response:', response);
        if (!response || !response.token) {
          console.error('AuthService - Refresh token failed, no token in response');
          return;
        }
        // Extraer el nuevo token
        let newToken = '';
        if (response?.token) {
          newToken = response.token;
        } else if (response?.data?.token) {
          newToken = response.data.token;
        }

        if (newToken) {
          localStorage.setItem(environment.tokenKey, newToken);
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

    // Actualizar estado inmediatamente
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
    console.log('🔒 Limpiando datos de autenticación');
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
    const token = localStorage.getItem(environment.tokenKey);
    const hasValidToken = !!token;

    // Si tenemos token pero el observable no refleja el estado, actualizar
    if (hasValidToken && !this.isLoggedInSubject.value) {
      const userStr = localStorage.getItem(environment.userKey);
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUserSubject.next(user);
          this.isLoggedInSubject.next(true);
        } catch (error) {
          console.error('AuthService - Error parsing user data:', error);
          this.clearAuthData();
          return false;
        }
      }
    }

    return hasValidToken;
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
