import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, RegisterRequest, GuestInitRequest } from '../../services/auth/auth.service';

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
    private router: Router
  ) {}

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
        this.isLoading = false;
        if (response.status === 200) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = response.message || 'Error al iniciar sesión';
        }
      },
      error: (error) => {
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
        this.isLoading = false;
        if (response.status === 200 || response.status === 201) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = response.message || 'Error al registrar usuario';
        }
      },
      error: (error) => {
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
        this.isLoading = false;
        if (response.status === 200 || response.status === 201) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = response.message || 'Error al iniciar como invitado';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error de conexión';
      }
    });
  }
}
