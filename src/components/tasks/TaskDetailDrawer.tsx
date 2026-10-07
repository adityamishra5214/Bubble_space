'use client';

import React, { useState, useEffect } from 'react';
import { Drawer } from '@/ui/Drawer';
import { StatusBadge, PriorityBadge } from '@/ui/Badge';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Task, UserSummary, TaskStatus, TaskPriority, Flow } from '@/types';
import { formatDueDate } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Calendar,
  User,
  GitCommit,
  MessageSquare,
  Clock,
  Trash2,
  Send,
  AlertCircle,
  Share2,
  Maximize2,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface TaskDetailDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
  onNavigateToTask?: (targetId: string) => void;
}

export function TaskDetailDrawer({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  onNavigateToTask,
}: TaskDetailDrawerProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [employees, setEmployees] = useState<UserSummary[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  const fetchTaskDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/tasks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
      }
    } catch (err) {
      console.error('Error loading task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId && isOpen) {
      fetchTaskDetails(taskId);

      fetch('/api/organization')
        .then((res) => res.json())
        .then((d) => setEmployees(d.employees || []));

      fetch('/api/flows')
        .then((res) => res.json())
        .then((d) => setFlows(d.flows || []));
    } else {
      setTask(null);
    }
  }, [taskId, isOpen]);

  const handleUpdate = async (updates: Partial<Task>) => {
    if (!task) return;
    try {
      setTask({ ...task, ...updates } as Task);

      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, ...updates }),
      });

      if (res.ok) {
        if (onTaskUpdated) onTaskUpdated();
        fetchTaskDetails(task.id);
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !task) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commentText.trim() }),
      });

      if (res.ok) {
        setCommentText('');
        fetchTaskDetails(task.id);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onTaskDeleted) onTaskDeleted();
        onClose();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  if (!isOpen) return null;

  const dueInfo = task ? formatDueDate(task.dueDate) : null;
  const taskIndexCode = `FLOW-${task ? task.id.slice(-3).toUpperCase() : '101'}`;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="xl"
      title={
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#DCD7CE] font-mono text-xs font-bold text-[#1C1A17]">
            {taskIndexCode}
          </span>
          {task && <StatusBadge status={task.status} size="sm" />}
        </div>
      }
    >
      {isLoading && !task ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#736D64] text-sm font-mono">
          <div className="w-6 h-6 border-2 border-[#1C1A17] border-t-transparent rounded-full animate-spin mb-3" />
          Loading task details...
        </div>
      ) : task ? (
        <div className="space-y-6">
          {/* Header Title Section */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9B9489]">
              Task Index Entry
            </div>
            <input
              type="text"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              onBlur={() => handleUpdate({ title: task.title })}
              className="w-full text-xl font-extrabold text-[#1C1A17] bg-transparent border-b-2 border-transparent hover:border-[#DCD7CE] focus:border-[#1C1A17] focus:outline-hidden py-1 transition-colors leading-tight"
            />
            {task.flow && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-[#736D64] font-medium">Belongs to flow:</span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#FEF08A] text-[#854D0E] font-bold font-mono border border-[#EAB308]/40">
                  {task.flow.name}
                </span>
              </div>
            )}
          </div>

          {/* Overdue Warning Alert Box */}
          {task.isOverdue && (
            <div className="p-4 bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl space-y-1 text-xs text-[#DC2626] shadow-xs">
              <div className="flex items-center gap-2 font-bold font-mono uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                {dueInfo?.text} (Action Required)
              </div>
              <p className="text-[11px] text-[#736D64] leading-relaxed">
                Automated staging gate paused. Critical blockers prevent promotion pipeline to cluster staging-us-east.
              </p>
            </div>
          )}

          {/* Primary Responsibility Box */}
          <div className="p-4 bg-[#FFFFFF] border-2 border-[#1C1A17] rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[#736D64]">
              <span>Primary Responsibility</span>
              <button
                type="button"
                onClick={() => setIsReassigning(!isReassigning)}
                className="px-2 py-0.5 bg-[#FAF8F5] border border-[#DCD7CE] hover:border-[#1C1A17] rounded-md font-mono text-[#1C1A17] font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" /> Reassign
              </button>
            </div>

            <div className="flex items-center gap-3">
              {task.assignee && (
                <Avatar name={task.assignee.name} avatar={task.assignee.avatar} size="lg" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#1C1A17] truncate">
                  {task.assignee?.name || 'Unassigned'}
                </div>
                <div className="text-xs text-[#736D64] truncate font-medium">
                  {task.assignee?.designation || 'Team Member'}
                </div>
                <div className="text-[10px] font-mono font-bold text-[#2563EB] mt-0.5">
                  Accountable Single Primary Owner
                </div>
              </div>
            </div>

            {isReassigning && (
              <div className="pt-2 border-t border-[#E8E4DC]">
                <label className="block text-[10px] font-mono font-bold uppercase text-[#736D64] mb-1">
                  Select New Owner
                </label>
                <select
                  value={task.assignedToId}
                  onChange={(e) => {
                    handleUpdate({ assignedToId: e.target.value });
                    setIsReassigning(false);
                  }}
                  className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#DCD7CE] rounded-lg text-xs font-semibold text-[#1C1A17] focus:outline-hidden"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation || 'Team'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Current Status & Priority Row Pickers */}
          <div className="grid grid-cols-2 gap-3">
            {/* Current Status */}
            <div className="p-3 bg-[#FAF8F5] border border-[#DCD7CE] rounded-2xl space-y-1.5">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#736D64]">
                Current Status
              </label>
              <select
                value={task.status}
                onChange={(e) => handleUpdate({ status: e.target.value as TaskStatus })}
                className="w-full px-3 py-2 bg-white border border-[#DCD7CE] rounded-xl text-xs font-bold text-[#1C1A17] focus:outline-hidden cursor-pointer"
              >
                <option value="TODO">● TODO</option>
                <option value="IN_PROGRESS">● IN PROGRESS</option>
                <option value="BLOCKED">● BLOCKED</option>
                <option value="DONE">● DONE</option>
              </select>
            </div>

            {/* Priority */}
            <div className="p-3 bg-[#FAF8F5] border border-[#DCD7CE] rounded-2xl space-y-1.5">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#736D64]">
                Priority Level
              </label>
              <select
                value={task.priority}
                onChange={(e) => handleUpdate({ priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 bg-white border border-[#DCD7CE] rounded-xl text-xs font-bold text-[#1C1A17] focus:outline-hidden cursor-pointer"
              >
                <option value="URGENT">! URGENT (P0)</option>
                <option value="HIGH">HIGH (P1)</option>
                <option value="MEDIUM">MEDIUM (P2)</option>
                <option value="LOW">LOW (P3)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#736D64]">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              value={task.description || ''}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              onBlur={() => handleUpdate({ description: task.description })}
              placeholder="Add key deliverables, architectural notes, or links..."
              className="w-full p-3 bg-[#FAF8F5] border border-[#DCD7CE] rounded-2xl text-xs text-[#1C1A17] placeholder-[#9B9489] focus:border-[#1C1A17] focus:outline-hidden resize-none leading-relaxed"
            />
          </div>

          {/* Graph Dependencies Section */}
          <div className="space-y-3 p-4 bg-[#FAF8F5] border border-[#DCD7CE] rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-[#1C1A17] flex items-center gap-1.5">
                <GitCommit className="w-4 h-4 text-[#2563EB]" />
                Graph Dependencies
              </label>
            </div>

            {/* Blocked By */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#DC2626] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Blocked By ({task.blockedBy?.length || 0})
              </div>
              {task.blockedBy && task.blockedBy.length > 0 ? (
                task.blockedBy.map((dep) => (
                  <div
                    key={dep.id}
                    onClick={() => onNavigateToTask?.(dep.sourceTask.id)}
                    className="p-2.5 bg-white border border-[#DCD7CE] hover:border-[#1C1A17] rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-[#1C1A17] truncate">
                        {dep.sourceTask.title}
                      </div>
                      <div className="text-[10px] text-[#736D64] font-mono mt-0.5">
                        Owner: {dep.sourceTask.assignee?.name || 'Aman'}
                      </div>
                    </div>
                    <StatusBadge status={dep.sourceTask.status} size="sm" />
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-[#9B9489] italic pl-2">No upstream blockers.</div>
              )}
            </div>

            {/* Blocks */}
            <div className="space-y-1.5 pt-2 border-t border-[#E8E4DC]">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2563EB]">
                → This Task Blocks ({task.blocks?.length || 0} Tasks)
              </div>
              {task.blocks && task.blocks.length > 0 ? (
                task.blocks.map((dep) => (
                  <div
                    key={dep.id}
                    onClick={() => onNavigateToTask?.(dep.targetTask.id)}
                    className="p-2.5 bg-white border border-[#DCD7CE] hover:border-[#1C1A17] rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-[#1C1A17] truncate">
                        {dep.targetTask.title}
                      </div>
                    </div>
                    <StatusBadge status={dep.targetTask.status} size="sm" />
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-[#9B9489] italic pl-2">No downstream dependencies.</div>
              )}
            </div>
          </div>

          {/* Contextual Comments */}
          <div className="space-y-3">
            <label className="text-xs font-bold font-mono uppercase tracking-wider text-[#736D64] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Comments & Notes ({task.comments?.length || 0})
            </label>

            <div className="space-y-2 max-h-44 overflow-y-auto">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1C1A17]">{comment.user.name}</span>
                      <span className="text-[10px] text-[#9B9489] font-mono">
                        {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-[#736D64] leading-relaxed">{comment.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#9B9489] italic py-1">No notes recorded yet.</div>
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Leave an operational update..."
                className="flex-1 px-3.5 py-2 bg-white border border-[#DCD7CE] rounded-xl text-xs text-[#1C1A17] placeholder-[#9B9489] focus:border-[#1C1A17] focus:outline-hidden"
              />
              <Button
                type="submit"
                size="sm"
                variant="primary"
                isLoading={isSubmittingComment}
                disabled={!commentText.trim()}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#DCD7CE] flex items-center justify-between">
            <span className="text-[10px] text-[#9B9489] font-mono">
              Created by {task.creator?.name || 'Admin'}
            </span>
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-[#DC2626] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Entry
            </button>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
