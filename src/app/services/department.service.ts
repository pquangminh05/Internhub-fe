import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define the Department interface, consistent with org-structure.ts
export interface Department {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  positions?: any[]; // Using 'any' for simplicity, can be more specific if needed
  memberNames?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = 'http://localhost:8090/api';

  constructor(private http: HttpClient) { }

  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/departments`);
  }
}
