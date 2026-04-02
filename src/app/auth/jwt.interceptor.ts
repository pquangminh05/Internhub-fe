import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token: string | null = null;

    if (typeof window !== 'undefined') {
      token = localStorage.getItem('jwt_token');
    }

    // Kiểm tra nếu URL là tuyệt đối tới backend hoặc là đường dẫn tương đối bắt đầu bằng /api
    const isApiUrl =
      request.url.startsWith('http://localhost:8090/api') || request.url.startsWith('/api');
    if (token && isApiUrl) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request);
  }
}
