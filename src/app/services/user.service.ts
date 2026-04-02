import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, BehaviorSubject } from 'rxjs';
import { UserProfileResponse } from '../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseApiUrl = 'http://localhost:8090/api/user'; // Base URL for user-related APIs

  // Default avatar for consistency across components
  public getDefaultAvatar(): string {
    return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=200';
  }

  // BehaviorSubject to share current user name across components
  private _userNameSource = new BehaviorSubject<string>('');
  currentUserName$ = this._userNameSource.asObservable();

  // BehaviorSubject to share current user avatar across components
  private _userAvatarSource = new BehaviorSubject<string>(this.getDefaultAvatar());
  currentUserAvatar$ = this._userAvatarSource.asObservable();

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    // In a real application, you would get the JWT token from a service (e.g., AuthService)
    // and include it in the Authorization header.
    // Assuming JwtInterceptor is handling this automatically for now.
    // For multipart/form-data, do NOT manually set Content-Type; the browser will handle it.
    return new HttpHeaders({
      // 'Content-Type': 'application/json', // Not needed for FormData
      // 'Authorization': `Bearer ${yourAuthService.getToken()}` // Handled by interceptor
    });
  }

  getUserProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.baseApiUrl}/profile`, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError<UserProfileResponse>('getUserProfile'))
    );
  }

  // New method to upload avatar
  uploadAvatar(formData: FormData): Observable<{ newAvatarUrl: string }> {
    // HttpHeaders are intentionally left minimal here.
    // The browser will set the correct 'Content-Type: multipart/form-data' with boundary.
    // The JWT Interceptor should add the Authorization header.
    return this.http.patch<{ newAvatarUrl: string }>(`${this.baseApiUrl}/profile/avatar`, formData).pipe(
      catchError(this.handleError<{ newAvatarUrl: string }>('uploadAvatar'))
    );
  }

  // Method to update the user name across components
  updateUserName(name: string) {
    this._userNameSource.next(name);
  }

  // Method to update the avatar URL across components
  updateUserAvatar(avatarUrl: string) {
    this._userAvatarSource.next(avatarUrl);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // Log to console for debugging

      // Re-throw the error for component to handle
      return throwError(() => error);
    };
  }
}
