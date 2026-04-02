import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface SkillWeight {
  skillId: number;
  weight: number;
}

export interface Task {
  id?: number;
  title: string;
  description: string;
  deadline: string;
  weight?: number;
  internIds?: number[];
  skills?: {
    skillId: number;
    weight: number;
  }[];
}

export interface Intern {
  id: number;
  name: string;
  email?: string;
  fullName?: string;
}

export interface TaskDetail {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: string;
  weight: number;
  score?: number | null;
  reviewComment?: string | null;
  submissionLink?: string;
  submission_link?: string;
  submissionNote?: string;
  submission_note?: string;
  assignedInterns: Intern[];
  skills?: {
    skillId: number;
    weight: number;
    ratingScore?: number;
    reviewComment?: string | null;
  }[];
}

// ✅ MỚI: Request body cho Duplicate Task
export interface DuplicateTaskRequest {
  /** Danh sách intern nhận task mới (ít nhất 1) */
  internIds: number[];
  /** Deadline mới — ISO 8601, ví dụ: "2025-08-01T23:59:59.000Z" */
  deadline: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private api = 'http://localhost:8090/api/tasks';
  private userApi = 'http://localhost:8090/api/user';
  private skillApi = 'http://localhost:8090/api/skills';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Có lỗi xảy ra';
    if (error.status === 0) {
      errorMessage = 'Không thể kết nối tới server';
    } else if (error.status === 401) {
      errorMessage = 'Bạn chưa đăng nhập hoặc token đã hết hạn';
    } else {
      errorMessage = `Server trả về lỗi ${error.status}`;
    }
    console.error('HTTP Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  getMentorTasks(): Observable<TaskDetail[]> {
    return this.http
      .get<any[]>(`${this.api}/mentor`)
      .pipe(
        map(tasks => tasks.map(task => this.mapTaskResponse(task))),
        catchError(this.handleError)
      );
  }

  getInternTasks(): Observable<TaskDetail[]> {
    return this.http
      .get<any[]>(`${this.api}/intern`)
      .pipe(
        map(tasks => tasks.map(task => this.mapTaskResponse(task))),
        catchError(this.handleError)
      );
  }

  createTask(task: Task): Observable<string> {
    return this.http
      .post(`${this.api}`, task, { responseType: 'blob' })
      .pipe(
        switchMap(blob => from(blob.text())),
        map(text => text || 'Task created successfully'),
        catchError(this.handleError)
      );
  }

  getTaskDetail(taskId: number): Observable<TaskDetail> {
    return this.http
      .get<any>(`${this.api}/${taskId}`)
      .pipe(
        map(task => this.mapTaskResponse(task)),
        catchError(this.handleError)
      );
  }

  updateTask(taskId: number, task: any): Observable<string> {
    return this.http
      .put(`${this.api}/${taskId}`, task, { responseType: 'text' })
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteTask(taskId: number): Observable<string> {
    return this.http
      .delete(`${this.api}/${taskId}`, { responseType: 'text' })
      .pipe(
        catchError(this.handleError)
      );
  }

  submitTask(taskId: number, data: any): Observable<string> {
    return this.http
      .post(`${this.api}/${taskId}/submit`, data, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  reviewTask(taskId: number, data: any): Observable<string> {
    return this.http
      .post(`${this.api}/${taskId}/review`, data, { responseType: 'text' })
      .pipe(
        catchError(this.handleError)
      );
  }

  getInterns(): Observable<Intern[]> {
    return this.http
      .get<Intern[]>(`${this.userApi}/interns`)
      .pipe(catchError(this.handleError));
  }

  getSkills(): Observable<any[]> {
    return this.http
      .get<any[]>(this.skillApi)
      .pipe(catchError(this.handleError));
  }

  // ✅ MỚI: Duplicate task — sao chép sang intern mới với deadline mới.
  // Skill Tags và Trọng số được giữ nguyên tự động bởi backend.
  duplicateTask(taskId: number, data: DuplicateTaskRequest): Observable<TaskDetail[]> {
    return this.http
      .post<any[]>(`${this.api}/${taskId}/duplicate`, data)
      .pipe(
        map(tasks => tasks.map(task => this.mapTaskResponse(task))),
        catchError(this.handleError)
      );
  }

  public mapTaskResponse(task: any): TaskDetail {
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
}
