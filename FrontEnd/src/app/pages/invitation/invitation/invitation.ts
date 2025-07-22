import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Room, RoomService } from '../../../services/room/room.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-invitation',
  templateUrl: './invitation.html',
  imports: [CommonModule],
})
export class Invitation implements OnInit {
  room: Room | null = null;

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    if (roomId) {
      this.roomService.getRoom(roomId).subscribe({
        next: res => this.room = res.data ?? null,
        error: () => this.router.navigate(['/dashboard']) // Redirige si hay error
      });
    }
  }

  acceptInvitation() {
    if (!this.room) return;

    this.roomService.joinRoom(this.room.id).subscribe({
      next: () => {
        // Una vez unido, navegar a la sala
        this.router.navigate(['/rooms', this.room!.id]);
      },
      error: (error) => {
        console.error('Error al unirse a la sala:', error);
        // Aquí puedes mostrar un mensaje de error o notificación
        alert('No se pudo unir a la sala, intenta más tarde.');
      }
    });
  }


  declineInvitation() {
    this.router.navigate(['/dashboard']);
  }

  get currentUser() {
    // Asume que usas un AuthService o similar
    return { name: 'Invitado', is_anonymous: true }; // Reemplaza con tu lógica real
  }

  hasProfilePhoto(): boolean {
    return false; // reemplaza si usas avatar
  }

  getProfilePhotoUrl(): string {
    return '';
  }

  logout() {
    this.router.navigate(['/login']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
