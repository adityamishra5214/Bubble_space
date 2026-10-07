'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '@/types';
import { StatusBadge, PriorityBadge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { formatDueDate } from '@/lib/utils';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { isToday, isPast, isFuture, parseISO } from 'date-fns';

interface MyTasksViewProps {
  onSelectTask: (taskId: string) => void;
  onOpenNewTask: () => void;
  dataVersion: number;
}

export function MyTasksView({ onSelectTask, onOpenNewTask, dataVersion }: MyTasksViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyTasks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tasks?assignedToId=me');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load my tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [dataVersion]);

  const handleStatusToggle = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: TaskStatus = task.status === 'DONE' ? 'IN_PROGRESS' : 'DONE';
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
      fetchMyTasks();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const now = new Date();

  // Categorize
  const overdueTasks: Task[] = [];
  const todayTasks: Task[] = [];
  const upcomingTasks: Task[] = [];
  const completedTasks: Task[] = [];

  tasks.forEach((t) => {
    if (t.status === 'DONE') {
      completedTasks.push(t);
      return;
    }

    if (!t.dueDate) {
      upcomingTasks.push(t);
      return;
    }

    const d = new Date(t.dueDate);
    if (isToday(d)) {
      todayTasks.push(t);
    } else if (isPast(d)) {
      overdueTasks.push(t);
    } else {
      upcomingTasks.push(t);
    }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-[#FFFFFF] border-2 border-[#1C1A17] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9B9489]">
            My Responsibilities
          </div>
          <h2 className="text-xl font-black text-[#1C1A17] tracking-tight mt-0.5">
            Personal Task Stream
          </h2>
          <p className="text-xs text-[#736D64] mt-0.5 font-medium">
            Single-owner tasks directly assigned to your account.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewTask}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New Task
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#736D64] text-sm font-mono">
          <div className="w-6 h-6 border-2 border-[#1C1A17] border-t-transparent rounded-full animate-spin mb-3" />
          Loading your notebook stream...
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-16 text-center bg-[#FFFFFF] border-2 border-[#1C1A17] rounded-2xl shadow-xs">
          <Sparkles className="w-10 h-10 text-[#EAB308] mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-[#1C1A17]">All Clear!</h3>
          <p className="text-xs text-[#736D64] mt-1 mb-4 font-medium">
            You currently have no active tasks assigned to you.
          </p>
          <Button variant="primary" size="sm" onClick={onOpenNewTask}>
            + Create a Task
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. OVERDUE SECTION */}
          {overdueTasks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#DC2626] uppercase tracking-wider px-1">
                <AlertCircle className="w-4 h-4 text-[#DC2626] animate-pulse" />
                OVERDUE ({overdueTasks.length})
              </div>
              <div className="space-y-2">
                {overdueTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    isOverdueSection
                    onSelect={() => onSelectTask(t.id)}
                    onToggleDone={(e) => handleStatusToggle(t, e)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. TODAY SECTION */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider px-1">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              DUE TODAY ({todayTasks.length})
            </div>
            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onSelect={() => onSelectTask(t.id)}
                    onToggleDone={(e) => handleStatusToggle(t, e)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 bg-[#FFFFFF] border border-[#DCD7CE] rounded-xl text-xs text-[#9B9489] italic">
                No tasks due today.
              </div>
            )}
          </div>

          {/* 3. UPCOMING SECTION */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#736D64] uppercase tracking-wider px-1">
              <Calendar className="w-4 h-4 text-[#736D64]" />
              UPCOMING ({upcomingTasks.length})
            </div>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-2">
                {upcomingTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onSelect={() => onSelectTask(t.id)}
                    onToggleDone={(e) => handleStatusToggle(t, e)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 bg-[#FFFFFF] border border-[#DCD7CE] rounded-xl text-xs text-[#9B9489] italic">
                No upcoming tasks scheduled.
              </div>
            )}
          </div>

          {/* 4. COMPLETED SECTION */}
          {completedTasks.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#059669] uppercase tracking-wider px-1">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                COMPLETED ({completedTasks.length})
              </div>
              <div className="space-y-2">
                {completedTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    isCompletedSection
                    onSelect={() => onSelectTask(t.id)}
                    onToggleDone={(e) => handleStatusToggle(t, e)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  isOverdueSection,
  isCompletedSection,
  onSelect,
  onToggleDone,
}: {
  task: Task;
  isOverdueSection?: boolean;
  isCompletedSection?: boolean;
  onSelect: () => void;
  onToggleDone: (e: React.MouseEvent) => void;
}) {
  const dueInfo = formatDueDate(task.dueDate);

  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer group shadow-xs ${
        isOverdueSection
          ? 'bg-[#FEF2F2] border-[#EF4444] hover:shadow-md'
          : isCompletedSection
          ? 'bg-[#FAF8F5] border-[#DCD7CE] opacity-80 hover:opacity-100'
          : 'bg-[#FFFFFF] border-[#1C1A17] hover:border-[#2563EB] hover:shadow-md'
      }`}
    >
      {/* Left: Done Toggle & Title */}
      <div className="flex items-center gap-3.5 min-w-0 pr-4">
        <button
          onClick={onToggleDone}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            task.status === 'DONE'
              ? 'bg-[#10B981] border-[#10B981] text-white'
              : 'border-[#1C1A17] bg-white hover:bg-[#FAF8F5]'
          }`}
        >
          {task.status === 'DONE' && <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3]" />}
        </button>

        <div className="min-w-0">
          <div
            className={`text-xs font-extrabold group-hover:text-[#2563EB] transition-colors truncate ${
              task.status === 'DONE' ? 'line-through text-[#9B9489]' : 'text-[#1C1A17]'
            }`}
          >
            {task.title}
          </div>
          {task.flow && (
            <div className="text-[10px] text-[#736D64] font-mono mt-0.5">
              Flow: {task.flow.name}
            </div>
          )}
        </div>
      </div>

      {/* Right: Priority, Status, Due Date */}
      <div className="flex items-center gap-3 shrink-0">
        <PriorityBadge priority={task.priority} size="sm" />
        <StatusBadge status={task.status} size="sm" />

        <span
          className={`text-xs font-mono min-w-[100px] text-right ${
            isOverdueSection
              ? 'text-[#DC2626] font-bold'
              : dueInfo.isToday
              ? 'text-[#B45309] font-bold'
              : 'text-[#736D64]'
          }`}
        >
          {dueInfo.text}
        </span>

        <ArrowRight className="w-3.5 h-3.5 text-[#9B9489] group-hover:text-[#1C1A17] transition-colors" />
      </div>
    </div>
  );
}
