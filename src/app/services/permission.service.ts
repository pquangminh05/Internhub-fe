import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { API_ENDPOINTS } from '../api-endpoints';
import { Role } from '../shared/models/permissions.model'; // Import Role interface

// Định nghĩa các kiểu dữ liệu cho Permission
export interface FunctionPermission {
  id: number;
  functionCode: string;
  functionName: string;
  canAccess: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private permissionsSubject = new BehaviorSubject<FunctionPermission[] | null>(null);
  public permissions$ = this.permissionsSubject.asObservable();

  private rolesSubject = new BehaviorSubject<Role[] | null>(null);
  public roles$ = this.rolesSubject.asObservable();

  private departmentsSubject = new BehaviorSubject<Department[] | null>(null);
  public departments$ = this.departmentsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Gọi API để lấy tất cả các quyền (permissions) của người dùng hiện tại
   * và lưu trữ chúng vào BehaviorSubject.
   * @returns Observable<FunctionPermission[]>
   */
  loadPermissions(): Observable<FunctionPermission[]> {
    return this.http.get<FunctionPermission[]>(API_ENDPOINTS.Auth.getPermissions).pipe(
      tap((permissions) => {
        this.permissionsSubject.next(permissions);
        console.log('Permissions loaded:', permissions);
      }),
      catchError((error) => {
        console.error('Failed to load permissions:', error);
        this.permissionsSubject.next(null); // Clear permissions on error
        return of([]); // Return an empty array or rethrow error based on desired behavior
      }),
    );
  }

  /**
   * Trả về các quyền hiện tại dưới dạng Observable.
   * Nếu quyền chưa được tải, sẽ kích hoạt tải.
   * @returns Observable<FunctionPermission[] | null>
   */
  getPermissions(): Observable<FunctionPermission[] | null> {
    if (!this.permissionsSubject.value) {
      this.loadPermissions().subscribe(); // Tải quyền nếu chưa có
    }
    return this.permissions$;
  }

  /**
   * Tải danh sách vai trò (roles) từ backend.
   * @returns Observable<Role[]>
   */
  loadRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(API_ENDPOINTS.Admin.roles).pipe(
      tap((roles) => {
        this.rolesSubject.next(roles);
        console.log('Roles loaded from backend:', roles);
      }),
      catchError((error) => {
        console.error('Failed to load roles from backend:', error);
        this.rolesSubject.next(null);
        return of([]);
      }),
    );
  }

  /**
   * Trả về danh sách vai trò hiện tại dưới dạng Observable.
   * Nếu vai trò chưa được tải, sẽ kích hoạt tải.
   * @returns Observable<Role[] | null>
   */
  getRoles(): Observable<Role[] | null> {
    if (!this.rolesSubject.value) {
      this.loadRoles().subscribe(); // Tải vai trò nếu chưa có
    }
    return this.roles$;
  }

  /**
   * Tải danh sách phòng ban từ backend.
   * @returns Observable<Department[]>
   */
  loadDepartments(): Observable<Department[]> {
    // Sử dụng URL tuyệt đối đồng nhất với các API khác để đảm bảo Interceptor hoạt động
    const url = 'http://localhost:8090/api/departments';
    return this.http.get<Department[]>(url).pipe(
      tap((departments) => {
        this.departmentsSubject.next(departments);
        console.log('Departments loaded from backend:', departments);
      }),
      catchError((error) => {
        console.error('Failed to load departments from backend:', error);
        this.departmentsSubject.next(null);
        return of([]);
      }),
    );
  }

  getDepartments(): Observable<Department[] | null> {
    if (!this.departmentsSubject.value) {
      this.loadDepartments().subscribe(); // Tải phòng ban nếu chưa có
    }
    return this.departments$;
  }

  /**
   * Kiểm tra xem người dùng có quyền cụ thể trên một functionCode hay không.
   * @param functionCode Mã chức năng (ví dụ: 'E01_USER_MGMT')
   * @param permissionType Loại quyền cần kiểm tra (ví dụ: 'canAccess', 'canCreate')
   * @returns Observable<boolean>
   */
  hasPermission(
    functionCode: string,
    permissionType: 'canAccess' | 'canCreate' | 'canEdit' | 'canDelete',
  ): Observable<boolean> {
    return this.permissions$.pipe(
      map((permissions) => {
        if (!permissions) {
          return false; // No permissions loaded
        }
        const permission = permissions.find((p) => p.functionCode === functionCode);
        return permission ? permission[permissionType] : false;
      }),
    );
  }

  /**
   * Clear permissions and roles, typically on logout.
   */
  clearPermissionsAndRoles(): void {
    this.permissionsSubject.next(null);
    this.rolesSubject.next(null);
    this.departmentsSubject.next(null);
  }
}
