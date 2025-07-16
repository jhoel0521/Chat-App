import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {

    // 🌐 API URLs
    get apiUrl(): string {
        return environment.apiUrl;
    }

    get baseUrl(): string {
        return environment.baseUrl;
    }

    // 🔐 Storage Keys
    get tokenKey(): string {
        return environment.tokenKey;
    }

    get refreshTokenKey(): string {
        return environment.refreshTokenKey;
    }

    get userKey(): string {
        return environment.userKey;
    }

    get guestKey(): string {
        return environment.guestKey;
    }

    // 🔌 WebSocket Configuration
    get websocketConfig() {
        return environment.websocket;
    }

    // 📁 File Upload Configuration
    get fileUploadConfig() {
        return environment.fileUpload;
    }

    // ⏱️ Timeouts
    get timeouts() {
        return environment.timeouts;
    }

    // 📱 App Info
    get appInfo() {
        return environment.app;
    }

    // 🎨 UI Configuration
    get uiConfig() {
        return environment.ui;
    }

    // 🔍 Helper methods
    isProduction(): boolean {
        return environment.production;
    }

    isDevelopment(): boolean {
        return !environment.production;
    }

    /**
     * Construye URL completa para un endpoint
     */
    buildApiUrl(endpoint: string): string {
        return `${this.apiUrl}/${endpoint.replace(/^\//, '')}`;
    }

    /**
     * Construye URL completa para archivos estáticos
     */
    buildAssetUrl(path: string): string {
        return `${this.baseUrl}/${path.replace(/^\//, '')}`;
    }
}
