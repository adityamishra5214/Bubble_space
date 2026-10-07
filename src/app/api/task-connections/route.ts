import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createConnectionSchema = z.object({
  sourceTaskId: z.string().min(1),
  targetTaskId: z.string().min(1),
  relationshipType: z.string().default('BLOCKS'),
});

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createConnectionSchema.parse(body);

    if (data.sourceTaskId === data.targetTaskId) {
      return NextResponse.json({ error: 'A task cannot depend on itself' }, { status: 400 });
    }

    // Verify both tasks belong to current user's company
    const [source, target] = await Promise.all([
      prisma.task.findFirst({ where: { id: data.sourceTaskId, companyId: currentUser.companyId } }),
      prisma.task.findFirst({ where: { id: data.targetTaskId, companyId: currentUser.companyId } }),
    ]);

    if (!source || !target) {
      return NextResponse.json({ error: 'One or both tasks not found' }, { status: 404 });
    }

    // Check existing
    const existing = await prisma.taskConnection.findUnique({
      where: {
        sourceTaskId_targetTaskId: {
          sourceTaskId: data.sourceTaskId,
          targetTaskId: data.targetTaskId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ connection: existing });
    }

    const connection = await prisma.taskConnection.create({
      data: {
        sourceTaskId: data.sourceTaskId,
        targetTaskId: data.targetTaskId,
        relationshipType: data.relationshipType || 'BLOCKS',
      },
    });

    await logActivity({
      companyId: currentUser.companyId,
      actorId: currentUser.id,
      entityType: 'TASK',
      entityId: target.id,
      taskId: target.id,
      action: 'TASK_STATUS_CHANGED',
      metadata: {
        dependency: `"${source.title}" now blocks "${target.title}"`,
      },
    });

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error: unknown) {
    console.error('Task connection POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create task connection' }, { status: 500 });
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
    const sourceTaskId = searchParams.get('sourceTaskId');
    const targetTaskId = searchParams.get('targetTaskId');

    if (id) {
      await prisma.taskConnection.delete({ where: { id } });
    } else if (sourceTaskId && targetTaskId) {
      await prisma.taskConnection.delete({
        where: {
          sourceTaskId_targetTaskId: {
            sourceTaskId,
            targetTaskId,
          },
        },
      });
    } else {
      return NextResponse.json({ error: 'Missing connection identifiers' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task connection DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete task connection' }, { status: 500 });
  }
}
