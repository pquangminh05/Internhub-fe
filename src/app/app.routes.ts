import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { MainLayout } from './dashboard/main-layout/main-layout';
import { Hr } from './settings/hr/hr';
import { Security } from './settings/security/security';
import { ConfigReview } from './settings/config-review/config-review';
import { PartnerData } from './settings/partner-data/partner-data';
import { SystemOperation } from './settings/system-operation/system-operation';

import { Execution } from './dashboard/execution/execution';
import { Management } from './dashboard/management/management';
import { Capacity } from './dashboard/capacity/capacity';
import { Approval } from './dashboard/approval/approval';

import { InternsComponent } from './dashboard/management/interns/interns';
import { AnalyticsComponent } from './dashboard/capacity/analytics/analytics';

import { AccountManagementComponent } from './settings/hr/accounts/account-management/account-management.component';
import { HrInternsComponent } from './settings/hr/interns/interns';
import { OrgStructureComponent } from './settings/hr/org-structure/org-structure';
import { EvaluationSkillsComponent } from './settings/evaluation/skills/skills';
import { PartnersListComponent } from './settings/partners/list/list';
import { SecurityLogsComponent } from './settings/security/logs/logs';
import { ActivateAccountComponent } from './activate-account/activate-account.component';
import { Tasks } from './tasks/task';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { AccessDeniedComponent } from './access-denied/access-denied.component'; // Import AccessDeniedComponent
import { authGuard, internGuard, nonInternGuard } from './auth/auth.guard';
import { InternDashboardComponent } from './dashboard/intern-dashboard/intern-dashboard.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'activate', component: ActivateAccountComponent },
  { path: 'access-denied', component: AccessDeniedComponent },
  {
    path: 'dashboard',
    component: MainLayout,
    data: { title: 'Tổng quan' },
    children: [
      {
        path: '',
        component: Dashboard,
        canActivate: [nonInternGuard],
        data: { title: 'Tổng quan', mode: 'dashboard' },
      },
      {
        path: 'intern',
        component: InternDashboardComponent,
        canActivate: [internGuard],
        data: { title: 'Dashboard Intern' },
      },
    ],
  },
  {
    path: 'profile',
    component: MainLayout,
    data: { title: 'Hồ sơ của tôi' },
    children: [{ path: '', component: MyProfileComponent, data: { title: 'Hồ sơ cá nhân' } }],
  },
  // /tasks — chỉ non-intern
  {
    path: 'tasks',
    component: MainLayout,
    canActivate: [nonInternGuard],
    data: { title: 'Thực thi' },
    children: [{ path: '', component: Tasks, data: { title: 'Thực thi' } }],
  },

  // /my-tasks — chỉ intern
  {
    path: 'my-tasks',
    component: MainLayout,
    canActivate: [internGuard],
    data: { title: 'Nhiệm vụ của tôi' },
    children: [{ path: '', component: Execution, data: { title: 'Nhiệm vụ của tôi' } }],
  },
  {
    path: 'management',
    component: MainLayout,
    data: { title: 'Quản lý' },
    children: [
      { path: '', redirectTo: 'interns', pathMatch: 'full' },
      { path: 'interns', component: InternsComponent, data: { title: 'Hồ sơ Intern' } },
    ],
  },
  {
    path: 'skills',
    component: MainLayout,
    data: { title: 'Năng lực' },
    children: [
      { path: '', redirectTo: 'analytics', pathMatch: 'full' },
      { path: 'analytics', component: AnalyticsComponent, data: { title: 'Radar Analytics' } },
    ],
  },
  {
    path: 'approval',
    component: MainLayout,
    data: { title: 'Phê duyệt' },
    children: [{ path: '', component: Approval, data: { title: 'Phê duyệt', mode: 'dashboard' } }],
  },
  {
    path: 'settings',
    component: MainLayout,
    canActivate: [authGuard],
    data: { title: 'Cài đặt' },
    children: [
      { path: '', redirectTo: 'hr', pathMatch: 'full' },
      {
        path: 'hr',
        component: Hr,
        data: { title: 'Quản trị Nhân sự' },
        children: [
          { path: '', redirectTo: 'accounts', pathMatch: 'full' },
          {
            path: 'accounts',
            component: AccountManagementComponent,
            data: { title: 'Quản lý Tài khoản & Phân quyền' },
          },
          {
            path: 'interns',
            component: HrInternsComponent,
            data: { title: 'Quản lý Thực tập sinh' },
          },
          {
            path: 'org-structure',
            component: OrgStructureComponent,
            data: { title: 'Cơ cấu Tổ chức' },
          },
        ],
      },
      {
        path: 'evaluation',
        component: ConfigReview,
        data: { title: 'Cấu hình Đánh giá' },
        children: [
          { path: '', redirectTo: 'skills', pathMatch: 'full' },
          {
            path: 'skills',
            component: EvaluationSkillsComponent,
            data: { title: 'Thư viện Kỹ năng' },
          },
        ],
      },
      {
        path: 'partners',
        component: PartnerData,
        data: { title: 'Dữ liệu Đối tác' },
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          { path: 'list', component: PartnersListComponent, data: { title: 'Danh mục Đối tác' } },
        ],
      },
      {
        path: 'operation',
        data: { title: 'Vận hành hệ thống' },
        children: [
          { path: '', redirectTo: 'process', pathMatch: 'full' },
          {
            path: 'process',
            component: SystemOperation,
            data: { title: 'Cấu hình Quy trình' },
          },
        ],
      },
      {
        path: 'security',
        component: Security,
        data: { title: 'Bảo mật & Tra cứu' },
        children: [
          { path: '', redirectTo: 'logs', pathMatch: 'full' },
          { path: 'logs', component: SecurityLogsComponent, data: { title: 'Nhật ký Hệ thống' } },
        ],
      },
    ],
  },
];
