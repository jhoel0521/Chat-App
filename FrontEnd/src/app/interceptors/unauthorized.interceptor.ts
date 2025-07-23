import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { environment } from '../../environments/environment';
import Swal from 'sweetalert2';

// ⚠️ Bandera global
let alreadyHandling401 = false;

function alertUnauthorized(authService: AuthService, router: Router) {
    if (alreadyHandling401) return;
    alreadyHandling401 = true;

    // Detener intervalos, timers, polling, etc. si lo usas en AuthService

    Swal.fire({
        icon: 'warning',
        title: 'Sesión expirada',
        text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false
    }).then(() => {
        // Limpia tokens, estados, etc.
        authService.forceClearAuthData();

        // Redirige y reinicia la bandera solo cuando ya terminó todo
        router.navigate(['/login'], { replaceUrl: true }).then(() => {
            // Esperar unos ms para que Angular reactive el estado antes de permitir más peticiones
            setTimeout(() => {
                alreadyHandling401 = false;
            }, 500);
        });
    });
}

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const excludedRoutes = environment.excludedAuthRoutes;

    const isExcludedRoute = excludedRoutes.some(route => req.url.includes(route));

    // ⚠️ Si ya se está manejando un 401, bloquear inmediatamente sin procesar más
    if (alreadyHandling401) {
        return throwError(() => new Error('Sesión expirada'));
    }

    if (isExcludedRoute) {
        return next(req);
    }

    return next(req).pipe(
        catchError((error) => {
            if (error.status === 401 && req.url !== '/logout') {
                console.warn('❌ Interceptor capturó error 401, ejecutando logout');
                alertUnauthorized(authService, router);
            }

            return throwError(() => error);
        })
    );
};
