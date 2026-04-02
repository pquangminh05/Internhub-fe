import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from './task.model';
import { BASE_API_URL } from '../api-endpoints';

export interface Intern {
  id: number;
  name: string;
  email: string;
}

export interface DuplicateTaskRequest {
  internIds: number[];
  deadline: string;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = `${BASE_API_URL}/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  getMentorTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${BASE_API_URL}/mentor/tasks`);
  }

  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  getTaskDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getInterns(): Observable<any> {
    return this.http.get<any>(`${BASE_API_URL}/mentor/interns`);
  }

  getSkills(): Observable<any[]> {
    return this.http.get<any[]>(`${BASE_API_URL}/skills`);
  }

  createTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  reviewTask(id: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/review`, payload);
  }

  duplicateTask(id: number, request: DuplicateTaskRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/duplicate`, request);
  }
}
