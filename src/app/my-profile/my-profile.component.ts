import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core'; // Import ChangeDetectorRef, ViewChild, ElementRef
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge'; // For department badge
import { MatTooltipModule } from '@angular/material/tooltip'; // For progress bar tooltip
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Import MatSnackBar and MatSnackBarModule
import { Router } from '@angular/router'; // Import Router
import { Auth } from '../auth/auth'; // Import Auth Service
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms'; // Import form modules
import { MatExpansionModule } from '@angular/material/expansion'; // Import MatExpansionModule
import { MatFormFieldModule } from '@angular/material/form-field'; // Import MatFormFieldModule
import { MatInputModule } from '@angular/material/input'; // Import MatInputModule

import { UserService } from '../services/user.service';
import { UserProfileResponse } from '../shared/models/user.model';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError, TimeoutError, of } from 'rxjs'; // Import throwError, TimeoutError, of
import { catchError, timeout, finalize, tap } from 'rxjs/operators'; // Import catchError, timeout, finalize, tap

/** Custom validator to check if two fields match */
export function passwordMatchValidator(controlName: string, checkControlName: string): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const group = control as FormGroup;
    const controlName_ = group.controls[controlName];
    const checkControlName_ = group.controls[checkControlName];

    if (!controlName_ || !checkControlName_) {
      return null;
    }

    if (checkControlName_.errors && !checkControlName_.errors['mismatch']) {
      return null;
    }

    if (controlName_.value !== checkControlName_.value) {
      checkControlName_.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      checkControlName_.setErrors(null);
      return null;
    }
  };
}


