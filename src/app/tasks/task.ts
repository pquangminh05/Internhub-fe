import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TaskService, Intern, DuplicateTaskRequest } from './task.service';
import { Task, TaskStatus } from './task.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { UiPageHeaderComponent } from '../shared/components/ui-page-header/ui-page-header.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatRadioModule,
    UiPageHeaderComponent,
  ],
  templateUrl: './tasks.html',
})
export class Tasks implements OnInit {
  tasks: any[] = [];
  interns: Intern[] = [];
  skills: any[] = [];

  selectedSkillId: number | null = null;

  loading = false;
  loadingInterns = false;

  displayedColumns: string[] = [
    'stt',
    'title',
    'difficulty',
    'deadline',
    'status',
    'submission',
    'intern',
  ];

  selectedInternId: number | null = null;
  showInternBox = false;

  searchText = '';
  statusFilter = '';

  selectedTask: any = null;
  taskDetail: any = null;
  showTaskModal = false;
  showAddModal = false; // New property

  isEditing = false;
  showEditInternBox = false;

  // Review modal
  showReviewModal = false;
  reviewTaskData: any = null;
  reviewScore: number | null = null;
  reviewComment: string = '';

  // ✅ DUPLICATE MODAL STATE — string 'YYYY-MM-DD' thay vì Date object
  showDuplicateModal = false;
  duplicateSourceTask: any = null;
  duplicateDeadlineStr: string = '';
  duplicateSelectedInternIds: number[] = [];
  isDuplicating = false;

  editForm: any = {
    title: '',
    description: '',
    deadline: null,
    weight: 1,
    internId: null,
  };

  newTask: any = {
    title: '',
    description: '',
    weight: 1,
    deadline: null,
  };

  constructor(
    private taskService: TaskService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadInterns();
    this.loadSkills();
  }

  openAddModal(): void {
    this.resetNewTaskForm();
    setTimeout(() => {
      this.showAddModal = true;
      this.cdr.detectChanges();
    }, 0);
  }

  closeAddModal(): void {
    setTimeout(() => {
      this.showAddModal = false;
      this.cdr.detectChanges();
    }, 0);
  }

  // Ngày hôm nay dạng 'YYYY-MM-DD' để set [min] cho date input
  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ─── Load data ────────────────────────────────────────────────────────────

