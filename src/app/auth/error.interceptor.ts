import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar'; // For displaying messages
import { Auth } from './auth'; // Assuming Auth service is in the same directory

// This interface helps to type the error response from Spring Boot
interface SpringBootErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string; // The message we want to display
  path: string;
  validationErrors?: { [key: string]: string[] }; // Optional validation errors
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: Auth
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unknown error occurred!';
        let backendError: SpringBootErrorResponse | undefined;

        if (error.error && typeof error.error === 'object') {
          backendError = error.error as SpringBootErrorResponse;
          errorMessage = backendError.message || errorMessage;
        } else if (error.message) {
          errorMessage = error.message;
        }

        switch (error.status) {
          case 401: // Unauthorized
            console.error('HTTP Error 401: Unauthorized');
            this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
            this.authService.logout(); // Perform logout logic
            this.router.navigate(['/login']); // Redirect to login page
            break;

          case 403: // Forbidden
            console.error('HTTP Error 403: Forbidden');
            this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
            this.router.navigate(['/access-denied']); // Redirect to access denied page
            break;

          case 409: // Conflict
            console.error('HTTP Error 409: Conflict', backendError);
            // Specific message for 409 as per requirement
            const conflictMessage = 'Dữ liệu đã tồn tại (Email/Tên phòng ban trùng)';
            this.snackBar.open(conflictMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
            break;

          case 400: // Bad Request
            console.error('HTTP Error 400: Bad Request', backendError);
            if (backendError?.validationErrors) {
              // Handle validation errors - for now, just log and display a general message
              // In a real application, you'd map these to specific form controls
              console.warn('Validation errors:', backendError.validationErrors);
              const validationErrorMessage = Object.values(backendError.validationErrors).flat().join('; ') || errorMessage;
              this.snackBar.open(`Lỗi xác thực: ${validationErrorMessage}`, 'Close', { duration: 7000, panelClass: ['error-snackbar'] });
            } else {
              this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
            }
            break;

          default:
            console.error(`HTTP Error ${error.status}: ${error.message}`, error);
            // Handle JSON parsing errors specifically
            if (error.status === 200 && error.message && error.message.includes('parsing')) {
              errorMessage = 'Task created successfully but response parsing failed';
              this.snackBar.open('Task created successfully', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
              return throwError(() => new Error(errorMessage));
            }
            this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
            break;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
