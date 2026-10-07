import { prisma } from './db';

export interface CreateNotificationParams {
  companyId: string;
  userId: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_OVERDUE' | 'MENTION';
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
