// src/app/api-endpoints.ts

export const BASE_API_URL = 'http://localhost:8090/api';

export const API_ENDPOINTS = {
  Auth: {
    login: `${BASE_API_URL}/auth/login`,
    getPermissions: `${BASE_API_URL}/auth/permissions`,
    activateAccount: `${BASE_API_URL}/auth/activate`,
  },
  Admin: {
    users: `${BASE_API_URL}/admin/users`,
    updateUserStatus: (id: number) => `${BASE_API_URL}/admin/users/${id}/status`,
    roles: `${BASE_API_URL}/admin/roles`, // New API for fetching roles
  },
  AuditLog: {
    base: `${BASE_API_URL}/admin/audit-logs`,
    actions: `${BASE_API_URL}/admin/audit-logs/actions`,
    byId: (id: number) => `${BASE_API_URL}/admin/audit-logs/${id}`,
  },
  Departments: {
    base: `${BASE_API_URL}/departments`,
    byId: (id: number) => `${BASE_API_URL}/departments/${id}`,
  },
  InternshipPositions: {
    base: `${BASE_API_URL}/positions`,
    byId: (id: number) => `${BASE_API_URL}/positions/${id}`,
  },
  RolePermissions: {
    base: `${BASE_API_URL}/admin/role-permissions`,
    byRoleId: (roleId: number) => `${BASE_API_URL}/admin/role-permissions/${roleId}`,
    byRoleIdAndFunctionId: (roleId: number, functionId: number) =>
      `${BASE_API_URL}/admin/role-permissions/${roleId}/${functionId}`,
  },
  Intern: {
    dashboard: `${BASE_API_URL}/v1/intern/dashboard`,
  },
  User: {
    profile: `${BASE_API_URL}/user/profile`,
    changePassword: `${BASE_API_URL}/user/change-password`,
    updateAvatar: `${BASE_API_URL}/user/profile/avatar`,
    interns: `${BASE_API_URL}/user/interns`,
  },
  Mentor: {
    interns: `${BASE_API_URL}/mentor/interns`,
  },
  Radar: {
    byInternId: (id: number) => `${BASE_API_URL}/radar/intern/${id}`,
  },
  Universities: {
    base: `${BASE_API_URL}/universities`,
  },

  Interns: {
    base: `${BASE_API_URL}/interns`,
    byId: (id: number) => `${BASE_API_URL}/interns/${id}`,
  },
  Export: {
    internExcel: (id: number) => `${BASE_API_URL}/export/intern/${id}/excel`,
    groupExcel: (departmentId?: number, universityId?: number) => {
      const params = new URLSearchParams();
      if (departmentId) params.set('departmentId', String(departmentId));
      if (universityId) params.set('universityId', String(universityId));
      const q = params.toString();
      return `${BASE_API_URL}/export/group/excel${q ? '?' + q : ''}`;
    },
  },
};