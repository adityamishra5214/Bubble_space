import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
});

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const departments = await prisma.department.findMany({
      where: { companyId: currentUser.companyId },
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Departments GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createDepartmentSchema.parse(body);

    const department = await prisma.department.create({
      data: {
        name: data.name.trim(),
        companyId: currentUser.companyId,
      },
    });

    return NextResponse.json({ department }, { status: 201 });
  } catch (error: unknown) {
    console.error('Departments POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
