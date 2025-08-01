import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { CreateRoomComponent } from './pages/rooms/create-room';
import { EditRoomComponent } from './pages/rooms/edit-room';
import { RoomComponent } from './pages/room/room.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { authGuard, guestGuard } from './guards/auth.guard';
import { checkRoomGuard } from './guards/checkRoomGuard';
import { Invitation } from './pages/invitation/invitation/invitation';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'rooms/create',
    component: CreateRoomComponent,
    canActivate: [authGuard]
  },
  {
    path: 'rooms/edit/:id',
    component: EditRoomComponent,
    canActivate: [authGuard]
  },
  {
    path: 'rooms/:id',
    component: RoomComponent,
    canActivate: [authGuard, checkRoomGuard]
  },
  {
    path: 'invite/:roomId',
    component: Invitation,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/login' } // Wildcard route
];
