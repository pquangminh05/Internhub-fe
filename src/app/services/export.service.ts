import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  constructor(private http: HttpClient) {}

  /**
   * Xuất báo cáo Excel cho 1 intern theo ID.
   * GET /api/export/intern/{id}/excel
   */
  exportInternExcel(internId: number): Observable<Blob> {
    return this.http.get(API_ENDPOINTS.Export.internExcel(internId), {
      responseType: 'blob',
    });
  }

  /**
   * Xuất báo cáo Excel theo nhóm (lọc theo phòng ban hoặc trường ĐH).
   * GET /api/export/group/excel?departmentId=&universityId=
   */
  exportGroupExcel(departmentId?: number, universityId?: number): Observable<Blob> {
    return this.http.get(API_ENDPOINTS.Export.groupExcel(departmentId, universityId), {
      responseType: 'blob',
    });
  }

  /**
   * Tải blob file về máy người dùng.
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}