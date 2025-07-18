import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { tokenRefreshInterceptor } from './interceptors/token-refresh.interceptor';

import { routes } from './app.routes';
import { WebSocketService } from './services/websocket/websocket.service';
import { ConfigService } from './services/config.service';
import { AuthService } from './services/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        tokenRefreshInterceptor
      ])
    ),
    {
      provide: WebSocketService,
      useFactory: () => {
        const service = new WebSocketService(
          inject(ConfigService),
          inject(AuthService),
          inject(HttpClient)
        );
        return service;
      }
    }
  ]
};
