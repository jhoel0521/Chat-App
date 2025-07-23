import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, RegisterRequest, GuestInitRequest } from '../../services/auth/auth.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  currentTab: 'login' | 'register' | 'guest' = 'login';
  isLoading = false;
  errorMessage = '';

  // Formularios
  loginForm: LoginRequest = {
    email: '',
    password: ''
  };

  registerForm: RegisterRequest = {
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  };

  guestForm: GuestInitRequest = {
    name: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  /**
   * Cambiar pestaña activa
   */
  setTab(tab: 'login' | 'register' | 'guest'): void {
    this.currentTab = tab;
    this.errorMessage = '';
  }

  /**
   * Iniciar sesión
   */
  onLogin(): void {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        this.isLoading = false;

        // Verificar si la respuesta viene envuelta en ApiResponse o directamente
        let authResponse: any;

        if (response.data) {
          authResponse = response.data;
        } else {
          authResponse = response as any;
        }

        if (authResponse && authResponse.success) {
          console.log('Login successful, navigating to dashboard...');
          // Usar navigateByUrl para navegación absoluta
          this.redirectAfterAuth();
        } else {
          this.errorMessage = authResponse?.message || 'Error al iniciar sesión';
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error de conexión';
      }
    });
  }

  /**
   * Registrar usuario
   */
  onRegister(): void {
    if (!this.registerForm.name || !this.registerForm.email || !this.registerForm.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    if (this.registerForm.password !== this.registerForm.password_confirmation) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.registerForm).subscribe({
      next: (response) => {
        console.log('Register response:', response);
        this.isLoading = false;
        // Verificar si la respuesta viene envuelta en ApiResponse o directamente
        let authResponse: any;

        if (response.data) {
          authResponse = response.data;
        } else {
          authResponse = response as any;
        }

        if (authResponse && authResponse.success) {
          console.log('Registration successful, navigating to dashboard...');
          // Usar navigateByUrl para navegación absoluta
          this.redirectAfterAuth();
        } else {
          this.errorMessage = authResponse?.message || 'Error al registrar usuario';
        }
      },
      error: (error) => {
        console.error('Register error:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error de conexión';
      }
    });
  }

  /**
   * Iniciar como invitado
   */
  onGuestInit(): void {
    if (!this.guestForm.name.trim()) {
      this.errorMessage = 'Por favor ingresa un nombre';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.guestInit(this.guestForm).subscribe({
      next: (response) => {
        console.log('Guest init response:', response);
        this.isLoading = false;
        // Verificar si la respuesta viene envuelta en ApiResponse o directamente
        let authResponse: any;

        if (response.data) {
          authResponse = response.data;
        } else {
          authResponse = response as any;
        }

        if (authResponse && authResponse.success) {
          console.log('Guest init successful, navigating to dashboard...');
          this.redirectAfterAuth();;
        } else {
          this.errorMessage = authResponse?.message || 'Error al iniciar como invitado';
        }
      },
      error: (error) => {
        console.error('Guest init error:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error de conexión';
      }
    });
  }
  private redirectAfterAuth(defaultUrl = '/dashboard'): void {
    const redirectUrl = this.route.snapshot.queryParamMap.get('redirect');

    if (redirectUrl) {
      this.router.navigateByUrl(redirectUrl);
    } else {
      this.router.navigateByUrl(defaultUrl);
    }
  }

}
