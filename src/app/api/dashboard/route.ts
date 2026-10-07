import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = currentUser.companyId;
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekAgo = subDays(now, 7);

    // Fetch all tasks for company
    const allTasks = await prisma.task.findMany({
      where: { companyId },
      include: {
        assignee: {
          select: { id: true, name: true, designation: true, avatar: true },
        },
        flow: { select: { id: true, name: true } },
      },
    });

    // Fetch all employees for company
    const employees = await prisma.user.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: {
        department: true,
        assignedTasks: {
          select: { id: true, title: true, status: true, priority: true, dueDate: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const activeTasks = allTasks.filter((t) => t.status !== 'DONE');
    const overdueTasks = allTasks.filter(
      (t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now
    );
    const dueTodayTasks = allTasks.filter(
      (t) =>
        t.status !== 'DONE' &&
        t.dueDate &&
        new Date(t.dueDate) >= todayStart &&
        new Date(t.dueDate) <= todayEnd
    );
    const completedThisWeek = allTasks.filter(
      (t) => t.status === 'DONE' && t.completedAt && new Date(t.completedAt) >= weekAgo
    );

    // Status counts
    const statusCounts = {
      TODO: allTasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      BLOCKED: allTasks.filter((t) => t.status === 'BLOCKED').length,
      DONE: allTasks.filter((t) => t.status === 'DONE').length,
    };

    // Priority counts
    const priorityCounts = {
      URGENT: allTasks.filter((t) => t.priority === 'URGENT' && t.status !== 'DONE').length,
      HIGH: allTasks.filter((t) => t.priority === 'HIGH' && t.status !== 'DONE').length,
      MEDIUM: allTasks.filter((t) => t.priority === 'MEDIUM' && t.status !== 'DONE').length,
      LOW: allTasks.filter((t) => t.priority === 'LOW' && t.status !== 'DONE').length,
    };

    // "Who is doing what?"
    const workloads = employees.map((emp) => {
      const empActive = emp.assignedTasks.filter((t) => t.status !== 'DONE');
      const empOverdue = emp.assignedTasks.filter(
        (t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now
      );
      const inProgress = emp.assignedTasks.filter((t) => t.status === 'IN_PROGRESS');

      return {
        id: emp.id,
        name: emp.name,
        designation: emp.designation || 'Team Member',
        avatar: emp.avatar,
        department: emp.department?.name || 'General',
        activeTaskCount: empActive.length,
        overdueTaskCount: empOverdue.length,
        inProgressTasks: inProgress.slice(0, 3),
        activeTasks: empActive,
      };
    });

    return NextResponse.json({
      metrics: {
        totalEmployees: employees.length,
        activeTasksCount: activeTasks.length,
        overdueTasksCount: overdueTasks.length,
        dueTodayCount: dueTodayTasks.length,
        completedThisWeekCount: completedThisWeek.length,
        totalTasksCount: allTasks.length,
      },
      statusCounts,
      priorityCounts,
      workloads,
      recentOverdue: overdueTasks.slice(0, 5),
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
