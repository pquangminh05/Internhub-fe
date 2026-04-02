// src/app/auth/auth.guard.ts — mở rộng file hiện có

import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Auth } from './auth';
import { PermissionService } from '../services/permission.service';
import { map, switchMap, take } from 'rxjs';
import { RoleService } from './role.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(Auth);
  const router = inject(Router);
  const permissionService = inject(PermissionService);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Nếu đã đăng nhập, kiểm tra quyền
  const requiredPermission = route.data['requiredPermission'];

  if (requiredPermission) {
    // Tải quyền nếu chưa có hoặc đảm bảo đã tải
    return permissionService.getPermissions().pipe(
      take(1), // Lấy giá trị hiện tại và hoàn thành
      switchMap(() => {
        // Sau khi đảm bảo quyền đã được tải, kiểm tra quyền cụ thể
        return permissionService
          .hasPermission(requiredPermission.functionCode, requiredPermission.permissionType)
          .pipe(
            take(1), // Lấy giá trị hiện tại và hoàn thành
            map((hasPerm) => {
              if (hasPerm) {
                return true;
              } else {
                // Nếu không có quyền, điều hướng về dashboard hoặc trang báo lỗi
                console.warn(
                  `User does not have required permission for ${requiredPermission.functionCode}:${requiredPermission.permissionType}`,
                );
                router.navigate(['/dashboard']); // Hoặc một trang "Unauthorized"
                return false;
              }
            }),
          );
      }),
    );
  }

  // Nếu không có requiredPermission nào được định nghĩa trong route.data, cho phép truy cập
  return true;
};

// Chỉ INTERN được vào
export const internGuard: CanActivateFn = () => {
  const role = inject(RoleService);
  const router = inject(Router);
  if (role.isIntern()) return true;
  router.navigate(['/dashboard']);
  return false;
};

// Không phải INTERN mới được vào
export const nonInternGuard: CanActivateFn = () => {
  const role = inject(RoleService);
  const router = inject(Router);
  if (!role.isIntern()) return true;
  router.navigate(['/dashboard/intern']);
  return false;
};
