import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core'; // Add OnDestroy
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // For ngModel in mat-radio-group
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox'; // For interactive checkboxes
import { MatRadioModule } from '@angular/material/radio'; // For mat-radio-group
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // For mat-spinner
import { MatSnackBar } from '@angular/material/snack-bar'; // For notifications
import { Auth } from '../../../../auth/auth';

import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import {
  FUNCTIONS_DATA,
  FUNCTION_CODE_TO_ID_MAP,
  FUNCTION_ID_TO_NAME_MAP,
  MOCK_ROLE_PERMISSIONS_FLAT, // Temporarily use mock flat data
  ROLES_DATA_MOCK, // Import ROLES_DATA_MOCK
  PermissionMatrix,
  RbacFeatureGroup,
  RbacFeature,
  SingleRoleFeaturePermission,
  RolePermissionRequest,
  RolePermissionResponse,
  FeaturePermission,
  toCrudString,
  Role, // Import Role interface
} from '../../../../shared/models/permissions.model';
import { RolePermissionService } from '../../../../services/role-permission.service'; // New service
import { PermissionService } from '../../../../services/permission.service'; // Import PermissionService
import { Subject, takeUntil, combineLatest } from 'rxjs'; // Import Subject, takeUntil, combineLatest

import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiPageHeaderComponent } from '../../../../shared/components/ui-page-header/ui-page-header.component';

@Component({
  selector: 'app-account-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // For ngModel in mat-radio-group
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule,
    MatRadioModule, // For mat-radio-group
    MatProgressSpinnerModule, // For mat-spinner
    UiCardComponent, // New
    UiPageHeaderComponent, // New
  ],
  templateUrl: './account-management.component.html',
  styleUrls: ['./account-management.component.css'],
})
export class AccountManagementComponent implements OnInit, OnDestroy {
  // Implement OnDestroy
  activeTab: 'accounts' | 'permissions' = 'accounts';
  users: any[] = []; // Cần khai báo để tránh lỗi trong template, nên được định nghĩa kiểu dữ liệu cụ thể sau này
  rolesHeader: string[] = [];
  roleDefinitions: Role[] = [];
  permissionMatrix: PermissionMatrix | null = null;
  isLoading = true;
  selectedPermissionType: 'canCreate' | 'canAccess' | 'canEdit' | 'canDelete' = 'canAccess'; // Default view

  private destroy$ = new Subject<void>(); // Subject to manage subscriptions

  constructor(
    public dialog: MatDialog,
    private rolePermissionService: RolePermissionService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private permissionService: PermissionService, // Inject PermissionService
    private authService: Auth,
  ) {}

