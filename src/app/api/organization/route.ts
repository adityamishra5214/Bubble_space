import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  designation: z.string().optional().default('Team Member'),
  departmentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  role: z.enum(['FOUNDER', 'ADMIN', 'EMPLOYEE']).default('EMPLOYEE'),
  password: z.string().optional().default('password123'),
});

const updateEmployeeSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  designation: z.string().optional(),
  departmentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  role: z.enum(['FOUNDER', 'ADMIN', 'EMPLOYEE']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search')?.toLowerCase().trim();

    const now = new Date();

    const employees = await prisma.user.findMany({
      where: {
        companyId: currentUser.companyId,
        ...(departmentId ? { departmentId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { designation: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        department: true,
        manager: {
          select: { id: true, name: true, designation: true, email: true },
        },
        directReports: {
          select: { id: true, name: true, designation: true, email: true },
        },
        assignedTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            flow: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const enriched = employees.map((emp) => {
      const activeTasks = emp.assignedTasks.filter((t) => t.status !== 'DONE');
      const completedTasks = emp.assignedTasks.filter((t) => t.status === 'DONE');
      const overdueTasks = emp.assignedTasks.filter(
        (t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now
      );

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        avatar: emp.avatar,
        designation: emp.designation || 'Team Member',
        role: emp.role,
        status: emp.status,
        department: emp.department,
        manager: emp.manager,
        managerId: emp.managerId,
        directReports: emp.directReports,
        stats: {
          activeCount: activeTasks.length,
          overdueCount: overdueTasks.length,
          completedCount: completedTasks.length,
          totalCount: emp.assignedTasks.length,
        },
        activeTasks,
        overdueTasks,
        completedTasks,
      };
    });

    return NextResponse.json({ employees: enriched });
  } catch (error) {
    console.error('Organization GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'FOUNDER' && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: only founders and admins can add team members' }, { status: 403 });
    }

    const body = await request.json();
    const data = createEmployeeSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(data.password || 'password123');

    const newEmployee = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: passwordHash,
        designation: data.designation?.trim() || 'Team Member',
        departmentId: data.departmentId || null,
        managerId: data.managerId || null,
        role: data.role || 'EMPLOYEE',
        companyId: currentUser.companyId,
        status: 'ACTIVE',
      },
      include: {
        department: true,
        manager: { select: { id: true, name: true, designation: true } },
      },
    });

    await logActivity({
      companyId: currentUser.companyId,
      actorId: currentUser.id,
      entityType: 'EMPLOYEE',
      entityId: newEmployee.id,
      action: 'EMPLOYEE_CREATED',
      metadata: {
        name: newEmployee.name,
        designation: newEmployee.designation,
        manager: newEmployee.manager?.name || 'None',
      },
    });

    return NextResponse.json({ employee: newEmployee }, { status: 201 });
  } catch (error: unknown) {
    console.error('Organization POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'FOUNDER' && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = updateEmployeeSchema.parse(body);

    const existing = await prisma.user.findFirst({
      where: { id: data.id, companyId: currentUser.companyId },
      include: { manager: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const managerChanged = data.managerId !== undefined && data.managerId !== existing.managerId;

    const updated = await prisma.user.update({
      where: { id: data.id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.designation ? { designation: data.designation.trim() } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.managerId !== undefined ? { managerId: data.managerId } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
      include: {
        department: true,
        manager: { select: { id: true, name: true, designation: true } },
      },
    });

    if (managerChanged) {
      const newManager = data.managerId
        ? await prisma.user.findUnique({ where: { id: data.managerId } })
        : null;

      await logActivity({
        companyId: currentUser.companyId,
        actorId: currentUser.id,
        entityType: 'EMPLOYEE',
        entityId: updated.id,
        action: 'EMPLOYEE_MANAGER_CHANGED',
        metadata: {
          employee: updated.name,
          oldManager: existing.manager?.name || 'None',
          newManager: newManager?.name || 'None',
        },
      });
    }

    return NextResponse.json({ employee: updated });
  } catch (error: unknown) {
    console.error('Organization PUT error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}
