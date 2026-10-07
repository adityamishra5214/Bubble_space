'use client';

import React, { useState, useEffect } from 'react';
import { AppShell, useApp } from '@/layout/AppShell';
import { Avatar } from '@/ui/Avatar';
import { Activity as ActivityType } from '@/types';
import { format } from 'date-fns';
import {
  Activity as ActivityIcon,
  CheckCircle2,
  Clock,
  UserPlus,
  GitCommit,
  MessageSquare,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function ActivityPage() {
  const { openTaskDetail, openEmployeeDetail, dataVersion } = useApp();
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [filterAction, setFilterAction] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const url = filterAction ? `/api/activity?action=${filterAction}` : '/api/activity';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Failed to load activity stream:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [filterAction, dataVersion]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'TASK_CREATED':
        return { label: 'Created Task', color: 'text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE]' };
      case 'TASK_ASSIGNED':
      case 'TASK_REASSIGNED':
        return { label: 'Assigned', color: 'text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE]' };
      case 'TASK_STATUS_CHANGED':
        return { label: 'Status Update', color: 'text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD]' };
      case 'TASK_COMPLETED':
        return { label: 'Completed', color: 'text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0]' };
      case 'TASK_COMMENTED':
        return { label: 'Comment', color: 'text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A]' };
      case 'EMPLOYEE_CREATED':
      case 'EMPLOYEE_MANAGER_CHANGED':
        return { label: 'Organization', color: 'text-[#4F46E5] bg-[#EEF2FF] border border-[#C7D2FE]' };
      default:
        return { label: 'Activity', color: 'text-[#736D64] bg-[#FAF8F5] border border-[#DCD7CE]' };
    }
  };

  return (
    <AppShell title="Company Activity & Audit Trail">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Filter */}
        <div className="flex items-center justify-between bg-[#FFFFFF] border-2 border-[#1C1A17] rounded-2xl p-5 shadow-xs flex-wrap gap-3">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9B9489]">
              Audit Trail
            </div>
            <h2 className="text-base font-extrabold text-[#1C1A17] flex items-center gap-2 mt-0.5">
              <ActivityIcon className="w-4 h-4 text-[#2563EB]" />
              Real-time Organizational Activity Feed
            </h2>
            <p className="text-xs text-[#736D64] mt-0.5 font-medium">
              Chronological log of task creations, status transitions, handoffs, and organizational updates.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#736D64]" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl text-xs font-bold text-[#1C1A17] focus:border-[#1C1A17] focus:outline-hidden cursor-pointer"
            >
              <option value="">All Events</option>
              <option value="TASK_CREATED">Task Created</option>
              <option value="TASK_ASSIGNED">Task Assigned</option>
              <option value="TASK_STATUS_CHANGED">Status Changed</option>
              <option value="TASK_COMPLETED">Task Completed</option>
              <option value="TASK_COMMENTED">Task Comments</option>
              <option value="EMPLOYEE_CREATED">New Team Members</option>
            </select>
          </div>
        </div>

        {/* Activity Stream */}
        <div className="bg-[#FFFFFF] border-2 border-[#1C1A17] rounded-2xl p-6 shadow-xs">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-[#736D64] text-sm font-mono">
              <div className="w-6 h-6 border-2 border-[#1C1A17] border-t-transparent rounded-full animate-spin mb-3" />
              Loading activity logs...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#9B9489] font-mono">
              No activity matching the selected filter.
            </div>
          ) : (
            <div className="relative border-l-2 border-[#DCD7CE] ml-4 space-y-6">
              {activities.map((act) => {
                const badge = getActionBadge(act.action);
                let meta: Record<string, string> = {};
                try {
                  if (act.metadata) meta = JSON.parse(act.metadata);
                } catch {}

                return (
                  <div key={act.id} className="relative pl-6 group">
                    {/* Dot */}
                    <div className="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-[#1C1A17] border-2 border-[#FFFFFF] group-hover:scale-125 transition-transform" />

                    <div className="p-4 bg-[#FAF8F5] border border-[#DCD7CE] hover:border-[#1C1A17] rounded-xl transition-all space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={act.actor?.name || 'System'}
                            avatar={act.actor?.avatar}
                            size="xs"
                          />
                          <span className="text-xs font-bold text-[#1C1A17]">
                            {act.actor?.name || 'System'}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-[#9B9489]">
                          {format(new Date(act.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>

                      {/* Content Description */}
                      <div className="text-xs text-[#736D64] pl-6">
                        {act.action === 'TASK_CREATED' && (
                          <div>
                            Created new task{' '}
                            <span
                              onClick={() => act.taskId && openTaskDetail(act.taskId)}
                              className="font-bold text-[#1C1A17] hover:text-[#2563EB] cursor-pointer"
                            >
                              &quot;{meta.title || act.task?.title || 'Untitled Task'}&quot;
                            </span>
                            {meta.assignedTo && (
                              <span>
                                {' '}
                                and assigned to{' '}
                                <strong className="text-[#1C1A17]">{meta.assignee || meta.assignedTo}</strong>
                              </span>
                            )}
                          </div>
                        )}

                        {act.action === 'TASK_ASSIGNED' && (
                          <div>
                            Assigned task{' '}
                            <span
                              onClick={() => act.taskId && openTaskDetail(act.taskId)}
                              className="font-bold text-[#1C1A17] hover:text-[#2563EB] cursor-pointer"
                            >
                              &quot;{meta.title || act.task?.title}&quot;
                            </span>{' '}
                            to <strong className="text-[#1C1A17]">{meta.assignee}</strong>
                          </div>
                        )}

                        {act.action === 'TASK_REASSIGNED' && (
                          <div>
                            Reassigned{' '}
                            <span
                              onClick={() => act.taskId && openTaskDetail(act.taskId)}
                              className="font-bold text-[#1C1A17] hover:text-[#2563EB] cursor-pointer"
                            >
                              &quot;{meta.title || act.task?.title}&quot;
                            </span>{' '}
                            from <span className="text-[#736D64]">{meta.from}</span> to{' '}
                            <strong className="text-[#1C1A17]">{meta.to}</strong>
                          </div>
                        )}

                        {act.action === 'TASK_STATUS_CHANGED' && (
                          <div>
                            Moved{' '}
                            <span
                              onClick={() => act.taskId && openTaskDetail(act.taskId)}
                              className="font-bold text-[#1C1A17] hover:text-[#2563EB] cursor-pointer"
                            >
                              &quot;{meta.title || act.task?.title}&quot;
                            </span>{' '}
                            {meta.from ? (
                              <span>
                                from <span className="font-mono text-[10px] font-bold text-[#736D64]">{meta.from}</span> →{' '}
                              </span>
                            ) : null}
                            <span className="font-bold text-[#2563EB] font-mono text-[10px]">
                              {meta.to || 'updated'}
                            </span>
                            {meta.dependency && <div className="mt-0.5 text-[11px] text-[#DC2626]">⚠️ {meta.dependency}</div>}
                          </div>
                        )}

                        {act.action === 'TASK_COMPLETED' && (
                          <div className="flex items-center gap-1.5 text-[#059669] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            Completed task{' '}
                            <span
                              onClick={() => act.taskId && openTaskDetail(act.taskId)}
                              className="font-extrabold text-[#1C1A17] hover:text-[#059669] cursor-pointer underline"
                            >
                              &quot;{meta.title || act.task?.title}&quot;
                            </span>
                          </div>
                        )}

                        {act.action === 'TASK_COMMENTED' && (
                          <div>
                            Left comment on{' '}
                            <span
                              onClick={() => act.taskId && openTaskDetail(act.taskId)}
                              className="font-bold text-[#1C1A17] hover:text-[#2563EB] cursor-pointer"
                            >
                              &quot;{meta.title || act.task?.title}&quot;
                            </span>
                            : <span className="italic text-[#1C1A17]">&quot;{meta.commentPreview}&quot;</span>
                          </div>
                        )}

                        {act.action === 'EMPLOYEE_CREATED' && (
                          <div>
                            Added new team member{' '}
                            <strong className="text-[#1C1A17]">{meta.name}</strong> (
                            {meta.designation || 'Team Member'}) to the company graph.
                          </div>
                        )}

                        {act.action === 'EMPLOYEE_MANAGER_CHANGED' && (
                          <div>
                            Updated reporting manager for{' '}
                            <strong className="text-[#1C1A17]">{meta.employee}</strong>: now reports
                            to <strong className="text-[#1C1A17]">{meta.newManager}</strong>.
                          </div>
                        )}

                        {act.action === 'FLOW_CREATED' && (
                          <div>
                            Created new initiative flow: <strong className="text-[#1C1A17]">{meta.name}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
