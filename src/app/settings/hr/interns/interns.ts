import { Component, OnInit, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Auth } from '../../../auth/auth';
import { HttpClient } from '@angular/common/http';
import { UiPageHeaderComponent } from '../../../shared/components/ui-page-header/ui-page-header.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import * as XLSX from 'xlsx';

export type InternStatus = 'In_Progress' | 'Completed' | 'Extended' | 'Terminated';

export interface Intern {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  major: string;
  universityId: number;
  universityName: string;
  deptId: number;
  deptName: string;
  positionId: number;
  posName: string;
  status: InternStatus;
  startDate: string;
  endDate: string;
  mentorId: number;
  mentorName: string;
  managerId: number;
  managerName: string;
}

export interface UserItem {
  id: number;
  name: string;
  email: string;
  roleName?: string;
  departmentId?: number;
  departmentName?: string;
  phone?: string;
}

interface University {
  id: number;
  name: string;
  short: string;
}
interface Department {
  id: number;
  name: string;
}
interface Mentor {
  id: number;
  name: string;
}
interface Manager {
  id: number;
  name: string;
}
interface Position {
  id: number;
  name: string;
  departmentId: number;
}

@Component({
  selector: 'app-hr-interns',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTableModule, // Thêm MatTableModule
    MatProgressSpinnerModule,
    UiPageHeaderComponent,
    UiCardComponent,
  ],
  templateUrl: `./intern-profile-management.html`,
  styleUrl: `./intern-profile.css`,
})
export class HrInternsComponent implements OnInit {
  private API = 'http://localhost:8090/api/interns';
  private API_UNIV = 'http://localhost:8090/api/universities';
  private API_DEPT = 'http://localhost:8090/api/departments';
  private API_POS = 'http://localhost:8090/api/positions';
  UNIVERSITIES: University[] = [];
  DEPARTMENTS: Department[] = [];
  MENTORS: Mentor[] = [];
  MANAGERS: Manager[] = [];
  ALL_POSITIONS: Position[] = [];
  DEPT_POSITIONS: Record<number, { id: number; name: string }[]> = {};

  // ── Danh sách user có role INTERN chưa có profile ──────────────────────
  availableInternUsers: UserItem[] = [];
  isLoadingUsers = false;
  userSearchQuery = '';
  selectedUserId: number | null = null;

  isPickUserModalOpen = false;

  get filteredAvailableUsers(): UserItem[] {
    const q = this.userSearchQuery.toLowerCase().trim();
    if (!q) return this.availableInternUsers;
    return this.availableInternUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }

  readonly STATUS_META: Record<InternStatus, { label: string; cls: string }> = {
    In_Progress: { label: 'Đang thực tập', cls: 's-inprogress' },
    Completed: { label: 'Hoàn thành', cls: 's-completed' },
    Extended: { label: 'Gia hạn', cls: 's-extended' },
    Terminated: { label: 'Nghỉ việc', cls: 's-terminated' },
  };
  readonly STATUS_KEYS = Object.keys(this.STATUS_META) as InternStatus[];

  interns: Intern[] = [];
  filtered: Intern[] = [];
  isLoading = true;

  searchQuery = '';
  filterDept = '';
  filterPos = '';
  filterUniv = '';
  filterStatus = '';
  filterPositionOptions: string[] = [];

  isFormModalOpen = false;
  isDeleteModalOpen = false;
  isStatusModalOpen = false;
  isEditMode = false;

  editingId: number | null = null;
  deletingIntern: Intern | null = null;
  statusIntern: Intern | null = null;
  selectedStatus: InternStatus = 'In_Progress';

  displayedColumns: string[] = ['intern', 'contact', 'major', 'org', 'status', 'actions']; // Định nghĩa displayedColumns

  duplicateError = '';
  toastMessage = '';
  showToastFlag = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  internForm!: FormGroup;

  get availablePositions() {
    return this.DEPT_POSITIONS[this.internForm.get('departmentId')?.value] || [];
  }

