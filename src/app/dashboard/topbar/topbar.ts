import { Component, EventEmitter, Input, Output, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { UserService } from '../../services/user.service'; // Import UserService

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, RouterModule, BreadcrumbComponent, MatIconModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
  encapsulation: ViewEncapsulation.None,
})
export class Topbar implements OnInit, OnDestroy {
  @Input() isSidebarVisible: boolean = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  public currentRouteMode: string = 'dashboard';
  public showBackArrow: boolean = false;
  public userAvatarUrl: string = '';
  public userName: string = ''; // Khởi tạo rỗng, đợi load từ API

  constructor(
    public router: Router,
    private activatedRoute: ActivatedRoute,
    public userService: UserService, // Make UserService public for template access
  ) {}

  ngOnInit() {
    // Existing router event subscription
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event: NavigationEnd) => {
          let route = this.activatedRoute.root;
          while (route.firstChild) {
            route = route.firstChild;
          }
          this.currentRouteMode = route.snapshot.data['mode'] || 'dashboard';
          this.showBackArrow = event.urlAfterRedirects.includes('/profile');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Set initial mode and back arrow visibility
    let route = this.activatedRoute.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.currentRouteMode = route.snapshot.data['mode'] || 'dashboard';
    this.showBackArrow = this.router.url.includes('/profile');

    // Subscribe to user avatar changes
    this.userService.currentUserAvatar$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(avatarUrl => {
      console.log('Topbar: Received avatarUrl from UserService:', avatarUrl);
      this.userAvatarUrl = avatarUrl;
    });

    // Subscribe to user name changes
    this.userName = ''; // Reset để tránh hiển thị tên cũ
    this.userService.currentUserName$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(name => {
      this.userName = name;
    });

    // Load user profile on init
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    this.userService.getUserProfile().subscribe({
      next: (profile) => {
        this.userService.updateUserName(profile.name);
        if (profile.avatar) {
          // Convert relative path to full URL if needed
          const fullAvatarUrl = profile.avatar.startsWith('/') 
            ? 'http://localhost:8090' + profile.avatar 
            : profile.avatar;
          this.userService.updateUserAvatar(fullAvatarUrl);
        }
      },
      error: (err) => {
        console.error('Failed to load user profile:', err);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
