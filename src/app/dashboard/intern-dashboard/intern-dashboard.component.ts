import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';

import {
  InternDashboardService,
  InternDashboardResponse,
} from '../../services/intern-dashboard.service'; // Import the service and response interface
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiPageHeaderComponent } from '../../shared/components/ui-page-header/ui-page-header.component';

@Component({
  selector: 'app-intern-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    UiCardComponent,
    UiPageHeaderComponent,
  ],
  providers: [DatePipe],
  templateUrl: './intern-dashboard.component.html',
  styleUrls: ['./intern-dashboard.component.css'],
})
export class InternDashboardComponent implements OnInit {
  dashboardData: InternDashboardResponse | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private datePipe: DatePipe,
    private internDashboardService: InternDashboardService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    this.loadCache();
    this.fetchDashboardData();
  }

  private loadCache(): void {
    if (isPlatformBrowser(this.platformId)) {
      const cached = localStorage.getItem('intern_dashboard_data');
      if (cached) {
        this.dashboardData = JSON.parse(cached);
        this.isLoading = false; // Hiển thị ngay lập tức, không chờ API
      }
    }
  }

  fetchDashboardData(): void {
    // Chỉ hiện loading nếu chưa có dữ liệu trong cache
    if (!this.dashboardData) {
      this.isLoading = true;
    }
    this.error = null;
    this.internDashboardService
      .getInternDashboard()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching intern dashboard data', error);
          this.error = 'Failed to load dashboard data. Please try again later.';
          if (error.status === 404) {
            this.error = 'Dashboard data not found.';
          } else if (error.error && error.error.message) {
            this.error = error.error.message;
          }
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('intern_dashboard_data', JSON.stringify(data));
          }
          // Optionally process data here if needed, e.g., format dates
        },
        error: () => {
          // Error already handled by catchError and assigned to this.error
        },
      });
  }
  // Helper to format date
  formatDate(dateString: string): string {
    return this.datePipe.transform(dateString, 'dd/MM/yyyy HH:mm') || dateString;
  }

  // Helper to get status class for tasks
  getTaskStatusClass(status: string): string {
    switch (status) {
      case 'Todo':
        return 'status-todo';
      case 'In_Progress':
        return 'status-in-progress';
      case 'Completed':
        return 'status-completed';
      default:
        return '';
    }
  }

  // Helper to check if a task is overdue
  isOverdue(deadline: string): boolean {
    return new Date(deadline) < new Date() && this.getTaskStatus(deadline) !== 'Completed';
  }

  getTaskStatus(deadline: string): string {
    // This is a simplified example; actual logic might involve task completion status from API
    const now = new Date();
    const taskDeadline = new Date(deadline);

    if (taskDeadline < now) {
      return 'Overdue';
    } else {
      return ''; // Not overdue
    }
  }
}
