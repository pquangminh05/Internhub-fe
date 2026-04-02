import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditLogItem {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface PagedResult {
  content: AuditLogItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface LogFilter {
  keyword?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  size: number;
  sortBy: string;
  sortDir: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly API = 'http://localhost:8090/api/admin/audit-logs';

  constructor(private http: HttpClient) {}

  getLogs(f: LogFilter): Observable<PagedResult> {
    let p = new HttpParams()
      .set('page', String(f.page))
      .set('size', String(f.size))
      .set('sortBy', f.sortBy)
      .set('sortDir', f.sortDir);
    if (f.keyword) p = p.set('keyword', f.keyword);
    if (f.action) p = p.set('action', f.action);
    if (f.fromDate) p = p.set('fromDate', f.fromDate);
    if (f.toDate) p = p.set('toDate', f.toDate);
    return this.http.get<PagedResult>(this.API, { params: p });
  }

  getActions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API}/actions`);
  }
}
