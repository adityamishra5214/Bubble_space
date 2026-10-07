import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createTaskSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional().nullable(),
  assignedToId: z.string().min(1, 'Assignee is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']).default('TODO'),
  dueDate: z.string().optional().nullable(),
  flowId: z.string().optional().nullable(),
  positionX: z.number().optional().nullable(),
  positionY: z.number().optional().nullable(),
});

const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  assignedToId: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().nullable(),
  flowId: z.string().optional().nullable(),
  positionX: z.number().optional().nullable(),
  positionY: z.number().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignedToId = searchParams.get('assignedToId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const flowId = searchParams.get('flowId');
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search')?.toLowerCase().trim();
    const overdueOnly = searchParams.get('overdueOnly') === 'true';
    const teamOnly = searchParams.get('teamOnly') === 'true';

    const now = new Date();

    // Determine assignee filter
    let assigneeFilter: unknown = undefined;
    if (assignedToId === 'me') {
      assigneeFilter = currentUser.id;
    } else if (assignedToId) {
      assigneeFilter = assignedToId;
    } else if (teamOnly) {
      // Find all direct reports
      const reports = await prisma.user.findMany({
        where: { managerId: currentUser.id, companyId: currentUser.companyId },
        select: { id: true },
      });
      const reportIds = reports.map((r) => r.id);
      reportIds.push(currentUser.id);
      assigneeFilter = { in: reportIds };
    }

    const tasks = await prisma.task.findMany({
      where: {
        companyId: currentUser.companyId,
        ...(assigneeFilter ? { assignedToId: assigneeFilter as string } : {}),
        ...(status
          ? status === 'NOT_DONE'
            ? { status: { not: 'DONE' } }
            : { status }
          : {}),
        ...(priority ? { priority } : {}),
        ...(flowId ? { flowId } : {}),
        ...(departmentId ? { assignee: { departmentId } } : {}),
        ...(overdueOnly
          ? {
              status: { not: 'DONE' },
              dueDate: { lt: now },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { description: { contains: search } },
                { assignee: { name: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            designation: true,
            department: { select: { id: true, name: true } },
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
        flow: {
          select: { id: true, name: true },
        },
        blocks: {
          include: {
            targetTask: {
              select: { id: true, title: true, status: true, priority: true },
            },
          },
        },
        blockedBy: {
          include: {
            sourceTask: {
              select: { id: true, title: true, status: true, priority: true },
            },
          },
        },
        _count: {
          select: { comments: true, activities: true },
        },
      },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    const enrichedTasks = tasks.map((task) => {
      const isOverdue =
        task.status !== 'DONE' && task.dueDate ? new Date(task.dueDate) < now : false;

      return {
        ...task,
        isOverdue,
      };
    });

    return NextResponse.json({ tasks: enrichedTasks });
  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    const assignee = await prisma.user.findFirst({
      where: { id: data.assignedToId, companyId: currentUser.companyId },
    });

    if (!assignee) {
      return NextResponse.json({ error: 'Assignee not found in this company' }, { status: 400 });
    }

    const dueDate = data.dueDate ? new Date(data.dueDate) : null;

    const task = await prisma.task.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        assignedToId: data.assignedToId,
        createdById: currentUser.id,
        companyId: currentUser.companyId,
        priority: data.priority,
        status: data.status,
        dueDate,
        flowId: data.flowId || null,
        positionX: data.positionX ?? (Math.random() * 400 + 100),
        positionY: data.positionY ?? (Math.random() * 300 + 100),
        completedAt: data.status === 'DONE' ? new Date() : null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, designation: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true, email: true, designation: true },
        },
        flow: true,
      },
    });

    // Log Activity
    await logActivity({
      companyId: currentUser.companyId,
      actorId: currentUser.id,
      entityType: 'TASK',
      entityId: task.id,
      taskId: task.id,
      action: 'TASK_CREATED',
      metadata: {
        title: task.title,
        assignedTo: assignee.name,
        priority: task.priority,
      },
    });

    // Notify assignee if not the creator
    if (assignee.id !== currentUser.id) {
      await createNotification({
        companyId: currentUser.companyId,
        userId: assignee.id,
        title: 'New Task Assigned',
        message: `${currentUser.name} assigned you: "${task.title}"`,
        type: 'TASK_ASSIGNED',
        link: `/tasks?id=${task.id}`,
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: unknown) {
    console.error('Tasks POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateTaskSchema.parse(body);

    const existing = await prisma.task.findFirst({
      where: { id: data.id, companyId: currentUser.companyId },
      include: { assignee: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const statusChanged = data.status !== undefined && data.status !== existing.status;
    const assigneeChanged = data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId;
    const priorityChanged = data.priority !== undefined && data.priority !== existing.priority;
    const dueDateChanged = data.dueDate !== undefined;

    let completedAt = existing.completedAt;
    if (data.status === 'DONE' && existing.status !== 'DONE') {
      completedAt = new Date();
    } else if (data.status && data.status !== 'DONE') {
      completedAt = null;
    }

    const updated = await prisma.task.update({
      where: { id: data.id },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.assignedToId ? { assignedToId: data.assignedToId } : {}),
        ...(data.status ? { status: data.status, completedAt } : {}),
        ...(data.priority ? { priority: data.priority } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
        ...(data.flowId !== undefined ? { flowId: data.flowId || null } : {}),
        ...(data.positionX !== undefined ? { positionX: data.positionX } : {}),
        ...(data.positionY !== undefined ? { positionY: data.positionY } : {}),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, designation: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true, email: true, designation: true },
        },
        flow: true,
        blocks: true,
        blockedBy: true,
      },
    });

    // Log Activity for each change
    if (statusChanged && data.status) {
      const action = data.status === 'DONE' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED';
      await logActivity({
        companyId: currentUser.companyId,
        actorId: currentUser.id,
        entityType: 'TASK',
        entityId: updated.id,
        taskId: updated.id,
        action: action,
        metadata: {
          title: updated.title,
          from: existing.status,
          to: data.status,
        },
      });

      if (updated.assignedToId !== currentUser.id) {
        await createNotification({
          companyId: currentUser.companyId,
          userId: updated.assignedToId,
          title: 'Task Status Updated',
          message: `${currentUser.name} moved "${updated.title}" to ${data.status}`,
          type: 'TASK_UPDATED',
          link: `/tasks?id=${updated.id}`,
        });
      }
    }

    if (assigneeChanged && data.assignedToId) {
      const newAssignee = await prisma.user.findUnique({ where: { id: data.assignedToId } });
      await logActivity({
        companyId: currentUser.companyId,
        actorId: currentUser.id,
        entityType: 'TASK',
        entityId: updated.id,
        taskId: updated.id,
        action: 'TASK_REASSIGNED',
        metadata: {
          title: updated.title,
          from: existing.assignee.name,
          to: newAssignee?.name || 'Unknown',
        },
      });

      if (newAssignee && newAssignee.id !== currentUser.id) {
        await createNotification({
          companyId: currentUser.companyId,
          userId: newAssignee.id,
          title: 'Task Reassigned to You',
          message: `${currentUser.name} assigned you: "${updated.title}"`,
          type: 'TASK_ASSIGNED',
          link: `/tasks?id=${updated.id}`,
        });
      }
    }

    if (priorityChanged && data.priority) {
      await logActivity({
        companyId: currentUser.companyId,
        actorId: currentUser.id,
        entityType: 'TASK',
        entityId: updated.id,
        taskId: updated.id,
        action: 'TASK_PRIORITY_CHANGED',
        metadata: {
          title: updated.title,
          from: existing.priority,
          to: data.priority,
        },
      });
    }

    if (dueDateChanged) {
      await logActivity({
        companyId: currentUser.companyId,
        actorId: currentUser.id,
        entityType: 'TASK',
        entityId: updated.id,
        taskId: updated.id,
        action: 'TASK_DUE_DATE_CHANGED',
        metadata: {
          title: updated.title,
          dueDate: data.dueDate,
        },
      });
    }

    return NextResponse.json({ task: updated });
  } catch (error: unknown) {
    console.error('Tasks PUT error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id, companyId: currentUser.companyId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tasks DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
