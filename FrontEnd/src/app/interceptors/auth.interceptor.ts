import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Rutas que NO necesitan token (desde environment)
  const excludedRoutes = environment.excludedAuthRoutes;

  // Verificar si la ruta actual está excluida
  const isExcludedRoute = excludedRoutes.some(route => {
    return req.url.includes(route);
  });
  // Obtener token del localStorage solo si no es una ruta excluida
  const token = !isExcludedRoute ? localStorage.getItem(environment.tokenKey) : null;
  // Clonar la request para agregar headers básicos

  const isFormData = req.body instanceof FormData;

  // Solo agregar Content-Type si NO es FormData
  let headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  let authReq = req.clone({ setHeaders: headers });

  // Si hay token, la request es para nuestra API y NO es una ruta excluida, agregar Authorization
  if (token && req.url.startsWith(environment.apiUrl) && !isExcludedRoute) {
    authReq = authReq.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  return next(authReq);
};
