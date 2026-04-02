export type MicroTaskStatus = 'Todo' | 'In_Progress' | 'Submitted' | 'Reviewed' | 'Rejected';

export interface MicroTaskResponse {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: MicroTaskStatus;
  submissionLink?: string;
  submissionNote?: string;
  mentorId?: number;
  mentorName?: string;
  internId?: number;
  internName?: string;
  createdAt: string;
}

export interface TaskSubmissionRequest {
  submissionLink: string;
  submissionNote?: string;
}

export interface TaskReviewRequest {
  status: 'Reviewed' | 'Rejected';
  reviewNote?: string;
}
