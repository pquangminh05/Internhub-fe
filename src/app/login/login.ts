import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../auth/auth';
import { UserService } from '../services/user.service';
import { RoleService } from '../auth/role.service';
import { Subject, takeUntil, filter, take, timeout, catchError, of } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });

  private destroy$ = new Subject<void>();
  private backendAssetBaseUrl: string = 'http://localhost:8090';

  constructor(
    private authService: Auth,
    private router: Router,
    private userService: UserService,
    private roleService: RoleService,
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    this.loginForm.setErrors(null);
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('incorrectCredentials')) {
      passwordControl.setErrors(null);
      passwordControl.updateValueAndValidity();
    }

    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      if (email && password) {
        this.authService.login({ email, password }).subscribe({
          next: (response) => {
            console.log('Login successful', response);

            this.userService.getUserProfile().subscribe({
              next: (profileData) => {
                let avatarUrl = profileData.avatar;
                if (avatarUrl && avatarUrl.startsWith('/')) {
                  avatarUrl = this.backendAssetBaseUrl + avatarUrl;
                }
                this.userService.updateUserAvatar(avatarUrl || this.userService.getDefaultAvatar());

                this.roleService.setRole('');
                this.roleService.reloadRole();

                this.roleService.role$
                  .pipe(
                    filter((role) => role !== ''),
                    take(1),
                    timeout(5000),
                    catchError(() => of('')),
                  )
                  .subscribe((role) => {
                    if (role === 'INTERN') {
                      this.router.navigate(['/dashboard/intern']);
                    } else {
                      this.router.navigate(['/my-tasks']);
                    }
                  });
              },
              error: (profileError) => {
                console.error('Failed to fetch user profile', profileError);
                this.router.navigate(['/dashboard']);
              },
            });
          },
          error: (error) => {
            console.error('Login failed', error);
            if (error.status === 0) {
              this.loginForm.setErrors({
                connectionLost: 'Mất kết nối tới máy chủ. Vui lòng thử lại sau.',
              });
            } else {
              passwordControl?.setErrors({
                incorrectCredentials: 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.',
              });
            }
          },
        });
      }
    }
  }
}
