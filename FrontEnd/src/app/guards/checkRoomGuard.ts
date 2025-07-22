// src/app/guards/check-room.guard.ts
import { Injectable } from '@angular/core';
import {
    CanActivateFn,
    Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot
} from '@angular/router';
import { inject } from '@angular/core';
import { RoomService } from '../services/room/room.service';
import { AuthService } from '../services/auth/auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export const checkRoomGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): Observable<boolean> => {
    const roomService = inject(RoomService);
    const router = inject(Router);
    const authService = inject(AuthService);
    const roomId = route.paramMap.get('id');
    console.log("se ejecuta el check room", roomId);

    if (!roomId) {
        router.navigate(['/dashboard']);
        return of(false);
    }

    return authService.currentUser$.pipe(
        switchMap(user => {
            if (!user) {
                router.navigate(['/login']);
                return of(false);
            }
            return roomService.checkRoom(roomId).pipe(
                map(response => {
                    if (response?.data?.is_active) {
                        return true;
                    } else {
                        router.navigate(['/invite', roomId]);
                        return false;
                    }
                }),
                catchError(err => {
                    console.error('❌ Error en checkRoomGuard', err);
                    router.navigate(['/dashboard']);
                    return of(false);
                })
            );
        })
    );
};
