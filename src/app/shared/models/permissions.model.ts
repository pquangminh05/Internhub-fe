// src/app/shared/models/permissions.model.ts

export interface Role {
  id: number;
  name: string;
}

// MOCK_ROLES_DATA for temporary use until a proper API endpoint is available
export const ROLES_DATA_MOCK: Role[] = [
  { id: 1, name: 'ADMIN' },
  { id: 2, name: 'HR' },
  { id: 5, name: 'INTERN' },
  { id: 3, name: 'MANAGER' },
  { id: 4, name: 'MENTOR' },
];

// Data from the backend 'functions' table
export const FUNCTIONS_DATA = [
  { id: 3, name: 'Quản lý tài khoản nội bộ', code: 'E01_USER_MGMT' },
  { id: 4, name: 'Cấu hình Phòng ban & Vị trí', code: 'E02_DEPT_POS_CONFIG' },
  { id: 5, name: 'Cấu hình Skill Tags & Trọng số', code: 'E03_SKILL_CONFIG' },
  { id: 6, name: 'Truy xuất Audit Logs', code: 'E04_AUDIT_LOGS' },
  { id: 7, name: 'Tạo/Import hồ sơ Intern', code: 'E05_INTERN_IMPORT' },
  { id: 8, name: 'Gán Mentor & Manager cho Intern', code: 'E06_ASSIGN_MENTOR' },
  { id: 9, name: 'Quản lý danh mục Trường ĐH', code: 'E07_UNI_MGMT' },
  { id: 10, name: 'Dashboard lộ trình cá nhân', code: 'E08_PERSONAL_DASHBOARD' },
  { id: 11, name: 'Giao & Duplicate Task', code: 'E09_TASK_ACTION' },
  { id: 12, name: 'To-do list & Cảnh báo', code: 'E10_TODO_LIST' },
  { id: 13, name: 'Nộp kết quả & Minh chứng', code: 'E11_TASK_SUBMISSION' },
  { id: 14, name: 'Chấm điểm & Feedback', code: 'E12_GRADING' },
  { id: 15, name: 'Xem điểm số Real-time', code: 'E14_REALTIME_SCORE' },
  { id: 16, name: 'Đánh giá tổng kết cuối kỳ', code: 'E15_FINAL_EVALUATION' },
  { id: 17, name: 'Phê duyệt kết quả cuối cùng', code: 'E16_FINAL_APPROVAL' },
  { id: 18, name: 'Xem Biểu đồ Radar năng lực', code: 'E17_RADAR_CHART' },
  { id: 19, name: 'Dashboard so sánh Intern', code: 'E18_COMPARE_DASHBOARD' },
  { id: 20, name: 'Xuất báo cáo Excel/PDF', code: 'E19_EXPORT_REPORT' },
  { id: 21, name: 'Quản lý người dùng', code: 'USER_MGMT' },
  { id: 22, name: 'Thư viện kỹ năng', code: 'SKILL_LIB' },
];

// Mappings for easier lookup
export const FUNCTION_CODE_TO_ID_MAP: { [code: string]: number } = FUNCTIONS_DATA.reduce((acc, func) => {
  acc[func.code] = func.id;
  return acc;
}, {} as { [code: string]: number });

export const FUNCTION_ID_TO_NAME_MAP: { [id: number]: string } = FUNCTIONS_DATA.reduce((acc, func) => {
  acc[func.id] = func.name;
  return acc;
}, {} as { [id: number]: string });

