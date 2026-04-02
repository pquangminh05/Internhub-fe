import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, throwError, BehaviorSubject, map, tap } from 'rxjs';
import { UserCreationRequest, ErrorDetails } from '../shared/models/user.model';
import { API_ENDPOINTS, BASE_API_URL } from '../api-endpoints';
// import { jwtDecode } from 'jwt-decode'; // Uncomment if using jwt-decode library

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = API_ENDPOINTS.Auth.login; // Your backend login API endpoint
  private baseApiUrl = BASE_API_URL; // Base URL for general backend API calls

  // BehaviorSubject để quản lý trạng thái người dùng hiện tại
  // Ban đầu sẽ kiểm tra localStorage xem đã có token chưa để khôi phục trạng thái
  private currentUserSubject: BehaviorSubject<any | null>;
  public currentUser$: Observable<any | null>;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    let user = null;
    if (isPlatformBrowser(this.platformId)) {
      // Khởi tạo currentUserSubject từ token trong localStorage (nếu có)
      const token = localStorage.getItem('jwt_token');
      if (token) {
        // TODO: Giải mã JWT token để lấy thông tin người dùng thực sự
        // Ví dụ: user = jwtDecode(token);
        user = { accessToken: token }; // Tạm thời lưu trữ token như một phần của user
      }
    }
    this.currentUserSubject = new BehaviorSubject<any | null>(user);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  // Getter để lấy giá trị hiện tại của người dùng
  public get currentUserValue(): any | null {
    return this.currentUserSubject.value;
  }

  // Getter để kiểm tra trạng thái đăng nhập
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
    return this.http.post<any>(this.apiUrl, credentials, httpOptions).pipe(
      tap((response: any) => {
        // Sau khi đăng nhập thành công
        if (response && response.accessToken) {
          if (isPlatformBrowser(this.platformId)) {
            // Lưu token vào localStorage
            localStorage.setItem('jwt_token', response.accessToken);
          }
          // TODO: Giải mã JWT token để lấy thông tin người dùng thực sự
          // Ví dụ: this.currentUserSubject.next(jwtDecode(response.token));
          this.currentUserSubject.next({ accessToken: response.accessToken }); // Tạm thời cập nhật user với token
        }
      }),
      catchError(this.handleError<any>('login')),
    );
  }

  createUser(userData: UserCreationRequest): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
    return this.http
      .post<any>(API_ENDPOINTS.Admin.users, userData, httpOptions)
      .pipe(catchError(this.handleError<any>('createUser')));
  }

  /**
   * Lấy danh sách tất cả người dùng cho trang quản trị
   */
  getUsersAll(): Observable<any[]> {
    return this.http
      .get<any[]>(`http://localhost:8090/api/admin/users/all`)
      .pipe(catchError(this.handleError<any[]>('getUsersAll', [])));
  }

  // Phương thức đăng xuất
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Xóa token khỏi localStorage
      localStorage.removeItem('jwt_token');
    }
    // Cập nhật trạng thái người dùng thành null
    this.currentUserSubject.next(null);
  }

  // Phương thức thay đổi mật khẩu
  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    const token = this.currentUserValue?.accessToken; // Lấy token từ BehaviorSubject
    if (!token) {
      return throwError(() => new Error('No JWT token found. User not authenticated.'));
    }

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }),
    };

    const body = { oldPassword, newPassword };

    return this.http
      .post<any>(API_ENDPOINTS.User.changePassword, body, httpOptions)
      .pipe(catchError(this.handleError<any>('changePassword')));
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // Ghi lỗi ra console
      // Tùy chọn: gửi lỗi đến một cơ sở hạ tầng ghi nhật ký từ xa

      // Cho phép ứng dụng tiếp tục chạy bằng cách trả về một kết quả rỗng.
      return throwError(() => error);
    };
  }

  activateAccount(token: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
    return this.http
      .get<any>(`${API_ENDPOINTS.Auth.activateAccount}?token=${token}`, httpOptions)
      .pipe(catchError(this.handleError<any>('activateAccount')));
  }
}
