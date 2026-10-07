import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: { id, companyId: currentUser.companyId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            designation: true,
            department: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            designation: true,
          },
        },
        flow: true,
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, designation: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        activities: {
          include: {
            actor: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        blocks: {
          include: {
            targetTask: {
              include: {
                assignee: { select: { id: true, name: true } },
              },
            },
          },
        },
        blockedBy: {
          include: {
            sourceTask: {
              include: {
                assignee: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const now = new Date();
    const isOverdue =
      task.status !== 'DONE' && task.dueDate ? new Date(task.dueDate) < now : false;

    return NextResponse.json({
      task: {
        ...task,
        isOverdue,
      },
    });
  } catch (error) {
    console.error('Task detail GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch task details' }, { status: 500 });
  }
}
