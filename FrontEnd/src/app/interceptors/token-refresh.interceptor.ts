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

    const refreshToken = localStorage.getItem(environment.refreshTokenKey);
    
    if (refreshToken) {
      const http = inject(HttpClient);
      
      // Hacer request para refresh token
      return http.post<any>(`${environment.apiUrl}/token/refresh`, {
        refresh_token: refreshToken
      }).pipe(
        switchMap((token: any) => {
          isRefreshing = false;
          refreshTokenSubject.next(token.access_token);
          
          // Guardar nuevo token
          localStorage.setItem(environment.tokenKey, token.access_token);
          
          // Reintentar la request original con el nuevo token
          return next(addTokenToRequest(req, token.access_token));
        }),
        catchError((err) => {
          isRefreshing = false;
          
          // Si el refresh falla, limpiar localStorage y redirigir a login
          localStorage.removeItem(environment.tokenKey);
          localStorage.removeItem(environment.refreshTokenKey);
          localStorage.removeItem(environment.userKey);
          
          // Aquí podrías redirigir a login usando Router
          // window.location.href = '/login';
          
          return throwError(() => err);
        })
      );
    }
  }
  
  return throwError(() => new Error('No refresh token available'));
}

function addTokenToRequest(request: any, token: string) {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function isAuthRoute(url: string): boolean {
  const authRoutes = ['/login', '/register', '/guest/init', '/token/refresh'];
  return authRoutes.some(route => url.includes(route));
}
