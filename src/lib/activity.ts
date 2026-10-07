import { prisma } from './db';

export interface LogActivityParams {
  companyId: string;
  actorId?: string | null;
  entityType: 'TASK' | 'EMPLOYEE' | 'FLOW' | 'COMPANY';
  entityId: string;
  taskId?: string | null;
  action:
    | 'TASK_CREATED'
    | 'TASK_ASSIGNED'
    | 'TASK_REASSIGNED'
    | 'TASK_STATUS_CHANGED'
    | 'TASK_PRIORITY_CHANGED'
    | 'TASK_DUE_DATE_CHANGED'
    | 'TASK_COMPLETED'
    | 'TASK_COMMENTED'
    | 'EMPLOYEE_CREATED'
    | 'EMPLOYEE_MANAGER_CHANGED'
    | 'FLOW_CREATED';
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activity.create({
      data: {
        companyId: params.companyId,
        actorId: params.actorId || null,
        entityType: params.entityType,
        entityId: params.entityId,
        taskId: params.taskId || null,
        action: params.action,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
