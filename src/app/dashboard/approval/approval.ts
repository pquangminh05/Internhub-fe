import {
  Component,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  NgZone,
  afterNextRender,
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

// ─── Models chung ────────────────────────────────────────────────────────────

interface InternItem {
  id: number;
  name: string;
  email: string;
}

interface SkillSummary {
  skillId: number;
  skillName: string;
  parentSkillName?: string;
  averageScore: number;
  totalWeight: number;
  taskCount: number;
}

interface EvaluationResponse {
  id?: number;
  internId: number;
  internName?: string;
  internEmail?: string;
  mentorId?: number;
  mentorName?: string;
  overallComment?: string;
  status?: 'DRAFT' | 'SUBMITTED';
  isLocked?: boolean;
  submittedAt?: string;
  createdAt?: string;
  skillSummaries?: SkillSummary[];
  totalTasksReviewed?: number;
  totalTasksAll?: number;
}

// ─── Models Manager Review ────────────────────────────────────────────────────

interface TaskSkillItem {
  skillName: string;
  weight: number;
  ratingScore: number | null;
  reviewComment: string | null;
}

interface TaskHistoryItem {
  taskId: number;
  title: string;
  description: string;
  status: string;
  deadline: string;
  createdAt: string;
  skills: TaskSkillItem[];
}

interface DecisionInfo {
  decisionId: number;
  decision: 'PASS' | 'FAIL' | 'CONVERT_TO_STAFF';
  managerComment: string;
  managerName: string;
  createdAt: string;
  hrNotified: boolean;
}

interface ManagerReviewResponse {
  internId: number;
  internName: string;
  internEmail: string;
  internPhone: string;
  internAvatar: string | null;
  universityName: string | null;
  major: string | null;
  internshipProfileId: number;
  positionName: string | null;
  departmentName: string | null;
  startDate: string;
  endDate: string;
  internshipStatus: string;
  mentorId: number;
  mentorName: string;
  mentorEmail: string;
  evaluationId: number;
  overallComment: string;
  evaluationStatus: string;
  evaluationSubmittedAt: string;
  skillSummaries: SkillSummary[];
  overallScore: number;
  totalTasksAll: number;
  totalTasksReviewed: number;
  taskHistory: TaskHistoryItem[];
  currentDecision: DecisionInfo | null;
}

interface HrNotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  referenceId: number | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
  senderName?: string;
}

type DecisionType = 'PASS' | 'FAIL' | 'CONVERT_TO_STAFF';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-approval',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './approval.html',
  styleUrl: './approval.css',
})
export class Approval {
  private readonly apiUrl = 'http://localhost:8090/api';
  private toastCounter = 0;

  // ── Role detection ────────────────────────────────────────────────────────
  currentRole: 'MENTOR' | 'MANAGER' | string = 'MENTOR';

  // ── Shared: danh sách intern + loading ───────────────────────────────────
  interns: InternItem[] = [];
  selectedInternId: number | null = null;
  isInternsLoading = false;
  isLoading = false;

  // ════════════════════════════════════════════════════════════════════════════
  // MENTOR STATE
  // ════════════════════════════════════════════════════════════════════════════
  evaluation: EvaluationResponse | null = null;
  activeTab: 'write' | 'upload' = 'upload';
  overallComment = '';
  uploadNote = '';
  uploadSlots: Array<{ file: File | null }> = [{ file: null }];
  isSaving = false;
  isSubmitting = false;
  showSubmitModal = false;
  isExporting = false;
  isResetting = false;
  showResetModal = false;

  // ════════════════════════════════════════════════════════════════════════════
  // MANAGER STATE
  // ════════════════════════════════════════════════════════════════════════════

  // Danh sách hồ sơ chờ duyệt (SUBMITTED + chưa có quyết định)
  pendingReviews: ManagerReviewResponse[] = [];
  isPendingLoading = false;

  // Hồ sơ đang được xem chi tiết
  selectedReview: ManagerReviewResponse | null = null;
  isReviewDetailLoading = false;

  // Decision modal
  showDecisionModal = false;
  pendingDecision: DecisionType = 'PASS';
  managerComment = '';
  isSubmittingDecision = false;

  // Expand task history
  expandedTaskIds = new Set<number>();

  // Tab: pending | all
  managerTab: 'pending' | 'all' = 'pending';
  allReviews: ManagerReviewResponse[] = [];
  isAllLoading = false;

