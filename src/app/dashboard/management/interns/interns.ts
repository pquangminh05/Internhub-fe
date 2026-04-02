import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ExportService } from '../../../services/export.service';
import { API_ENDPOINTS } from '../../../api-endpoints';

interface InternProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  major: string | null;
  universityName: string | null;
  universityId: number | null;
  positionName: string | null;
  departmentName: string | null;
  departmentId: number | null;
  mentorName: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

interface Department {
  id: number;
  name: string;
}

interface University {
  id: number;
  name: string;
}

@Component({
  selector: 'app-interns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interns.html',
  styleUrl: './interns.css',
})
export class InternsComponent implements OnInit {
  profiles: InternProfile[] = [];
  departments: Department[] = [];
  universities: University[] = [];
  selectedDepartmentId: number | null = null;
  selectedUniversityId: number | null = null;
  isLoading = false;
  isExportingGroup = false;
  exportingId: number | null = null;
  errorMsg = '';

  constructor(
    private http: HttpClient,
    private exportService: ExportService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfiles();
      this.loadDepartments();
      this.loadUniversities();
    }
  }

  get filteredProfiles(): InternProfile[] {
    return this.profiles.filter((p) => {
      if (this.selectedDepartmentId && p.departmentId !== this.selectedDepartmentId) {
        return false;
      }
      if (this.selectedUniversityId && p.universityId !== this.selectedUniversityId) {
        return false;
      }
      return true;
    });
  }

  onFilterChange(): void {
    // Filter is reactive via the getter; no action needed
  }

  private loadProfiles(): void {
    this.isLoading = true;
    this.http
      .get<any[]>(API_ENDPOINTS.Interns.base)
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        }),
      )
      .subscribe({
        next: (data) => {
          this.zone.run(() => {
            if (!data || !Array.isArray(data)) {
              this.profiles = [];
            } else {
              this.profiles = data.map((p) => ({
                id: p.id,
                userId: p.userId,
                name: p.fullName ?? '—',
                email: p.email ?? '—',
                major: p.major ?? null,
                universityName: p.universityName ?? null,
                universityId: p.universityId ?? null,
                positionName: p.positionName ?? null,
                departmentName: p.departmentName ?? null,
                departmentId: p.departmentId ?? null,
                mentorName: p.mentorName ?? null,
                status: p.status ?? '—',
                startDate: p.startDate ?? null,
                endDate: p.endDate ?? null,
              }));
            }
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.zone.run(() => {
            console.error('Lỗi tải danh sách thực tập sinh:', err);
            this.errorMsg = 'Không thể tải danh sách intern.';
            this.cdr.detectChanges();
          });
        },
      });
  }

  private loadDepartments(): void {
    this.http.get<any[]>(API_ENDPOINTS.Departments.base).subscribe({
      next: (data) => {
        this.departments = data.map((d) => ({ id: d.id, name: d.name }));
      },
      error: () => {},
    });
  }

  private loadUniversities(): void {
    this.http.get<any[]>(API_ENDPOINTS.Universities.base).subscribe({
      next: (data) => {
        this.universities = data.map((u) => ({ id: u.id, name: u.name }));
      },
      error: () => {},
    });
  }

  exportIndividual(internId: number, internName: string): void {
    this.exportingId = internId;
    this.exportService.exportInternExcel(internId).subscribe({
      next: (blob) => {
        const safeName = internName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '-');
        const filename = `bao-cao-${safeName}.xlsx`;
        this.exportService.downloadBlob(blob, filename);
        this.exportingId = null;
      },
      error: () => {
        alert('Xuất báo cáo thất bại. Vui lòng thử lại.');
        this.exportingId = null;
      },
    });
  }

  exportGroup(): void {
    this.isExportingGroup = true;
    const deptId = this.selectedDepartmentId ?? undefined;
    const uniId = this.selectedUniversityId ?? undefined;
    this.exportService.exportGroupExcel(deptId, uniId).subscribe({
      next: (blob) => {
        const parts = [];
        if (deptId) parts.push(`phong-ban-${deptId}`);
        if (uniId) parts.push(`truong-${uniId}`);
        const suffix = parts.length > 0 ? parts.join('-') : 'tat-ca';
        this.exportService.downloadBlob(blob, `bao-cao-nhom-${suffix}.xlsx`);
        this.isExportingGroup = false;
      },
      error: () => {
        alert('Xuất báo cáo nhóm thất bại. Vui lòng thử lại.');
        this.isExportingGroup = false;
      },
    });
  }

  getStatusClass(status: string): string {
    const base = 'inline-block px-2 py-0.5 rounded-full text-xs font-medium ';
    switch (status) {
      case 'In_Progress':
        return base + 'bg-blue-100 text-blue-700';
      case 'Completed':
        return base + 'bg-green-100 text-green-700';
      case 'Terminated':
        return base + 'bg-red-100 text-red-700';
      case 'Extended':
        return base + 'bg-yellow-100 text-yellow-700';
      default:
        return base + 'bg-gray-100 text-gray-600';
    }
  }
}