  get hasActiveFilter(): boolean {
    return !!(
      this.searchQuery ||
      this.filterDept ||
      this.filterPos ||
      this.filterUniv ||
      this.filterStatus
    );
  }

  // University autocomplete
  universitySearch = '';
  showUniversityDropdown = false;

  get filteredUniversities(): University[] {
    const q = this.universitySearch.toLowerCase().trim();
    if (!q) return this.UNIVERSITIES;
    return this.UNIVERSITIES.filter((u) => u.name.toLowerCase().includes(q));
  }

  getStatusMeta(status: string): { label: string; cls: string } {
    const s = status as InternStatus;
    return this.STATUS_META[s] || { label: status, cls: 'bg-gray-100 text-gray-400' };
  }

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private authService: Auth,
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  /**
   * Tải các dữ liệu danh mục và người dùng trước khi tải danh sách Intern
   */
  loadInitialData(): void {
    this.loadUniversities();
    this.loadDepartments();
    this.loadPositions();

    // Lấy tất cả người dùng để lọc ra Mentor/Manager theo Role (Giống account-management)
    this.authService.getUsersAll().subscribe((users) => {
      this.MENTORS = users
        .filter((u) => (u.roleName || u.role?.name) === 'MENTOR')
        .map((u) => ({ id: u.id, name: u.name }));
      this.MANAGERS = users
        .filter((u) => (u.roleName || u.role?.name) === 'MANAGER')
        .map((u) => ({ id: u.id, name: u.name }));

      // Sau khi đã có danh sách Mentor/Manager làm map, mới tải Intern
      this.loadInterns();
    });
  }

  loadUniversities() {
    this.http.get<University[]>(this.API_UNIV).subscribe((res) => {
      this.UNIVERSITIES = res;
    });
  }

  loadDepartments() {
    this.http.get<Department[]>(this.API_DEPT).subscribe((res) => {
      this.DEPARTMENTS = res;
    });
  }

  loadPositions() {
    this.DEPT_POSITIONS = {};
    this.http.get<any[]>(this.API_POS).subscribe((res) => {
      this.ALL_POSITIONS = res.map((p) => ({
        id: p.id,
        name: p.name,
        departmentId: p.departmentId,
      }));
      res.forEach((p) => {
        if (!this.DEPT_POSITIONS[p.departmentId]) this.DEPT_POSITIONS[p.departmentId] = [];
        this.DEPT_POSITIONS[p.departmentId].push({ id: p.id, name: p.name });
      });
    });
  }

