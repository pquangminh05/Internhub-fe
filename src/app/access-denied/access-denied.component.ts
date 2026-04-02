import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router'; // Import RouterLink for the button

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    RouterLink // Add RouterLink to imports
  ],
  template: `
    <div class="access-denied-container">
      <mat-card class="access-denied-card">
        <mat-card-header>
          <mat-card-title>Truy Cập Bị Từ Chối</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Bạn không có quyền truy cập vào trang này.</p>
          <p>Vui lòng liên hệ với quản trị viên nếu bạn tin rằng đây là một lỗi.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" routerLink="/dashboard">Quay về Dashboard</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .access-denied-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    .access-denied-card {
      max-width: 400px;
      text-align: center;
      padding: 20px;
    }
    mat-card-title {
      font-size: 1.5em;
      margin-bottom: 15px;
    }
    mat-card-content p {
      margin-bottom: 10px;
    }
    mat-card-actions {
      margin-top: 20px;
    }
  `]
})
export class AccessDeniedComponent { }
