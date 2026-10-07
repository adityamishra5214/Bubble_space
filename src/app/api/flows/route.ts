import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createFlowSchema = z.object({
  name: z.string().min(2, 'Flow name is required'),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const flows = await prisma.flow.findMany({
      where: { companyId: currentUser.companyId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ flows });
  } catch (error) {
    console.error('Flows GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch flows' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createFlowSchema.parse(body);

    const flow = await prisma.flow.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        companyId: currentUser.companyId,
      },
    });

    await logActivity({
      companyId: currentUser.companyId,
      actorId: currentUser.id,
      entityType: 'FLOW',
      entityId: flow.id,
      action: 'FLOW_CREATED',
      metadata: { name: flow.name },
    });

    return NextResponse.json({ flow }, { status: 201 });
  } catch (error: unknown) {
    console.error('Flows POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create flow' }, { status: 500 });
  }
}
