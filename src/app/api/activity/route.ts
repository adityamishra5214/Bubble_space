import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const actionFilter = searchParams.get('action');

    const activities = await prisma.activity.findMany({
      where: {
        companyId: currentUser.companyId,
        ...(actionFilter ? { action: actionFilter } : {}),
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            designation: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Activity GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity stream' }, { status: 500 });
  }
}