// Mock flat role permissions data from Backend (replace with actual API fetch)
export const MOCK_ROLE_PERMISSIONS_FLAT: RolePermissionResponse[] = [
  { id: 0, roleId: 1, roleName: 'ADMIN', functionId: 3, functionCode: 'E01_USER_MGMT', functionName: 'Quản lý tài khoản nội bộ', canAccess: true, canCreate: true, canEdit: true, canDelete: true },
  { id: 0, roleId: 1, roleName: 'ADMIN', functionId: 4, functionCode: 'E02_DEPT_POS_CONFIG', functionName: 'Cấu hình Phòng ban & Vị trí', canAccess: true, canCreate: true, canEdit: true, canDelete: true },
  { id: 0, roleId: 1, roleName: 'ADMIN', functionId: 5, functionCode: 'E03_SKILL_CONFIG', functionName: 'Cấu hình Skill Tags & Trọng số', canAccess: true, canCreate: true, canEdit: true, canDelete: true },
  { id: 0, roleId: 1, roleName: 'ADMIN', functionId: 6, functionCode: 'E04_AUDIT_LOGS', functionName: 'Truy xuất Audit Logs', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 2, roleName: 'HR', functionId: 4, functionCode: 'E02_DEPT_POS_CONFIG', functionName: 'Cấu hình Phòng ban & Vị trí', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 2, roleName: 'HR', functionId: 7, functionCode: 'E05_INTERN_IMPORT', functionName: 'Tạo/Import hồ sơ Intern', canAccess: true, canCreate: true, canEdit: true, canDelete: true },
  { id: 0, roleId: 2, roleName: 'HR', functionId: 8, functionCode: 'E06_ASSIGN_MENTOR', functionName: 'Gán Mentor & Manager cho Intern', canAccess: true, canCreate: false, canEdit: true, canDelete: false },
  { id: 0, roleId: 2, roleName: 'HR', functionId: 9, functionCode: 'E07_UNI_MGMT', functionName: 'Quản lý danh mục Trường ĐH', canAccess: true, canCreate: true, canEdit: true, canDelete: true },
  { id: 0, roleId: 2, roleName: 'HR', functionId: 15, functionCode: 'E14_REALTIME_SCORE', functionName: 'Xem điểm số Real-time', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 2, roleName: 'HR', functionId: 16, functionCode: 'E15_FINAL_EVALUATION', functionName: 'Đánh giá tổng kết cuối kỳ', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 2, roleName: 'HR', functionId: 20, functionCode: 'E19_EXPORT_REPORT', functionName: 'Xuất báo cáo Excel/PDF', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 3, roleName: 'MANAGER', functionId: 4, functionCode: 'E02_DEPT_POS_CONFIG', functionName: 'Cấu hình Phòng ban & Vị trí', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 3, roleName: 'MANAGER', functionId: 15, functionCode: 'E14_REALTIME_SCORE', functionName: 'Xem điểm số Real-time', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 3, roleName: 'MANAGER', functionId: 17, functionCode: 'E16_FINAL_APPROVAL', functionName: 'Phê duyệt kết quả cuối cùng', canAccess: true, canCreate: true, canEdit: true, canDelete: true },
  { id: 0, roleId: 3, roleName: 'MANAGER', functionId: 18, functionCode: 'E17_RADAR_CHART', functionName: 'Xem Biểu đồ Radar năng lực', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 3, roleName: 'MANAGER', functionId: 19, functionCode: 'E18_COMPARE_DASHBOARD', functionName: 'Dashboard so sánh Intern', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 3, roleName: 'MANAGER', functionId: 20, functionCode: 'E19_EXPORT_REPORT', functionName: 'Xuất báo cáo Excel/PDF', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 4, roleName: 'MENTOR', functionId: 5, functionCode: 'E03_SKILL_CONFIG', functionName: 'Cấu hình Skill Tags & Trọng số', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 4, roleName: 'MENTOR', functionId: 7, functionCode: 'E05_INTERN_IMPORT', functionName: 'Tạo/Import hồ sơ Intern', canAccess: true, canCreate: false, canEdit: true, canDelete: false },
  { id: 0, roleId: 4, roleName: 'MENTOR', functionId: 11, functionCode: 'E09_TASK_ACTION', functionName: 'Giao & Duplicate Task', canAccess: true, canCreate: true, canEdit: true, canDelete: true },
  { id: 0, roleId: 4, roleName: 'MENTOR', functionId: 14, functionCode: 'E12_GRADING', functionName: 'Chấm điểm & Feedback', canAccess: true, canCreate: false, canEdit: true, canDelete: true },
  { id: 0, roleId: 4, roleName: 'MENTOR', functionId: 16, functionCode: 'E15_FINAL_EVALUATION', functionName: 'Đánh giá tổng kết cuối kỳ', canAccess: true, canCreate: false, canEdit: true, canDelete: false },
  { id: 0, roleId: 4, roleName: 'MENTOR', functionId: 18, functionCode: 'E17_RADAR_CHART', functionName: 'Xem Biểu đồ Radar năng lực', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 5, roleName: 'INTERN', functionId: 10, functionCode: 'E08_PERSONAL_DASHBOARD', functionName: 'Dashboard lộ trình cá nhân', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 5, roleName: 'INTERN', functionId: 12, functionCode: 'E10_TODO_LIST', functionName: 'To-do list & Cảnh báo', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
  { id: 0, roleId: 5, roleName: 'INTERN', functionId: 13, functionCode: 'E11_TASK_SUBMISSION', functionName: 'Nộp kết quả & Minh chứng', canAccess: true, canCreate: false, canEdit: true, canDelete: false },
  { id: 0, roleId: 5, roleName: 'INTERN', functionId: 18, functionCode: 'E17_RADAR_CHART', functionName: 'Xem Biểu đồ Radar năng lực', canAccess: true, canCreate: false, canEdit: false, canDelete: false },
];


// Backend DTOs for RolePermission
export interface RolePermissionRequest {
  roleId: number;
  functionId: number;
  canAccess: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface RolePermissionResponse {
  id: number; // Assuming the response has an ID for the specific permission entry
  roleId: number;
  roleName: string; // Add this
  functionId: number;
  functionCode: string; // Add this
  functionName: string; // Add this
  canAccess: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}


// --- Frontend RBAC Matrix Display Interfaces ---

// Represents the individual CRUD permission for a feature
export interface FeaturePermission {
  canCreate: boolean;
  canAccess: boolean; // Corresponds to Read
  canEdit: boolean;
  canDelete: boolean;
}

// Represents permissions for a single feature for a specific role
export interface SingleRoleFeaturePermission extends FeaturePermission {
  roleId: number;
  // functionId: number; // Could be added here if needed for direct mapping in UI
}

// Represents a single feature/module, e.g., "Quản lý tài khoản nội bộ (E01)"
export interface RbacFeature {
  // Original 'E' ID as a fallback display or reference
  id: string;
  functionId: number; // The actual function ID for backend API calls
  name: string; // e.g., "Quản lý tài khoản nội bộ"
  // Permissions for this feature, indexed by role ID
  permissions: { [roleId: number]: SingleRoleFeaturePermission };
}

// Represents a group of features, e.g., "Quản trị Hệ thống"
export interface RbacFeatureGroup {
  name: string; // e.g., "Quản trị Hệ thống"
  features: RbacFeature[];
}

// The overall structure of the RBAC matrix for frontend display
export interface PermissionMatrix {
  groups: RbacFeatureGroup[];
}

// Helper function to parse a CRUD string into FeaturePermission (no longer needed, using booleans directly)
// export function parseCrudString(crud: string): FeaturePermission {
//   const c = crud.includes('C');
//   const r = crud.includes('R');
//   const u = crud.includes('U');
//   const d = crud.includes('D');
//   return { canCreate: c, canAccess: r, canEdit: u, canDelete: d };
// }

// Helper function to convert FeaturePermission back to a CRUD string for display
export function toCrudString(permission: FeaturePermission): string {
  let str = '';
  if (permission.canCreate) str += 'C';
  if (permission.canAccess) str += 'R';
  if (permission.canEdit) str += 'U';
  if (permission.canDelete) str += 'D';
  return str === '' ? '-' : str;
}
