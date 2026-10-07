export type UserRole = 'FOUNDER' | 'ADMIN' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Company {
  id: string;
  name: string;
  logo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  companyId: string;
  _count?: { users: number };
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  designation?: string | null;
  role: UserRole;
  status: UserStatus;
  departmentId?: string | null;
  department?: Department | null;
  managerId?: string | null;
  manager?: { id: string; name: string; designation?: string | null; email?: string } | null;
  directReports?: Array<{ id: string; name: string; designation?: string | null; email?: string }>;
  company?: Company;
}

export interface EmployeeWithStats extends UserSummary {
  stats: {
    activeCount: number;
    overdueCount: number;
    completedCount: number;
    totalCount: number;
  };
  activeTasks: Task[];
  overdueTasks: Task[];
  completedTasks: Task[];
}

export interface Flow {
  id: string;
  name: string;
  description?: string | null;
  companyId: string;
  _count?: { tasks: number };
}

export interface TaskConnection {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  relationshipType: string;
  sourceTask?: Task;
  targetTask?: Task;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
    designation?: string | null;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  createdById: string;
  creator?: UserSummary;
  assignedToId: string;
  assignee?: UserSummary;
  companyId: string;
  flowId?: string | null;
  flow?: Flow | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  completedAt?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  isOverdue?: boolean;
  comments?: Comment[];
  activities?: Activity[];
  blocks?: Array<{ id: string; targetTaskId: string; targetTask: Task }>;
  blockedBy?: Array<{ id: string; sourceTaskId: string; sourceTask: Task }>;
  _count?: { comments: number; activities: number };
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  companyId: string;
  actorId?: string | null;
  actor?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string | null;
    designation?: string | null;
  } | null;
  entityType: 'TASK' | 'EMPLOYEE' | 'FLOW' | 'COMPANY';
  entityId: string;
  taskId?: string | null;
  task?: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  } | null;
  action: string;
  metadata?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  companyId: string;
  userId: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_OVERDUE' | 'MENTION';
  link?: string | null;
  read: boolean;
  createdAt: string;
}