  // HR notification state
  hrNotifications: HrNotificationItem[] = [];
  hrUnreadCount = 0;
  isHrNotificationsLoading = false;

  // ── Toast ─────────────────────────────────────────────────────────────────
  toasts: Toast[] = [];

  // ── Manager decision: local copy ─────────────────────────────────────────
  managerDecision: 'APPROVE' | 'REJECT' | null = null;
  showManagerModal = false;
  pendingDecisionOld: 'APPROVE' | 'REJECT' = 'APPROVE';
  rejectReason = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    afterNextRender(() => {
      this.detectCurrentRole();
      if (this.currentRole === 'MANAGER') {
        this.loadManagerPendingReviews();
      } else if (this.currentRole === 'HR') {
        this.loadHrNotifications();
      } else {
        this.loadInterns();
      }
    });
  }

  // ── Role detection ─────────────────────────────────────────────────────────

  private detectCurrentRole(): void {
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles: string[] = payload.roles ?? payload.authorities ?? [];

      if (roles.some((r: string) => r.includes('HR'))) {
        this.currentRole = 'HR';
      } else if (roles.some((r: string) => r.includes('MANAGER'))) {
        this.currentRole = 'MANAGER';
      } else if (roles.some((r: string) => r.includes('ADMIN'))) {
        this.currentRole = 'MANAGER'; // Admin cũng xem được trang này
      } else {
        this.currentRole = 'MENTOR';
      }
    } catch {
      this.currentRole = 'MENTOR';
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MENTOR LOGIC (giữ nguyên toàn bộ)
  // ════════════════════════════════════════════════════════════════════════════

  private loadInterns(): void {
    this.isInternsLoading = true;
    this.http
      .get<any[]>(`${this.apiUrl}/mentor/interns`)
      .pipe(
        finalize(() => {
          this.isInternsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (data) => {
          this.zone.run(() => {
            this.interns = data.map((u) => ({
              id: Number(u.id),
              name: u.name,
              email: u.email,
            }));
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          console.error('[Approval] Không thể tải danh sách intern:', err?.status);
        },
      });
  }

  onInternChange(internId: any): void {
    const id = internId ? Number(internId) : null;
    this.selectedInternId = id;
    this.evaluation = null;
    this.overallComment = '';
    this.managerDecision = null;
    if (!id) return;
    this.loadEvaluation(id);
  }

  private loadEvaluation(internId: number): void {
    this.isLoading = true;
    this.evaluation = null;
    this.http
      .get<EvaluationResponse>(`${this.apiUrl}/mentor/evaluations/intern/${internId}`)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (data) => {
          this.zone.run(() => {
            this.evaluation = data;
            this.overallComment = data.overallComment ?? '';
            const savedType = localStorage.getItem(`eval_type_${data.internId}`) as
              | 'write'
              | 'upload'
              | null;
            this.activeTab = savedType ?? 'upload';
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.evaluation = null;
          this.overallComment = '';
        },
      });
  }

  saveDraft(): void {
    if (!this.selectedInternId) return;
    this.isSaving = true;
    const commentToSave =
      this.activeTab === 'write'
        ? this.overallComment.trim()
        : this.uploadNote.trim() || '(Bản nháp - chưa có nhận xét)';

    this.http
      .post<EvaluationResponse>(`${this.apiUrl}/mentor/evaluations`, {
        internId: this.selectedInternId,
        overallComment: commentToSave,
      })
      .subscribe({
        next: (data) => {
          this.evaluation = { ...this.evaluation, ...data };
          this.isSaving = false;
          this.cdr.detectChanges();
          this.showToast('Đã lưu nháp đánh giá.');
        },
        error: () => {
          this.isSaving = false;
          this.showToast('Lưu nháp thất bại.', 'error');
        },
      });
  }

  switchTab(tab: 'write' | 'upload'): void {
    this.activeTab = tab;
    if (this.selectedInternId) {
      localStorage.setItem(`eval_type_${this.selectedInternId}`, tab);
    }
  }

  hasNoFiles(): boolean {
    return !this.uploadSlots || this.uploadSlots.every((s) => !s.file);
  }

  canSubmit(): boolean {
    if (this.activeTab === 'write') return this.overallComment.trim().length > 0;
    const hasFile = this.uploadSlots.some((s) => s.file !== null);
    const hasNote = this.uploadNote.trim().length > 0;
    return hasFile || hasNote;
  }

  openSubmitConfirm(): void {
    if (!this.canSubmit()) return;
    this.showSubmitModal = true;
  }

  submitEvaluation(): void {
    if (!this.selectedInternId || !this.canSubmit()) return;
    this.showSubmitModal = false;
    this.isSubmitting = true;

    const finalComment =
      this.activeTab === 'write'
        ? this.overallComment.trim()
        : this.uploadNote.trim() || '(Đã gửi kèm tệp đính kèm)';

    this.http
      .post<EvaluationResponse>(`${this.apiUrl}/mentor/evaluations`, {
        internId: this.selectedInternId,
        overallComment: finalComment,
      })
      .subscribe({
        next: (saved) => {
          if (!saved.id) {
            this.isSubmitting = false;
            this.showToast('Không lấy được ID đánh giá.', 'error');
            return;
          }
          this.http
            .post<EvaluationResponse>(`${this.apiUrl}/mentor/evaluations/${saved.id}/submit`, {})
            .subscribe({
              next: (submitted) => {
                this.evaluation = submitted;
                this.isSubmitting = false;
                this.cdr.detectChanges();
                this.showToast('Đã gửi phê duyệt thành công! Micro-tasks đã được khóa.');
              },
              error: (err) => {
                this.isSubmitting = false;
                this.showToast(err?.error?.message ?? 'Gửi phê duyệt thất bại.', 'error');
              },
            });
        },
        error: () => {
          this.isSubmitting = false;
          this.showToast('Lưu nhận xét thất bại.', 'error');
        },
      });
  }

  openManagerDecision(decision: 'APPROVE' | 'REJECT'): void {
    this.pendingDecisionOld = decision;
    this.rejectReason = '';
    this.showManagerModal = true;
  }

  confirmManagerDecision(): void {
    if (this.pendingDecisionOld === 'REJECT' && !this.rejectReason.trim()) return;
    this.showManagerModal = false;
    this.managerDecision = this.pendingDecisionOld;
    const msg =
      this.pendingDecisionOld === 'APPROVE'
        ? 'Đã phê duyệt kết quả đánh giá thành công.'
        : `Đã từ chối. Lý do: ${this.rejectReason}`;
    this.showToast(msg);
  }

  exportReport(): void {
    if (!this.evaluation || !this.selectedInternId) return;
    this.isExporting = true;
    this.http
      .get(`${this.apiUrl}/mentor/evaluations/intern/${this.selectedInternId}/export`, {
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          this.isExporting = false;
          const intern = this.interns.find((i) => i.id === this.selectedInternId);
          const filename = `danh-gia-${intern?.name ?? 'intern'}-${new Date().toISOString().slice(0, 10)}.pdf`;
          this.downloadBlob(blob, filename);
          this.showToast('Xuất file thành công!');
        },
        error: () => {
          this.isExporting = false;
          this.exportAsText();
        },
      });
  }

  openResetConfirm(): void {
    this.showResetModal = true;
  }

  confirmReset(): void {
    if (!this.evaluation?.id) return;
    this.showResetModal = false;
    this.isResetting = true;
    this.http
      .post<EvaluationResponse>(`${this.apiUrl}/mentor/evaluations/${this.evaluation.id}/reset`, {})
      .subscribe({
        next: (data) => {
          this.evaluation = data;
          this.overallComment = data.overallComment ?? '';
          this.isResetting = false;
          this.cdr.detectChanges();
          this.showToast('Đã mở khóa. Bạn có thể chỉnh sửa và gửi lại.');
        },
        error: () => {
          if (this.evaluation) {
            this.evaluation = { ...this.evaluation, isLocked: false, status: 'DRAFT' };
          }
          this.isResetting = false;
          this.cdr.detectChanges();
          this.showToast('Đã mở khóa đánh giá (local).');
        },
      });
  }

  private exportAsText(): void {
    const intern = this.interns.find((i) => i.id === this.selectedInternId);
    const lines: string[] = [
      '===== BÁO CÁO ĐÁNH GIÁ CUỐI KỲ =====',
      `Intern: ${intern?.name ?? ''} (${intern?.email ?? ''})`,
      `Mentor: ${this.evaluation?.mentorName ?? ''}`,
      `Ngày gửi: ${this.evaluation?.submittedAt ?? 'Chưa gửi'}`,
      '',
      '--- BẢNG ĐIỂM KỸ NĂNG ---',
    ];
    this.evaluation?.skillSummaries?.forEach((s) => {
      lines.push(
        `  ${s.skillName}: ${s.averageScore.toFixed(2)}/10  (${s.taskCount} task, trọng số ${s.totalWeight})`,
      );
    });
    lines.push('', '--- NHẬN XÉT TỔNG KẾT ---');
    lines.push(this.evaluation?.overallComment ?? '(Chưa có nhận xét)');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    this.downloadBlob(
      blob,
      `danh-gia-${intern?.name ?? 'intern'}-${new Date().toISOString().slice(0, 10)}.txt`,
    );
    this.showToast('Đã xuất file báo cáo (text).');
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  getScoreLabel(score: number): string {
    if (score >= 8.5) return 'Xuất sắc';
    if (score >= 7) return 'Tốt';
    if (score >= 5) return 'Đạt';
    return 'Cần cải thiện';
  }

  addUploadSlot(): void {
    this.uploadSlots.push({ file: null });
  }

  removeSlot(index: number): void {
    this.uploadSlots.splice(index, 1);
    if (this.uploadSlots.length === 0) this.uploadSlots.push({ file: null });
  }

  triggerSlotFileInput(index: number): void {
    const inputs = document.querySelectorAll<HTMLInputElement>('input[data-slot]');
    inputs[index]?.click();
  }

  triggerSlotCamera(index: number): void {
    const inputs = document.querySelectorAll<HTMLInputElement>('input[data-slot]');
    const input = inputs[index];
    if (input) {
      input.setAttribute('capture', 'environment');
      input.click();
    }
  }

  onSlotFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.uploadSlots[index] = { file: input.files[0] };
    input.removeAttribute('capture');
    input.value = '';
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MANAGER LOGIC — MỚI
  // ════════════════════════════════════════════════════════════════════════════

  switchManagerTab(tab: 'pending' | 'all'): void {
    this.managerTab = tab;
    this.selectedReview = null;
    this.expandedTaskIds.clear();
    if (tab === 'pending') {
      this.loadManagerPendingReviews();
    } else {
      this.loadManagerAllReviews();
    }
  }

  loadManagerPendingReviews(): void {
    this.isPendingLoading = true;
    this.http
      .get<ManagerReviewResponse[]>(`${this.apiUrl}/manager/reviews/pending`)
      .pipe(
        finalize(() => {
          this.isPendingLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (data) => {
          this.zone.run(() => {
            this.pendingReviews = data;
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.showToast('Không thể tải danh sách hồ sơ chờ duyệt.', 'error');
        },
      });
  }

  loadManagerAllReviews(): void {
    this.isAllLoading = true;
    this.http
      .get<ManagerReviewResponse[]>(`${this.apiUrl}/manager/reviews/all`)
      .pipe(
        finalize(() => {
          this.isAllLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (data) => {
          this.zone.run(() => {
            this.allReviews = data;
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.showToast('Không thể tải danh sách hồ sơ.', 'error');
        },
      });
  }

  get currentManagerReviews(): ManagerReviewResponse[] {
    return this.managerTab === 'pending' ? this.pendingReviews : this.allReviews;
  }

  get isManagerListLoading(): boolean {
    return this.managerTab === 'pending' ? this.isPendingLoading : this.isAllLoading;
  }

  selectManagerReview(review: ManagerReviewResponse): void {
    this.isReviewDetailLoading = true;
    this.selectedReview = review;
    this.expandedTaskIds.clear();
    this.http
      .get<ManagerReviewResponse>(`${this.apiUrl}/manager/reviews/${review.internshipProfileId}`)
      .pipe(
        finalize(() => {
          this.isReviewDetailLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (detail) => {
          this.zone.run(() => {
            this.selectedReview = detail;
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.showToast('Không thể tải chi tiết hồ sơ.', 'error');
        },
      });
  }

  loadHrNotifications(): void {
    this.isHrNotificationsLoading = true;
    this.http
      .get<any>(`${this.apiUrl}/notifications?size=30`)
      .pipe(
        finalize(() => {
          this.isHrNotificationsLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          this.zone.run(() => {
            this.hrNotifications = (res?.content ?? []).map((n: any) => ({
              id: n.id,
              type: n.type,
              title: n.title,
              message: n.message,
              referenceId: n.referenceId,
              referenceType: n.referenceType,
              isRead: n.isRead,
              createdAt: n.createdAt,
              senderName: n.senderName,
            }));
            this.loadHrUnreadCount();
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.showToast('Không thể tải thông báo HR.', 'error');
        },
      });
  }

  loadHrUnreadCount(): void {
    this.http.get<any>(`${this.apiUrl}/notifications/unread-count`).subscribe({
      next: (res) => {
        this.hrUnreadCount = res?.unreadCount ?? 0;
      },
      error: () => {
        this.hrUnreadCount = 0;
      },
    });
  }

  markHrNotificationRead(id: number): void {
    this.http.patch<any>(`${this.apiUrl}/notifications/${id}/read`, {}).subscribe({
      next: () => {
        const item = this.hrNotifications.find((n) => n.id === id);
        if (item && !item.isRead) {
          item.isRead = true;
          this.hrUnreadCount = Math.max(this.hrUnreadCount - 1, 0);
        }
      },
      error: () => {
        this.showToast('Không thể đánh dấu đã đọc.', 'error');
      },
    });
  }

  openManagerDecisionNew(decision: DecisionType): void {
    this.pendingDecision = decision;
    this.managerComment = '';
    this.showDecisionModal = true;
  }

  closeDecisionModal(): void {
    this.showDecisionModal = false;
    this.managerComment = '';
  }

  confirmDecision(): void {
    if (!this.selectedReview) return;
    if (this.pendingDecision === 'FAIL' && !this.managerComment.trim()) return;

    this.isSubmittingDecision = true;
    this.http
      .post<ManagerReviewResponse>(`${this.apiUrl}/manager/reviews/decision`, {
        internshipProfileId: this.selectedReview.internshipProfileId,
        decision: this.pendingDecision,
        managerComment: this.managerComment.trim(),
      })
      .pipe(
        finalize(() => {
          this.isSubmittingDecision = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (updated) => {
          this.zone.run(() => {
            this.showDecisionModal = false;
            this.selectedReview = updated;
            // Cập nhật trong danh sách
            this.pendingReviews = this.pendingReviews.filter(
              (r) => r.internshipProfileId !== updated.internshipProfileId,
            );
            this.allReviews = this.allReviews.map((r) =>
              r.internshipProfileId === updated.internshipProfileId ? updated : r,
            );
            this.showToast(
              `Đã gửi quyết định "${this.getDecisionLabel(this.pendingDecision)}" và thông báo cho HR.`,
            );
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.showToast('Gửi quyết định thất bại. Vui lòng thử lại.', 'error');
        },
      });
  }

  toggleTask(taskId: number): void {
    if (this.expandedTaskIds.has(taskId)) {
      this.expandedTaskIds.delete(taskId);
    } else {
      this.expandedTaskIds.add(taskId);
    }
  }

  isTaskExpanded(taskId: number): boolean {
    return this.expandedTaskIds.has(taskId);
  }

  // ── Manager helpers ───────────────────────────────────────────────────────

  getDecisionLabel(d: DecisionType): string {
    return { PASS: 'Đạt', FAIL: 'Không đạt', CONVERT_TO_STAFF: 'Tuyển dụng chính thức' }[d];
  }

  getDecisionBadgeClass(d: DecisionType | undefined): string {
    if (!d) return '';
    return {
      PASS: 'bg-green-100 text-green-700 border-green-200',
      FAIL: 'bg-red-100 text-red-700 border-red-200',
      CONVERT_TO_STAFF: 'bg-purple-100 text-purple-700 border-purple-200',
    }[d];
  }

  getManagerScoreColor(score: number): string {
    if (score >= 8) return '#059669';
    if (score >= 5) return '#d97706';
    return '#dc2626';
  }

  getTaskStatusClass(status: string): string {
    const map: Record<string, string> = {
      Todo: 'bg-gray-100 text-gray-600',
      In_Progress: 'bg-blue-50 text-blue-600',
      Submitted: 'bg-amber-50 text-amber-600',
      Reviewed: 'bg-green-50 text-green-600',
      Rejected: 'bg-red-50 text-red-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }

  getTaskStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Todo: 'Chưa bắt đầu',
      In_Progress: 'Đang thực hiện',
      Submitted: 'Đã nộp',
      Reviewed: 'Đã chấm',
      Rejected: 'Từ chối',
    };
    return map[status] || status;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  canManagerDecide(review: ManagerReviewResponse): boolean {
    return review.evaluationStatus === 'SUBMITTED' && review.currentDecision === null;
  }

  getProgressPct(score: number): number {
    return Math.min((score / 10) * 100, 100);
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
      this.cdr.detectChanges();
    }, 3500);
  }
}
