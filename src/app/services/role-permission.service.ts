import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { RolePermissionRequest, RolePermissionResponse } from '../shared/models/permissions.model'; // Assuming these are defined there

@Injectable({
  providedIn: 'root'
})
export class RolePermissionService {
  private baseApiUrl = 'http://localhost:8090/api/admin/role-permissions'; // Base URL for role permissions

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    // In a real application, you would get the JWT token from a service (e.g., AuthService)
    // and include it in the Authorization header.
    // For now, we'll assume it's handled by JwtInterceptor or hardcode for testing if needed.
    // However, the backend report states these endpoints require ADMIN role,
    // so an authenticated request (with JWT) is expected.
    return new HttpHeaders({
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${yourAuthService.getToken()}` // Uncomment and integrate with actual auth service
    });
  }

  // Assumed endpoint to get all role permissions in a flat list
  // The backend provided a CSV-like flat list, so this endpoint is logical.
  // If this endpoint doesn't exist, we'd need to fetch per roleId.
  getAllRolePermissions(): Observable<RolePermissionResponse[]> {
    return this.http.get<RolePermissionResponse[]>(this.baseApiUrl, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError('getAllRolePermissions', []))
    );
  }

  // Get all permissions for a specific role
  getRolePermissionsByRoleId(roleId: number): Observable<RolePermissionResponse[]> {
    return this.http.get<RolePermissionResponse[]>(`${this.baseApiUrl}/${roleId}`, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError(`getRolePermissionsByRoleId(roleId=${roleId})`, []))
    );
  }

  // Get a specific permission entry
  getRolePermission(roleId: number, functionId: number): Observable<RolePermissionResponse> {
    return this.http.get<RolePermissionResponse>(`${this.baseApiUrl}/${roleId}/${functionId}`, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError<RolePermissionResponse>(`getRolePermission(roleId=${roleId}, functionId=${functionId})`))
    ) as Observable<RolePermissionResponse>;
  }

  // Create or Update a role permission
  updateRolePermission(request: RolePermissionRequest): Observable<RolePermissionResponse> {
    return this.http.post<RolePermissionResponse>(this.baseApiUrl, request, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError<RolePermissionResponse>('updateRolePermission'))
    ) as Observable<RolePermissionResponse>;
  }

  // Delete a specific role permission
  deleteRolePermission(roleId: number, functionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}/${roleId}/${functionId}`, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError<void>('deleteRolePermission'))
    ) as Observable<void>;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // Log to console for debugging
      // Optionally, send the error to remote logging infrastructure

      return throwError(() => error); // Re-throw the error for component to handle
    };
  }
}