@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule, // For tooltips
    MatSnackBarModule, // Add MatSnackBarModule for notifications
    ReactiveFormsModule, // Add ReactiveFormsModule for forms
    MatExpansionModule, // Add MatExpansionModule
    MatFormFieldModule, // Import MatFormFieldModule for mat-form-field
    MatInputModule // Import MatInputModule for matInput
  ],
  providers: [DatePipe], // Provide DatePipe here if not provided globally
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef; // Reference to the hidden file input

  userProfile: UserProfileResponse | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  internshipProgress: number = 0; // New property to store calculated progress

  // Change Password functionality
  changePasswordForm: FormGroup;
  hideOldPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  isChangingPassword = false;
  panelOpenState = false; // To control expansion panel state

  // Avatar Upload functionality
  selectedFile: File | null = null;
  avatarPreviewUrl: string | ArrayBuffer | null = null;
  isUploadingAvatar = false;
  backendAssetBaseUrl: string = 'http://localhost:8090'; // Base URL for backend assets


  constructor(
    public userService: UserService,
    private datePipe: DatePipe,
    private authService: Auth, // Inject Auth Service
    private router: Router, // Inject Router
    private snackBar: MatSnackBar, // Inject MatSnackBar
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
    private fb: FormBuilder // Inject FormBuilder
  ) {
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator('newPassword', 'confirmPassword') });
  }

  ngOnInit(): void {
    this.userService.getUserProfile().pipe(
      timeout(10000), // Set a timeout of 10 seconds
      catchError((err) => { // Catch errors from timeout or original http call
        let errorMessage = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
        if (err instanceof TimeoutError) {
          errorMessage = 'Yêu cầu tải hồ sơ quá thời gian. Vui lòng kiểm tra kết nối mạng hoặc thử lại.';
          console.error('MyProfileComponent - Timeout Error:', err);
        } else if (err instanceof HttpErrorResponse) {
          errorMessage = `Lỗi HTTP ${err.status}: ${err.message || 'Không thể tải thông tin hồ sơ.'}`;
          console.error('MyProfileComponent - HTTP Error:', err);
        } else {
          console.error('MyProfileComponent - Unknown Error in pipe:', err);
        }
        this.error = errorMessage; // Keep error message for template display
        this.snackBar.open(errorMessage, 'Đóng', { duration: 5000, panelClass: ['error-snackbar'] });
        this.isLoading = false;
        console.log('MyProfileComponent catchError - isLoading set to false. error:', this.error);
        this.cdr.detectChanges(); // Force change detection on error
        return throwError(() => err); // Re-throw for further handling if needed
      })
    ).subscribe({
                next: (data) => {
                  console.log('MyProfileComponent - Data received:', data); // Log the received data
                  this.userProfile = data;
                  this.internshipProgress = this.calculateProgress(); // Calculate and store progress
                  // Ensure userProfile.avatar is a full URL if it's a relative path from the backend
                  if (this.userProfile.avatar && this.userProfile.avatar.startsWith('/')) {
                    this.userProfile.avatar = this.backendAssetBaseUrl + this.userProfile.avatar;
                  }
                  // Initialize avatar preview with current avatar (now guaranteed to be full URL or default)
                  this.avatarPreviewUrl = this.userProfile.avatar || this.userService.getDefaultAvatar();
                  // Notify UserService about the current user's avatar, delayed to prevent ExpressionChangedAfterItHasBeenCheckedError
                  setTimeout(() => {
                    const avatarToUpdate = this.userProfile?.avatar || this.userService.getDefaultAvatar();
                    console.log('MyProfileComponent: ngOnInit - Updating UserService avatar with (setTimeout):', avatarToUpdate);
                    if (this.userProfile) { // Add null check for userProfile
                      this.userService.updateUserAvatar(avatarToUpdate);
                    } else {
                      // If userProfile is null, send default avatar
                      this.userService.updateUserAvatar(this.userService.getDefaultAvatar());
                    }
                  }, 0);
                  this.isLoading = false;
                  this.error = null; // Clear any previous error
                  console.log('MyProfileComponent - After data assignment: isLoading=', this.isLoading, 'userProfile=', this.userProfile); // Log state
                  this.cdr.detectChanges(); // Force change detection on success
                },
      
      error: (err) => { // This error will now catch the timeout error or other http errors
        // Error message and isLoading already handled in the pipe's catchError
        // This block is primarily for RxJS error handling that might slip past the pipe's catchError,
        // but given the structure, it's mostly redundant for setting error messages here.
        this.isLoading = false;
        console.log('MyProfileComponent - Error block: isLoading=', this.isLoading, 'error=', this.error); // Log state
        this.cdr.detectChanges(); // Force change detection on error
      }
    });
  }

  // Method to handle file selection for avatar upload
  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.item(0);

    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.snackBar.open('Chỉ chấp nhận file ảnh JPG, JPEG, PNG.', 'Đóng', { duration: 5000, panelClass: ['error-snackbar'] });
        // Reset file input
        this.fileInput.nativeElement.value = '';
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        this.snackBar.open('File ảnh quá lớn. Kích thước tối đa là 5MB.', 'Đóng', { duration: 5000, panelClass: ['error-snackbar'] });
        // Reset file input
        this.fileInput.nativeElement.value = '';
        return;
      }

      this.selectedFile = file;

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreviewUrl = reader.result;
        this.cdr.detectChanges(); // Force update preview
      };
      reader.readAsDataURL(file);

      // Upload the avatar
      this.uploadAvatar();
    } else {
      this.selectedFile = null;
              this.avatarPreviewUrl = this.userProfile?.avatar || this.userService.getDefaultAvatar(); // Revert to current avatar or default
    }
  }

  // Method to upload the selected avatar
  uploadAvatar(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Không có file ảnh nào được chọn để tải lên.', 'Đóng', { duration: 3000, panelClass: ['warning-snackbar'] });
      return;
    }

    this.isUploadingAvatar = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);

    this.userService.uploadAvatar(formData).pipe(
      finalize(() => {
        this.isUploadingAvatar = false;
        this.fileInput.nativeElement.value = ''; // Clear file input after upload attempt
        this.selectedFile = null; // Clear selected file
        this.cdr.detectChanges(); // Ensure UI updates after finalization
      })
    ).subscribe({
      next: (response) => {
        if (this.userProfile) {
          this.userProfile.avatar = this.backendAssetBaseUrl + response.newAvatarUrl; // Update avatar URL with full path
          const newFullAvatarUrl = this.userProfile.avatar;
          console.log('MyProfileComponent: uploadAvatar success - New full avatar URL:', newFullAvatarUrl);
          setTimeout(() => {
            if (this.userProfile) { // Add null check for userProfile
              console.log('MyProfileComponent: uploadAvatar success - Updating UserService avatar with (setTimeout):', newFullAvatarUrl);
              this.userService.updateUserAvatar(newFullAvatarUrl); // Notify service about the new avatar
            }
          }, 0);
        }
        this.snackBar.open('Cập nhật ảnh đại diện thành công!', 'Đóng', { duration: 3000, panelClass: ['success-snackbar'] });
        // No need to reset avatarPreviewUrl here, it should already be updated or reflect the new avatar
        this.cdr.detectChanges(); // Force update after successful upload
      },
      error: (err: HttpErrorResponse) => {
        let errorMessage = 'Đã xảy ra lỗi khi tải ảnh đại diện. Vui lòng thử lại.';
        if (err.status === 400) {
          errorMessage = err.error?.message || 'Yêu cầu không hợp lệ. Vui lòng kiểm tra định dạng hoặc kích thước file.';
        } else if (err.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          this.authService.logout();
          this.router.navigate(['/login']);
        } else if (err.error && err.error.message) {
          errorMessage = err.error.message;
        }
        this.snackBar.open(errorMessage, 'Đóng', { duration: 5000, panelClass: ['error-snackbar'] });
        console.error('Error uploading avatar:', err);
        // Revert preview to current avatar if upload fails
        this.avatarPreviewUrl = this.userProfile?.avatar || this.userService.getDefaultAvatar();
      }
    });
  }

  onSubmitChangePassword(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      this.snackBar.open('Vui lòng kiểm tra lại thông tin mật khẩu.', 'Đóng', { duration: 3000, panelClass: ['warning-snackbar'] });
      return;
    }

    this.isChangingPassword = true;
    const { oldPassword, newPassword } = this.changePasswordForm.value;

    this.authService.changePassword(oldPassword, newPassword).pipe(
      finalize(() => {
        this.isChangingPassword = false;
        this.cdr.detectChanges(); // Ensure UI updates after finalization
      })
    ).subscribe({
      next: () => {
        this.snackBar.open('Mật khẩu đã được thay đổi thành công!', 'Đóng', { duration: 3000, panelClass: ['success-snackbar'] });
        this.changePasswordForm.reset();
        this.panelOpenState = false; // Close the panel on success
        this.cdr.detectChanges(); // Force update after form reset and panel close
      },
                error: (err: HttpErrorResponse) => {
                  let errorMessage = 'Đã xảy ra lỗi khi thay đổi mật khẩu.'; // More generic message
                  if (err.status === 400) {
                    // If 400 and password seems to have changed on backend, this message is more appropriate
                    errorMessage = err.error?.message || 'Mật khẩu cũ không đúng hoặc mật khẩu mới không hợp lệ. Vui lòng kiểm tra lại.';
                  } else if (err.status === 401) {
                    errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                    this.authService.logout();
                    this.router.navigate(['/login']);
                  } else if (err.error && err.error.message) {
                    errorMessage = err.error.message;
                  }
                  // Add suggestion to try logging in with new password if it's a confusing 400 error.
                  this.snackBar.open(errorMessage + ' Nếu bạn gặp vấn đề, hãy thử đăng nhập bằng mật khẩu mới vừa đổi.', 'Đóng', { duration: 7000, panelClass: ['error-snackbar'] });
                  console.error('Error changing password:', err);
                }
      
    });
  }

  logout(): void {
    this.authService.logout(); // Call logout method from AuthService
    this.router.navigate(['/login']); // Redirect user to login page
  }




  getTranslatedStatus(status: string): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'Đang thực tập';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'TERMINATED':
        return 'Đã kết thúc';
      default:
        return status;
    }
  }

  getStatusColorClass(status: string): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'status-in-progress'; // Green
      case 'COMPLETED':
        return 'status-completed'; // Blue
      case 'TERMINATED':
        return 'status-terminated'; // Red
      default:
        return 'status-default'; // Grey or black
    }
  }

  calculateProgress(): number {
    if (!this.userProfile?.startDate || !this.userProfile?.endDate) {
      return 0;
    }
    const { startDate, endDate } = this.userProfile;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (now < start) {
      return 0; // Internship has not started yet
    }
    if (now > end) {
      return 100; // Internship has ended
    }

    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();

    return (elapsedDuration / totalDuration) * 100;
  }

  getDaysRemaining(): { days: number, colorClass: string } {
    if (!this.userProfile?.endDate) {
      return { days: 0, colorClass: '' };
    }
    const endDate = new Date(this.userProfile.endDate);
    const now = new Date();
    // Reset time components to only compare dates
    endDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let colorClass = '';
    if (diffDays <= 7 && diffDays > 0) {
      colorClass = 'days-remaining-warning'; // Red if 1-7 days left
    } else if (diffDays <= 0) {
      colorClass = 'days-remaining-past'; // Grey if ended
    } else {
      colorClass = 'days-remaining-normal'; // Normal if more than 7 days left
    }

    return { days: diffDays, colorClass: colorClass };
  }

  getFormattedDate(dateString: string): string {
    return this.datePipe.transform(dateString, 'dd/MM/yyyy') || dateString;
  }
}
