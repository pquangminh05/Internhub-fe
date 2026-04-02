import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  afterNextRender,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { RoleService } from '../../../auth/role.service';
import { ExportService } from '../../../services/export.service';
import { API_ENDPOINTS } from '../../../api-endpoints';

// ─── Models ───────────────────────────────────────────────────────────────────

interface SkillScore {
  skillId: number;
  skillName: string;
  parentSkillId: number | null;
  parentSkillName: string | null;
  score: number;
  totalWeight: number;
  taskCount: number;
}

interface BenchmarkScore {
  skillId: number;
  skillName: string;
  benchmarkScore: number;
}

interface RadarAnalyticsResponse {
  internId: number;
  internName: string;
  internEmail: string;
  phone: string | null;
  // Profile info
  universityName: string | null;
  major: string | null;
  positionName: string | null;
  departmentName: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  // Mentor / Manager
  mentorId: number | null;
  mentorName: string | null;
  managerId: number | null;
  managerName: string | null;
  // Scores
  skillScores: SkillScore[];
  benchmarkScores: BenchmarkScore[];
  totalTasksReviewed: number;
  totalTasksAll: number;
  overallScore: number;
}

interface InternItem {
  id: number;
  name: string;
  email: string;
  roleName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class AnalyticsComponent implements OnInit {
  currentRole = '';
  isIntern = false;

  // Intern selector
  interns: InternItem[] = [];
  selectedInternId: number | null = null;
  isLoadingInterns = false;

  // Radar data
  radarData: RadarAnalyticsResponse | null = null;
  isLoadingRadar = false;
  errorMsg = '';

  // Chart rendered flag
  chartRendered = false;

  // Export state
  isExporting = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private roleService: RoleService,
    private exportService: ExportService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    this.init();
  }

  private init(): void {
    this.currentRole = this.roleService.getRole();
    this.isIntern = this.roleService.isIntern();

    if (this.isIntern) {
      this.loadOwnRadar();
    } else {
      this.loadInterns();
    }
  }

  // ── Load danh sách intern (dùng cho non-intern role) ──────────────────────

