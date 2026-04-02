import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private roleSubject = new BehaviorSubject<string>('');

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRole();
    }
  }

  private loadRole(): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    // 1. Try reading from JWT payload
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles: string[] = payload.roles ?? payload.authorities ?? [];
      const fromScope: string[] = payload.scope ? payload.scope.split(' ') : [];
      const allRoles = [...roles, ...fromScope, payload.role ?? ''];

      const found = allRoles.find(r =>
        typeof r === 'string' && (
          r.includes('INTERN') || r.includes('MENTOR') ||
          r.includes('MANAGER') || r.includes('HR') || r.includes('ADMIN')
        )
      );
      if (found) {
        this.roleSubject.next(found.replace('ROLE_', ''));
        return;
      }
    } catch { }

    // 2. Fallback: probe /api/user/profile which is accessible to all authenticated users
    // The profile contains no direct role field in the response, so we cascade
    // through role-specific endpoints in order of least privilege
    this.probeRole();
  }

  private probeRole(): void {
    // Try INTERN endpoint first (most restrictive — only INTERN role can access it)
    this.http.get('http://localhost:8090/api/intern/tasks').subscribe({
      next: () => this.roleSubject.next('INTERN'),
      error: (err) => {
        if (err.status === 403) {
          // 403 = authenticated but wrong role — try MENTOR
          this.probeMentorOrAbove();
        } else if (err.status === 401) {
          // 401 = not authenticated at all
          this.roleSubject.next('');
        } else {
          // 500 or other server error on intern endpoint — not an intern,
          // but don't give up: try the next role
          this.probeMentorOrAbove();
        }
      }
    });
  }

  private probeMentorOrAbove(): void {
    // Try MENTOR endpoint — /api/mentor/interns requires MENTOR/ADMIN/MANAGER
    // BUT this endpoint currently returns 500 (backend bug), so we also accept 200
    // and treat any non-401/non-403 as "at least MENTOR level"
    this.http.get('http://localhost:8090/api/mentor/tasks').subscribe({
      next: () => this.roleSubject.next('MENTOR'),
      error: (err) => {
        if (err.status === 403) {
          // Not a mentor — must be HR, MANAGER, or ADMIN
          this.probeManagerOrAbove();
        } else if (err.status === 401) {
          this.roleSubject.next('');
        } else {
          // 500 on mentor endpoint too — try manager
          this.probeManagerOrAbove();
        }
      }
    });
  }

  private probeManagerOrAbove(): void {
    // MANAGER/ADMIN can access admin-level user list
    this.http.get('http://localhost:8090/api/admin/audit-logs/actions').subscribe({
      next: () => this.roleSubject.next('ADMIN'),
      error: (err) => {
        if (err.status === 403) {
          // 403 on admin = must be HR or MANAGER
          this.roleSubject.next('MANAGER');
        } else {
          this.roleSubject.next('MENTOR'); // safe fallback
        }
      }
    });
  }

  setRole(role: string): void {
    this.roleSubject.next(role);
  }

  getRole(): string {
    return this.roleSubject.value;
  }

  isIntern(): boolean { return this.roleSubject.value === 'INTERN'; }
  isMentor(): boolean { return this.roleSubject.value === 'MENTOR'; }
  isManager(): boolean { return this.roleSubject.value === 'MANAGER'; }
  isHr(): boolean { return this.roleSubject.value === 'HR'; }
  isAdmin(): boolean { return this.roleSubject.value === 'ADMIN'; }

  reloadRole(): void {
      this.loadRole();
    }
  get role$() { return this.roleSubject.asObservable(); }
}
