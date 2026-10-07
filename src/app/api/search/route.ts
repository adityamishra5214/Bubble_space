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
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 1) {
      return NextResponse.json({ employees: [], tasks: [], flows: [] });
    }

    const companyId = currentUser.companyId;

    const [employees, tasks, flows] = await Promise.all([
      prisma.user.findMany({
        where: {
          companyId,
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { designation: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
          role: true,
          avatar: true,
          department: { select: { name: true } },
        },
        take: 8,
      }),
      prisma.task.findMany({
        where: {
          companyId,
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { assignee: { name: { contains: q } } },
          ],
        },
        include: {
          assignee: { select: { id: true, name: true } },
          flow: { select: { id: true, name: true } },
        },
        take: 8,
      }),
      prisma.flow.findMany({
        where: {
          companyId,
          OR: [{ name: { contains: q } }, { description: { contains: q } }],
        },
        include: {
          _count: { select: { tasks: true } },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({ employees, tasks, flows });
  } catch (error) {
    console.error('Search GET error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
