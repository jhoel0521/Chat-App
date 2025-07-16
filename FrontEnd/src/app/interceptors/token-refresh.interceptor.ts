import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es error 401 (Unauthorized) y no es una ruta de auth
      if (error.status === 401 && !isAuthRoute(req.url)) {
        return handle401Error(req, next);
      }
      
      return throwError(() => error);
    })
  );
};

function handle401Error(req: any, next: any): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const currentToken = localStorage.getItem(environment.tokenKey);
    
    if (currentToken) {
      const http = inject(HttpClient);
      
      // Intentar refrescar el token usando el endpoint disponible
      return http.post<any>(`${environment.apiUrl}/token/refresh`, {}, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      }).pipe(
        switchMap((response: any) => {
          isRefreshing = false;
          
          // Extraer el nuevo token de la respuesta (el backend devuelve { success: true, token: "..." })
          const newToken = response.token;
          refreshTokenSubject.next(newToken);
          
          // Guardar nuevo token
          localStorage.setItem(environment.tokenKey, newToken);
          
          // Reintentar la request original con el nuevo token
          return next(addTokenToRequest(req, newToken));
        }),
        catchError((err) => {
          isRefreshing = false;
          refreshTokenSubject.next(null);
          
          // Si el refresh falla, limpiar localStorage y redirigir a login
          localStorage.removeItem(environment.tokenKey);
          localStorage.removeItem(environment.userKey);
          
          // Redirigir a login
          window.location.href = '/login';
          
          return throwError(() => new Error('Token expired, please login again'));
        })
      );
    } else {
      isRefreshing = false;
      
      // No hay token, redirigir directamente
      window.location.href = '/login';
      return throwError(() => new Error('No token available, please login'));
    }
  }
  
  // Si ya se está refrescando, esperar
  return refreshTokenSubject.pipe(
    switchMap(token => {
      if (token) {
        return next(addTokenToRequest(req, token));
      } else {
        window.location.href = '/login';
        return throwError(() => new Error('Token refresh failed'));
      }
    })
  );
}

function addTokenToRequest(request: any, token: string) {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function isAuthRoute(url: string): boolean {
  const authRoutes = ['/login', '/register', '/guest/init'];
  return authRoutes.some(route => url.includes(route));
}
