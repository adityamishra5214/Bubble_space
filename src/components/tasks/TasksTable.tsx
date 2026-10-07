'use client';

import React, { useState, useEffect } from 'react';
import { Task, UserSummary, Department, Flow, TaskStatus, TaskPriority } from '@/types';
import { StatusBadge, PriorityBadge } from '@/ui/Badge';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { formatDueDate } from '@/lib/utils';
import {
  Search,
  Plus,
  ArrowUpDown,
  AlertCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';

interface TasksTableProps {
  onSelectTask: (taskId: string) => void;
  onOpenNewTask: () => void;
  dataVersion: number;
}

export function TasksTable({ onSelectTask, onOpenNewTask, dataVersion }: TasksTableProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<UserSummary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [flowId, setFlowId] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState<'due' | 'priority' | 'created' | 'title'>('due');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (assignedToId) params.set('assignedToId', assignedToId);
      if (departmentId) params.set('departmentId', departmentId);
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (flowId) params.set('flowId', flowId);
      if (overdueOnly) params.set('overdueOnly', 'true');

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, assignedToId, departmentId, status, priority, flowId, overdueOnly, dataVersion]);

  useEffect(() => {
    fetch('/api/organization')
      .then((res) => res.json())
      .then((d) => setEmployees(d.employees || []));

    fetch('/api/departments')
      .then((res) => res.json())
      .then((d) => setDepartments(d.departments || []));

    fetch('/api/flows')
      .then((res) => res.json())
      .then((d) => setFlows(d.flows || []));
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSort = (field: 'due' | 'priority' | 'created' | 'title') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const factor = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title) * factor;
    }
    if (sortBy === 'priority') {
      const pWeights: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return ((pWeights[b.priority] || 0) - (pWeights[a.priority] || 0)) * factor;
    }
    if (sortBy === 'due') {
      if (!a.dueDate) return 1 * factor;
      if (!b.dueDate) return -1 * factor;
      return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * factor;
    }
    return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * factor;
  });

  const resetFilters = () => {
    setSearch('');
    setAssignedToId('');
    setDepartmentId('');
    setStatus('');
    setPriority('');
    setFlowId('');
    setOverdueOnly(false);
  };

  const hasActiveFilters =
    search || assignedToId || departmentId || status || priority || flowId || overdueOnly;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Search and Filters Bar */}
      <div className="bg-[#FFFFFF] border border-[#DCD7CE] rounded-2xl p-4 space-y-3 shadow-xs">
        {/* Top Row: Search & Actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#9B9489] absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title, description, or owner..."
              className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl text-xs text-[#1C1A17] placeholder-[#9B9489] focus:border-[#1C1A17] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear Filters
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewTask}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Task
            </Button>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl text-[#1C1A17] font-semibold focus:outline-hidden"
          >
            <option value="">All Assignees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>

          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl text-[#1C1A17] font-semibold focus:outline-hidden"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl text-[#1C1A17] font-semibold focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
            <option value="NOT_DONE">Active (Not Done)</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl text-[#1C1A17] font-semibold focus:outline-hidden"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={flowId}
            onChange={(e) => setFlowId(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl text-[#1C1A17] font-semibold focus:outline-hidden"
          >
            <option value="">All Work Streams</option>
            {flows.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer font-bold font-mono ${
              overdueOnly
                ? 'bg-[#FEF2F2] border-[#EF4444] text-[#DC2626]'
                : 'bg-[#FAF8F5] border-[#DCD7CE] text-[#736D64] hover:text-[#1C1A17]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" />
            Overdue Only
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-[#FFFFFF] border border-[#DCD7CE] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#DCD7CE] text-[#736D64] uppercase tracking-wider font-bold font-mono">
                <th
                  onClick={() => handleSort('title')}
                  className="px-5 py-4 cursor-pointer hover:text-[#1C1A17] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Task
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-5 py-4">Primary Owner</th>
                <th className="px-5 py-4">Status</th>
                <th
                  onClick={() => handleSort('priority')}
                  className="px-5 py-4 cursor-pointer hover:text-[#1C1A17] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Priority
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('due')}
                  className="px-5 py-4 cursor-pointer hover:text-[#1C1A17] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Due Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-5 py-4">Work Stream</th>
                <th className="px-5 py-4 text-right">Created By</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E8E4DC]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#736D64] font-mono">
                    <div className="w-6 h-6 border-2 border-[#1C1A17] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading task registry...
                  </td>
                </tr>
              ) : sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#736D64]">
                    <p className="font-bold text-[#1C1A17]">No tasks found</p>
                    <p className="text-xs text-[#9B9489] mt-1">
                      Try adjusting filters or create a new task.
                    </p>
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => {
                  const dueInfo = formatDueDate(task.dueDate);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onSelectTask(task.id)}
                      className={`hover:bg-[#FAF8F5] cursor-pointer transition-colors ${
                        task.isOverdue ? 'bg-[#FEF2F2]/50' : ''
                      }`}
                    >
                      {/* Task Title */}
                      <td className="px-5 py-4 max-w-sm">
                        <div className="font-bold text-[#1C1A17] hover:text-[#2563EB] transition-colors truncate text-sm">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-[#736D64] truncate mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </td>

                      {/* Owner */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={task.assignee.name}
                              avatar={task.assignee.avatar}
                              size="xs"
                            />
                            <div>
                              <span className="font-bold text-[#1C1A17] text-xs">
                                {task.assignee.name}
                              </span>
                              {task.assignee.designation && (
                                <div className="text-[10px] text-[#736D64] font-mono">
                                  {task.assignee.designation}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#9B9489] italic">Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus, e as any)}
                          className="bg-white border border-[#DCD7CE] rounded-lg px-2.5 py-1 text-xs text-[#1C1A17] font-bold focus:outline-hidden cursor-pointer"
                        >
                          <option value="TODO">TODO</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="BLOCKED">BLOCKED</option>
                          <option value="DONE">DONE</option>
                        </select>
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <PriorityBadge priority={task.priority} size="sm" />
                      </td>

                      {/* Due Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div
                          className={`font-mono text-xs flex items-center gap-1.5 ${
                            task.isOverdue
                              ? 'text-[#DC2626] font-bold'
                              : dueInfo.isToday
                              ? 'text-[#854D0E] font-bold'
                              : 'text-[#736D64]'
                          }`}
                        >
                          {task.isOverdue && <AlertCircle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />}
                          {dueInfo.text}
                        </div>
                      </td>

                      {/* Flow */}
                      <td className="px-5 py-4 whitespace-nowrap text-[#736D64]">
                        {task.flow ? (
                          <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#DCD7CE] text-xs font-mono font-bold text-[#1C1A17]">
                            {task.flow.name}
                          </span>
                        ) : (
                          <span className="text-[#9B9489]">—</span>
                        )}
                      </td>

                      {/* Created By */}
                      <td className="px-5 py-4 text-right whitespace-nowrap text-[#736D64]">
                        <span className="text-xs font-semibold">{task.creator?.name || 'Admin'}</span>
                        <div className="text-[10px] text-[#9B9489] font-mono">
                          {format(new Date(task.createdAt), 'MMM d')}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-3.5 bg-[#FAF8F5] border-t border-[#DCD7CE] flex items-center justify-between text-xs text-[#736D64] font-mono">
          <span>
            Total: <strong className="text-[#1C1A17]">{sortedTasks.length}</strong> tasks in registry
          </span>
          <span className="text-[11px] text-[#9B9489]">
            Click any row to open task specifications & dependencies
          </span>
        </div>
      </div>
    </div>
  );
}
