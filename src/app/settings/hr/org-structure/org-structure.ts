import { Component, afterNextRender, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

interface MemberInfo {
  id: number;
  name: string;
  email: string;
  roleName?: string;
  positionName?: string;
}

interface InternshipPosition {
  id: number;
  name: string;
  description?: string;
  departmentId?: number;
  departmentName?: string;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  positions?: InternshipPosition[];
  memberNames?: string[];
  members?: MemberInfo[];
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  roleName?: string;
  departmentId?: number;
  departmentName?: string;
}

interface DepartmentPayload {
  name: string;
  description?: string;
  leaderIds?: number[];
}

interface PositionPayload {
  name: string;
  description?: string;
  departmentId?: number | null;
}

@Component({
  selector: 'app-org-structure',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './org-structure.html',
  styleUrls: ['./org-structure.css']
})
export class OrgStructureComponent {
  private apiUrl = 'http://localhost:8090/api';

  activeTab: 'departments' | 'positions' = 'departments';

  departments: Department[] = [];
  allPositions: InternshipPosition[] = [];

  isLoading = true;
  isLoadingPositions = false;
  errorMessage = '';
  expandedDeptId: number | null = null;

  // ── Department modal ──────────────────────────────────────────────────────
  showDeptModal = false;
  isEditDeptMode = false;
  selectedDept: Department | null = null;
  departmentForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    description: new FormControl('')
  });

  showDeleteDeptModal = false;
  deptToDelete: Department | null = null;

  // ── Position modal ────────────────────────────────────────────────────────
  showPositionModal = false;
  isEditPositionMode = false;
  selectedPosition: InternshipPosition | null = null;
  targetDeptForPosition: Department | null = null;
  positionForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    description: new FormControl('', [Validators.maxLength(1000)]),
    departmentId: new FormControl<number | null>(null)
  });

  showDeletePositionModal = false;
  positionToDelete: InternshipPosition | null = null;

  // ── Member management ─────────────────────────────────────────────────────
  showAddMemberModal = false;
  addMemberTargetDept: Department | null = null;
  allUsers: UserItem[] = [];
  isLoadingUsers = false;
  memberSearchQuery = '';
  selectedUserIdToAdd: number | null = null;

  showMoveMemberModal = false;
  moveMemberTarget: { member: MemberInfo; fromDept: Department } | null = null;
  moveTargetDepartmentId: number | null = null;

  // ── Toast ─────────────────────────────────────────────────────────────────
  toasts: { id: number; message: string; type: 'success' | 'error' }[] = [];
  private toastCounter = 0;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    afterNextRender(() => {
      this.loadDepartments();
    });
  }

  // ── Toast helpers ─────────────────────────────────────────────────────────
  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, message, type });
    setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); }, 3000);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  // ── Tab ───────────────────────────────────────────────────────────────────
  switchTab(tab: 'departments' | 'positions'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    if (tab === 'positions') {
      this.loadAllPositions();
    }
  }

  // ── Load data ─────────────────────────────────────────────────────────────
  loadDepartments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.http.get<Department[]>(`${this.apiUrl}/departments`)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (depts) => {
          this.departments = depts;
          this.allPositions = depts.flatMap(d => d.positions ?? []);
        },
        error: (err) => {
          console.error('Load departments error:', err);
          this.errorMessage = 'Không thể tải danh sách phòng ban. Vui lòng thử lại.';
        }
      });
  }

  loadAllPositions(): void {
    this.isLoadingPositions = true;
    this.http.get<InternshipPosition[]>(`${this.apiUrl}/positions`)
      .pipe(finalize(() => {
        this.isLoadingPositions = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (positions) => {
          this.allPositions = positions;
          this.departments = this.departments.map(d => ({
            ...d,
            positions: positions.filter(p => p.departmentId === d.id)
          }));
        },
        error: (err) => {
          console.error('Load positions error:', err);
          this.errorMessage = 'Không thể tải danh sách vị trí.';
        }
      });
  }

  // ── Utility ───────────────────────────────────────────────────────────────
  getMemberCount(dept: Department): number { return dept.members?.length ?? dept.memberNames?.length ?? 0; }
  getMemberNames(dept: Department): string[] { return dept.memberNames ?? []; }
  getMembers(dept: Department): MemberInfo[] { return dept.members ?? []; }
  getPositions(dept: Department): InternshipPosition[] { return dept.positions ?? []; }

  toggleExpand(deptId: number): void {
    this.expandedDeptId = this.expandedDeptId === deptId ? null : deptId;
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  getAvatarColor(name: string): string {
    const palette = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#6366f1'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }

  // ── Core helper: cập nhật 1 dept, tạo array reference mới ────────────────
  private updateDeptInList(deptId: number, updater: (d: Department) => Department): void {
    this.departments = this.departments.map(d => d.id === deptId ? updater(d) : d);
    this.departments = [...this.departments];
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  // ── Core helper: cập nhật NHIỀU dept cùng lúc trong 1 lần map ────────────
  private updateMultipleDeptsInList(updaters: Map<number, (d: Department) => Department>): void {
    this.departments = this.departments.map(d => {
      const updater = updaters.get(d.id);
      return updater ? updater(d) : d;
    });
    // Tạo array reference mới để Angular detect changes
    this.departments = [...this.departments];
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  // ── Department CRUD ───────────────────────────────────────────────────────
  openAddDeptModal(): void {
    this.isEditDeptMode = false;
    this.selectedDept = null;
    this.departmentForm.reset();
    this.showDeptModal = true;
  }

  openEditDeptModal(dept: Department, event: Event): void {
    event.stopPropagation();
    this.isEditDeptMode = true;
    this.selectedDept = dept;
    this.departmentForm.patchValue({ name: dept.name, description: dept.description || '' });
    this.showDeptModal = true;
  }

  closeDeptModal(): void {
    this.showDeptModal = false;
    this.departmentForm.reset();
  }

  saveDepartment(): void {
    if (this.departmentForm.invalid) return;
    const payload: DepartmentPayload = {
      name: this.departmentForm.value.name!,
      description: this.departmentForm.value.description || '',
      leaderIds: []
    };
    if (this.isEditDeptMode && this.selectedDept) {
      this.http.put<Department>(`${this.apiUrl}/departments/${this.selectedDept.id}`, payload).subscribe({
        next: (updated) => {
          this.updateDeptInList(updated.id, d => ({
            ...updated,
            positions: d.positions ?? [],
            members: d.members ?? [],
            memberNames: d.memberNames ?? []
          }));
          this.closeDeptModal();
          this.showToast(`Đã cập nhật phòng ban "${updated.name}" thành công.`);
        },
        error: () => { this.showToast('Cập nhật phòng ban thất bại.', 'error'); }
      });
    } else {
      this.http.post<Department>(`${this.apiUrl}/departments`, payload).subscribe({
        next: (created) => {
          created.positions = [];
          created.members = [];
          this.departments = [...this.departments, created];
          this.closeDeptModal();
          this.showToast(`Đã thêm phòng ban "${created.name}" thành công.`);
          this.cdr.detectChanges();
        },
        error: () => { this.showToast('Thêm phòng ban thất bại.', 'error'); }
      });
    }
  }

  confirmDeleteDept(dept: Department, event: Event): void {
    event.stopPropagation();
    this.deptToDelete = dept;
    this.showDeleteDeptModal = true;
  }

  cancelDeleteDept(): void {
    this.showDeleteDeptModal = false;
    this.deptToDelete = null;
  }

  deleteDepartment(): void {
    if (!this.deptToDelete) return;
    this.http.delete(`${this.apiUrl}/departments/${this.deptToDelete.id}`).subscribe({
      next: () => {
        const deletedId = this.deptToDelete!.id;
        const deletedName = this.deptToDelete!.name;
        this.departments = this.departments.filter(d => d.id !== deletedId);
        this.allPositions = this.allPositions.filter(p => p.departmentId !== deletedId);
        if (this.expandedDeptId === deletedId) this.expandedDeptId = null;
        this.cancelDeleteDept();
        this.showToast(`Đã xóa phòng ban "${deletedName}".`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Xóa phòng ban thất bại. Vui lòng thử lại.', 'error');
        this.cancelDeleteDept();
      }
    });
  }

  // ── Position CRUD ─────────────────────────────────────────────────────────
  openAddPositionFromDept(dept: Department, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isEditPositionMode = false;
    this.selectedPosition = null;
    this.targetDeptForPosition = dept;
    this.positionForm.reset();
    this.positionForm.patchValue({ departmentId: dept.id });
    setTimeout(() => { this.showPositionModal = true; this.cdr.detectChanges(); }, 0);
  }

  openAddPositionFromTab(): void {
    this.isEditPositionMode = false;
    this.selectedPosition = null;
    this.targetDeptForPosition = null;
    this.positionForm.reset();
    this.showPositionModal = true;
  }

  openEditPositionModal(position: InternshipPosition, dept: Department | null, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isEditPositionMode = true;
    this.selectedPosition = position;
    this.targetDeptForPosition = dept;
    this.positionForm.patchValue({
      name: position.name,
      description: position.description || '',
      departmentId: position.departmentId ?? null
    });
    setTimeout(() => { this.showPositionModal = true; this.cdr.detectChanges(); }, 0);
  }

  closePositionModal(): void {
    this.showPositionModal = false;
    this.positionForm.reset();
    this.targetDeptForPosition = null;
  }

  savePosition(): void {
    if (this.positionForm.invalid) return;
    const deptId: number | null =
      this.targetDeptForPosition?.id
      ?? (this.positionForm.value.departmentId as number | null)
      ?? null;
    const payload: PositionPayload = {
      name: this.positionForm.value.name!,
      description: this.positionForm.value.description || '',
      departmentId: deptId
    };
    if (this.isEditPositionMode && this.selectedPosition) {
      this.http.put<InternshipPosition>(`${this.apiUrl}/positions/${this.selectedPosition.id}`, payload).subscribe({
        next: (updated) => {
          this.departments = this.departments.map(d => ({
            ...d,
            positions: d.positions?.map(p => p.id === updated.id ? updated : p) ?? []
          }));
          this.allPositions = this.allPositions.map(p => p.id === updated.id ? updated : p);
          this.closePositionModal();
          this.showToast(`Đã cập nhật vị trí "${updated.name}" thành công.`);
          this.cdr.detectChanges();
        },
        error: () => { this.showToast('Cập nhật vị trí thất bại.', 'error'); }
      });
    } else {
      this.http.post<InternshipPosition>(`${this.apiUrl}/positions`, payload).subscribe({
        next: (created) => {
          if (created.departmentId) {
            this.departments = this.departments.map(d =>
              d.id === created.departmentId
                ? { ...d, positions: [...(d.positions ?? []), created] }
                : d
            );
          }
          this.allPositions = [...this.allPositions, created];
          this.closePositionModal();
          this.showToast(`Đã thêm vị trí "${created.name}" thành công.`);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Add position error:', err);
          this.showToast('Thêm vị trí thất bại.', 'error');
        }
      });
    }
  }

  confirmDeletePosition(position: InternshipPosition, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.positionToDelete = position;
    setTimeout(() => { this.showDeletePositionModal = true; this.cdr.detectChanges(); }, 0);
  }

  cancelDeletePosition(): void {
    this.showDeletePositionModal = false;
    this.positionToDelete = null;
  }

  deletePosition(): void {
    if (!this.positionToDelete) return;
    this.http.delete(`${this.apiUrl}/positions/${this.positionToDelete.id}`).subscribe({
      next: () => {
        const deletedId = this.positionToDelete!.id;
        const deletedName = this.positionToDelete!.name;
        this.departments = this.departments.map(d => ({
          ...d,
          positions: d.positions?.filter(p => p.id !== deletedId) ?? []
        }));
        this.allPositions = this.allPositions.filter(p => p.id !== deletedId);
        this.cancelDeletePosition();
        this.showToast(`Đã xóa vị trí "${deletedName}".`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Xóa vị trí thất bại.', 'error');
        this.cancelDeletePosition();
      }
    });
  }

  // ── Member management ─────────────────────────────────────────────────────
  openAddMemberModal(dept: Department, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.addMemberTargetDept = dept;
    this.selectedUserIdToAdd = null;
    this.memberSearchQuery = '';
    this.loadAllUsers();
    setTimeout(() => { this.showAddMemberModal = true; this.cdr.detectChanges(); }, 0);
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal = false;
    this.addMemberTargetDept = null;
    this.selectedUserIdToAdd = null;
    this.memberSearchQuery = '';
  }

  loadAllUsers(): void {
    this.isLoadingUsers = true;
    this.http.get<UserItem[]>(`${this.apiUrl}/admin/users/all`)
      .pipe(finalize(() => {
        this.isLoadingUsers = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (users) => { this.allUsers = users; },
        error: () => { this.showToast('Không thể tải danh sách người dùng.', 'error'); }
      });
  }

  get filteredUsersToAdd(): UserItem[] {
    if (!this.addMemberTargetDept) return [];
    const existingIds = new Set((this.addMemberTargetDept.members ?? []).map(m => m.id));
    return this.allUsers.filter(u =>
      !existingIds.has(u.id) &&
      (this.memberSearchQuery === '' ||
        u.name.toLowerCase().includes(this.memberSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(this.memberSearchQuery.toLowerCase()))
    );
  }

  confirmAddMember(): void {
    if (!this.addMemberTargetDept || !this.selectedUserIdToAdd) return;
    const deptId = this.addMemberTargetDept.id;
    const userId = this.selectedUserIdToAdd;
    const selectedUser = this.allUsers.find(u => u.id === userId);

    this.http.post<Department>(`${this.apiUrl}/departments/${deptId}/members`, { userId }).subscribe({
      next: (apiResponse) => {
        if (selectedUser) {
          const newMember: MemberInfo = {
            id: selectedUser.id,
            name: selectedUser.name,
            email: selectedUser.email,
            roleName: selectedUser.roleName
          };
          this.updateDeptInList(deptId, d => ({
            ...d,
            members: [...(d.members ?? []), newMember],
            memberNames: [...(d.memberNames ?? []), newMember.name]
          }));
        } else {
          this.updateDeptInList(deptId, d => ({
            ...d,
            members: apiResponse.members ?? d.members ?? [],
            memberNames: apiResponse.memberNames ?? d.memberNames ?? []
          }));
        }
        this.closeAddMemberModal();
        this.showToast('Đã thêm nhân sự vào phòng ban thành công.');
      },
      error: () => { this.showToast('Thêm nhân sự thất bại.', 'error'); }
    });
  }

  confirmRemoveMember(member: MemberInfo, dept: Department, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (!confirm(`Bạn có chắc muốn xóa "${member.name}" khỏi phòng ban này?`)) return;

    this.http.delete<Department>(`${this.apiUrl}/departments/${dept.id}/members/${member.id}`).subscribe({
      next: () => {
        // Không phụ thuộc API response, xóa trực tiếp từ local state
        this.updateDeptInList(dept.id, d => ({
          ...d,
          members: (d.members ?? []).filter(m => m.id !== member.id),
          memberNames: (d.memberNames ?? []).filter(n => n !== member.name)
        }));
        this.showToast(`Đã xóa "${member.name}" khỏi phòng ban.`);
      },
      error: () => { this.showToast('Xóa nhân sự thất bại.', 'error'); }
    });
  }

  openMoveMemberModal(member: MemberInfo, dept: Department, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.moveMemberTarget = { member, fromDept: dept };
    this.moveTargetDepartmentId = null;
    setTimeout(() => { this.showMoveMemberModal = true; this.cdr.detectChanges(); }, 0);
  }

  closeMoveMemberModal(): void {
    this.showMoveMemberModal = false;
    this.moveMemberTarget = null;
    this.moveTargetDepartmentId = null;
  }

  confirmMoveMember(): void {
    if (!this.moveMemberTarget) return;
    const { member, fromDept } = this.moveMemberTarget;
    const targetId = this.moveTargetDepartmentId;
    const targetName = this.departments.find(d => d.id === targetId)?.name ?? 'phòng ban khác';

    this.http.patch<void>(
      `${this.apiUrl}/departments/members/${member.id}/move`,
      { targetDepartmentId: targetId }
    ).subscribe({
      next: () => {
        // FIX CHÍNH: cập nhật fromDept VÀ targetDept trong 1 lần map duy nhất
        // Tránh việc gọi updateDeptInList 2 lần làm lần sau ghi đè lần trước
        const updaters = new Map<number, (d: Department) => Department>();

        // Xóa member khỏi fromDept
        updaters.set(fromDept.id, (d: Department) => ({
          ...d,
          members: (d.members ?? []).filter(m => m.id !== member.id),
          memberNames: (d.memberNames ?? []).filter(n => n !== member.name)
        }));

        // Thêm member vào targetDept (nếu chuyển đến 1 phòng ban cụ thể, không phải "bỏ phân bổ")
        if (targetId !== null) {
          updaters.set(targetId, (d: Department) => ({
            ...d,
            members: [...(d.members ?? []), member],
            memberNames: [...(d.memberNames ?? []), member.name]
          }));
        }

        this.updateMultipleDeptsInList(updaters);
        this.closeMoveMemberModal();
        this.showToast(`Đã chuyển "${member.name}" sang ${targetName}.`);
      },
      error: () => { this.showToast('Chuyển nhân sự thất bại.', 'error'); }
    });
  }

  get otherDepartments(): Department[] {
    if (!this.moveMemberTarget) return this.departments;
    return this.departments.filter(d => d.id !== this.moveMemberTarget!.fromDept.id);
  }
}
