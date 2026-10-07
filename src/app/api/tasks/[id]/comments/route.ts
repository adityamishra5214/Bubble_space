import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const commentSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = commentSchema.parse(body);

    const task = await prisma.task.findFirst({
      where: { id, companyId: currentUser.companyId },
      include: { assignee: true, creator: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId: id,
        userId: currentUser.id,
        message: data.message.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, designation: true },
        },
      },
    });

    await logActivity({
      companyId: currentUser.companyId,
      actorId: currentUser.id,
      entityType: 'TASK',
      entityId: task.id,
      taskId: task.id,
      action: 'TASK_COMMENTED',
      metadata: {
        title: task.title,
        commentPreview: data.message.slice(0, 60),
      },
    });

    // Notify task owner if someone else commented
    if (task.assignedToId !== currentUser.id) {
      await createNotification({
        companyId: currentUser.companyId,
        userId: task.assignedToId,
        title: 'New Comment on Task',
        message: `${currentUser.name} commented on "${task.title}"`,
        type: 'TASK_UPDATED',
        link: `/tasks?id=${task.id}`,
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: unknown) {
    console.error('Comment POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
