import { Component, OnInit, Inject, OnDestroy } from '@angular/core'; // Add OnDestroy
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs'; // Import Subject, takeUntil

import { Auth } from '../../../../../auth/auth';
import { UserCreationRequest, ErrorDetails } from '../../../../../shared/models/user.model';
import { DepartmentService, Department } from '../../../../../services/department.service';
import { PermissionService } from '../../../../../services/permission.service'; // Import PermissionService
import { Role } from '../../../../../shared/models/permissions.model'; // Import Role interface

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.css'],
})
export class CreateUserDialogComponent implements OnInit, OnDestroy { // Implement OnDestroy
  userForm!: FormGroup;
  roles: Role[] = []; // Initialize as an empty array of type Role
  departments: Department[] = [];

  private destroy$ = new Subject<void>(); // Subject to manage subscriptions

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CreateUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private departmentService: DepartmentService,
    private permissionService: PermissionService // Inject PermissionService
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      roleId: ['', [Validators.required]],
      departmentId: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
    });
    this.loadDepartments();
    this.loadRoles(); // Call loadRoles
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.snackBar.open('Failed to load departments.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      }
    });
  }

  loadRoles(): void {
    this.permissionService.getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          if (roles) {
            this.roles = roles;
          }
        },
        error: (error) => {
          console.error('Error loading roles:', error);
          this.snackBar.open('Failed to load roles.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const userData: UserCreationRequest = this.userForm.value;
      this.authService.createUser(userData).subscribe({
        next: (response: any) => {
          this.snackBar.open('User created successfully!', 'Close', { duration: 3000 });
          this.dialogRef.close(true); // Close dialog and pass true for success
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error creating user:', error);
          let errorMessage = 'Failed to create user. Please try again.';

          if (error.error && typeof error.error === 'object' && 'message' in error.error) {
            const errorDetails: ErrorDetails = error.error as ErrorDetails;
            if (error.status === 409) { // Conflict - likely duplicate email
                errorMessage = `Error: ${errorDetails.message || 'Email already exists.'}`;
            } else if (error.status === 400 || error.status === 403) {
                errorMessage = `Error: ${errorDetails.message || 'Invalid input or forbidden.'}`;
            } else {
                errorMessage = `Error: ${errorDetails.message || 'Unknown error.'}`;
            }
          } else if (error.message) {
            errorMessage = `Error: ${error.message}`;
          }
          this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
          this.dialogRef.close(false); // Close dialog and pass false for failure, or keep open. For now, close.
        },
      });
    } else {
      this.snackBar.open('Please fill in all required fields correctly.', 'Close', { duration: 3000 });
    }
  }

  onCancel(): void {
    this.dialogRef.close(); // Close dialog without returning data
  }

  // Helper for form validation messages
  getErrorMessage(controlName: string): string {
    const control = this.userForm.get(controlName);

    if (control?.hasError('required')) {
      return 'This field is required.';
    }
    if (control?.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength'].requiredLength} characters.`;
    }
    if (control?.hasError('maxlength')) {
      return `Maximum length is ${control.errors?.['maxlength'].requiredLength} characters.`;
    }
    if (control?.hasError('email')) {
      return 'Not a valid email.';
    }
    if (control?.hasError('pattern')) {
      return 'Not a valid phone number (10-15 digits).';
    }
    return '';
  }
}

