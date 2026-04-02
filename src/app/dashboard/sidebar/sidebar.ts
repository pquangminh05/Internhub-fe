import { Component, Input, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  NavigationEnd,
  ActivatedRoute,
  RouterModule,
  IsActiveMatchOptions,
} from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { RoleService } from '../../auth/role.service';

interface MenuItem {
  label: string;
  icon?: string;
  routerLink?: string;
  children?: MenuItem[];
  expanded?: boolean;
  routerLinkActiveOptions?: IsActiveMatchOptions;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  encapsulation: ViewEncapsulation.None,
})
export class Sidebar implements OnInit, OnDestroy {
  @Input() isSidebarVisible: boolean = true;
  private destroy$ = new Subject<void>();

  private buildDashboardMenu(): MenuItem[] {
    const isIntern = this.roleService.isIntern();

    const overviewItem: MenuItem = {
      label: 'Tổng quan',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
      routerLink: isIntern ? '/dashboard/intern' : '/dashboard',
      routerLinkActiveOptions: {
        paths: 'exact',
        queryParams: 'ignored',
        matrixParams: 'ignored',
        fragment: 'ignored',
      },
    };

    const skillsItem: MenuItem = {
      label: 'Năng lực',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M10 16h.01',
      routerLink: '/skills/analytics',
      routerLinkActiveOptions: {
        paths: 'subset',
        queryParams: 'ignored',
        matrixParams: 'ignored',
        fragment: 'ignored',
      },
      children: [
        {
          label: 'Radar Analytics',
          routerLink: '/skills/analytics',
          routerLinkActiveOptions: {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
          },
        },
      ],
    };

    if (isIntern) {
      return [
        overviewItem,
        {
          label: 'Nhiệm vụ của tôi',
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
          routerLink: '/my-tasks',
          routerLinkActiveOptions: {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
          },
        },
        skillsItem,
      ];
    }

    return [
      overviewItem,
      {
        label: 'Thực thi',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        routerLink: '/tasks',
        routerLinkActiveOptions: {
          paths: 'exact',
          queryParams: 'ignored',
          matrixParams: 'ignored',
          fragment: 'ignored',
        },
      },
      {
        label: 'Quản lý',
        icon: 'M19 11H5m14 0a2 2 0 012 2v2a2 2 0 01-2 2m0-6V9a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h2m7-5a2 2 0 01-2 2H9a2 2 0 01-2-2m7-4a2 2 0 01-2-2H9a2 2 0 00-2 2m7-4a2 2 0 01-2-2H9a2 2 0 00-2 2',
        routerLink: '/management/interns',
        routerLinkActiveOptions: {
          paths: 'subset',
          queryParams: 'ignored',
          matrixParams: 'ignored',
          fragment: 'ignored',
        },
        children: [
          {
            label: 'Hồ sơ Intern',
            routerLink: '/management/interns',
            routerLinkActiveOptions: {
              paths: 'exact',
              queryParams: 'ignored',
              matrixParams: 'ignored',
              fragment: 'ignored',
            },
          },
        ],
      },
      skillsItem,
      {
        label: 'Phê duyệt',
        icon: 'M5 13l4 4L19 7',
        routerLink: '/approval',
        routerLinkActiveOptions: {
          paths: 'exact',
          queryParams: 'ignored',
          matrixParams: 'ignored',
          fragment: 'ignored',
        },
      },
    ];
  }

  dashboardMenuItems: MenuItem[] = [];

