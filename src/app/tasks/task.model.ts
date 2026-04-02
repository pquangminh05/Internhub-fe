export enum TaskStatus {
  PENDING = 'Pending',
  SUBMITTED = 'Submitted',
  REVIEWED = 'Reviewed',
}

export interface Task {
  id?: number;
  title: string;
  description: string;
  deadline: Date | string;
  status: TaskStatus;
  assignedInterns: AssignedIntern[];
  score?: number | null;
  reviewComment?: string | null;
  weight?: number;
  skillId?: number;
  internIds?: number[];
  skills?: { skillId: number; weight: number }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignedIntern {
  id: number;
  name: string;
  avatar?: string;
}
