import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Rutas que NO necesitan token (desde environment)
  const excludedRoutes = environment.excludedAuthRoutes;
  
  // Verificar si la ruta actual está excluida
  // Para /rooms, solo excluir GET requests (lectura pública)
  const isExcludedRoute = excludedRoutes.some(route => {
    if (route === '/rooms') {
      // Solo excluir GET requests a /rooms (listado público)
      return req.url.includes(route) && req.method === 'GET';
    }
    // Para otras rutas, usar la lógica original
    return req.url.includes(route);
  });
  
  // Obtener token del localStorage solo si no es una ruta excluida
  const token = !isExcludedRoute ? localStorage.getItem(environment.tokenKey) : null;
  
  // Clonar la request para agregar headers básicos
  let authReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

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
