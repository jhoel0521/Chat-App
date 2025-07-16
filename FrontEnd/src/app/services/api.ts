import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
    data?: T;
    message?: string;
    errors?: any;
    status: number;
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly baseUrl = environment.apiUrl;
    private readonly appUrl = environment.baseUrl;

    constructor(private http: HttpClient) { }

    /**
     * GET request
     */
    get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
        const url = `${this.baseUrl}/${endpoint}`;
        return this.http.get<ApiResponse<T>>(url, { params });
    }

    /**
     * POST request
     */
    post<T>(endpoint: string, data?: any): Observable<ApiResponse<T>> {
        const url = `${this.baseUrl}/${endpoint}`;
        return this.http.post<ApiResponse<T>>(url, data);
    }

    /**
     * PUT request
     */
    put<T>(endpoint: string, data?: any): Observable<ApiResponse<T>> {
        const url = `${this.baseUrl}/${endpoint}`;
        return this.http.put<ApiResponse<T>>(url, data);
    }

    /**
     * PATCH request
     */
    patch<T>(endpoint: string, data?: any): Observable<ApiResponse<T>> {
        const url = `${this.baseUrl}/${endpoint}`;
        return this.http.patch<ApiResponse<T>>(url, data);
    }

    /**
     * DELETE request
     */
    delete<T>(endpoint: string): Observable<ApiResponse<T>> {
        const url = `${this.baseUrl}/${endpoint}`;
        return this.http.delete<ApiResponse<T>>(url);
    }

    /**
     * Upload file
     */
    upload<T>(endpoint: string, formData: FormData): Observable<ApiResponse<T>> {
        const url = `${this.baseUrl}/${endpoint}`;
        return this.http.post<ApiResponse<T>>(url, formData);
    }

    /**
     * Download file
     */
    downloadFile(endpoint: string): Observable<Blob> {
        const url = `${this.baseUrl}/${endpoint}`;
        return this.http.get(url, { responseType: 'blob' });
    }
}