  loadTasks(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.taskService.getMentorTasks().subscribe({
      next: (data: any[]) => {
        if (data.length === 0) {
          this.tasks = [];
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
        const detailRequests = data.map((task) =>
          this.taskService.getTaskDetail(task.id).pipe(catchError(() => of(task))),
        );
        forkJoin(detailRequests).subscribe({
          next: (details: any[]) => {
            this.tasks = details.map((detail, i) => ({
              ...data[i],
              ...detail,
              weight: data[i].skills?.[0]?.weight ?? detail.weight ?? 1,
            }));
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.tasks = data.map((task) => ({ ...task, weight: task.skills?.[0]?.weight ?? 1 }));
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Lỗi load tasks:', error);
        this.tasks = [];
        this.loading = false;
        this.cdr.markForCheck();
        this.snackBar.open('Không thể tải danh sách task!', 'Đóng', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  loadInterns(): void {
    this.loadingInterns = true;
    this.taskService.getInterns().subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.interns = data.map((item) => ({
            id: item.id,
            name: item.name || item.fullName || item.username || 'Không có tên',
            email: item.email || '',
          }));
        } else if (data?.content && Array.isArray(data.content)) {
          this.interns = data.content.map((item: any) => ({
            id: item.id,
            name: item.name || item.fullName || 'Không có tên',
            email: item.email || '',
          }));
        } else {
          this.interns = [];
        }
        this.loadingInterns = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Lỗi load interns:', error);
        this.interns = [];
        this.loadingInterns = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadSkills(): void {
    this.taskService.getSkills().subscribe({
      next: (data) => {
        this.skills = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.skills = [];
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  getStars(weight: number): number[] {
    return Array(weight).fill(0);
  }

  get filteredTasks(): any[] {
    return this.tasks.filter((task) => {
      const matchesSearch = task.title?.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesStatus = this.statusFilter ? task.status === this.statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }

  selectIntern(id: number): void {
    this.selectedInternId = id;
    this.showInternBox = false;
  }

  isInternSelected(id: number): boolean {
    return this.selectedInternId === id;
  }

  getInternName(id: number): string {
    if (!id) return '';
    const intern = this.interns.find((i) => i.id === id);
    return intern ? intern.name : `Intern #${id}`;
  }

  getSkillName(skillId: number): string {
    if (!skillId) return '';
    const skill = this.skills.find((s) => s.id === skillId);
    return skill ? skill.name : `Skill #${skillId}`;
  }

  // ─── Create Task ──────────────────────────────────────────────────────────

  createTask(): void {
    if (!this.newTask.title || !this.newTask.deadline) {
      this.snackBar.open('Vui lòng nhập tiêu đề và thời hạn', 'Đóng', { duration: 3000 });
      return;
    }
    if (!this.selectedSkillId) {
      this.snackBar.open('Vui lòng chọn Skill', 'Đóng', { duration: 3000 });
      return;
    }
    if (!this.selectedInternId) {
      this.snackBar.open('Vui lòng chọn 1 Intern', 'Đóng', { duration: 3000 });
      return;
    }

    const deadlineDate = new Date(this.newTask.deadline);
    deadlineDate.setHours(23, 59, 59);

    const payload: Task = {
      title: this.newTask.title,
      description: this.newTask.description,
      deadline: deadlineDate.toISOString(),
      internIds: [this.selectedInternId],
      skills: [{ skillId: this.selectedSkillId, weight: this.newTask.weight ?? 1 }],
      status: TaskStatus.PENDING,
      assignedInterns: [],
    };

    this.taskService.createTask(payload).subscribe({
      next: () => {
        this.snackBar.open('Tạo task thành công', 'Đóng', { duration: 3000 });
        this.showAddModal = false;
        this.resetNewTaskForm();
        this.loadTasks();
      },
      error: (error) => {
        console.error('Lỗi tạo task:', error);
        // If it's a parsing error with status 200, the task was actually created successfully
        if (error.message && error.message.includes('response parsing failed')) {
          this.snackBar.open('Tạo task thành công', 'Đóng', { duration: 3000 });
          this.showAddModal = false;
          this.resetNewTaskForm();
          this.loadTasks();
        } else {
          this.snackBar.open('Tạo task thất bại: ' + (error.message || 'Vui lòng thử lại'), 'Đóng', {
            duration: 5000,
          });
        }
      },
    });
  }

  resetNewTaskForm(): void {
    this.newTask = { title: '', description: '', weight: 1, deadline: null };
    this.selectedInternId = null;
    this.selectedSkillId = null;
    this.showInternBox = false;
  }

  // ─── View / Edit / Delete Task ────────────────────────────────────────────

  private mapTaskDetail(task: any): any {
    const skills = task.skills || [];

    // Backend không có score ở root — lấy từ skills[0].ratingScore
    // UI dùng thang 0-10, backend lưu 0-5 → nhân 2 để hiển thị lại
    const rawScore = task.score ?? skills[0]?.ratingScore ?? null;
    const displayScore: number | null = rawScore !== null
      ? Math.round(rawScore * 10) / 10
      : null;

    // reviewComment lấy từ skills[0].reviewComment nếu không có ở root
    const reviewComment: string | null = task.reviewComment
      || task.review_comment
      || skills[0]?.reviewComment
      || null;

    // assignedInterns: list API trả về mảng rỗng, detail API mới có
    // Nếu rỗng nhưng có task.intern (single object) thì dùng đó
    let assignedInterns: Intern[] = task.assignedInterns || [];
    if (assignedInterns.length === 0 && task.intern) {
      assignedInterns = [task.intern];
    }

    // submissionLink: check nhiều field name khác nhau
    const submissionLink = task.submissionLink
      || task.submission_link
      || task.submitdate
      || null;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      status: task.status,
      weight: task.weight || (skills[0]?.weight ?? 1),
      score: displayScore,
      reviewComment,
      submissionLink: submissionLink ?? undefined,
      submission_link: task.submission_link || task.submitdate,
      submissionNote: task.submissionNote || task.submission_note,
      submission_note: task.submission_note,
      assignedInterns,
      skills
    };
  }

  viewTask(task: any): void {
    this.taskService.getTaskDetail(task.id).subscribe({
      next: (data) => {
        this.selectedTask = task;
        this.taskDetail = this.mapTaskDetail(data);
        this.taskDetail.weight = task.weight;
        if (data.skills && data.skills.length > 0) {
          this.selectedSkillId = data.skills[0].skillId;
        }
        setTimeout(() => {
          this.showTaskModal = true;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.snackBar.open('Không thể tải chi tiết task', 'Đóng', { duration: 3000 });
      },
    });
  }

  closeTaskModal(): void {
    setTimeout(() => {
      this.showTaskModal = false;
      this.isEditing = false;
      this.showEditInternBox = false;
      this.cdr.detectChanges();
    }, 0);
  }

  startEditing(): void {
    this.isEditing = true;
    this.editForm = {
      title: this.taskDetail?.title || '',
      description: this.taskDetail?.description || '',
      deadline: this.taskDetail?.deadline ? new Date(this.taskDetail.deadline) : null,
      weight: this.taskDetail?.weight || 1,
      internId: this.taskDetail?.assignedInterns?.[0]?.id || null,
    };
    if (this.taskDetail?.skills?.length > 0) {
      this.selectedSkillId = this.taskDetail.skills[0].skillId;
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.showEditInternBox = false;
  }

  selectEditIntern(id: number): void {
    this.editForm.internId = id;
    this.showEditInternBox = false;
  }

  saveEdit(): void {
    if (!this.selectedTask) return;
    if (!this.editForm.title || !this.editForm.deadline) {
      this.snackBar.open('Vui lòng nhập tiêu đề và thời hạn', 'Đóng', { duration: 3000 });
      return;
    }
    if (!this.selectedSkillId) {
      this.snackBar.open('Vui lòng chọn Skill', 'Đóng', { duration: 3000 });
      return;
    }
    if (!this.editForm.internId) {
      this.snackBar.open('Vui lòng chọn 1 Intern', 'Đóng', { duration: 3000 });
      return;
    }

    const deadlineDate = new Date(this.editForm.deadline);
    deadlineDate.setHours(23, 59, 59);

    const payload = {
      title: this.editForm.title,
      description: this.editForm.description,
      deadline: deadlineDate.toISOString(),
      internIds: [this.editForm.internId],
      skills: [{ skillId: this.selectedSkillId, weight: this.editForm.weight }],
    };

    this.taskService.updateTask(this.selectedTask.id, payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.snackBar.open('Cập nhật task thành công', 'Đóng', { duration: 3000 });
          this.isEditing = false;
          this.showTaskModal = false;
          this.cdr.detectChanges();
          this.loadTasks();
        }, 0);
      },
      error: (error) => {
        console.error('Lỗi update task:', error);
        // If it's a parsing error with status 200, the task was actually updated successfully
        if (error.message && error.message.includes('response parsing failed')) {
          setTimeout(() => {
            this.snackBar.open('Cập nhật task thành công', 'Đóng', { duration: 3000 });
            this.isEditing = false;
            this.showTaskModal = false;
            this.cdr.detectChanges();
            this.loadTasks();
          }, 0);
        } else {
          this.snackBar.open('Cập nhật task thất bại: ' + (error.message || 'Vui lòng thử lại'), 'Đóng', {
            duration: 5000,
          });
        }
      },
    });
  }

  deleteTask(task: any): void {
    if (!confirm('Bạn có chắc muốn xóa task?')) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.snackBar.open('Đã xóa task', 'Đóng', { duration: 3000 });
          this.closeTaskModal();
          this.loadTasks();
        }, 0);
      },
      error: (error) => {
        console.error('Lỗi xóa task:', error);
        // If it's a parsing error with status 200, the task was actually deleted successfully
        if (error.message && error.message.includes('response parsing failed')) {
          setTimeout(() => {
            this.snackBar.open('Đã xóa task', 'Đóng', { duration: 3000 });
            this.closeTaskModal();
            this.loadTasks();
          }, 0);
        } else {
          this.snackBar.open('Xóa task thất bại: ' + (error.message || 'Vui lòng thử lại'), 'Đóng', {
            duration: 5000,
          });
        }
      },
    });
  }

  openReviewModal(task: any): void {
    this.taskService.getTaskDetail(task.id).subscribe({
      next: (detail) => {
        this.reviewTaskData = { ...task, ...detail, weight: task.weight };
        setTimeout(() => {
          this.showReviewModal = true;
          this.cdr.detectChanges();
        }, 0);
      },
      error: () => {
        this.reviewTaskData = task;
        setTimeout(() => {
          this.showReviewModal = true;
          this.cdr.detectChanges();
        }, 0);
      },
    });
  }

  closeReviewModal(): void {
    setTimeout(() => {
      this.showReviewModal = false;
      this.reviewTaskData = null;
      this.reviewScore = null;
      this.reviewComment = '';
      this.cdr.detectChanges();
    }, 0);
  }

  isValidScore(): boolean {
    if (this.reviewScore === null || this.reviewScore === undefined) return false;
    const v = Number(this.reviewScore);
    return !isNaN(v) && v >= 0 && v <= 10;
  }

  submitReview(): void {
    if (!this.isValidScore()) {
      this.snackBar.open('Điểm phải từ 0 đến 10', 'Đóng', { duration: 3000 });
      return;
    }

    const task = this.reviewTaskData;
    const taskSkillId = task?.skills?.[0]?.skillId ?? null;

    if (!taskSkillId) {
      this.snackBar.open('Task này chưa có skill — không thể chấm điểm', 'Đóng', {
        duration: 4000,
      });
      return;
    }

    const backendScore = Math.round(Number(this.reviewScore) * 100) / 100;

    const payload = {
      skills: [
        {
          skillId: taskSkillId,
          ratingScore: backendScore,
          reviewComment: this.reviewComment || '',
        },
      ],
    };

    this.taskService.reviewTask(task.id, payload).subscribe({
      next: () => {
        this.closeReviewModal();
        this.snackBar.open('Chấm điểm thành công!', 'Đóng', { duration: 3000 });
        
        // Refresh task list first
        setTimeout(() => this.loadTasks(), 50);
        
        // Then refresh task detail if modal is still open
        if (this.showTaskModal && this.selectedTask) {
          setTimeout(() => {
            this.taskService.getTaskDetail(this.selectedTask.id).subscribe({
              next: (data) => {
                this.taskDetail = this.mapTaskDetail(data);
                this.taskDetail.weight = this.selectedTask.weight;
                // Force change detection
                this.cdr.markForCheck();
              },
              error: () => {
                console.error('Failed to refresh task detail after review');
              }
            });
          }, 200); // Increased timeout to ensure backend has processed the review
        }
      },
      error: (error) => {
        console.error('Lỗi review task:', error);
        // If it's a parsing error with status 200, the task was actually reviewed successfully
        if (error.message && error.message.includes('response parsing failed')) {
          this.closeReviewModal();
          this.snackBar.open('Chấm điểm thành công!', 'Đóng', { duration: 3000 });
          setTimeout(() => this.loadTasks(), 50);
          // Also refresh the task detail if modal is still open
          if (this.showTaskModal && this.selectedTask) {
            setTimeout(() => {
              this.taskService.getTaskDetail(this.selectedTask.id).subscribe({
                next: (data) => {
                  this.taskDetail = this.mapTaskDetail(data);
                  this.taskDetail.weight = this.selectedTask.weight;
                  // Force change detection
                  this.cdr.markForCheck();
                },
                error: () => {
                  console.error('Failed to refresh task detail after review');
                }
              });
            }, 250); // Increased timeout to ensure backend has processed the review
          }
        } else if (error?.status === 200 || error?.status === 0) {
          this.closeReviewModal();
          this.snackBar.open('Chấm điểm thành công!', 'Đóng', { duration: 3000 });
          setTimeout(() => this.loadTasks(), 50);
          // Also refresh the task detail if modal is still open
          if (this.showTaskModal && this.selectedTask) {
            setTimeout(() => {
              this.taskService.getTaskDetail(this.selectedTask.id).subscribe({
                next: (data) => {
                  this.taskDetail = this.mapTaskDetail(data);
                  this.taskDetail.weight = this.selectedTask.weight;
                  // Force change detection
                  this.cdr.markForCheck();
                },
                error: () => {
                  console.error('Failed to refresh task detail after review');
                }
              });
            }, 200);
          }
          return;
        } else {
          const msg = error?.error?.message || error?.message || 'Chấm điểm thất bại';
          this.snackBar.open(msg, 'Đóng', { duration: 4000 });
        }
      },
    });
  }

  // ─── ✅ Duplicate Task ────────────────────────────────────────────────────

  openDuplicateModal(task: any): void {
    this.duplicateSourceTask = task;
    this.duplicateDeadlineStr = '';
    this.duplicateSelectedInternIds = [];
    this.isDuplicating = false;
    setTimeout(() => {
      this.showDuplicateModal = true;
      this.cdr.detectChanges();
    }, 0);
  }

  closeDuplicateModal(): void {
    this.showDuplicateModal = false;
    this.duplicateSourceTask = null;
    this.duplicateDeadlineStr = '';
    this.duplicateSelectedInternIds = [];
    this.isDuplicating = false;
  }

  toggleDuplicateIntern(internId: number): void {
    const idx = this.duplicateSelectedInternIds.indexOf(internId);
    if (idx === -1) {
      this.duplicateSelectedInternIds = [...this.duplicateSelectedInternIds, internId];
    } else {
      this.duplicateSelectedInternIds = this.duplicateSelectedInternIds.filter(
        (id) => id !== internId,
      );
    }
  }

  isDuplicateInternSelected(internId: number): boolean {
    return this.duplicateSelectedInternIds.includes(internId);
  }

  isOriginalIntern(internId: number): boolean {
    const originalId = this.duplicateSourceTask?.assignedInterns?.[0]?.id;
    return originalId === internId;
  }

  confirmDuplicate(): void {
    if (
      !this.duplicateSourceTask ||
      !this.duplicateDeadlineStr ||
      this.duplicateSelectedInternIds.length === 0
    ) {
      return;
    }

    this.isDuplicating = true;

    const deadline = `${this.duplicateDeadlineStr}T23:59:59`;

    const request: DuplicateTaskRequest = {
      internIds: [...this.duplicateSelectedInternIds],
      deadline,
    };

    this.taskService.duplicateTask(this.duplicateSourceTask.id, request).subscribe({
      next: (newTasks) => {
        const count = Array.isArray(newTasks) ? newTasks.length : 1;
        setTimeout(() => {
          this.isDuplicating = false;
          this.closeDuplicateModal();
          this.snackBar.open(`✅ Đã tạo thành công ${count} task mới!`, 'Đóng', { duration: 4000 });
          this.loadTasks();
        }, 0);
      },
      error: (error) => {
        setTimeout(() => {
          this.isDuplicating = false;
          this.cdr.detectChanges();
          console.error('Lỗi duplicate task:', error);
          const msg =
            error?.error?.message || error?.message || 'Duplicate thất bại, vui lòng thử lại.';
          this.snackBar.open(msg, 'Đóng', { duration: 5000, panelClass: ['error-snackbar'] });
        }, 0);
      },
    });
  }

  // ─── Other helpers ────────────────────────────────────────────────────────

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'submitted':
        return 'info';
      case 'reviewed':
        return 'success';
      default:
        return 'primary';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'submitted':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'reviewed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }

  canReview(task: any): boolean {
    return !!(task?.submissionLink || task?.status === 'Submitted');
  }

  refreshData(): void {
    this.loadTasks();
    this.loadInterns();
    this.loadSkills();
  }
}
