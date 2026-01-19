export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  REVIEW = "REVIEW",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TaskType {
  GENERAL = "GENERAL",
  REPORT = "REPORT",
  TRAINING = "TRAINING",
  MEETING = "MEETING",
  SYSTEM = "SYSTEM",
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  departmentId: number;
  priority?: TaskPriority;
  type?: TaskType;
  startDate?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  type?: TaskType;
  startDate?: string;
  dueDate?: string;
}

export interface AssignTaskInput {
  employeeIds: number[];
}

export interface UpdateAssignmentInput {
  status?: TaskStatus;
  progress?: number;
}

export interface TaskQuery {
  departmentId?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  page?: number;
  limit?: number;
}

export interface MyTaskQuery {
  status?: TaskStatus;
  page?: number;
  limit?: number;
}