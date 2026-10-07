'use client';

import React, { useState, useEffect } from 'react';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { StatusBadge, PriorityBadge } from '@/ui/Badge';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Task } from '@/types';

interface DashboardOverviewProps {
  onSelectEmployee: (employeeId: string) => void;
  onSelectTask: (taskId: string) => void;
  onOpenNewTask: () => void;
  dataVersion: number;
}

interface DashboardData {
  metrics: {
    totalEmployees: number;
    activeTasksCount: number;
    overdueTasksCount: number;
    dueTodayCount: number;
    completedThisWeekCount: number;
    totalTasksCount: number;
  };
  statusCounts: {
    TODO: number;
    IN_PROGRESS: number;
    BLOCKED: number;
    DONE: number;
  };
  priorityCounts: {
    URGENT: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  workloads: Array<{
    id: string;
    name: string;
    designation: string;
    avatar?: string | null;
    department: string;
    activeTaskCount: number;
    overdueTaskCount: number;
    inProgressTasks: Task[];
  }>;
  recentOverdue: Task[];
}

export function DashboardOverview({
  onSelectEmployee,
  onSelectTask,
  onOpenNewTask,
  dataVersion,
}: DashboardOverviewProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [dataVersion]);

  if (isLoading || !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-[#8C959F] text-sm">
        <div className="w-8 h-8 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin mb-3" />
        Loading company operational pulse...
      </div>
    );
  }