  loadInterns(): void {
    this.isLoading = true;
    this.http.get<any[]>(this.API).subscribe((res) => {
      this.interns = res.map((i) => ({
        id: i.id,
        fullName: i.fullName,
        email: i.email,
        phone: i.phone,
        major: i.major,
        universityId: i.universityId,
        universityName: i.universityName,
        deptId: i.departmentId,
        deptName: i.departmentName,
        positionId: i.positionId,
        posName: i.positionName,
        status: i.status,
        startDate: i.startDate,
        endDate: i.endDate,
        mentorId: i.mentorId,
        // Nếu Backend trả về mentorName null, tìm trong danh sách MENTORS đã tải
        mentorName:
          i.mentorName || this.MENTORS.find((m) => m.id === i.mentorId)?.name || 'Chưa phân công',
        managerId: i.managerId,
        managerName:
          i.managerName ||
          this.MANAGERS.find((m) => m.id === i.managerId)?.name ||
          'Chưa phân công',
      }));
      this.applyFilters();
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  /**
   * Tải danh sách user có role INTERN nhưng chưa có InternshipProfile.
   */
  loadAvailableInternUsers(): void {
    this.authService.getUsersAll().subscribe({
      next: (allUsers) => {
        const internUsers = allUsers.filter((u) => {
          const role = u.roleName || u.role?.name || '';
          return role === 'INTERN';
        });
        const existingEmails = new Set(this.interns.map((i) => i.email.toLowerCase()));
        this.availableInternUsers = internUsers.filter(
          (u) => !existingEmails.has(u.email.toLowerCase()),
        );
        this.isLoadingUsers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingUsers = false;
        this.cdr.detectChanges();
        this.showToastMessage('Không thể tải danh sách người dùng.', true);
      },
    });
  }

  openPickUserModal(): void {
    this.selectedUserId = null;
    this.userSearchQuery = '';
    this.availableInternUsers = [];
    this.isLoadingUsers = true;
    this.isPickUserModalOpen = true;
    this.cdr.detectChanges();
    setTimeout(() => this.loadAvailableInternUsers(), 0);
  }

  closePickUserModal(): void {
    this.isPickUserModalOpen = false;
    this.selectedUserId = null;
  }

  /** Sau khi chọn user, mở form điền thông tin thực tập */
  confirmPickUser(): void {
    if (!this.selectedUserId) return;
    const user = this.availableInternUsers.find((u) => u.id === this.selectedUserId);
    if (!user) return;

    // Lưu lại trước khi closePickUserModal() reset selectedUserId về null
    const pickedUserId = this.selectedUserId;

    this.closePickUserModal();

    this.isEditMode = false;
    this.editingId = null;
    this.duplicateError = '';
    this.universitySearch = '';
    this.showUniversityDropdown = false;

    this.internForm.reset({ status: 'In_Progress' });

    if (user.departmentId) {
      this.internForm.patchValue({ departmentId: user.departmentId }, { emitEvent: true });
    }

    this.internForm.patchValue(
      {
        fullName: user.name,
        email: user.email,
        phone: user.phone || '',
      },
      { emitEvent: false },
    );

    this._pickingFromUserId = pickedUserId; // ← dùng biến đã lưu
    this.isFormModalOpen = true;
    this.cdr.detectChanges();
  }

  /** ID user được chọn từ danh sách, dùng để gọi endpoint /from-user/{id} */
  _pickingFromUserId: number | null = null;

  // ── Modal THÊM MỚI (tạo user + profile) ─────────────────────────────
  openAddModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.duplicateError = '';
    this._pickingFromUserId = null;
    this.universitySearch = '';
    this.showUniversityDropdown = false;
    this.internForm.reset({ status: 'In_Progress' });
    this.isFormModalOpen = true;
    this.cdr.detectChanges();
  }

  openEditModal(intern: Intern): void {
    this.isEditMode = true;
    this.editingId = intern.id;
    this.duplicateError = '';
    this._pickingFromUserId = null;

    // Sync university search text
    const univ = this.UNIVERSITIES.find((u) => u.id === intern.universityId);
    this.universitySearch = univ?.name || '';
    this.showUniversityDropdown = false;

    this.internForm.reset({ status: 'In_Progress' });
    this.internForm.patchValue({ departmentId: intern.deptId }, { emitEvent: true });

    this.internForm.patchValue(
      {
        fullName: intern.fullName,
        email: intern.email,
        phone: intern.phone,
        major: intern.major,
        universityId: intern.universityId,
        startDate: intern.startDate,
        endDate: intern.endDate,
        mentorId: intern.mentorId,
        managerId: intern.managerId,
        status: this.resolveStatus(intern.status, intern.endDate),
      },
      { emitEvent: false },
    );

    setTimeout(() => {
      this.internForm.patchValue({ positionId: intern.positionId }, { emitEvent: false });
    }, 0);

    this.isFormModalOpen = true;
    this.cdr.detectChanges();
  }

  private resolveStatus(currentStatus: InternStatus, endDate: string | null): InternStatus {
    if (!endDate) return currentStatus;
    const end = new Date(endDate);
    if (!isNaN(end.getTime()) && end < new Date()) return 'Completed';
    return currentStatus;
  }

  selectUniversity(univ: University): void {
    this.universitySearch = univ.name;
    this.showUniversityDropdown = false;
    this.internForm.patchValue({ universityId: univ.id }, { emitEvent: false });
  }

  clearUniversity(): void {
    this.universitySearch = '';
    this.showUniversityDropdown = false;
    this.internForm.patchValue({ universityId: null }, { emitEvent: false });
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.duplicateError = '';
    this._pickingFromUserId = null;
    this.universitySearch = '';
    this.showUniversityDropdown = false;
  }

  saveIntern(): void {
    this.duplicateError = '';
    if (this.internForm.invalid) {
      this.internForm.markAllAsTouched();
      return;
    }

    const val = this.internForm.getRawValue();

    // ── EDIT MODE ─────────────────────────────────────────────────────
    if (this.isEditMode && this.editingId) {
      const dupEmail = this.interns.find((i) => i.email === val.email && i.id !== this.editingId);
      if (dupEmail) {
        this.duplicateError = `Email "${val.email}" đã tồn tại.`;
        return;
      }
      this.http.put(`${this.API}/${this.editingId}`, val).subscribe(() => {
        this.showToastMessage('Cập nhật hồ sơ thành công!');
        this.loadInterns();
        this.closeFormModal();
      });
      return;
    }

    // ── TẠO TỪ USER CÓ SẴN ───────────────────────────────────────────
    if (this._pickingFromUserId) {
      const userId = this._pickingFromUserId;
      this.http.post(`${this.API}/from-user/${userId}`, val).subscribe({
        next: () => {
          this.showToastMessage('Tạo hồ sơ thực tập thành công!');
          this.loadInterns();
          this.closeFormModal();
        },
        error: (err) => {
          if (err.status === 409) {
            this.duplicateError = err.error?.message || 'Người dùng này đã có hồ sơ thực tập.';
          } else {
            this.showToastMessage('Có lỗi xảy ra, vui lòng thử lại.', true);
          }
        },
      });
      return;
    }

    // ── TẠO MỚI (user + profile) — chặn nếu email đã tồn tại ─────────
    // Kiểm tra email trong danh sách intern hiện có
    const dupEmail = this.interns.find((i) => i.email === val.email);
    if (dupEmail) {
      this.duplicateError = `Email "${val.email}" đã tồn tại. Nếu muốn tạo hồ sơ cho người dùng này, hãy dùng nút "Chọn từ danh sách".`;
      return;
    }

    this.http.post(this.API, val).subscribe({
      next: () => {
        this.showToastMessage('Tạo hồ sơ thực tập sinh thành công!');
        this.loadInterns();
        this.closeFormModal();
      },
      error: (err) => {
        if (err.status === 409) {
          this.duplicateError = `Email "${val.email}" đã tồn tại trong hệ thống. Hãy dùng nút "Chọn từ danh sách" để tạo hồ sơ.`;
        } else {
          this.showToastMessage('Có lỗi xảy ra, vui lòng thử lại.', true);
        }
      },
    });
  }

  // ── Delete / Status ───────────────────────────────────────────────────

  openDeleteModal(intern: Intern): void {
    this.deletingIntern = intern;
    this.isDeleteModalOpen = true;
  }
  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.deletingIntern = null;
  }

  confirmDelete(): void {
    if (!this.deletingIntern) return;
    this.http.delete(`${this.API}/${this.deletingIntern.id}`).subscribe(() => {
      this.showToastMessage('Đã xóa hồ sơ thực tập sinh.');
      this.loadInterns();
      this.closeDeleteModal();
    });
  }

  openStatusModal(intern: Intern): void {
    this.statusIntern = intern;
    this.selectedStatus = intern.status;
    this.isStatusModalOpen = true;
  }
  closeStatusModal(): void {
    this.isStatusModalOpen = false;
    this.statusIntern = null;
  }

  saveStatus(): void {
    if (!this.statusIntern) return;
    this.http
      .patch(`${this.API}/${this.statusIntern.id}/status`, { status: this.selectedStatus })
      .subscribe(() => {
        this.showToastMessage('Cập nhật trạng thái thành công!');
        this.loadInterns();
        this.closeStatusModal();
      });
  }

  // ── Filters ───────────────────────────────────────────────────────────

  buildForm(): void {
    this.internForm = this.fb.group(
      {
        fullName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.pattern(/^[a-zA-ZÀ-ỹà-ỹĂăÂâĐđÊêÔôƠơƯư\s]+$/),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^(0|\+84)\d{9}$/)]],
        major: [''],
        universityId: [null],
        departmentId: [null],
        positionId: [null],
        status: ['In_Progress'],
        startDate: ['', Validators.required],
        endDate: [''],
        mentorId: [null],
        managerId: [null],
      },
      {
        validators: (group: AbstractControl) => {
          const start = group.get('startDate')?.value;
          const end = group.get('endDate')?.value;
          if (start && end && new Date(end) <= new Date(start)) return { dateRange: true };
          return null;
        },
      },
    );

    this.internForm.get('departmentId')?.valueChanges.subscribe(() => {
      this.internForm.patchValue({ positionId: null }, { emitEvent: false });
    });
    this.internForm.get('endDate')?.valueChanges.subscribe((endDate) => {
      if (!endDate) return;
      if (new Date(endDate) < new Date()) {
        this.internForm.patchValue({ status: 'Completed' }, { emitEvent: false });
      }
    });
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.interns.filter((i) => {
      if (q && !i.fullName.toLowerCase().includes(q) && !i.email.toLowerCase().includes(q))
        return false;
      if (this.filterDept && i.deptName !== this.filterDept) return false;
      if (this.filterPos && i.posName !== this.filterPos) return false;
      if (this.filterUniv && i.universityId !== Number(this.filterUniv)) return false;
      if (this.filterStatus && i.status !== this.filterStatus) return false;
      return true;
    });
  }

  onDeptFilterChange(): void {
    this.filterPos = '';
    const dept = this.DEPARTMENTS.find((d) => d.name === this.filterDept);
    this.filterPositionOptions = dept
      ? (this.DEPT_POSITIONS[dept.id] || []).map((p) => p.name)
      : [];
    this.applyFilters();
    this.cdr.detectChanges();
  }

  clearAllFilters(): void {
    this.searchQuery = this.filterDept = this.filterPos = this.filterUniv = this.filterStatus = '';
    this.filterPositionOptions = [];
    this.applyFilters();
  }

  // ── Import Excel ──────────────────────────────────────────────────────

  triggerImport(): void {
    document.getElementById('xlsx-input')?.click();
  }

  handleImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false,
        } as any);
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        const internsToImport = rows
          .filter((row: any[]) => row.some((cell: any) => cell !== ''))
          .map((row: any[], index: number) => this.mapRowToIntern(row, headers, index));
        const errors = internsToImport.map((i) => i.error).filter(Boolean);
        if (errors.length > 0) {
          this.showToastMessage(`Có ${errors.length} dòng lỗi.`, true);
          return;
        }
        this.importInternsSequentially(internsToImport.map((i) => i.data));
      } catch {
        this.showToastMessage('File Excel không hợp lệ!', true);
      }
    };
    reader.readAsArrayBuffer(file);
    input.value = '';
  }

  private mapRowToIntern(
    row: any[],
    headers: string[],
    rowIndex: number,
  ): { data?: any; error?: string } {
    const fullName = (row[0] || '').toString().trim();
    const email = (row[1] || '').toString().trim();
    const phone = (row[2] || '').toString().trim();
    const major = (row[3] || '').toString().trim();
    const university = (row[4] || '').toString().trim();
    const department = (row[5] || '').toString().trim();
    const position = (row[6] || '').toString().trim();
    const startDate = row[7] ?? '';
    const endDate = row[8] ?? '';
    const statusRaw = (row[9] || '').toString().trim();

    if (!fullName || !email || !phone)
      return { error: `Dòng ${rowIndex + 2}: Thiếu họ tên / email / SĐT` };

    const universityObj = this.UNIVERSITIES.find((u) =>
      u.name.toLowerCase().includes(university.toLowerCase()),
    );
    let positionId: number | null = null;
    let departmentId: number | null = null;

    if (position) {
      const pos = this.ALL_POSITIONS.find((p) =>
        p.name.toLowerCase().includes(position.toLowerCase()),
      );
      if (pos) {
        positionId = pos.id;
        departmentId = pos.departmentId;
      }
    }
    if (department && !departmentId) {
      const dept = this.DEPARTMENTS.find((d) =>
        d.name.toLowerCase().includes(department.toLowerCase()),
      );
      if (dept) departmentId = dept.id;
    }

    const formatDate = (val: any): string | null => {
      if (!val) return null;
      if (typeof val === 'number')
        return new Date(Math.floor(val - 25569) * 86400 * 1000).toISOString().split('T')[0];
      return val.toString().trim() || null;
    };

    const end = formatDate(endDate);
    let resolvedStatus = this.mapStatus(statusRaw);
    if (end && new Date(end) < new Date()) resolvedStatus = 'Completed';

    return {
      data: {
        fullName,
        email,
        phone: phone.replace(/\D/g, ''),
        major,
        universityId: universityObj?.id ?? null,
        departmentId,
        positionId,
        startDate: formatDate(startDate),
        endDate: end,
        status: resolvedStatus,
        mentorId: null,
        managerId: null,
      },
    };
  }

  private mapStatus(raw: string): InternStatus {
    const s = (raw || '').toLowerCase().trim();
    if (s.includes('hoàn thành')) return 'Completed';
    if (s.includes('gia hạn')) return 'Extended';
    if (s.includes('nghỉ') || s.includes('chấm dứt')) return 'Terminated';
    return 'In_Progress';
  }

  private async importInternsSequentially(interns: any[]) {
    let ok = 0,
      skip = 0,
      err = 0;
    for (const intern of interns) {
      try {
        const existing = this.interns.find((i) => i.email === intern.email);
        if (existing) {
          skip++;
        } else {
          await this.http.post(this.API, intern).toPromise();
          ok++;
        }
      } catch (e: any) {
        if (e?.status === 409) skip++;
        else err++;
      }
    }
    let msg = `Import hoàn tất: ${ok} thành công`;
    if (skip > 0) msg += `, ${skip} bỏ qua`;
    if (err > 0) msg += `, ${err} lỗi`;
    this.showToastMessage(msg, err > 0);
    if (ok > 0) this.loadInterns();
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  getDeptName(deptId: string): string {
    return this.DEPARTMENTS.find((d) => String(d.id) === deptId)?.name || '—';
  }
  getUnivShort(univId: string): string {
    return this.UNIVERSITIES.find((u) => String(u.id) === univId)?.short || '—';
  }
  getUnivFull(univId: number): string {
    return this.UNIVERSITIES.find((u) => u.id === univId)?.name || '';
  }
  avatarColor(name: string): string {
    const c = [
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#f59e0b',
      '#10b981',
      '#06b6d4',
      '#6366f1',
      '#f97316',
    ];
    return c[name.charCodeAt(0) % c.length];
  }

  isInvalid(controlName: string): boolean {
    const control = this.internForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getError(controlName: string): string {
    const control = this.internForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.hasError('required')) return 'Trường này không được để trống';
    if (control.hasError('email')) return 'Email không hợp lệ';
    if (control.hasError('minlength'))
      return `Tối thiểu ${control.errors['minlength'].requiredLength} ký tự`;
    if (control.hasError('pattern')) {
      if (controlName === 'phone') return 'Số điện thoại không hợp lệ (10 số)';
      if (controlName === 'fullName') return 'Họ tên không được chứa số hoặc ký tự đặc biệt';
      return 'Định dạng không hợp lệ';
    }
    if (
      this.internForm.hasError('dateRange') &&
      (controlName === 'startDate' || controlName === 'endDate')
    ) {
      return 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    return 'Dữ liệu không hợp lệ';
  }

  showToastMessage(msg: string, isError = false): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = msg;
    this.showToastFlag = true;
    this.toastTimer = setTimeout(() => (this.showToastFlag = false), 3000);
  }

  trackById(_: number, item: Intern): number {
    return item.id;
  }

  protected readonly String = String;
}