  settingsMenuItems: MenuItem[] = [
    {
      label: 'Quản trị Nhân sự',
      icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0A8.966 8.966 0 0112 20.25a8.966 8.966 0 01-5.982-2.525M15 9.75a3 3 0 11-6 0 3 3 0 016 0z',
      routerLink: '/settings/hr/accounts',
      routerLinkActiveOptions: {
        paths: 'subset',
        queryParams: 'ignored',
        matrixParams: 'ignored',
        fragment: 'ignored',
      },
      children: [
        {
          label: 'Quản lý Tài khoản Nội bộ',
          routerLink: '/settings/hr/accounts',
          routerLinkActiveOptions: {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
          },
        },
        {
          label: 'Quản lý Thực tập sinh',
          routerLink: '/settings/hr/interns',
          routerLinkActiveOptions: {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
          },
        },
        {
          label: 'Cơ cấu Tổ chức',
          routerLink: '/settings/hr/org-structure',
          routerLinkActiveOptions: {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
          },
        },
      ],
    },
    {
      label: 'Cấu hình Đánh giá',
      icon: 'M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6zM12 18a6 6 0 100-12 6 6 0 000 12z',
      routerLink: '/settings/evaluation/skills',
      routerLinkActiveOptions: {
        paths: 'subset',
        queryParams: 'ignored',
        matrixParams: 'ignored',
        fragment: 'ignored',
      },
      children: [
        {
          label: 'Thư viện Kỹ năng',
          routerLink: '/settings/evaluation/skills',
          routerLinkActiveOptions: {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
          },
        },
      ],
    },
    {
      label: 'Dữ liệu Đối tác',
      icon: 'M12 1.5v12m0 0l-3-3m3 3l3-3m-9 6h6m6 0a9 9 0 11-18 0 9 9 0 0118 0z',
      routerLink: '/settings/partners/list',
      routerLinkActiveOptions: {
        paths: 'subset',
        queryParams: 'ignored',
        matrixParams: 'ignored',
        fragment: 'ignored',
      },
      children: [
        {
          label: 'Danh mục Đối tác',
          routerLink: '/settings/partners/list',
          routerLinkActiveOptions: {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
          },
        },
      ],
    },
    {
      label: 'Vận hành hệ thống',
      icon: 'M19.5 14.25v-2.625a.75.75 0 00-.75-.75H.75a.75.75 0 00-.75.75v2.625A.75.75 0 00.75 15h18A.75.75 0 0019.5 14.25zM21 4.5v15a.75.75 0 01-.75.75H.75a.75.75 0 01-.75-.75V4.5A.75.75 0 01.75 3h19.5a.75.75 0 01.75.75v.75z',
      routerLink: '/settings/operation/process',
      routerLinkActiveOptions: {
        paths: 'subset',
        queryParams: 'ignored',
        matrixParams: 'ignored',
        fragment: 'ignored',
      },
      children: [
        {
          label: 'Cấu hình Quy trình',
          routerLink: '/settings/operation/process',
          routerLinkActiveOptions: {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
          },
        },
      ],
    },
    {
      label: 'Bảo mật & Tra cứu',
      icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      routerLink: '/settings/security/logs',
      routerLinkActiveOptions: {
        paths: 'subset',
        queryParams: 'ignored',
        matrixParams: 'ignored',
        fragment: 'ignored',
      },
      children: [
        {
          label: 'Nhật ký Hệ thống',
          routerLink: '/settings/security/logs',
          routerLinkActiveOptions: {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
          },
        },
      ],
    },
  ];

  currentMenuItems: MenuItem[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public roleService: RoleService, // ← đổi thành public để template dùng được
  ) {}

  get isSettingsRouteActive(): boolean {
    return this.router.url.startsWith('/settings');
  }

  ngOnInit() {
    // Build menu ngay + subscribe để rebuild khi role thay đổi (role load async)
    this.dashboardMenuItems = this.buildDashboardMenu();
    this.updateMenuBasedOnRoute();

    this.roleService.role$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.dashboardMenuItems = this.buildDashboardMenu();
      this.updateMenuBasedOnRoute();
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.updateMenuBasedOnRoute();
        this.updateExpandedState();
      });

    this.updateExpandedState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateMenuBasedOnRoute(): void {
    if (this.router.url.startsWith('/settings')) {
      this.currentMenuItems = this.settingsMenuItems;
    } else {
      this.currentMenuItems = this.dashboardMenuItems;
    }
  }

  toggleSubMenu(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  private updateExpandedState(): void {
    const checkAndExpand = (items: MenuItem[]) => {
      for (const item of items) {
        if (item.children) {
          const isChildActive = item.children.some((child) =>
            this.router.isActive(child.routerLink!, {
              paths: 'subset',
              queryParams: 'ignored',
              matrixParams: 'ignored',
              fragment: 'ignored',
            }),
          );
          item.expanded = isChildActive;
          checkAndExpand(item.children);
        }
      }
    };
    checkAndExpand(this.dashboardMenuItems);
    checkAndExpand(this.settingsMenuItems);
  }

  getRouterLinkActiveOptions(item: MenuItem): IsActiveMatchOptions {
    return (
      item.routerLinkActiveOptions || {
        paths: 'exact',
        queryParams: 'ignored',
        matrixParams: 'ignored',
        fragment: 'ignored',
      }
    );
  }

  isLinkActive(routerLink: string | undefined, options: IsActiveMatchOptions | undefined): boolean {
    if (!routerLink) return false;
    return this.router.isActive(
      routerLink,
      options || {
        paths: 'exact',
        queryParams: 'ignored',
        matrixParams: 'ignored',
        fragment: 'ignored',
      },
    );
  }

  isMenuItemActive(item: MenuItem): boolean {
    if (!item.routerLink) {
      return item.children ? item.children.some((child) => this.isMenuItemActive(child)) : false;
    }
    return this.isLinkActive(item.routerLink, this.getRouterLinkActiveOptions(item));
  }

  isParentToggleActive(item: MenuItem): boolean {
    if (item.children) {
      return item.children.some((child) =>
        child.routerLink
          ? this.isLinkActive(child.routerLink, this.getRouterLinkActiveOptions(child))
          : this.isParentToggleActive(child),
      );
    }
    return false;
  }
}