  const { metrics, statusCounts, workloads, recentOverdue } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Operational Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Tasks */}
        <div className="p-5 bg-[#FFFFFF] border-2 border-[#1C1A17] rounded-2xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#736D64] uppercase tracking-wider font-mono">
              Active Tasks
            </span>
            <Activity className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-3xl font-black text-[#1C1A17] mt-2 font-mono">
            {metrics.activeTasksCount}
          </div>
          <div className="text-[11px] text-[#9B9489] mt-1 font-medium">Across all flows</div>
        </div>

        {/* Overdue Tasks */}
        <div
          className={`p-5 rounded-2xl border-2 relative overflow-hidden shadow-xs transition-colors ${
            metrics.overdueTasksCount > 0
              ? 'bg-[#FEF2F2] border-[#EF4444]'
              : 'bg-[#FFFFFF] border-[#DCD7CE]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-wider font-mono">
              Overdue
            </span>
            <AlertCircle
              className={`w-4 h-4 ${
                metrics.overdueTasksCount > 0 ? 'text-[#DC2626] animate-pulse' : 'text-[#9B9489]'
              }`}
            />
          </div>
          <div
            className={`text-3xl font-black mt-2 font-mono ${
              metrics.overdueTasksCount > 0 ? 'text-[#DC2626]' : 'text-[#736D64]'
            }`}
          >
            {metrics.overdueTasksCount}
          </div>
          <div className="text-[11px] text-[#DC2626]/80 mt-1 font-medium">Action required</div>
        </div>

        {/* Due Today */}
        <div className="p-5 bg-[#FFFFFF] border-2 border-[#1C1A17] rounded-2xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#B45309] uppercase tracking-wider font-mono">
              Due Today
            </span>
            <Clock className="w-4 h-4 text-[#EAB308]" />
          </div>
          <div className="text-3xl font-black text-[#B45309] mt-2 font-mono">
            {metrics.dueTodayCount}
          </div>
          <div className="text-[11px] text-[#9B9489] mt-1 font-medium">Ending today</div>
        </div>

        {/* Completed This Week */}
        <div className="p-5 bg-[#ECFDF5] border-2 border-[#10B981] rounded-2xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#059669] uppercase tracking-wider font-mono">
              Completed (7d)
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-3xl font-black text-[#059669] mt-2 font-mono">
            {metrics.completedThisWeekCount}
          </div>
          <div className="text-[11px] text-[#059669]/80 mt-1 font-medium">Shipped this week</div>
        </div>
      </div>

      {/* Overdue Attention Callout if any */}
      {recentOverdue.length > 0 && (
        <div className="p-4 bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#DC2626] uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              Critical Overdue Work
            </div>
            <span className="text-[11px] text-[#DC2626] font-mono font-bold">
              {recentOverdue.length} tasks needing attention
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recentOverdue.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className="flex items-center justify-between p-3 bg-white border border-[#FECACA] hover:border-[#DC2626] rounded-xl cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="text-xs font-bold text-[#1C1A17] truncate">{task.title}</div>
                  <div className="text-[10px] text-[#736D64] mt-0.5 font-mono">
                    Owner: <span className="font-semibold text-[#1C1A17]">{task.assignee?.name}</span>
                  </div>
                </div>
                <PriorityBadge priority={task.priority} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TASKS BY STATUS */}
      <div className="bg-[#FFFFFF] border-2 border-[#1C1A17] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-[#736D64] uppercase tracking-wider">
            Tasks by Status
          </h3>
          <span className="text-xs text-[#9B9489] font-mono">{metrics.totalTasksCount} Total</span>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl">
            <div className="text-xs text-[#736D64] font-bold font-mono uppercase">To Do</div>
            <div className="text-2xl font-black text-[#1C1A17] mt-1 font-mono">{statusCounts.TODO}</div>
          </div>
          <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl">
            <div className="text-xs text-[#2563EB] font-bold font-mono uppercase">In Progress</div>
            <div className="text-2xl font-black text-[#2563EB] mt-1 font-mono">
              {statusCounts.IN_PROGRESS}
            </div>
          </div>
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl">
            <div className="text-xs text-[#DC2626] font-bold font-mono uppercase">Blocked</div>
            <div className="text-2xl font-black text-[#DC2626] mt-1 font-mono">
              {statusCounts.BLOCKED}
            </div>
          </div>
          <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl">
            <div className="text-xs text-[#059669] font-bold font-mono uppercase">Done</div>
            <div className="text-2xl font-black text-[#059669] mt-1 font-mono">
              {statusCounts.DONE}
            </div>
          </div>
        </div>
      </div>

      {/* WHO IS DOING WHAT? */}
      <div className="bg-[#FFFFFF] border-2 border-[#1C1A17] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-[#1C1A17] uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2563EB]" />
              Who is Doing What?
            </h3>
            <p className="text-[11px] text-[#736D64] mt-0.5">
              Live organizational workload distribution across team members
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={onOpenNewTask} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Assign Work
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {workloads.map((emp) => (
            <div
              key={emp.id}
              onClick={() => onSelectEmployee(emp.id)}
              className="p-4 bg-[#FAF8F5] border border-[#DCD7CE] hover:border-[#1C1A17] rounded-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={emp.name}
                      avatar={emp.avatar}
                      size="sm"
                      hasOverdue={emp.overdueTaskCount > 0}
                    />
                    <div>
                      <div className="text-xs font-bold text-[#1C1A17] group-hover:text-[#2563EB] transition-colors">
                        {emp.name}
                      </div>
                      <div className="text-[10px] text-[#736D64] font-mono">{emp.designation}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      emp.overdueTaskCount > 0
                        ? 'bg-[#FEF2F2] text-[#DC2626] border-[#EF4444]'
                        : emp.activeTaskCount > 0
                        ? 'bg-white text-[#1C1A17] border-[#DCD7CE]'
                        : 'bg-[#EFECE6] text-[#736D64] border-[#DCD7CE]'
                    }`}
                  >
                    {emp.activeTaskCount} active
                  </span>
                </div>

                {/* In Progress highlights */}
                {emp.inProgressTasks && emp.inProgressTasks.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#E8E4DC] space-y-1">
                    <div className="text-[9px] text-[#9B9489] uppercase font-mono font-bold tracking-wider">
                      Currently working on:
                    </div>
                    {emp.inProgressTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(t.id);
                        }}
                        className="text-[11px] text-[#736D64] hover:text-[#2563EB] truncate flex items-center gap-1.5 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-[#E8E4DC] flex items-center justify-between text-[10px] text-[#736D64] font-mono">
                <span>Dept: {emp.department}</span>
                <span className="text-[#2563EB] flex items-center gap-0.5 font-bold group-hover:underline">
                  View tasks <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