  private loadInterns(): void {
    this.isLoadingInterns = true;

    const url =
      this.currentRole === 'ADMIN' || this.currentRole === 'HR'
        ? `${API_ENDPOINTS.Admin.users}/all`
        : API_ENDPOINTS.Mentor.interns;

    this.http
      .get<any[]>(url)
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.isLoadingInterns = false;
            this.cdr.detectChanges();
          });
        }),
      )
      .subscribe({
        next: (data) => {
          this.zone.run(() => {
            if (this.currentRole === 'ADMIN' || this.currentRole === 'HR') {
              this.interns = data
                .filter((u) => (u.roleName || '').toUpperCase() === 'INTERN')
                .map((u) => ({ id: u.id, name: u.name, email: u.email, roleName: u.roleName }));
            } else {
              this.interns = data.map((u) => ({ id: u.id, name: u.name, email: u.email }));
            }
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.errorMsg = 'Không thể tải danh sách intern.';
        },
      });
  }

  // ── INTERN xem radar của chính mình ───────────────────────────────────────

  private loadOwnRadar(): void {
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) return;
      // Validate token is parseable before proceeding
      JSON.parse(atob(token.split('.')[1]));
      this.fetchCurrentUserId();
    } catch {
      this.fetchCurrentUserId();
    }
  }

  private fetchCurrentUserId(): void {
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload.sub || payload.email || '';

      this.http.get<any[]>(API_ENDPOINTS.User.interns).subscribe({
        next: (interns) => {
          const me = interns.find((i) => i.email === email);
          if (me) {
            localStorage.setItem('cached_intern_id', me.id.toString());
            this.selectedInternId = me.id;
            this.loadRadar(me.id);
          }
        },
        error: () => {
          this.errorMsg = 'Không thể xác định tài khoản hiện tại.';
        },
      });
    } catch {
      this.errorMsg = 'Lỗi xác thực.';
    }
  }

  // ── Khi MENTOR/MANAGER/ADMIN chọn intern ──────────────────────────────────

  onInternChange(internId: number | string | null): void {
    const id = internId ? Number(internId) : null;
    this.selectedInternId = id;
    this.radarData = null;
    this.errorMsg = '';
    this.chartRendered = false;
    if (!id) return;
    this.loadRadar(id);
  }

  // ── Gọi API Radar ─────────────────────────────────────────────────────────

  loadRadar(internId: number): void {
    // Nếu đã có dữ liệu cache, không hiện spinner để tránh làm phiền người dùng
    if (!this.radarData) {
      this.isLoadingRadar = true;
    }
    this.errorMsg = '';
    this.chartRendered = false;

    this.http
      .get<RadarAnalyticsResponse>(API_ENDPOINTS.Radar.byInternId(internId))
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.isLoadingRadar = false;
            this.cdr.detectChanges();
          });
        }),
      )
      .subscribe({
        next: (data) => {
          this.zone.run(() => {
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('cached_radar_data', JSON.stringify(data));
            }
            this.radarData = data;
            this.cdr.detectChanges();
            setTimeout(() => this.renderRadarChart(), 100);
          });
        },
        error: (err) => {
          this.zone.run(() => {
            if (err.status === 403) {
              this.errorMsg = 'Bạn không có quyền xem dữ liệu này.';
            } else if (err.status === 404) {
              this.errorMsg = 'Không tìm thấy intern với ID đã chọn.';
            } else {
              this.errorMsg = 'Không thể tải dữ liệu radar.';
            }
            this.cdr.detectChanges();
          });
        },
      });
  }

  // ── Vẽ Radar Chart với Chart.js ───────────────────────────────────────────

  private renderRadarChart(): void {
    if (!this.radarData || !this.radarData.skillScores.length) return;
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = document.getElementById('radarChart') as HTMLCanvasElement;
    if (!canvas) return;

    const existing = (window as any).__radarChartInstance;
    if (existing) {
      existing.destroy();
      (window as any).__radarChartInstance = null;
    }

    const skills = this.radarData.skillScores;
    const labels = skills.map((s) => s.skillName);
    const actual = skills.map((s) => +s.score.toFixed(2));
    const benchmark = skills.map((s) => {
      const b = this.radarData!.benchmarkScores.find((b) => b.skillId === s.skillId);
      return b ? b.benchmarkScore : 7.0;
    });

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const labelColor = isDark ? '#c2c0b6' : '#5f5e5a';

    const Chart = (window as any).Chart;
    if (!Chart) {
      setTimeout(() => this.renderRadarChart(), 300);
      return;
    }

    const chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Năng lực thực tế',
            data: actual,
            backgroundColor: 'rgba(59,130,246,0.18)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Benchmark (chuẩn)',
            data: benchmark,
            backgroundColor: 'rgba(249,115,22,0.10)',
            borderColor: '#f97316',
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#fff',
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: {
              stepSize: 2,
              color: labelColor,
              font: { size: 10 },
              backdropColor: 'transparent',
            },
            grid: { color: gridColor },
            angleLines: { color: gridColor },
            pointLabels: {
              color: labelColor,
              font: { size: 12 },
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw}/10`,
            },
          },
        },
      },
    });

    (window as any).__radarChartInstance = chart;
    this.chartRendered = true;
    this.cdr.detectChanges();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getScoreColor(score: number): string {
    if (score >= 8) return '#16a34a';
    if (score >= 5) return '#d97706';
    return '#dc2626';
  }

  getScoreLabel(score: number): string {
    if (score >= 8.5) return 'Xuất sắc';
    if (score >= 7) return 'Tốt';
    if (score >= 5) return 'Đạt';
    return 'Cần cải thiện';
  }

  getVsLabel(score: number, benchmark: number): string {
    const diff = score - benchmark;
    if (diff > 0) return `+${diff.toFixed(1)} vs chuẩn`;
    if (diff < 0) return `${diff.toFixed(1)} vs chuẩn`;
    return '= chuẩn';
  }

  getVsColor(score: number, benchmark: number): string {
    const diff = score - benchmark;
    if (diff >= 0) return '#16a34a';
    if (diff >= -2) return '#d97706';
    return '#dc2626';
  }

  getBenchmarkForSkill(skillId: number): number {
    if (!this.radarData) return 7;
    const b = this.radarData.benchmarkScores.find((b) => b.skillId === skillId);
    return b ? b.benchmarkScore : 7;
  }

  getProgressWidth(score: number): number {
    return Math.min((score / 10) * 100, 100);
  }

  getTaskCompletionPct(): number {
    if (!this.radarData || !this.radarData.totalTasksAll) return 0;
    return Math.round((this.radarData.totalTasksReviewed / this.radarData.totalTasksAll) * 100);
  }

  hasSkillData(): boolean {
    return !!this.radarData && this.radarData.skillScores.length > 0;
  }

  // ── Export ────────────────────────────────────────────────────────────────

  exportInternExcel(): void {
    if (!this.radarData || !this.selectedInternId) return;
    this.isExporting = true;
    this.exportService.exportInternExcel(this.selectedInternId).subscribe({
      next: (blob) => {
        const safeName = this.radarData!.internName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '-');
        this.exportService.downloadBlob(blob, `bao-cao-${safeName}.xlsx`);
        this.isExporting = false;
      },
      error: () => {
        alert('Xuất báo cáo thất bại. Vui lòng thử lại.');
        this.isExporting = false;
      },
    });
  }

  translateStatus(status: string | null): string {
    switch (status) {
      case 'In_Progress':
        return 'Đang thực tập';
      case 'Completed':
        return 'Hoàn thành';
      case 'Terminated':
        return 'Đã chấm dứt';
      case 'Extended':
        return 'Gia hạn';
      default:
        return status ?? '—';
    }
  }

  trackBySkillId(_: number, s: SkillScore): number {
    return s.skillId;
  }

  trackByInternId(_: number, i: InternItem): number {
    return i.id;
  }
}
