'use client';

import React from 'react';
import { Drawer } from '@/ui/Drawer';
import { Avatar } from '@/ui/Avatar';
import { StatusBadge, PriorityBadge, DepartmentBadge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { EmployeeWithStats, Task } from '@/types';
import { formatDueDate } from '@/lib/utils';
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  Flag,
  ArrowUpRight,
  Maximize2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface EmployeeDrawerProps {
  employee: EmployeeWithStats | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignTask: (employeeId: string) => void;
  onSelectTask: (taskId: string) => void;
  onSelectEmployee?: (employeeId: string) => void;
  onTaskStatusChange?: (taskId: string, newStatus: string) => void;
}

export function EmployeeDrawer({
  employee,
  isOpen,
  onClose,
  onAssignTask,
  onSelectTask,
  onSelectEmployee,
  onTaskStatusChange,
}: EmployeeDrawerProps) {
  if (!isOpen || !employee) return null;

  const isFounder = employee.role === 'FOUNDER';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="xl"
      title={
        <div className="flex items-center gap-3">
          <Avatar
            name={employee.name}
            avatar={employee.avatar}
            size="lg"
            isFounder={isFounder}
            hasOverdue={employee.stats.overdueCount > 0}
          />
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-[#1C1A17] tracking-tight truncate">
              {employee.name}
            </h2>
            <div className="text-xs font-semibold text-[#736D64] flex items-center gap-2 mt-0.5">
              <span>{employee.designation || 'Team Member'}</span>
              {employee.department && (
                <>
                  <span>•</span>
                  <span>{employee.department.name}</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-[#9B9489] font-mono mt-0.5">
              Joined Q2 2022 • Active Workspace Member
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Reports To Box */}
        <div className="p-3.5 bg-[#FAF8F5] border border-[#DCD7CE] rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#9B9489] font-mono uppercase text-[10px]">↳ Reports to</span>
            {employee.manager ? (
              <span
                onClick={() => onSelectEmployee?.(employee.manager!.id)}
                className="font-bold text-[#1C1A17] hover:underline cursor-pointer"
              >
                {employee.manager.name} ({employee.manager.designation || 'Manager'})
              </span>
            ) : (
              <span className="font-bold text-[#1C1A17]">Company Board (Top Level)</span>
            )}
          </div>
          {employee.manager && (
            <button
              onClick={() => onSelectEmployee?.(employee.manager!.id)}
              className="px-2.5 py-1 bg-white border border-[#DCD7CE] rounded-lg text-xs font-semibold text-[#1C1A17] hover:bg-[#EFECE6] transition-colors cursor-pointer"
            >
              Focus
            </button>
          )}
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-3 gap-3">
          {/* Active Tasks */}
          <div className="p-4 bg-[#FFFFFF] border-2 border-[#1C1A17] rounded-2xl text-center shadow-xs">
            <div className="text-2xl font-black text-[#1C1A17] font-mono">
              {employee.stats.activeCount}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#736D64] mt-1 font-mono">
              Active Tasks
            </div>
          </div>

          {/* Overdue */}
          <div
            className={`p-4 rounded-2xl text-center border-2 shadow-xs ${
              employee.stats.overdueCount > 0
                ? 'bg-[#FEF2F2] border-[#EF4444]'
                : 'bg-[#FFFFFF] border-[#DCD7CE]'
            }`}
          >
            <div
              className={`text-2xl font-black font-mono flex items-center justify-center gap-1 ${
                employee.stats.overdueCount > 0 ? 'text-[#DC2626]' : 'text-[#736D64]'
              }`}
            >
              {employee.stats.overdueCount}
              <Flag className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#736D64] mt-1 font-mono">
              Overdue
            </div>
          </div>

          {/* Completed */}
          <div className="p-4 bg-[#ECFDF5] border-2 border-[#10B981] rounded-2xl text-center shadow-xs">
            <div className="text-2xl font-black text-[#059669] font-mono">
              {employee.stats.completedCount}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#059669] mt-1 font-mono">
              Completed
            </div>
          </div>
        </div>

        {/* Direct Reports */}
        {employee.directReports && employee.directReports.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold font-mono uppercase tracking-wider text-[#736D64]">
              <span>Direct Reports ({employee.directReports.length})</span>
              <span className="text-[10px] text-[#9B9489]">Full team</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {employee.directReports.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => onSelectEmployee?.(rep.id)}
                  className="p-2.5 bg-[#FAF8F5] border border-[#DCD7CE] hover:border-[#1C1A17] rounded-xl cursor-pointer transition-all flex items-center gap-2"
                >
                  <Avatar name={rep.name} size="xs" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1C1A17] truncate">{rep.name}</div>
                    <div className="text-[10px] text-[#736D64] truncate font-mono">
                      {rep.designation?.split(' ')[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notebook Task Stream */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-bold font-mono uppercase tracking-wider text-[#736D64]">
            <span>Notebook Task Stream</span>
            <span className="text-[10px] text-[#9B9489]">FLOW-{employee.id.slice(-3).toUpperCase()}</span>
          </div>

          <div className="space-y-3">
            {employee.overdueTasks.map((task) => (
              <TaskStreamCard
                key={task.id}
                task={task}
                isOverdue
                onSelectTask={onSelectTask}
                onTaskStatusChange={onTaskStatusChange}
              />
            ))}

            {employee.activeTasks
              .filter((t) => !employee.overdueTasks.some((ot) => ot.id === t.id))
              .map((task) => (
                <TaskStreamCard
                  key={task.id}
                  task={task}
                  onSelectTask={onSelectTask}
                  onTaskStatusChange={onTaskStatusChange}
                />
              ))}

            {employee.completedTasks.slice(0, 3).map((task) => (
              <TaskStreamCard
                key={task.id}
                task={task}
                isCompleted
                onSelectTask={onSelectTask}
                onTaskStatusChange={onTaskStatusChange}
              />
            ))}

            {employee.activeTasks.length === 0 && employee.completedTasks.length === 0 && (
              <div className="p-6 text-center text-xs text-[#9B9489] italic bg-[#FAF8F5] rounded-2xl border border-[#DCD7CE]">
                No tasks currently in this member&apos;s stream.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Sticky Action Button */}
        <div className="pt-4 border-t border-[#DCD7CE]">
          <Button
            variant="primary"
            className="w-full py-3 justify-center text-sm font-bold shadow-md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => onAssignTask(employee.id)}
          >
            Assign Task to {employee.name.split(' ')[0]}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

function TaskStreamCard({
  task,
  isOverdue,
  isCompleted,
  onSelectTask,
  onTaskStatusChange,
}: {
  task: Task;
  isOverdue?: boolean;
  isCompleted?: boolean;
  onSelectTask: (id: string) => void;
  onTaskStatusChange?: (id: string, newStatus: string) => void;
}) {
  const dueInfo = formatDueDate(task.dueDate);

  return (
    <div
      onClick={() => onSelectTask(task.id)}
      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group shadow-xs ${
        isOverdue
          ? 'bg-[#FEF2F2] border-[#EF4444]'
          : isCompleted
          ? 'bg-[#FAF8F5] border-[#DCD7CE] opacity-80 hover:opacity-100'
          : 'bg-[#FFFFFF] border-[#1C1A17] hover:border-[#2563EB]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-xs font-bold text-[#1C1A17] group-hover:text-[#2563EB] transition-colors leading-snug line-clamp-2">
          {task.title}
        </h4>
        <StatusBadge status={task.status} size="sm" />
      </div>

      {task.description && (
        <p className="text-[11px] text-[#736D64] mt-1.5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="mt-3 pt-2.5 border-t border-[#E8E4DC] flex items-center justify-between text-[10px] font-mono">
        <span
          className={`font-semibold flex items-center gap-1 ${
            isOverdue
              ? 'text-[#DC2626]'
              : dueInfo.isToday
              ? 'text-[#854D0E]'
              : 'text-[#736D64]'
          }`}
        >
          {isOverdue && <AlertCircle className="w-3 h-3" />}
          {isCompleted ? 'Completed' : dueInfo.text}
        </span>

        {onTaskStatusChange ? (
          <select
            value={task.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onTaskStatusChange(task.id, e.target.value)}
            className="px-2 py-0.5 bg-white border border-[#DCD7CE] rounded-md text-[10px] font-semibold text-[#1C1A17] focus:outline-hidden"
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="DONE">DONE</option>
          </select>
        ) : null}
      </div>
    </div>
  );
}
