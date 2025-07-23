import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth/auth.service';
import { UserService, UpdateProfileRequest, ChangePasswordRequest, UpgradeAccountRequest } from '../../services/user/user.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
    currentUser: User | null = null;
    isLoading = false;

    // Modales
    showEditModal = false;
    showPasswordModal = false;
    showUpgradeModal = false;
    showDeleteModal = false;
    showPhotoModal = false;

    // Formularios
    editForm: UpdateProfileRequest = {
        name: '',
        email: ''
    };

    passwordForm: ChangePasswordRequest = {
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    };

    upgradeForm: UpgradeAccountRequest = {
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
    };

    deletePassword = '';

    // Estados
    editError = '';
    passwordError = '';
    upgradeError = '';
    deleteError = '';
    photoError = '';

    editSuccess = '';
    passwordSuccess = '';
    upgradeSuccess = '';
    deleteSuccess = '';
    photoSuccess = '';

    // Foto de perfil
    selectedFile: File | null = null;
    photoPreview: string | null = null;

    constructor(
        private authService: AuthService,
        private userService: UserService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadUserProfile();
    }

    /**
     * Cargar perfil del usuario
     */
    loadUserProfile(): void {
        this.authService.getCurrentUser().subscribe({
            next: (response) => {
                this.currentUser = response.data || null;
                if (this.currentUser) {
                    this.editForm.name = this.currentUser.name;
                    this.editForm.email = this.currentUser.email || '';
                    this.upgradeForm.name = this.currentUser.name;
                }
            },
            error: (error) => {
                console.error('Error loading user profile:', error);
            }
        });
    }

    /**
     * Abrir modal de editar perfil
     */
    openEditModal(): void {
        this.showEditModal = true;
        this.editError = '';
        this.editSuccess = '';
        if (this.currentUser) {
            this.editForm.name = this.currentUser.name;
            this.editForm.email = this.currentUser.email || '';
        }
    }

    /**
     * Cerrar modal de editar perfil
     */
    closeEditModal(): void {
        this.showEditModal = false;
        this.editError = '';
        this.editSuccess = '';
    }

    /**
     * Actualizar perfil
     */
    updateProfile(): void {
        if (!this.editForm.name.trim()) {
            this.editError = 'El nombre es obligatorio';
            return;
        }

        this.isLoading = true;
        this.editError = '';

        this.userService.updateProfile(this.editForm).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.editSuccess = 'Perfil actualizado exitosamente';

                // Actualizar usuario en el servicio de auth
                if (response.data) {
                    this.currentUser = response.data;
                }

                setTimeout(() => {
                    this.closeEditModal();
                    this.loadUserProfile();
                }, 2000);
            },
            error: (error) => {
                this.isLoading = false;
                this.editError = error.error?.message || 'Error al actualizar el perfil';
            }
        });
    }

    /**
     * Abrir modal de cambiar contraseña
     */
    openPasswordModal(): void {
        this.showPasswordModal = true;
        this.passwordError = '';
        this.passwordSuccess = '';
        this.passwordForm = {
            current_password: '',
            new_password: '',
            new_password_confirmation: ''
        };
    }

    /**
     * Cerrar modal de cambiar contraseña
     */
    closePasswordModal(): void {
        this.showPasswordModal = false;
        this.passwordError = '';
        this.passwordSuccess = '';
    }

    /**
     * Cambiar contraseña
     */
    changePassword(): void {
        if (!this.passwordForm.current_password || !this.passwordForm.new_password) {
            this.passwordError = 'Todos los campos son obligatorios';
            return;
        }

        if (this.passwordForm.new_password !== this.passwordForm.new_password_confirmation) {
            this.passwordError = 'Las contraseñas nuevas no coinciden';
            return;
        }

        if (this.passwordForm.new_password.length < 6) {
            this.passwordError = 'La nueva contraseña debe tener al menos 6 caracteres';
            return;
        }

        this.isLoading = true;
        this.passwordError = '';

        this.userService.changePassword(this.passwordForm).subscribe({
            next: () => {
                this.isLoading = false;
                this.passwordSuccess = 'Contraseña cambiada exitosamente';

                setTimeout(() => {
                    this.closePasswordModal();
                }, 2000);
            },
            error: (error) => {
                this.isLoading = false;
                this.passwordError = error.error?.message || 'Error al cambiar la contraseña';
            }
        });
    }

    /**
     * Abrir modal de actualizar cuenta
     */
    openUpgradeModal(): void {
        this.showUpgradeModal = true;
        this.upgradeError = '';
        this.upgradeSuccess = '';
        if (this.currentUser) {
            this.upgradeForm.name = this.currentUser.name;
        }
    }

    /**
     * Cerrar modal de actualizar cuenta
     */
    closeUpgradeModal(): void {
        this.showUpgradeModal = false;
        this.upgradeError = '';
        this.upgradeSuccess = '';
    }

    /**
     * Actualizar cuenta anónima
     */
    upgradeAccount(): void {
        if (!this.upgradeForm.name || !this.upgradeForm.email || !this.upgradeForm.password) {
            this.upgradeError = 'Todos los campos son obligatorios';
            return;
        }

        if (this.upgradeForm.password !== this.upgradeForm.password_confirmation) {
            this.upgradeError = 'Las contraseñas no coinciden';
            return;
        }

        if (this.upgradeForm.password.length < 6) {
            this.upgradeError = 'La contraseña debe tener al menos 6 caracteres';
            return;
        }

        this.isLoading = true;
        this.upgradeError = '';

        this.userService.upgradeAccount(this.upgradeForm).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.upgradeSuccess = 'Cuenta actualizada exitosamente';

                if (response.data) {
                    this.currentUser = response.data;
                }

                setTimeout(() => {
                    this.closeUpgradeModal();
                    this.loadUserProfile();
                }, 2000);
            },
            error: (error) => {
                this.isLoading = false;
                this.upgradeError = error.error?.message || 'Error al actualizar la cuenta';
            }
        });
    }

    /**
     * Abrir modal de eliminar cuenta
     */
    openDeleteModal(): void {
        this.showDeleteModal = true;
        this.deleteError = '';
        this.deleteSuccess = '';
        this.deletePassword = '';
    }

    /**
     * Cerrar modal de eliminar cuenta
     */
    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.deleteError = '';
        this.deleteSuccess = '';
    }

    /**
     * Eliminar cuenta
     */
    deleteAccount(): void {
        if (!this.currentUser?.is_anonymous && !this.deletePassword) {
            this.deleteError = 'Debes ingresar tu contraseña para eliminar la cuenta';
            return;
        }

        this.isLoading = true;
        this.deleteError = '';

        const password = this.currentUser?.is_anonymous ? undefined : this.deletePassword;

        this.userService.deleteAccount(password).subscribe({
            next: () => {
                this.isLoading = false;
                this.deleteSuccess = 'Cuenta eliminada exitosamente';

                setTimeout(() => {
                    this.authService.logout().then(() => {
                        this.router.navigate(['/login']);
                    });
                }, 2000);
            },
            error: (error) => {
                this.isLoading = false;
                this.deleteError = error.error?.message || 'Error al eliminar la cuenta';
            }
        });
    }

    /**
     * Abrir modal de foto de perfil
     */
    openPhotoModal(): void {
        this.showPhotoModal = true;
        this.photoError = '';
        this.photoSuccess = '';
        this.selectedFile = null;
        this.photoPreview = null;
    }

    /**
     * Cerrar modal de foto de perfil
     */
    closePhotoModal(): void {
        this.showPhotoModal = false;
        this.photoError = '';
        this.photoSuccess = '';
        this.selectedFile = null;
        this.photoPreview = null;
    }

    /**
     * Seleccionar archivo de foto
     */
    // profile.component.ts
    onFileSelected(event: any): void {
        const files = event.target.files;
        if (!files || files.length === 0) {
            return;
        }

        const file = files[0];

        // Validaciones más robustas
        if (file.size > 5 * 1024 * 1024) {
            this.photoError = 'La imagen debe ser menor a 5MB';
            this.selectedFile = null;
            this.photoPreview = null;
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            this.photoError = 'Solo se permiten archivos JPG, PNG o GIF';
            this.selectedFile = null;
            this.photoPreview = null;
            return;
        }

        this.selectedFile = file;
        this.photoError = '';

        // Crear preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.photoPreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Subir foto de perfil
     */
    uploadPhoto(): void {
        if (!this.selectedFile) {
            this.photoError = 'Selecciona una imagen';
            return;
        }
        console.log('Subiendo foto:', this.selectedFile); // Debug
        this.isLoading = true;
        this.photoError = '';

        this.userService.uploadProfilePhoto(this.selectedFile).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.photoSuccess = 'Foto de perfil actualizada exitosamente';
                console.log('Respuesta del servidor:', response); // Debug
                if (response.data) {
                    this.currentUser = response.data;
                }

                setTimeout(() => {
                    this.closePhotoModal();
                    this.loadUserProfile();
                }, 2000);
            },
            error: (error) => {
                console.error('Error al subir foto:', error); // Debug
                this.isLoading = false;
                this.photoError = error.error?.message || 'Error al subir la foto';
            }
        });
    }

    /**
     * Eliminar foto de perfil
     */
    deletePhoto(): void {
        this.isLoading = true;
        this.photoError = '';

        this.userService.deleteProfilePhoto().subscribe({
            next: (response) => {
                this.isLoading = false;
                this.photoSuccess = 'Foto de perfil eliminada exitosamente';

                if (response.data) {
                    this.currentUser = response.data;
                }

                setTimeout(() => {
                    this.closePhotoModal();
                    this.loadUserProfile();
                }, 2000);
            },
            error: (error) => {
                this.isLoading = false;
                this.photoError = error.error?.message || 'Error al eliminar la foto';
            }
        });
    }

    /**
     * Volver al dashboard
     */
    goBack(): void {
        this.router.navigate(['/dashboard']);
    }

    /**
     * Formatear fecha
     */
    formatDate(dateString: string | undefined): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Obtener URL de la foto de perfil
     */
    getProfilePhotoUrl(): string {
        if (this.currentUser?.profile_photo) {
            const { baseUrl } = environment;
            return baseUrl + this.currentUser.profile_photo;
        }
        // Usar un color de fondo y letra inicial como fallback
        const initials = this.currentUser?.name?.charAt(0)?.toUpperCase() || 'U';
        return `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
        <rect width="150" height="150" fill="#9CA3AF"/>
        <text x="75" y="85" font-family="Arial, sans-serif" font-size="60" fill="white" text-anchor="middle">${initials}</text>
      </svg>
    `)}`;
    }
}
