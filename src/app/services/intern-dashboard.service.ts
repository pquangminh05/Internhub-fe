import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../api-endpoints';

// Interface for the response data from the API
interface SkillResponse {
  id: number;
  name: string;
}

interface MicroTask {
  id: number;
  title: string;
  description: string;
  status: 'Todo' | 'In_Progress' | 'Completed';
  deadline: string;
}

interface InternshipMilestone {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
}

export interface InternDashboardResponse {
  positionName: string;
  mentorName: string;
  daysRemaining: number;
  targetSkills: SkillResponse[];
  tasks: MicroTask[];
  roadmap: InternshipMilestone[];
}

@Injectable({
  providedIn: 'root'
})
export class InternDashboardService {
  private apiUrl = API_ENDPOINTS.Intern.dashboard; // Defined in api-endpoints.ts

  constructor(private http: HttpClient) { }

  getInternDashboard(): Observable<InternDashboardResponse> {
    return this.http.get<InternDashboardResponse>(this.apiUrl);
  }
}
