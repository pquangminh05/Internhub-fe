import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { MicroTaskResponse, TaskSubmissionRequest } from '../models/micro-task.model';

@Injectable({
  providedIn: 'root',
})
export class InternTaskService {
  private baseUrl = 'http://localhost:8090/api/intern/tasks';

  constructor(private http: HttpClient) {}

  getMyTasks(): Observable<MicroTaskResponse[]> {
    return this.http.get<MicroTaskResponse[]>(this.baseUrl).pipe(
      timeout(10000), // 10 giây timeout
    );
  }

  getMyTaskById(taskId: number): Observable<MicroTaskResponse> {
    return this.http.get<MicroTaskResponse>(`${this.baseUrl}/${taskId}`);
  }

  submitTask(taskId: number, request: TaskSubmissionRequest): Observable<MicroTaskResponse> {
    return this.http.post<MicroTaskResponse>(`${this.baseUrl}/${taskId}/submit`, request);
  }
}
