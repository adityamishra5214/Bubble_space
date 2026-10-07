'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { UserSummary, Flow, TaskPriority, TaskStatus } from '@/types';
import { Plus } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  defaultAssigneeId?: string;
  defaultFlowId?: string;
  defaultPosition?: { x: number; y: number };
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  defaultAssigneeId,
  defaultFlowId,
  defaultPosition,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [dueDate, setDueDate] = useState('');
  const [flowId, setFlowId] = useState('');
  const [employees, setEmployees] = useState<UserSummary[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/organization')
        .then((res) => res.json())
        .then((data) => {
          if (data.employees) {
            setEmployees(data.employees);
            if (defaultAssigneeId) {
              setAssignedToId(defaultAssigneeId);
            } else if (data.employees.length > 0 && !assignedToId) {
              setAssignedToId(data.employees[0].id);
            }
          }
        });

      fetch('/api/flows')
        .then((res) => res.json())
        .then((data) => {
          if (data.flows) {
            setFlows(data.flows);
            if (defaultFlowId) {
              setFlowId(defaultFlowId);
            } else if (data.flows.length > 0 && !flowId) {
              setFlowId(data.flows[0].id);
            }
          }
        });

      setError('');
    }
  }, [isOpen, defaultAssigneeId, defaultFlowId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!assignedToId) {
      setError('Assignee is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          assignedToId,
          priority,
          status,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          flowId: flowId || null,
          positionX: defaultPosition?.x,
          positionY: defaultPosition?.y,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      // Reset
      setTitle('');
      setDescription('');
      setDueDate('');
      onTaskCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="+ New Task" description="Create and assign a task instantly">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-950/50 border border-red-800/50 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Task Title */}
        <div>
          <label className="block text-xs font-medium text-[#8C959F] mb-1.5 uppercase tracking-wider">
            Task Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design Homepage Wireframes"
            className="w-full px-3.5 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[#F2F4F5] placeholder-[#57606A] text-sm focus:border-[#38BDF8] focus:outline-hidden transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-[#8C959F] mb-1.5 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key deliverables, context, or requirements..."
            rows={3}
            className="w-full px-3.5 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[#F2F4F5] placeholder-[#57606A] text-sm focus:border-[#38BDF8] focus:outline-hidden transition-colors resize-none"
          />
        </div>

        {/* Assign To & Priority Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#8C959F] mb-1.5 uppercase tracking-wider">
              Assign To <span className="text-red-400">*</span>
            </label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[#F2F4F5] text-sm focus:border-[#38BDF8] focus:outline-hidden"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.designation || 'Team'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8C959F] mb-1.5 uppercase tracking-wider">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[#F2F4F5] text-sm focus:border-[#38BDF8] focus:outline-hidden"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Due Date & Flow Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#8C959F] mb-1.5 uppercase tracking-wider">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[#F2F4F5] text-sm focus:border-[#38BDF8] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8C959F] mb-1.5 uppercase tracking-wider">
              Work Flow
            </label>
            <select
              value={flowId}
              onChange={(e) => setFlowId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[#F2F4F5] text-sm focus:border-[#38BDF8] focus:outline-hidden"
            >
              <option value="">No Flow Assigned</option>
              {flows.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A3036]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Plus className="w-4 h-4" />}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
