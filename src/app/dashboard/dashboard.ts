import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RoleService } from '../auth/role.service';
import { API_ENDPOINTS } from '../api-endpoints';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

interface DashboardStats {
  totalInterns: number;
  activeInterns: number;
  avgProgress: number;
  pendingActions: number;
}

interface InternSummary {
  id: number;
  name: string;
  mentorName: string;
  progress: number;
  avgScore: number;
  status: 'On-track' | 'At-risk' | 'Completed';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  stats: DashboardStats = {
    totalInterns: 0,
    activeInterns: 0,
    avgProgress: 0,
    pendingActions: 0,
  };

  interns: InternSummary[] = [];
  isLoading = true;
  currentRole = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private roleService: RoleService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentRole = this.roleService.getRole();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    // Giả sử có một API tổng hợp dữ liệu cho Dashboard
    // Nếu chưa có, bạn có thể gọi tuần tự các API hiện có để gom dữ liệu
    this.http
      .get<any>(`${API_ENDPOINTS.Admin.users}/all`)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (users) => {
          const allInterns = users.filter((u: any) => u.roleName === 'INTERN');
          this.stats.totalInterns = allInterns.length;
          this.stats.activeInterns = allInterns.filter((u: any) => u.status !== 'Completed').length;

          // Mock dữ liệu tiến độ cho minh họa UI
          this.interns = allInterns.map((u: any) => ({
            id: u.id,
            name: u.name,
            mentorName: u.mentorName || 'Chưa gán',
            progress: Math.floor(Math.random() * 100),
            avgScore: Number((Math.random() * (10 - 4) + 4).toFixed(1)),
            status: Math.random() > 0.2 ? 'On-track' : 'At-risk',
          }));

          this.stats.avgProgress = Math.round(
            this.interns.reduce((acc, curr) => acc + curr.progress, 0) / (this.interns.length || 1),
          );
          this.stats.pendingActions = 3; // Mock
        },
        error: () => {
          console.error('Không thể tải dữ liệu dashboard');
        },
      });
  }

  getScoreClass(score: number): string {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'On-track':
        return 'bg-green-100 text-green-700';
      case 'At-risk':
        return 'bg-red-100 text-red-700';
      case 'Completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}
