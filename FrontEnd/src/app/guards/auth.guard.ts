import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  authService.scheduleSessionExtendAlert();
  // Verificar estado actual del token primero
  const hasToken = !!authService.getToken();
  console.log('AuthGuard - hasToken:', hasToken, 'route:', route.routeConfig?.path);
  return authService.isLoggedIn$.pipe(
    map(isLoggedIn => {
      console.log('AuthGuard - isLoggedIn from observable:', isLoggedIn);

      // Si tenemos token pero el observable no está actualizado, permitir acceso
      if (hasToken || isLoggedIn) {
        return true;
      } else {
        console.log('AuthGuard - Not authenticated, redirecting to login');
        // Usar navigateByUrl para navegación absoluta
        router.navigate(['/login'], { queryParams: { redirect: state.url } });
        return false;
      }
    })
  );
};

/**
 * Guard para evitar que usuarios autenticados accedan al login
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar estado actual del token primero
  const hasToken = !!authService.getToken();

  return authService.isLoggedIn$.pipe(
    map(isLoggedIn => {

      // Si tenemos token o el observable indica que está logueado, redirigir al dashboard
      if (hasToken || isLoggedIn) {
        // Usar navigateByUrl para navegación absoluta
        router.navigateByUrl('/dashboard');
        return false;
      } else {
        return true;
      }
    })
  );
};
