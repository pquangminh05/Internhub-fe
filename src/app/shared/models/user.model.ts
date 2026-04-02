export interface UserCreationRequest {
  name: string;
  email: string;
  roleId: number;
  departmentId: number;
  phone: string;
}

export interface UserProfileResponse {
  id?: number; // Added based on expected data
  name: string;
  email: string;
  avatar?: string; // Changed from avatarUrl to avatar to match backend
  departmentName?: string;
  positionName?: string; // Moved from internshipProfile
  universityName?: string; // Moved from internshipProfile
  mentorName?: string; // Moved from internshipProfile
  startDate?: string; // Moved from internshipProfile
  endDate?: string; // Moved from internshipProfile
  status?: 'IN_PROGRESS' | 'TERMINATED' | 'COMPLETED' | string; // Moved from internshipProfile
  daysRemaining?: number; // Added based on backend response
  major?: string; // Added based on backend response
  phone?: string; // Added based on backend response
  isActive?: boolean;
}

export interface ErrorDetails {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

