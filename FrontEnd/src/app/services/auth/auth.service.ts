import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiService, ApiResponse } from '../api';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

export interface User {
  id: string;
  name: string;
  email?: string;
  is_anonymous: boolean;
  profile_photo?: string;
  created_at: string;
  updated_at: string;
  count_messages?: number;
  rooms_count?: number;
  rooms_joined_count?: number;
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
  refreshToken(): Promise<true> {
    const accessToken = localStorage.getItem(environment.tokenKey);
    return new Promise((resolve, reject) => {
      this.http.post<any>(`${environment.apiUrl}/token/refresh`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }).subscribe({
        next: (response: any) => {
          console.warn('Refresh token response:', response);
          if (!response || !response.token) {
            console.error('AuthService - Refresh token failed, no token in response');
            reject('No token in response');
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
            localStorage.setItem(environment.refreshTokenKey, JSON.stringify({ expires_in: response.expires_in, now: Date.now() }));
            resolve(true);
          } else {
            reject('No new token received');
          }
        },
        error: (err) => {
          console.error('AuthService - Error refreshing token:', err);
          reject(err);
        }
      });
    });
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
    if (authResponse.expires_in) {
      localStorage.setItem(environment.refreshTokenKey, JSON.stringify({ expires_in: authResponse.expires_in, now: Date.now() }));
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
    if (authResponse.expires_in) {
      localStorage.setItem(environment.refreshTokenKey, JSON.stringify({ expires_in: authResponse.expires_in, now: Date.now() }));
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
   * Obtener el usuario current
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
  private showSessionExtendAlert(msLeft: number = 5 * 60 * 1000) {
    let timerInterval: any;
    Swal.fire({
      title: '¿Extender sesión?',
      text: 'Tu sesión está por expirar en menos de 5 minutos. ¿Deseas extenderla?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Extender',
      cancelButtonText: 'Cerrar sesión',
      timer: msLeft,
      timerProgressBar: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        timerInterval = setInterval(() => {
          const content = Swal.getHtmlContainer();
          if (content) {
            const timeLeft = Math.ceil(Swal.getTimerLeft()! / 1000);
            content.querySelector('.swal2-timer')?.setAttribute('data-timer', timeLeft.toString());
          }
        }, 1000);
      },
      willClose: () => {
        clearInterval(timerInterval);
      },
      html: '<div class="swal2-timer" style="margin-top:10px;font-size:1.1em;color:#d33;"></div>'
    }).then((result) => {
      if (result.isConfirmed) {
        this.refreshToken().then((success) => {
          console.log('Token refreshed successfully:', success);
        }).catch((error) => {
          console.error('Error refreshing token:', error);
        });
      } else {
        localStorage.removeItem(environment.tokenKey);
        localStorage.removeItem(environment.userKey);
        localStorage.removeItem(environment.refreshTokenKey);
        Swal.fire('Sesión cerrada', 'Tu sesión ha expirado.', 'info').then(() => {
          window.location.href = '/login';
        });
      }
    });
  }

  /**
   * Programar alerta para extender sesión faltando 5 minutos
   */
  scheduleSessionExtendAlert(): void {
    const key = environment.refreshTokenKey;
    const expireData = localStorage.getItem(key);
    if (!expireData) return;
    const expire = JSON.parse(expireData);
    const expires_in = expire.expires_in;
    const loginTime = expire.now;
    const expiryTimestamp = loginTime + expires_in * 1000;
    const msLeft = expiryTimestamp - Date.now();
    // Si faltan más de 5 min, programar el timeout para mostrar la alerta faltando 5 min
    const min = 5 * 60 * 1000; // 5 minutos en milisegundos
    if (msLeft > min) {
      setTimeout(() => this.showSessionExtendAlert(), msLeft - min);
    } else if (msLeft > 0) {
      // Si ya faltan menos de 5 min, mostrar la alerta inmediatamente
      this.showSessionExtendAlert(msLeft);
    }
  }
}