  ngOnInit(): void {
    // Load roles and permissions concurrently
    combineLatest([
      this.permissionService.getRoles(),
      this.permissionService.getPermissions(),
      this.rolePermissionService.getAllRolePermissions(),
      this.authService.getUsersAll(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([roles, permissions, flatPermissions, users]) => {
          if (roles) {
            this.roleDefinitions = roles;
            this.rolesHeader = roles.map((r) => r.name);
          }
          this.users = users;
          // Permissions are handled by buildPermissionMatrix
          this.permissionMatrix = this.buildPermissionMatrix(flatPermissions);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load initial data:', err);
          this.snackBar.open('Failed to load initial data. Please check backend API.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
          this.isLoading = false;
          // Fallback to mock data if loading fails
          this.roleDefinitions = ROLES_DATA_MOCK; // Use the mock data for roles
          this.rolesHeader = ROLES_DATA_MOCK.map((r) => r.name);
          this.permissionMatrix = this.buildPermissionMatrix(MOCK_ROLE_PERMISSIONS_FLAT);
          this.users = [];
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Maps flat RolePermissionResponse[] from Backend to structured PermissionMatrix for Frontend
  private buildPermissionMatrix(flatPermissions: RolePermissionResponse[]): PermissionMatrix {
    console.log('Building matrix from flat permissions:', flatPermissions);
    const matrix: PermissionMatrix = { groups: [] };
    const featureMap = new Map<number, RbacFeature>(); // Map functionId to RbacFeature

    // Initialize all features from FUNCTIONS_DATA
    FUNCTIONS_DATA.forEach((func) => {
      const rbacFeature: RbacFeature = {
        id: func.code, // Use the full code, e.g., E01_USER_MGMT
        functionId: func.id,
        name: func.name,
        permissions: {},
      };
      // Initialize permissions for all roles to false
      this.roleDefinitions.forEach((role) => {
        // Use dynamic roleDefinitions
        rbacFeature.permissions[role.id] = {
          roleId: role.id,
          canCreate: false,
          canAccess: false,
          canEdit: false,
          canDelete: false,
        };
      });
      featureMap.set(func.id, rbacFeature);
    });
    console.log('Feature map after initialization:', featureMap);

    // Populate permissions from flat data
    flatPermissions.forEach((perm) => {
      const feature = featureMap.get(perm.functionId);
      if (feature) {
        feature.permissions[perm.roleId] = {
          roleId: perm.roleId,
          canCreate: perm.canCreate,
          canAccess: perm.canAccess,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
        };
      }
    });
    console.log('Feature map after populating permissions:', featureMap);

    // Group features as per the original table structure
    const groupsConfig = [
      {
        name: 'Quản trị Hệ thống',
        functionCodes: [
          'E01_USER_MGMT',
          'E02_DEPT_POS_CONFIG',
          'E03_SKILL_CONFIG',
          'E04_AUDIT_LOGS',
        ],
      },
      {
        name: 'Onboarding & Quản lý Intern',
        functionCodes: [
          'E05_INTERN_IMPORT',
          'E06_ASSIGN_MENTOR',
          'E07_UNI_MGMT',
          'E08_PERSONAL_DASHBOARD',
        ],
      },
      {
        name: 'Điều hành Micro-tasks',
        functionCodes: ['E09_TASK_ACTION', 'E10_TODO_LIST', 'E11_TASK_SUBMISSION', 'E12_GRADING'],
      },
      {
        name: 'Luồng Phê duyệt & Báo cáo',
        functionCodes: [
          'E14_REALTIME_SCORE',
          'E15_FINAL_EVALUATION',
          'E16_FINAL_APPROVAL',
          'E17_RADAR_CHART',
          'E18_COMPARE_DASHBOARD',
          'E19_EXPORT_REPORT',
        ],
      },
      // Add other functions that might not fit neatly into these primary groups
      { name: 'Khác', functionCodes: ['USER_MGMT', 'SKILL_LIB'] }, // Example for other codes
    ];

    groupsConfig.forEach((groupConfig) => {
      const group: RbacFeatureGroup = {
        name: groupConfig.name,
        features: groupConfig.functionCodes
          .map((code) => FUNCTION_CODE_TO_ID_MAP[code]) // Get functionId from code
          .map((functionId) => (functionId ? featureMap.get(functionId) : undefined))
          .filter((f): f is RbacFeature => f !== undefined),
      };
      console.log(
        'Group config:',
        groupConfig.name,
        'features:',
        group.features.length,
        group.features,
      );
      if (group.features.length > 0) {
        matrix.groups.push(group);
      }
    });
    console.log('Final matrix:', matrix);

    return matrix;
  }

  getRoleName(roleId: number): string {
    return this.roleDefinitions.find((role) => role.id === roleId)?.name || 'Unknown'; // Use dynamic roleDefinitions
  }

  // Method to check if a permission is enabled for a given role and feature
  isPermissionEnabled(
    feature: RbacFeature,
    roleId: number,
    type: 'canCreate' | 'canAccess' | 'canEdit' | 'canDelete',
  ): boolean {
    const rolePermission = feature.permissions[roleId];
    if (!rolePermission) return false;
    return rolePermission[type];
  }

  // Method called when a checkbox/toggle is changed
  onPermissionChange(
    feature: RbacFeature,
    role: { id: number; name: string },
    permissionType: 'canCreate' | 'canAccess' | 'canEdit' | 'canDelete',
    event: MatCheckboxChange,
  ): void {
    const isChecked = event.checked;

    // Update local matrix optimistically
    const currentPermission = feature.permissions[role.id];
    if (currentPermission) {
      currentPermission[permissionType] = isChecked;
    }

    const request: RolePermissionRequest = {
      roleId: role.id,
      functionId: feature.functionId,
      canAccess: feature.permissions[role.id]?.canAccess || false,
      canCreate: feature.permissions[role.id]?.canCreate || false,
      canEdit: feature.permissions[role.id]?.canEdit || false,
      canDelete: feature.permissions[role.id]?.canDelete || false,
    };

    this.rolePermissionService.updateRolePermission(request).subscribe({
      next: (response) => {
        this.snackBar.open(
          `Permission for ${role.name} on ${feature.name} (${permissionType}) updated successfully.`,
          'Close',
          { duration: 3000 },
        );
        // Update the 'id' of the permission if the response includes it (for tracking existing entries)
        if (response.id) {
          // This would be more relevant if we were tracking individual permission response IDs
        }
      },
      error: (err) => {
        console.error('Failed to update permission:', err);
        this.snackBar.open(
          `Failed to update permission for ${role.name} on ${feature.name} (${permissionType}).`,
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] },
        );
        // Revert local change if API call fails
        if (currentPermission) {
          currentPermission[permissionType] = !isChecked;
        }
      },
    });
  }

  trackByRoleId(index: number, role: { id: number; name: string }): number {
    return role.id;
  }

  trackByFeatureId(index: number, feature: RbacFeature): number {
    return feature.functionId;
  }

  trackByGroup(index: number, group: RbacFeatureGroup): string {
    return group.name; // Assuming group names are unique
  }

  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '450px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The create user dialog was closed', result);
      if (result) {
        // Optionally reload permissions if user creation affects roles or permissions visible here
        // this.loadPermissions();
      }
    });
  }

  /**
   * Trả về nhãn hiển thị cho trạng thái tài khoản
   * @param enabled Trạng thái kích hoạt của người dùng
   */
  getStatusLabel(enabled: boolean): string {
    return enabled ? 'Hoạt động' : 'Đã khóa';
  }
}
